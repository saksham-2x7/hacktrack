const jwt = require('jsonwebtoken');
const { getPool } = require('../db');

export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key');
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const pool = getPool();
  try {
    const userResult = await pool.query('SELECT id, username, display_name, created_at FROM users ORDER BY created_at DESC');
    const hackResult = await pool.query('SELECT COUNT(*) FROM hackathons');
    const teamResult = await pool.query('SELECT COUNT(*) FROM team_members');

    res.status(200).json({
      stats: {
        totalUsers: parseInt(userResult.rowCount),
        totalHackathons: parseInt(hackResult.rows[0].count),
        totalTeamMemberships: parseInt(teamResult.rows[0].count)
      },
      users: userResult.rows.map(r => ({
        id: r.id,
        username: r.username,
        displayName: r.display_name,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}
