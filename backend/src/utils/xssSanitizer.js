function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return escapeHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }

  return value;
}

function sanitizeResponseBody(body) {
  return sanitizeValue(body);
}

function sanitizeResponse() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => originalJson(sanitizeResponseBody(body));
    next();
  };
}

module.exports = {
  sanitizeResponse
};
