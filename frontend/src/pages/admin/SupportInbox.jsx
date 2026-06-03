import React, { useState, useEffect, useRef } from 'react';
import { supportAPI } from '../../utils/api';
import { PageHeader, Card, Badge, Button, Avatar, Select } from '../../components/common/UI';
import { FiSend, FiInbox, FiPhone, FiMail, FiUser, FiCheckSquare, FiXCircle, FiPlay } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SupportInbox() {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [activeTicketDetails, setActiveTicketDetails] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch all tickets
  const fetchAllTickets = async (silent = false) => {
    try {
      const res = await supportAPI.adminGetTickets();
      setTickets(res.data.tickets);
    } catch {
      if (!silent) toast.error('Failed to load support tickets.');
    }
    if (!silent) setLoading(false);
  };

  // Fetch details of active ticket
  const fetchActiveDetails = async (id, silent = false) => {
    try {
      const res = await supportAPI.adminGetTicket(id);
      setActiveTicketDetails(res.data.ticket);
    } catch {
      if (!silent) toast.error('Failed to load conversation history.');
    }
  };

  useEffect(() => {
    fetchAllTickets();
    const interval = setInterval(() => {
      fetchAllTickets(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll for message updates on the active ticket
  useEffect(() => {
    if (!activeTicket) return;

    fetchActiveDetails(activeTicket.id);
    const interval = setInterval(() => {
      fetchActiveDetails(activeTicket.id, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTicket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicketDetails?.messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply || !activeTicket) return;
    setSendingReply(true);
    try {
      const res = await supportAPI.adminAddMessage(activeTicket.id, { message: replyText });
      setReplyText('');
      // Optimistically append message
      setActiveTicketDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, res.data.message]
        };
      });
      fetchAllTickets(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reply.');
    }
    setSendingReply(false);
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await supportAPI.adminUpdateStatus(activeTicket.id, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      // Refresh ticket details
      await fetchActiveDetails(activeTicket.id, true);
      // Refresh tickets list
      await fetchAllTickets(true);
    } catch {
      toast.error('Failed to update status.');
    }
    setUpdatingStatus(false);
  };

  const getStatusBadgeType = (status) => {
    if (status === 'open') return 'active';
    if (status === 'resolved') return 'approved';
    return 'rejected'; // closed
  };

  return (
    <div>
      <PageHeader title="Support Inbox" subtitle="Manage and reply to freelancer help requests">
        <Badge status="admin" className="px-3 py-1.5"><FiInbox size={12}/> Helpdesk</Badge>
      </PageHeader>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 200px)', minHeight: '480px' }}>
          {/* Left Panel: list of user tickets */}
          <Card className="md:col-span-1 flex flex-col overflow-hidden p-0">
            <div className="p-4 border-b font-display font-bold text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              All Inbound Requests
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {loading ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading tickets…</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  No support requests received yet.
                </div>
              ) : (
                tickets.map(t => {
                  const active = activeTicket?.id === t.id;
                  const latestMsg = t.messages?.[0]?.message || 'No messages';
                  return (
                    <button key={t.id} onClick={() => setActiveTicket(t)} className="w-full text-left p-4 transition-colors hover:bg-surface-2 flex flex-col gap-1"
                      style={{
                        background: active ? 'var(--bg-surface-2)' : 'transparent',
                        borderLeft: active ? '3px solid var(--purple)' : '3px solid transparent'
                      }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{t.user?.name || 'Unknown'}</span>
                        <Badge status={getStatusBadgeType(t.status)}>{t.status}</Badge>
                      </div>
                      <span className="text-[11px] font-medium truncate w-full" style={{ color: 'var(--text-secondary)' }}>{t.subject}</span>
                      <p className="text-xs truncate w-full text-muted" style={{ color: 'var(--text-muted)' }}>{latestMsg}</p>
                      <span className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(t.updatedAt).toLocaleString()}</span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right Panel: Chat Room & Ticket Controls */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden p-0 relative">
            {activeTicketDetails ? (
              <div className="flex flex-col h-full">
                {/* Chat Header controls */}
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Avatar name={activeTicketDetails.user?.name} src={activeTicketDetails.user?.profileImage} size="sm" />
                      <div>
                        <h3 className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                          {activeTicketDetails.user?.name}
                        </h3>
                        <div className="flex items-center gap-2.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-0.5"><FiMail size={10}/> {activeTicketDetails.user?.email}</span>
                          {activeTicketDetails.user?.mobile && (
                            <span className="flex items-center gap-0.5"><FiPhone size={10}/> {activeTicketDetails.user?.mobile}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Topic: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{activeTicketDetails.subject}</span>
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeTicketDetails.status !== 'open' && (
                      <Button onClick={() => handleStatusChange('open')} disabled={updatingStatus} variant="ghost" className="text-xs py-1 px-2.5 flex items-center gap-1">
                        <FiPlay size={12}/> Open
                      </Button>
                    )}
                    {activeTicketDetails.status !== 'resolved' && (
                      <Button onClick={() => handleStatusChange('resolved')} disabled={updatingStatus} className="text-xs py-1 px-2.5 flex items-center gap-1" style={{ background: 'var(--green)', color: '#fff' }}>
                        <FiCheckSquare size={12}/> Resolve
                      </Button>
                    )}
                    {activeTicketDetails.status !== 'closed' && (
                      <Button onClick={() => handleStatusChange('closed')} disabled={updatingStatus} className="text-xs py-1 px-2.5 flex items-center gap-1" style={{ background: 'var(--red)', color: '#fff' }}>
                        <FiXCircle size={12}/> Close
                      </Button>
                    )}
                  </div>
                </div>

                {/* Conversation area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/5" style={{ background: 'var(--bg-primary)' }}>
                  {activeTicketDetails.messages?.map((m) => {
                    const isAdminMsg = m.sender?.role === 'admin';
                    const senderName = isAdminMsg ? 'Support Admin' : activeTicketDetails.user?.name;
                    return (
                      <div key={m.id} className={`flex items-start gap-2.5 ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isAdminMsg && <Avatar name={senderName} src={activeTicketDetails.user?.profileImage} size="sm" />}
                        <div className={`flex flex-col max-w-[70%] ${isAdminMsg ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>{senderName}</span>
                          <div className="p-3 rounded-2xl text-xs break-all leading-relaxed shadow-sm"
                            style={isAdminMsg ? {
                              background: 'linear-gradient(135deg, var(--purple), #6d28d9)',
                              color: '#ffffff',
                              borderBottomRightRadius: 2
                            } : {
                              background: 'var(--bg-surface-2)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              borderBottomLeftRadius: 2
                            }}>
                            {m.message}
                          </div>
                          <span className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Footer Box */}
                {activeTicketDetails.status !== 'closed' ? (
                  <form onSubmit={handleSendReply} className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Send a reply to ${activeTicketDetails.user?.name}...`}
                      className="input-field py-2"
                      style={{ height: 38 }}
                      required
                    />
                    <Button type="submit" disabled={sendingReply || !replyText.trim()} className="btn-neon h-[38px] px-4 flex items-center justify-center" style={{ background: 'var(--purple)', borderColor: 'var(--purple)' }}>
                      <FiSend size={14}/>
                    </Button>
                  </form>
                ) : (
                  <div className="p-3 bg-red-400/5 text-center text-xs text-muted flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    This conversation is closed. Use the controls above to re-open it.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                <FiInbox size={32} className="mb-2" style={{ color: 'var(--text-muted)' }}/>
                <p>Select a ticket conversation from the left to start answering support requests.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
