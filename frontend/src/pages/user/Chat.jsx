import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSend, FiMessageSquare, FiSearch, FiInfo, FiArrowLeft } from 'react-icons/fi';
import { messageAPI, userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Button, Avatar } from '../../components/common/UI';
import SessionBar from '../../components/user/SessionBar';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Fetch all active conversations
  const fetchConversations = async (silent = false) => {
    try {
      const res = await messageAPI.getConversations();
      const list = res.data.conversations || [];
      setConversations(list);
      
      // If we have an active conversation, update its partner details in the list
      if (activeConversation) {
        const currentPartnerId = activeConversation.partner?.id || activeConversation.partner?._id;
        const updated = list.find(c => (c.partner?.id || c.partner?._id) === currentPartnerId);
        if (updated) {
          setActiveConversation(prev => ({
            ...prev,
            lastMessage: updated.lastMessage,
            lastMessageTime: updated.lastMessageTime,
            unreadCount: 0 // Reset unread count locally when active
          }));
        }
      }
    } catch (err) {
      if (!silent) toast.error('Failed to load chats.');
    }
    if (!silent) setLoadingConversations(false);
  };

  // Fetch chat history with a specific user
  const fetchChatHistory = async (partnerId, silent = false) => {
    try {
      const res = await messageAPI.getChatHistory(partnerId);
      setChatHistory(res.data.history || []);
    } catch (err) {
      if (!silent) toast.error('Failed to load chat history.');
    }
  };

  // Initialize conversations and check URL queries
  useEffect(() => {
    const init = async () => {
      await fetchConversations();
      
      // Check for ?userId=XYZ query parameter
      const queryParams = new URLSearchParams(location.search);
      const queryUserId = queryParams.get('userId');
      if (queryUserId) {
        // Clear query parameter from address bar
        window.history.replaceState(null, '', '/chat');
        
        // Find existing conversation
        const res = await messageAPI.getConversations();
        const list = res.data.conversations || [];
        const existing = list.find(c => (c.partner?.id || c.partner?._id) === queryUserId);
        
        if (existing) {
          handleSelectConversation(existing);
        } else {
          // Fetch new partner details
          setLoadingHistory(true);
          try {
            const userRes = await userAPI.getUser(queryUserId);
            const partnerUser = userRes.data.user;
            
            const tempConv = {
              partner: partnerUser,
              lastMessage: '',
              lastMessageTime: new Date(),
              unreadCount: 0,
              isTemp: true
            };
            
            // Add temp conversation to list and select it
            setConversations(prev => [tempConv, ...prev]);
            setActiveConversation(tempConv);
            setChatHistory([]);
          } catch (err) {
            toast.error('Failed to start chat with this user.');
          }
          setLoadingHistory(false);
        }
      }
    };
    
    init();
  }, [location.search]);

  // Set up 4-second polling for active conversation list & messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (activeConversation) {
        const partnerId = activeConversation.partner?.id || activeConversation.partner?._id;
        fetchChatHistory(partnerId, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConversation]);

  // Select a conversation from the left pane list
  const handleSelectConversation = async (conv) => {
    // If selecting the already active one, do nothing
    const currentId = activeConversation?.partner?.id || activeConversation?.partner?._id;
    const selectId = conv.partner?.id || conv.partner?._id;
    if (currentId === selectId) return;

    setActiveConversation(conv);
    setLoadingHistory(true);
    await fetchChatHistory(selectId);
    setLoadingHistory(false);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage || !activeConversation) return;
    
    const partnerId = activeConversation.partner?.id || activeConversation.partner?._id;
    setSendingMessage(true);
    
    try {
      const res = await messageAPI.sendMessage({
        receiverId: partnerId,
        message: messageText.trim()
      });
      
      const sentMessage = res.data.message;
      
      // Optimistically add to history
      setChatHistory(prev => [...prev, sentMessage]);
      setMessageText('');
      
      // If it was a temp conversation, remove isTemp marker
      if (activeConversation.isTemp) {
        setActiveConversation(prev => ({ ...prev, isTemp: false }));
      }
      
      // Refresh conversation list to show new message
      fetchConversations(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    }
    setSendingMessage(false);
  };

  // Filter conversations based on query
  const filteredConversations = conversations.filter(c =>
    c.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Direct Messages" subtitle="Chat with freelancers and clients in real-time"/>
      
      <div className="p-6">
        <SessionBar/>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 240px)', minHeight: '480px' }}>
          
          {/* Left panel: active chat threads */}
          <Card className={`md:col-span-1 flex flex-col p-0 overflow-hidden ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <div className="relative flex-1">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}/>
                <input
                  type="text"
                  placeholder="Search chats…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-field pl-8 w-full"
                  style={{ height: 36 }}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {loadingConversations ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading chats…</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No matching chats found.' : 'No active chats. Start one by clicking "Message" on any post.'}
                </div>
              ) : (
                filteredConversations.map(c => {
                  const partnerId = c.partner?.id || c.partner?._id;
                  const active = (activeConversation?.partner?.id || activeConversation?.partner?._id) === partnerId;
                  return (
                    <button
                      key={partnerId}
                      onClick={() => handleSelectConversation(c)}
                      className="w-full text-left p-4 transition-colors hover:bg-surface-2 flex items-center gap-3"
                      style={{
                        background: active ? 'var(--bg-surface-2)' : 'transparent',
                        borderLeft: active ? '3px solid var(--neon)' : '3px solid transparent'
                      }}
                    >
                      <div className="relative">
                        <Avatar name={c.partner?.name} src={c.partner?.profileImage} size="md"/>
                        {c.partner?.isOnline && (
                          <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 bg-green-400"
                            style={{ borderColor: 'var(--bg-secondary)' }}
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                            {c.partner?.name}
                          </span>
                          {c.lastMessageTime && (
                            <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: c.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: c.unreadCount > 0 ? '600' : '400' }}>
                          {c.lastMessage || 'No messages yet'}
                        </p>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 animate-pulse">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>
          
          {/* Right panel: Chat messages */}
          <Card className={`md:col-span-2 flex flex-col p-0 overflow-hidden relative ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
            {activeConversation ? (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-1.5 hover:bg-bg-surface-2 rounded-lg flex items-center justify-center border mr-1 flex-shrink-0"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      title="Back to Chats"
                    >
                      <FiArrowLeft size={14}/>
                    </button>
                    <div className="relative flex-shrink-0">
                      <Avatar name={activeConversation.partner?.name} src={activeConversation.partner?.profileImage} size="md"/>
                      {activeConversation.partner?.isOnline && (
                        <span
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 bg-green-400"
                          style={{ borderColor: 'var(--bg-secondary)' }}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {activeConversation.partner?.name}
                      </h3>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {activeConversation.partner?.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5" style={{ background: 'var(--bg-primary)' }}>
                  {loadingHistory ? (
                    <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mb-2"/>
                      <div>Loading chat history…</div>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-xs opacity-55" style={{ color: 'var(--text-muted)' }}>
                      <FiMessageSquare size={24} className="mb-2"/>
                      This is the beginning of your chat history. Say hello!
                    </div>
                  ) : (
                    chatHistory.map((m) => {
                      const isMe = m.senderId === user.id;
                      return (
                        <div key={m.id || m._id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isMe && <Avatar name={activeConversation.partner?.name} src={activeConversation.partner?.profileImage} size="sm"/>}
                          <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div
                              className="p-3 rounded-2xl text-xs break-all leading-relaxed shadow-sm"
                              style={isMe ? {
                                background: 'linear-gradient(135deg, var(--neon), #1d4ed8)',
                                color: '#ffffff',
                                borderBottomRightRadius: 2
                              } : {
                                background: 'var(--bg-surface-2)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                borderBottomLeftRadius: 2
                              }}
                            >
                              {m.message}
                            </div>
                            <span className="text-[8px] mt-1" style={{ color: 'var(--text-muted)' }}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef}/>
                </div>

                {/* Message Send Footer */}
                <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    className="input-field py-2"
                    style={{ height: 38 }}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={sendingMessage || !messageText.trim()}
                    className="btn-neon h-[38px] px-4 flex items-center justify-center"
                  >
                    <FiSend size={14}/>
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                <FiMessageSquare size={32} className="mb-2" style={{ color: 'var(--text-muted)' }}/>
                <p>Select a conversation from the list to start chatting with clients or freelancers.</p>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
