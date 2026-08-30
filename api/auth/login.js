const { getPool } = require('../../lib/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, displayName: user.display_name },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '7d' }
    );

    // Set HttpOnly cookie
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7;
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Strict; Max-Age=${maxAge}; Path=/`);

    res.status(200).json({ 
      success: true, 
      user: { username: user.username, displayName: user.display_name } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
