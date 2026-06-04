import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiInbox, FiUser, FiDollarSign, FiClock, FiCheck, FiX, FiMessageSquare, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { proposalAPI, postAPI } from '../../utils/api';
import { PageHeader, Card, Badge, Button, EmptyState, Avatar } from '../../components/common/UI';
import SessionBar from '../../components/user/SessionBar';
import toast from 'react-hot-toast';

export default function Proposals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submitted'); // 'submitted' or 'received'
  const [loading, setLoading] = useState(true);

  // Submitted Proposals States
  const [submittedProposals, setSubmittedProposals] = useState([]);

  // Received Proposals States (My Posts & selected post's proposals)
  const [myPosts, setMyPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  const fetchSubmitted = async (silent = false) => {
    try {
      const res = await proposalAPI.getMyProposals();
      setSubmittedProposals(res.data.proposals || []);
    } catch (err) {
      if (!silent) toast.error('Failed to load submitted proposals.');
    }
  };

  const fetchMyPosts = async (silent = false) => {
    try {
      const res = await postAPI.getMyPosts();
      setMyPosts(res.data.posts || []);
    } catch (err) {
      if (!silent) toast.error('Failed to load your posts.');
    }
  };

  // Initial load on tab change
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setMobileShowDetails(false);
      if (activeTab === 'submitted') {
        await fetchSubmitted(false);
      } else {
        await fetchMyPosts(false);
        setSelectedPost(null);
        setReceivedProposals([]);
      }
      setLoading(false);
    };
    init();
  }, [activeTab]);

  // Polling for real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'submitted') {
        fetchSubmitted(true);
      } else {
        fetchMyPosts(true);
        if (selectedPost) {
          proposalAPI.getPostProposals(selectedPost._id || selectedPost.id)
            .then(res => setReceivedProposals(res.data.proposals || []))
            .catch(() => {});
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab, selectedPost]);

  // Load proposals for a specific post of mine
  const handleSelectPost = async (post) => {
    setSelectedPost(post);
    setMobileShowDetails(true);
    setLoadingProposals(true);
    try {
      const res = await proposalAPI.getPostProposals(post._id || post.id);
      setReceivedProposals(res.data.proposals || []);
    } catch (err) {
      toast.error('Failed to load proposals for this post.');
    }
    setLoadingProposals(false);
  };

  // Update proposal status (Accept/Reject)
  const handleStatusChange = async (proposalId, status) => {
    try {
      const res = await proposalAPI.updateProposalStatus(proposalId, { status });
      toast.success(res.data.message || `Proposal ${status}!`);
      
      // Update local state
      setReceivedProposals(prev =>
        prev.map(p => (p.id === proposalId || p._id === proposalId) ? { ...p, status } : p)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update proposal status.');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'accepted') return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  };

  return (
    <div>
      <PageHeader title="Proposal Tracker" subtitle="Manage your job applications and project pitches"/>

      <div className="p-6">
        <SessionBar/>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('submitted')}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            style={{
              background: activeTab === 'submitted' ? 'var(--bg-surface-2)' : 'transparent',
              color: activeTab === 'submitted' ? 'var(--neon)' : 'var(--text-muted)'
            }}
          >
            <FiBriefcase size={16}/> Submitted ({submittedProposals.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            style={{
              background: activeTab === 'received' ? 'var(--bg-surface-2)' : 'transparent',
              color: activeTab === 'received' ? 'var(--neon)' : 'var(--text-muted)'
            }}
          >
            <FiInbox size={16}/> Received ({myPosts.length})
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-2"/>
            <div>Loading proposals…</div>
          </div>
        ) : activeTab === 'submitted' ? (
          /* ─── SUBMITTED PROPOSALS ─── */
          submittedProposals.length === 0 ? (
            <EmptyState
              icon="💼"
              title="No submitted proposals"
              description="You haven't applied to any job postings yet. Find tasks in the feed and pitch your talent!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {submittedProposals.map((proposal, i) => {
                const post = proposal.postId || proposal.post;
                if (!post) return null;
                return (
                  <motion.div
                    key={proposal.id || proposal._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Card className="flex flex-col gap-3 h-full">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {post.title}
                          </h3>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Client: {post.userId?.name || 'Unknown'}
                          </span>
                        </div>
                        <Badge status={getStatusBadge(proposal.status)}>{proposal.status}</Badge>
                      </div>

                      <div className="flex items-center gap-4 py-2 border-y text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1">
                          <FiDollarSign size={13}/>
                          <span>Budget: <strong>{post.budget}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiDollarSign size={13} style={{ color: 'var(--green)' }}/>
                          <span style={{ color: 'var(--green)' }}>My Bid: <strong>{proposal.bidAmount}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock size={13}/>
                          <span>Applied: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Cover Letter
                        </span>
                        <p className="text-xs mt-1 leading-relaxed bg-black/5 p-3 rounded-lg border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                          {proposal.coverLetter}
                        </p>
                      </div>

                      {proposal.status === 'accepted' && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={() => navigate(`/chat?userId=${post.userId?.id || post.userId?._id}`)}
                            className="btn-neon text-xs py-1.5 px-3"
                          >
                            <FiMessageSquare size={13}/> Chat with Client
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* ─── RECEIVED PROPOSALS ─── */
          myPosts.length === 0 ? (
            <EmptyState
              icon="📥"
              title="No posts created"
              description="Create a post from the Create tab first, then check here for job applications from freelancers."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ minHeight: '450px' }}>
              {/* Left Column: My Posts list */}
              <Card className={`md:col-span-1 flex flex-col p-0 overflow-hidden ${mobileShowDetails ? 'hidden md:flex' : 'flex'}`} style={{ maxHeight: '600px' }}>
                <div className="p-4 border-b font-display font-bold text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  My Postings
                </div>
                <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
                  {myPosts.map(p => {
                    const active = selectedPost?._id === p._id || selectedPost?.id === p.id;
                    return (
                      <button
                        key={p._id || p.id}
                        onClick={() => handleSelectPost(p)}
                        className="w-full text-left p-4 transition-colors hover:bg-surface-2 flex flex-col gap-1"
                        style={{
                          background: active ? 'var(--bg-surface-2)' : 'transparent',
                          borderLeft: active ? '3px solid var(--neon)' : '3px solid transparent'
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{p.title}</span>
                          <Badge status={p.approvalStatus}>{p.approvalStatus}</Badge>
                        </div>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Budget: {p.budget}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Right Column: Candidates list */}
              <Card className={`md:col-span-2 flex flex-col p-0 overflow-hidden ${!mobileShowDetails ? 'hidden md:flex' : 'flex'}`} style={{ maxHeight: '600px' }}>
                <div className="p-4 border-b font-display font-bold text-sm flex items-center gap-3" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {mobileShowDetails && (
                    <button 
                      onClick={() => setMobileShowDetails(false)} 
                      className="md:hidden p-1.5 hover:bg-bg-surface-2 rounded-lg flex items-center justify-center border mr-1"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      title="Back to Postings"
                    >
                      <FiArrowLeft size={14}/>
                    </button>
                  )}
                  <span className="flex-1 truncate">
                    {selectedPost ? `Applications: ${selectedPost.title}` : 'Select a posting to view applications'}
                  </span>
                  {selectedPost && (
                    <a href={`/post/${selectedPost._id || selectedPost.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--neon)' }}>
                      View Post <FiExternalLink size={12}/>
                    </a>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {!selectedPost ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      <FiBriefcase size={28} className="mb-2 opacity-40"/>
                      Select one of your postings on the left to see applicants.
                    </div>
                  ) : loadingProposals ? (
                    <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mb-2"/>
                      <div>Loading applications…</div>
                    </div>
                  ) : receivedProposals.length === 0 ? (
                    <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                      No one has applied to this post yet. Approved postings are visible on the public feed.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {receivedProposals.map((proposal) => {
                        const candidate = proposal.userId || proposal.user;
                        return (
                          <Card key={proposal.id || proposal._id} className="border" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={candidate?.name} src={candidate?.profileImage} size="md"/>
                                <div>
                                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{candidate?.name}</h4>
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{candidate?.email} {candidate?.mobile && `· ${candidate.mobile}`}</span>
                                </div>
                              </div>
                              <Badge status={getStatusBadge(proposal.status)}>{proposal.status}</Badge>
                            </div>

                            <div className="flex items-center gap-4 py-2 border-y text-xs mb-3" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                              <div className="flex items-center gap-1 text-green-400">
                                <FiDollarSign size={13}/>
                                <span>Freelancer Pitch: <strong>{proposal.bidAmount}</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FiClock size={13}/>
                                <span>Received: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="mb-3">
                              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Cover Letter / Pitch
                              </span>
                              <p className="text-xs mt-1 leading-relaxed bg-black/5 p-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                                {proposal.coverLetter}
                              </p>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                              <div className="flex gap-2">
                                {proposal.status === 'pending' && (
                                  <>
                                    <Button
                                      onClick={() => handleStatusChange(proposal.id || proposal._id, 'accepted')}
                                      variant="success"
                                      size="sm"
                                    >
                                      <FiCheck size={14}/> Accept
                                    </Button>
                                    <Button
                                      onClick={() => handleStatusChange(proposal.id || proposal._id, 'rejected')}
                                      variant="danger"
                                      size="sm"
                                    >
                                      <FiX size={14}/> Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                              {proposal.status === 'accepted' && (
                                <Button
                                  onClick={() => navigate(`/chat?userId=${candidate?.id || candidate?._id}`)}
                                  className="btn-neon text-xs py-1.5 px-3"
                                >
                                  <FiMessageSquare size={13}/> Message Candidate
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  );
}
