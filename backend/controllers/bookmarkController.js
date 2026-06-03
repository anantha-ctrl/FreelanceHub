const { Bookmark, Post, User } = require('../models');
const { normalize } = require('../utils/dbUtils');

const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const existing = await Bookmark.findOne({ where: { userId, postId } });
    if (existing) {
      await existing.destroy();
      return res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
    } else {
      await Bookmark.create({ userId, postId });
      return res.json({ success: true, bookmarked: true, message: 'Post bookmarked.' });
    }
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await Bookmark.findAll({
      where: { userId },
      include: [{
        model: Post,
        as: 'post',
        where: { isDeleted: false },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }]
      }]
    });

    res.json({ success: true, bookmarks: normalize(bookmarks) });
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
};

module.exports = { toggleBookmark, getBookmarks };
