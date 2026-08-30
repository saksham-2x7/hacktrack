const { getPool } = require('./db');

export default async function handler(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const hackathons = await pool.query('SELECT COUNT(*) FROM hackathons');
    res.status(200).json({ users: parseInt(result.rows[0].count), hackathons: parseInt(hackathons.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}
