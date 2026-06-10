const { Op } = require('sequelize');
const {
  Advertisement, NewVehicleDetails, UsedVehicleDetails, User
} = require('../models');
const { normalize } = require('../utils/dbUtils');
const { logAudit } = require('../utils/auditLogger');
const { notify } = require('../services/notificationService');

// Pick only keys that are valid columns on the given model.
const pickModelFields = (Model, source = {}) => {
  const allowed = Object.keys(Model.rawAttributes).filter(
    k => !['id', 'advertisementId', 'createdAt', 'updatedAt'].includes(k)
  );
  const out = {};
  allowed.forEach(k => {
    if (source[k] !== undefined) out[k] = source[k];
  });
  return out;
};

// Generate the next sequential public Ad ID, e.g. CH-AD-00001.
const generateAdId = async () => {
  const count = await Advertisement.count();
  return `CH-AD-${String(count + 1).padStart(5, '0')}`;
};

// POST /api/ads
const createAd = async (req, res) => {
  try {
    const { batchNumber, carTitle, vehicleType, confirmed } = req.body;
    const details = req.body.details || req.body;

    if (!batchNumber || !carTitle || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Batch number, car title and vehicle type are required.' });
    }
    if (!['new', 'used'].includes(vehicleType)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle type.' });
    }
    if (!confirmed) {
      return res.status(400).json({ success: false, message: 'You must confirm the information is true and accurate.' });
    }

    const adId = await generateAdId();
    const ad = await Advertisement.create({
      adId,
      batchNumber,
      carTitle,
      username: req.user.username || req.user.name,
      vehicleType,
      confirmed: true,
      status: 'active',
      userId: req.user.id
    });

    if (vehicleType === 'new') {
      await NewVehicleDetails.create({ advertisementId: ad.id, ...pickModelFields(NewVehicleDetails, details) });
    } else {
      await UsedVehicleDetails.create({ advertisementId: ad.id, ...pickModelFields(UsedVehicleDetails, details) });
    }

    await logAudit({ action: 'AD_CREATE', details: `Ad ${adId} (${vehicleType}) created: ${carTitle}`, userId: req.user.id, req });

    notify({
      userId: req.user.id,
      title: 'Advertisement Submitted',
      message: `Your advertisement "${carTitle}" (${adId}) has been submitted successfully.`,
      type: 'ad',
      channels: ['in-app']
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Advertisement Submitted Successfully', ad: normalize(ad) });
  } catch (err) {
    console.error('Create ad error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit advertisement.' });
  }
};

// GET /api/ads/my  (supports ?adId= &batchNumber= &vehicleType= &from= &to= &q=)
const getMyAds = async (req, res) => {
  try {
    const { adId, batchNumber, vehicleType, from, to, q } = req.query;
    const where = { userId: req.user.id };

    if (adId) where.adId = { [Op.like]: `%${adId}%` };
    if (batchNumber) where.batchNumber = { [Op.like]: `%${batchNumber}%` };
    if (vehicleType && vehicleType !== 'all') where.vehicleType = vehicleType;
    if (q) {
      where[Op.or] = [
        { adId: { [Op.like]: `%${q}%` } },
        { batchNumber: { [Op.like]: `%${q}%` } },
        { carTitle: { [Op.like]: `%${q}%` } }
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const ads = await Advertisement.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, ads: normalize(ads) });
  } catch (err) {
    console.error('Get my ads error:', err);
    res.status(500).json({ success: false, message: 'Failed to load advertisements.' });
  }
};

// GET /api/ads/:id  (full ad with vehicle-type detail)
const getAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id, {
      include: [
        { model: NewVehicleDetails, as: 'newDetails' },
        { model: UsedVehicleDetails, as: 'usedDetails' },
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'email', 'mobile'] }
      ]
    });
    if (!ad) return res.status(404).json({ success: false, message: 'Advertisement not found.' });

    // Owner or admin only.
    if (ad.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this advertisement.' });
    }

    res.json({ success: true, ad: normalize(ad) });
  } catch (err) {
    console.error('Get ad error:', err);
    res.status(500).json({ success: false, message: 'Failed to load advertisement.' });
  }
};

// DELETE /api/ads/:id
const deleteAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    if (ad.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this advertisement.' });
    }

    const label = ad.adId;
    await NewVehicleDetails.destroy({ where: { advertisementId: ad.id } });
    await UsedVehicleDetails.destroy({ where: { advertisementId: ad.id } });
    await ad.destroy();

    await logAudit({ action: 'AD_DELETE', details: `Ad ${label} deleted`, userId: req.user.id, req });
    res.json({ success: true, message: 'Advertisement Deleted Successfully' });
  } catch (err) {
    console.error('Delete ad error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete advertisement.' });
  }
};

module.exports = { createAd, getMyAds, getAd, deleteAd };
