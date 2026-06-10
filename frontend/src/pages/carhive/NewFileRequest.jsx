import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSend, FiClock, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { fileRequestAPI } from '../../utils/api';
import { PageHeader, Card, Input, Select, Button, Badge, Table, Tr, Td } from '../../components/common/UI';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

export default function NewFileRequest() {
  const { user } = useAuth();
  const [ranges, setRanges] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ oldFileId: '', requestedFileRange: '', lastCompletionDate: '' });
  const [loading, setLoading] = useState(false);

  const loadMine = () => fileRequestAPI.getMine().then(r => setRequests(r.data.requests || [])).catch(() => {});

  useEffect(() => {
    fileRequestAPI.getRanges().then(r => setRanges(r.data.ranges || [])).catch(() => {});
    loadMine();
    
    const interval = setInterval(() => {
      loadMine();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (id, range) => {
    try {
      const res = await fileRequestAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Vehicle_Data_${range}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started!');
    } catch (err) {
      toast.error('Failed to download document.');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.requestedFileRange) { toast.error('Please select a requested file range.'); return; }
    setLoading(true);
    try {
      await fileRequestAPI.submit(form);
      toast.success('File Request Submitted Successfully');
      setForm({ oldFileId: '', requestedFileRange: '', lastCompletionDate: '' });
      loadMine();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit file request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="New File Request" subtitle="Request your next file assignment" />
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        <Card>
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiClock size={18} style={{ color: 'var(--amber)' }} /> Request Form
          </h3>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Old File ID" placeholder="e.g. 1-150" value={form.oldFileId} onChange={e => setForm(f => ({ ...f, oldFileId: e.target.value }))} />
            <Input label="Username" value={user?.username || user?.name || ''} disabled />
            <Select label="Requested File Range" value={form.requestedFileRange} onChange={e => setForm(f => ({ ...f, requestedFileRange: e.target.value }))}>
              <option value="">Select a range…</option>
              {ranges.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Input label="Last File Completion Date" type="date" value={form.lastCompletionDate} onChange={e => setForm(f => ({ ...f, lastCompletionDate: e.target.value }))} />
            <div className="sm:col-span-2">
              <Button type="submit" loading={loading} className="px-6 py-2.5"><FiSend size={15} /> SUBMIT REQUEST</Button>
            </div>
          </form>
        </Card>

        <Card padding={false}>
          <h3 className="font-display font-bold text-base p-5 pb-3" style={{ color: 'var(--text-primary)' }}>My File Requests</h3>
          <Table headers={['Old File', 'Requested Range', 'Completion Date', 'Requested On', 'Status', '']}>
            {requests.length === 0 && (
              <Tr><Td className="text-center" >No requests yet.</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td></Tr>
            )}
            {requests.map(r => (
              <Tr key={r._id}>
                <Td>{r.oldFileId || '—'}</Td>
                <Td bold>{r.requestedFileRange}</Td>
                <Td>{fmtDate(r.lastCompletionDate)}</Td>
                <Td>{fmtDate(r.createdAt)}</Td>
                <Td><Badge status={r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending'}>{r.status}</Badge></Td>
                <Td>
                  {r.status === 'approved' && (
                    <button
                      onClick={() => handleDownload(r._id || r.id, r.requestedFileRange)}
                      title="Download CSV"
                      className="p-1.5 rounded-lg flex items-center justify-center hover:bg-bg-surface-2 transition-colors"
                      style={{ color: 'var(--neon)', background: 'rgba(59,130,246,0.1)' }}
                    >
                      <FiDownload size={14} />
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
