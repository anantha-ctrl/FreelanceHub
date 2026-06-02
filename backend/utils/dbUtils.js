const normalize = (data) => {
  // Preserve Date instances — recursing into them would strip them to {}.
  if (data instanceof Date) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(normalize);
  }
  if (data && typeof data === 'object') {
    const raw = typeof data.get === 'function' ? data.get({ plain: true }) : data;
    if (raw instanceof Date) {
      return raw;
    }
    const result = {};
    Object.entries(raw).forEach(([key, value]) => {
      result[key] = normalize(value);
    });
    // Replace the scalar FK with its populated association object (Mongo-style),
    // whenever the association was included — even if the FK column is present.
    if (result.user !== undefined) {
      result.userId = result.user;
      delete result.user;
    }
    if (result.post !== undefined) {
      result.postId = result.post;
      delete result.post;
    }
    if (result.approvedByUser !== undefined) {
      result.approvedBy = result.approvedByUser;
      delete result.approvedByUser;
    }
    if (result.id !== undefined && result._id === undefined) {
      result._id = result.id;
    }
    return result;
  }
  return data;
};

module.exports = { normalize };