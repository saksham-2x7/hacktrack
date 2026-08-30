const { getPool } = require('../../lib/db');
const bcrypt = require('bcrypt');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { username, displayName, password } = req.body;
  if (!username || !displayName || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = getPool();
    
    // Check limit
    const countRes = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(countRes.rows[0].count) >= 99) {
      return res.status(403).json({ error: 'Maximum user limit (99) reached.' });
    }

    const usernameLower = username.toLowerCase();
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    await pool.query(
      'INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3)',
      [usernameLower, displayName, passwordHash]
    );

    res.status(200).json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
