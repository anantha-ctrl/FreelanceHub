import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSend, FiMessageSquare, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { supportAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Badge, Button, Input, Textarea, Modal, Avatar } from '../../components/common/UI';
import SessionBar from '../../components/user/SessionBar';
import toast from 'react-hot-toast';

export default function SupportDesk() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [activeTicketDetails, setActiveTicketDetails] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ subject: '', message: '' });
  const [creating, setCreating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch all tickets
  const fetchTickets = async (silent = false) => {
    try {
      const res = await supportAPI.getMyTickets();
      setTickets(res.data.tickets);
    } catch (err) {
      if (!silent) toast.error('Failed to load tickets.');
    }
    if (!silent) setLoading(false);
  };

  // Fetch details of active ticket
  const fetchActiveDetails = async (id, silent = false) => {
    try {
      const res = await supportAPI.getTicket(id);
      setActiveTicketDetails(res.data.ticket);
    } catch (err) {
      if (!silent) toast.error('Failed to load ticket conversation.');
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Set up 4-second polling for active ticket messages to ensure real-time datalink
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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.subject.trim() || !newForm.message.trim()) return;
    setCreating(true);
    try {
      const res = await supportAPI.createTicket(newForm);
      toast.success('Support ticket opened!');
      setNewForm({ subject: '', message: '' });
      setNewOpen(false);
      await fetchTickets(true);
      // Automatically select the newly created ticket
      setActiveTicket(res.data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open ticket.');
    }
    setCreating(false);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply || !activeTicket) return;
    setSendingReply(true);
    try {
      const res = await supportAPI.addMessage(activeTicket.id, { message: replyText });
      setReplyText('');
      // Optimistically add to messages
      setActiveTicketDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, res.data.message]
        };
      });
      // Refresh tickets list silently (updates last message timestamp/status)
      fetchTickets(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    }
    setSendingReply(false);
  };

  const getStatusBadgeType = (status) => {
    if (status === 'open') return 'active';
    if (status === 'resolved') return 'approved';
    return 'rejected'; // closed
  };

  return (
    <div>
      <PageHeader title="Support Desk" subtitle="Get help from our platform administrators">
        <Button onClick={() => setNewOpen(true)} className="btn-neon">
          <FiPlus size={15}/> New Request
        </Button>
      </PageHeader>

      <div className="p-6">
        <SessionBar/>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 240px)', minHeight: '450px' }}>
          {/* Left panel: list of tickets */}
          <Card className="md:col-span-1 flex flex-col overflow-hidden p-0">
            <div className="p-4 border-b font-display font-bold text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              My Requests
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {loading ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading tickets…</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  No support requests yet. Click "New Request" to create one.
                </div>
              ) : (
                tickets.map(t => {
                  const active = activeTicket?.id === t.id;
                  const latestMsg = t.messages?.[0]?.message || 'No messages';
                  return (
                    <button key={t.id} onClick={() => setActiveTicket(t)} className="w-full text-left p-4 transition-colors hover:bg-surface-2 flex flex-col gap-1.5"
                      style={{
                        background: active ? 'var(--bg-surface-2)' : 'transparent',
                        borderLeft: active ? '3px solid var(--neon)' : '3px solid transparent'
                      }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{t.subject}</span>
                        <Badge status={getStatusBadgeType(t.status)}>{t.status}</Badge>
                      </div>
                      <p className="text-xs truncate w-full" style={{ color: 'var(--text-secondary)' }}>{latestMsg}</p>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(t.updatedAt).toLocaleString()}</span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right panel: Active Chat */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden p-0 relative">
            {activeTicketDetails ? (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{activeTicketDetails.subject}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ID: {activeTicketDetails.id.substring(0,8)}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                      <Badge status={getStatusBadgeType(activeTicketDetails.status)}>{activeTicketDetails.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/5" style={{ background: 'var(--bg-primary)' }}>
                  {activeTicketDetails.messages?.map((m) => {
                    const isMe = m.senderId === user.id;
                    const senderName = isMe ? 'Me' : (m.sender?.role === 'admin' ? 'Support Admin' : m.sender?.name);
                    const isSupport = m.sender?.role === 'admin';
                    return (
                      <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMe && <Avatar name={senderName} src={m.sender?.profileImage} size="sm" />}
                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>{senderName}</span>
                          <div className="p-3 rounded-2xl text-xs break-all leading-relaxed shadow-sm"
                            style={isMe ? {
                              background: 'linear-gradient(135deg, var(--neon), #1d4ed8)',
                              color: '#ffffff',
                              borderBottomRightRadius: 2
                            } : {
                              background: isSupport ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
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
                      placeholder="Type your reply here..."
                      className="input-field py-2"
                      style={{ height: 38 }}
                      required
                    />
                    <Button type="submit" disabled={sendingReply || !replyText.trim()} className="btn-neon h-[38px] px-4 flex items-center justify-center">
                      <FiSend size={14}/>
                    </Button>
                  </form>
                ) : (
                  <div className="p-3 bg-red-400/5 text-center text-xs flex items-center justify-center gap-1.5" style={{ color: 'var(--red)', borderTop: '1px solid var(--border)' }}>
                    <FiInfo size={13}/>
                    This request is closed. You can create a new support request if you need further help.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                <FiMessageSquare size={32} className="mb-2" style={{ color: 'var(--text-muted)' }}/>
                <p>Select a support request from the list or open a new one to start chatting with the admin.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="New Support Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Subject / Topic"
            placeholder="e.g. Account activation problem, post approval delay"
            value={newForm.subject}
            onChange={e => setNewForm(f => ({ ...f, subject: e.target.value }))}
            required
          />
          <Textarea
            label="Describe your problem"
            rows={4}
            placeholder="Tell us what went wrong. Include details so we can help you fast..."
            value={newForm.message}
            onChange={e => setNewForm(f => ({ ...f, message: e.target.value }))}
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating} className="btn-neon">Submit Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
