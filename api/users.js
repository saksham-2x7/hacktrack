const { getPool } = require('./db');
const { requireAuth } = require('./auth/middleware');

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const pool = getPool();
  try {
    // Only return safe fields
    const result = await pool.query('SELECT id, username, display_name FROM users ORDER BY display_name ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}

export default requireAuth(handler);
