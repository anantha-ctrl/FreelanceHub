import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSend, FiFileText } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { reportAPI } from '../../utils/api';
import { PageHeader, Card, Input, Button, Table, Tr, Td } from '../../components/common/UI';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

export default function DailyReport() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    reportDate: today(),
    workingFileId: '',
    formsCompletedToday: '',
    formsCompletedTillNow: ''
  });
  const [loading, setLoading] = useState(false);

  const loadMine = () => reportAPI.getMine().then(r => setReports(r.data.reports || [])).catch(() => {});
  useEffect(() => { loadMine(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.reportDate || !form.workingFileId) { toast.error('Date and working file ID are required.'); return; }
    setLoading(true);
    try {
      await reportAPI.submit({ ...form, email: user?.email });
      toast.success('Daily Report Submitted Successfully');
      setForm({ reportDate: today(), workingFileId: '', formsCompletedToday: '', formsCompletedTillNow: '' });
      loadMine();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit daily report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Daily Report Submit" subtitle="Log your daily work progress" />
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        <Card>
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiFileText size={18} style={{ color: 'var(--purple)' }} /> Submit Daily Report
          </h3>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} />
            <Input label="Username" value={user?.username || user?.name || ''} disabled />
            <Input label="Email ID" value={user?.email || ''} disabled />
            <Input label="Working File ID" placeholder="e.g. 151-300" value={form.workingFileId} onChange={e => setForm(f => ({ ...f, workingFileId: e.target.value }))} />
            <Input label="Total Forms Completed Today" type="number" min="0" value={form.formsCompletedToday} onChange={e => setForm(f => ({ ...f, formsCompletedToday: e.target.value }))} />
            <Input label="Total Forms Completed Till Now" type="number" min="0" value={form.formsCompletedTillNow} onChange={e => setForm(f => ({ ...f, formsCompletedTillNow: e.target.value }))} />
            <div className="sm:col-span-2">
              <Button type="submit" loading={loading} className="px-6 py-2.5"><FiSend size={15} /> SUBMIT REPORT</Button>
            </div>
          </form>
        </Card>

        <Card padding={false}>
          <h3 className="font-display font-bold text-base p-5 pb-3" style={{ color: 'var(--text-primary)' }}>Report History</h3>
          <Table headers={['Date', 'Working File', 'Forms Today', 'Forms Till Now', 'Submitted']}>
            {reports.length === 0 && (
              <Tr><Td>No reports yet.</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td></Tr>
            )}
            {reports.map(r => (
              <Tr key={r._id}>
                <Td bold>{fmtDate(r.reportDate)}</Td>
                <Td>{r.workingFileId}</Td>
                <Td>{r.formsCompletedToday}</Td>
                <Td>{r.formsCompletedTillNow}</Td>
                <Td>{fmtDate(r.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
