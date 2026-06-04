import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDollarSign, FiClock, FiUser, FiBriefcase, FiSend, FiHeart, FiBookmark, FiTag } from 'react-icons/fi';
import { postAPI, bookmarkAPI, proposalAPI, getAssetURL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Badge, Button, Avatar, Modal, Input, Textarea } from '../../components/common/UI';
import SessionBar from '../../components/user/SessionBar';
import toast from 'react-hot-toast';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interaction states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [applied, setApplied] = useState(false);

  // Proposal modal states
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await postAPI.getPost(id);
        const postData = res.data.post;
        setPost(postData);
        setLiked(postData.isLiked || false);
        setLikesCount(postData.likesCount || 0);
        setBookmarked(postData.isBookmarked || false);
        setApplied(postData.isApplied || false);
      } catch (err) {
        toast.error('Failed to load post details.');
      }
      setLoading(false);
    };

    if (id) fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (liking || !post) return;
    setLiking(true);
    const prevLiked = liked;
    setLiked(!liked);
    setLikesCount(c => c + (liked ? -1 : 1));
    try {
      const res = await postAPI.toggleLike(post._id || post.id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setLiked(prevLiked);
      setLikesCount(c => c + (liked ? 1 : -1));
      toast.error('Failed to update like status.');
    }
    setLiking(false);
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      const res = await bookmarkAPI.toggleBookmark(post._id || post.id);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to toggle bookmark.');
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim() || !bidAmount.trim() || submittingProposal || !post) return;
    setSubmittingProposal(true);
    try {
      const res = await proposalAPI.applyForJob(post._id || post.id, {
        coverLetter: coverLetter.trim(),
        bidAmount: bidAmount.trim()
      });
      toast.success('Proposal submitted successfully!');
      setApplied(true);
      setApplyModalOpen(false);
      setCoverLetter('');
      setBidAmount('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proposal.');
    }
    setSubmittingProposal(false);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Job Details" subtitle="Loading post details..." />
        <div className="p-6 text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-2" />
          <div>Loading post information...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div>
        <PageHeader title="Job Details" subtitle="Post not found" />
        <div className="p-6 max-w-2xl mx-auto py-16 text-center">
          <div className="text-5xl mb-4" style={{ opacity: 0.3 }}>📭</div>
          <h2 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Post Not Found</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>The post you are trying to view does not exist or has been deleted.</p>
          <Button onClick={() => navigate('/feed')}>Go to Feed</Button>
        </div>
      </div>
    );
  }

  const author = post.userId;
  const isOwner = author?.id === user?.id || author?._id === user?.id;

  return (
    <div>
      <PageHeader title="Job Details" subtitle={`Category: ${post.category}`}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs">
          <FiArrowLeft size={13} /> Back
        </Button>
      </PageHeader>

      <div className="p-6 max-w-4xl mx-auto">
        <SessionBar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge status={post.approvalStatus}>{post.approvalStatus}</Badge>
                  <div className="flex items-center gap-2">
                    {post.approvalStatus === 'approved' && user && user.role !== 'admin' && (
                      <button 
                        onClick={handleBookmark}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
                        style={{ 
                          borderColor: 'var(--border)', 
                          color: bookmarked ? 'var(--neon)' : 'var(--text-secondary)',
                          background: 'var(--bg-surface-2)' 
                        }}
                        title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
                      >
                        <FiBookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                      </button>
                    )}
                    {post.approvalStatus === 'approved' && (
                      <button 
                        onClick={handleLike}
                        className="h-9 px-3 rounded-lg flex items-center gap-1.5 border transition-all text-xs font-semibold"
                        style={{ 
                          borderColor: 'var(--border)', 
                          color: liked ? 'var(--red)' : 'var(--text-secondary)',
                          background: 'var(--bg-surface-2)' 
                        }}
                      >
                        <FiHeart size={15} fill={liked ? 'currentColor' : 'none'} />
                        <span>{likesCount} Likes</span>
                      </button>
                    )}
                  </div>
                </div>

                <h1 className="font-display font-bold text-xl md:text-2xl mb-4" style={{ color: 'var(--text-primary)', lineHeight: '1.25' }}>
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 py-3 border-y mb-5 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-1">
                    <FiDollarSign size={14} style={{ color: 'var(--green)' }} />
                    <span>Budget: <strong className="text-sm" style={{ color: 'var(--green)' }}>{post.budget}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock size={14} />
                    <span>Posted on: <strong>{new Date(post.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiTag size={14} />
                    <span>Category: <strong>{post.category}</strong></span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Project Description
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {post.description}
                  </p>
                </div>

                {post.skills && post.skills.length > 0 && (
                  <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                    <h3 className="text-xs uppercase font-bold tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {post.skills.map(s => (
                        <span key={s} className="skill-tag px-3 py-1 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar Detail Column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Client Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <h3 className="text-xs uppercase font-bold tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                  About the Client
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={author?.name} src={author?.profileImage} size="md" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{author?.name || 'Client'}</h4>
                    {author?.isOnline ? (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Offline</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-1.5 truncate">
                    <FiUser size={13} style={{ color: 'var(--text-muted)' }} />
                    <span>{author?.email}</span>
                  </div>
                  {author?.mobile && (
                    <div className="flex items-center gap-1.5">
                      <FiBriefcase size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{author?.mobile}</span>
                    </div>
                  )}
                </div>

                {/* Direct Message Option */}
                {user && user.role !== 'admin' && !isOwner && (
                  <Button 
                    onClick={() => navigate(`/chat?userId=${author?.id || author?._id}`)}
                    variant="ghost" 
                    className="w-full justify-center mt-5 text-xs py-2"
                  >
                    <FiSend size={13} /> Chat with Client
                  </Button>
                )}
              </Card>
            </motion.div>

            {/* Application Pitch Action Card */}
            {post.approvalStatus === 'approved' && user && user.role !== 'admin' && !isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card style={{ borderLeft: '3px solid var(--neon)' }}>
                  <h3 className="font-display font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    {applied ? 'Application Submitted' : 'Submit your Proposal'}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {applied 
                      ? 'You have already submitted an application for this posting. Check the Proposal Tracker for updates.'
                      : 'Submit a custom bid and pitch your talents to apply for this job posting.'
                    }
                  </p>
                  <Button 
                    disabled={applied}
                    onClick={() => setApplyModalOpen(true)}
                    className="w-full justify-center text-xs py-2 btn-neon"
                  >
                    {applied ? '✓ Proposal Submitted' : 'Apply for this Job'}
                  </Button>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Proposal Modal */}
      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title={`Apply for: ${post.title}`}>
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Submit your proposal bid directly to <strong>{author?.name || 'Client'}</strong>.
          </div>
          <Input
            label="Bid Amount / Quotation"
            placeholder="e.g. $450, $40/hr"
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            required
          />
          <Textarea
            label="Cover Letter / pitch proposal"
            rows={4}
            placeholder="Introduce yourself, highlight relevant achievements, and specify how you plan to approach this task..."
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submittingProposal} className="btn-neon">Submit Proposal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
