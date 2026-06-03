import React, { useState, useEffect } from 'react';
import { bookmarkAPI } from '../../utils/api';
import { PageHeader, EmptyState, PostSkeleton } from '../../components/common/UI';
import PostCard from '../../components/user/PostCard';
import SessionBar from '../../components/user/SessionBar';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await bookmarkAPI.getBookmarks();
      setBookmarks(res.data.bookmarks || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (postId, isBookmarked) => {
    if (!isBookmarked) {
      setBookmarks(prev => prev.filter(b => {
        const p = b.postId || b.post;
        return (p?._id || p?.id) !== postId;
      }));
    }
  };

  return (
    <div>
      <PageHeader title="Saved Bookmarks" subtitle="Posts you have saved for later reference"/>
      <div className="p-6">
        <SessionBar/>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 feed-grid">
            {[...Array(4)].map((_, i) => <PostSkeleton key={i}/>)}
          </div>
        ) : bookmarks.length === 0 ? (
          <EmptyState icon="🔖" title="No bookmarked posts" description="Explore the feed and click the bookmark icon on any post to save it here."/>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 feed-grid">
            {bookmarks.map((b, i) => {
              const post = b.postId || b.post;
              if (!post) return null;
              const postData = {
                ...post,
                isBookmarked: true
              };
              return (
                <PostCard
                  key={b.id || post._id || post.id}
                  post={postData}
                  onBookmarkToggle={handleBookmarkToggle}
                  index={i}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
