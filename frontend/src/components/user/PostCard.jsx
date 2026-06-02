import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { Avatar, Badge } from '../common/UI';
import { postAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const categoryEmoji = {
  'Web Development': '💻', 'Mobile': '📱', 'Design': '🎨',
  'AI/ML': '🤖', 'DevOps': '☁️', 'Marketing': '📈',
  'Writing': '✍️', 'Data Science': '📊', 'Other': '🔧'
};

export default function PostCard({ post, onLike, onDelete, showActions = false, showStatus = false, index = 0 }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [liking, setLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await postAPI.getComments(post._id);
        setComments(res.data.comments);
      } catch {}
      setLoadingComments(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const res = await postAPI.addComment(post._id, { comment: text });
      setComments(prev => [res.data.comment, ...prev]);
      setCommentsCount(c => c + 1);
      setCommentText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment.');
    }
    setPosting(false);
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const prev = liked;
    setLiked(!liked);
    setLikesCount(c => c + (liked ? -1 : 1));
    try {
      const res = await postAPI.toggleLike(post._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
      if (onLike) onLike(post._id, res.data.liked);
    } catch {
      setLiked(prev);
      setLikesCount(c => c + (liked ? 1 : -1));
    }
    setLiking(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postAPI.deletePost(post._id);
      toast.success('Post deleted.');
      if (onDelete) onDelete(post._id);
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  const author = post.userId;
  const emoji = categoryEmoji[post.category] || '📋';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="surface-card post-card overflow-hidden flex flex-col">

      {/* Image / placeholder */}
      <div className="relative h-44 flex-shrink-0 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--bg-surface-2), var(--bg-surface-3))' }}>
        {post.image ? (
          <img src={post.image} alt={post.title} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">{emoji}</div>
        )}
        {/* Status overlay */}
        {showStatus && (
          <div className="absolute top-2.5 right-2.5">
            <Badge status={post.approvalStatus}>{post.approvalStatus}</Badge>
          </div>
        )}
        {/* Category pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}>
            {post.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-sm mb-1.5 leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {post.title}
        </h3>
        <p className="text-xs leading-relaxed mb-3 flex-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {post.description}
        </p>

        {/* Skills */}
        <div className="mb-3 flex flex-wrap">
          {post.skills?.slice(0,3).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {post.skills?.length > 3 && <span className="skill-tag">+{post.skills.length - 3}</span>}
        </div>

        {/* Budget */}
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--green)' }}>
          💰 {post.budget}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Avatar name={author?.name || 'Unknown'} src={author?.profileImage} size="sm"/>
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{author?.name || 'Freelancer'}</div>
              {author?.isOnline && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--green)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"/>Online
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Like */}
            {post.approvalStatus === 'approved' && (
              <button onClick={handleLike}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: liked ? 'var(--red)' : 'var(--text-muted)' }}>
                <FiHeart size={14} fill={liked ? 'currentColor' : 'none'}/>{likesCount}
              </button>
            )}
            {/* Comment */}
            <button onClick={toggleComments}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: showComments ? 'var(--neon)' : 'var(--text-muted)' }}>
              <FiMessageCircle size={14}/>{commentsCount}
            </button>
            {/* Owner actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                <a href={`/edit-post/${post._id}`}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
                  title="Edit"><FiEdit2 size={13}/></a>
                <button onClick={handleDelete}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.08)' }}
                  title="Delete"><FiTrash2 size={13}/></button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {post.approvalStatus === 'approved' ? (
              <form onSubmit={handleComment} className="flex items-center gap-2 mb-3">
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}/>
                <button type="submit" disabled={posting || !commentText.trim()}
                  className="text-xs font-semibold px-3 py-2 rounded-lg"
                  style={{ background: 'var(--neon)', color: '#fff', opacity: (posting || !commentText.trim()) ? 0.5 : 1 }}>
                  {posting ? '…' : 'Post'}
                </button>
              </form>
            ) : (
              <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Comments open once this post is approved.
              </div>
            )}

            {loadingComments ? (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first!</div>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {comments.map((c, i) => (
                  <div key={c._id || i} className="flex items-start gap-2">
                    <Avatar name={c.userId?.name || 'User'} src={c.userId?.profileImage} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{c.userId?.name || 'User'}</div>
                      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
