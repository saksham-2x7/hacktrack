const jwt = require('jsonwebtoken');

function requireAuth(handler) {
  return async (req, res) => {
    try {
      const cookieStr = req.headers.cookie || '';
      const match = cookieStr.match(new RegExp('(^| )auth_token=([^;]+)'));
      const token = match ? match[2] : null;

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

module.exports = { requireAuth };
