const { Op, Sequelize } = require('sequelize');
const { Post, User, Like, Comment, Bookmark, Proposal } = require('../models');
const { normalize } = require('../utils/dbUtils');

// Build a browser-loadable URL for an uploaded file.
// Cloudinary already returns an absolute https URL in file.path; local disk
// uploads need a /uploads/<filename> URL on this server.
const fileUrl = (req, file) => {
  if (!file) return null;
  if (file.path && /^https?:\/\//i.test(file.path)) return file.path;
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
};

const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { approvalStatus: 'approved', isDeleted: false };
    if (category && category !== 'All') where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        Sequelize.where(Sequelize.cast(Sequelize.col('skills'), 'char'), { [Op.like]: `%${search}%` })
      ];
    }

    const [posts, total] = await Promise.all([
      Post.findAll({
        where,
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage', 'isOnline'] }],
        order: [['createdAt', 'DESC']],
        offset: skip,
        limit: parseInt(limit)
      }),
      Post.count({ where })
    ]);

    let likedPostIds = new Set();
    let bookmarkedPostIds = new Set();
    let appliedPostIds = new Set();
    if (req.user && posts.length > 0) {
      const [likes, bookmarks, proposals] = await Promise.all([
        Like.findAll({
          where: { userId: req.user.id, postId: posts.map(p => p.id) }
        }),
        Bookmark.findAll({
          where: { userId: req.user.id, postId: posts.map(p => p.id) }
        }),
        Proposal.findAll({
          where: { userId: req.user.id, postId: posts.map(p => p.id) }
        })
      ]);
      likedPostIds = new Set(likes.map(l => l.postId));
      bookmarkedPostIds = new Set(bookmarks.map(b => b.postId));
      appliedPostIds = new Set(proposals.map(pr => pr.postId));
    }

    const postsWithLikes = posts.map((p) => {
      const normalized = normalize(p);
      return {
        ...normalized,
        isLiked: likedPostIds.has(normalized._id),
        isBookmarked: bookmarkedPostIds.has(normalized._id),
        isApplied: appliedPostIds.has(normalized._id)
      };
    });

    res.json({
      success: true,
      posts: postsWithLikes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNextPage: skip + posts.length < total
      }
    });
  } catch (err) {
    console.error('Get feed error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts.' });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, description, category, skills, budget } = req.body;
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);

    const post = await Post.create({
      userId: req.user.id,
      title,
      description,
      category,
      budget,
      skills: skillsArray,
      image: fileUrl(req, req.file),
      imagePublicId: req.file ? req.file.filename : null
    });

    await post.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }] });
    res.status(201).json({ success: true, message: 'Post submitted for approval.', post: normalize(post) });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: 'Failed to create post.' });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id, isDeleted: false };
    if (status) where.approvalStatus = status;

    const [posts, total] = await Promise.all([
      Post.findAll({ where, order: [['createdAt', 'DESC']], offset: skip, limit: parseInt(limit) }),
      Post.count({ where })
    ]);

    res.json({
      success: true,
      posts: normalize(posts),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total
      }
    });
  } catch (err) {
    console.error('Get my posts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch your posts.' });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage', 'bio', 'skills', 'isOnline'] }]
    });
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comments = await Comment.findAll({
      where: { postId: post.id, isDeleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    let isLiked = false;
    let isBookmarked = false;
    let isApplied = false;
    if (req.user) {
      const [like, bookmark, proposal] = await Promise.all([
        Like.findOne({ where: { userId: req.user.id, postId: post.id } }),
        Bookmark.findOne({ where: { userId: req.user.id, postId: post.id } }),
        Proposal.findOne({ where: { userId: req.user.id, postId: post.id } })
      ]);
      isLiked = !!like;
      isBookmarked = !!bookmark;
      isApplied = !!proposal;
    }

    res.json({ success: true, post: { ...normalize(post), isLiked, isBookmarked, isApplied }, comments: normalize(comments) });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch post.' });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const { title, description, category, skills, budget } = req.body;
    const updates = { title, description, category, budget, approvalStatus: 'pending' };
    if (skills) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (req.file) {
      updates.image = fileUrl(req, req.file);
      updates.imagePublicId = req.file.filename;
    }

    await post.update(updates);
    await post.reload();
    res.json({ success: true, message: 'Post updated and re-submitted for approval.', post: normalize(post) });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ success: false, message: 'Failed to update post.' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ success: false, message: 'Post not found.' });

    const isOwner = post.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });

    await post.update({ isDeleted: true });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post || post.approvalStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const existing = await Like.findOne({ where: { userId: req.user.id, postId: post.id } });
    let liked;

    if (existing) {
      await existing.destroy();
      await post.decrement('likesCount');
      liked = false;
    } else {
      await Like.create({ userId: req.user.id, postId: post.id });
      await post.increment('likesCount');
      liked = true;
    }

    await post.reload();
    res.json({ success: true, liked, likesCount: post.likesCount });
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
};

const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post || post.approvalStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const newComment = await Comment.create({ userId: req.user.id, postId: post.id, comment: comment.trim() });
    await post.increment('commentsCount');
    await newComment.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }] });

    res.status(201).json({ success: true, comment: normalize(newComment) });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

const getMyStats = async (req, res) => {
  try {
    const myPosts = await Post.findAll({
      where: { userId: req.user.id, isDeleted: false },
      attributes: ['id', 'approvalStatus', 'likesCount', 'commentsCount']
    });
    const postIds = myPosts.map(p => p.id);

    // Totals across ALL of the user's posts (not just the paginated 5).
    const totals = {
      totalPosts: myPosts.length,
      approved: myPosts.filter(p => p.approvalStatus === 'approved').length,
      pending: myPosts.filter(p => p.approvalStatus === 'pending').length,
      totalLikes: myPosts.reduce((s, p) => s + (p.likesCount || 0), 0),
      totalComments: myPosts.reduce((s, p) => s + (p.commentsCount || 0), 0)
    };

    // Build the last 7 daily buckets (oldest → newest), based on local midnight.
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ start: d, label: dayNames[d.getDay()], likes: 0, comments: 0 });
    }
    const weekStart = days[0].start;
    const todayStart = days[6].start;

    let likesThisWeek = 0;
    let commentsToday = 0;

    if (postIds.length) {
      const [likes, comments] = await Promise.all([
        Like.findAll({
          where: { postId: { [Op.in]: postIds }, createdAt: { [Op.gte]: weekStart } },
          attributes: ['createdAt']
        }),
        Comment.findAll({
          where: { postId: { [Op.in]: postIds }, isDeleted: false, createdAt: { [Op.gte]: weekStart } },
          attributes: ['createdAt']
        })
      ]);

      const bucket = (rows, key) => {
        rows.forEach(r => {
          const t = new Date(r.createdAt).getTime();
          for (const day of days) {
            const s = day.start.getTime();
            if (t >= s && t < s + 86400000) { day[key]++; break; }
          }
        });
      };
      bucket(likes, 'likes');
      bucket(comments, 'comments');

      likesThisWeek = likes.length;
      commentsToday = comments.filter(c => new Date(c.createdAt).getTime() >= todayStart.getTime()).length;
    }

    res.json({
      success: true,
      chart: days.map(d => ({ day: d.label, likes: d.likes, comments: d.comments })),
      likesThisWeek,
      commentsToday,
      ...totals
    });
  } catch (err) {
    console.error('Get my stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.id, isDeleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ success: true, comments: normalize(comments) });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
};

module.exports = { getFeed, createPost, getMyPosts, getMyStats, getPost, updatePost, deletePost, toggleLike, addComment, getComments };
