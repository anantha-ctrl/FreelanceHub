const { Proposal, Post, User } = require('../models');
const { normalize } = require('../utils/dbUtils');

const applyForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const { coverLetter, bidAmount } = req.body;

    if (!coverLetter || !bidAmount) {
      return res.status(400).json({ success: false, message: 'Cover letter and bid amount are required.' });
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.userId === userId) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own post.' });
    }

    const existing = await Proposal.findOne({ where: { userId, postId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job.' });
    }

    const proposal = await Proposal.create({
      userId,
      postId,
      coverLetter,
      bidAmount
    });

    res.status(201).json({ success: true, message: 'Proposal submitted successfully!', proposal: normalize(proposal) });
  } catch (err) {
    console.error('Apply for job error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit proposal.' });
  }
};

const getPostProposals = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view proposals for this post.' });
    }

    const proposals = await Proposal.findAll({
      where: { postId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'profileImage', 'mobile'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, proposals: normalize(proposals) });
  } catch (err) {
    console.error('Get post proposals error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch proposals.' });
  }
};

const getMyProposals = async (req, res) => {
  try {
    const userId = req.user.id;
    const proposals = await Proposal.findAll({
      where: { userId },
      include: [{
        model: Post,
        as: 'post',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, proposals: normalize(proposals) });
  } catch (err) {
    console.error('Get my proposals error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch your proposals.' });
  }
};

const updateProposalStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    const proposal = await Proposal.findByPk(req.params.id, {
      include: [{ model: Post, as: 'post' }]
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    if (proposal.post.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this proposal.' });
    }

    await proposal.update({ status });
    res.json({ success: true, message: `Proposal ${status} successfully.`, proposal: normalize(proposal) });
  } catch (err) {
    console.error('Update proposal status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update proposal status.' });
  }
};

module.exports = { applyForJob, getPostProposals, getMyProposals, updateProposalStatus };
