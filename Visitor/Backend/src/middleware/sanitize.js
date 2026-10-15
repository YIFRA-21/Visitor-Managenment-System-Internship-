function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  if (str.startsWith('data:image/') || str.startsWith('data:application/')) return str;
  return str
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove unprintable control characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/(--|#|\/\*|\*\/)/g, ''); // Neutralize SQL comment markers
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('photo') ||
        key.toLowerCase().includes('image') ||
        key.toLowerCase().includes('url') ||
        key.toLowerCase().includes('file') ||
        key.toLowerCase().includes('avatar')
      ) {
        continue;
      }
      if (typeof obj[key] === 'string') {
        if (key.toLowerCase().includes('email')) {
          obj[key] = sanitizeString(obj[key]).toLowerCase();
        } else {
          obj[key] = sanitizeString(obj[key]);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
}

function sanitizeBody(req, res, next) {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  next();
}

module.exports = { sanitizeBody };
