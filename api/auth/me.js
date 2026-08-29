const { requireAuth } = require('./middleware');

function handler(req, res) {
  // If requireAuth passes, req.user is set
  res.status(200).json({ user: req.user });
}

export default requireAuth(handler);
