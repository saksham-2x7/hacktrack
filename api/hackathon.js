const { getPool } = require('./db');
const { requireAuth } = require('./auth/middleware');

async function handler(req, res) {
  const pool = getPool();
  const userId = req.user.userId;
  const hackathonId = req.query.id;

  if (!hackathonId) return res.status(400).json({ error: 'Missing hackathon ID' });

  // Verify ownership
  try {
    const check = await pool.query('SELECT user_id FROM hackathons WHERE id = $1', [hackathonId]);
    if (check.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
  } catch(e) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, organizer, startDate, endDate, category, status, prize, url, notes } = req.body;
      await pool.query(
        `UPDATE hackathons SET name=$1, organizer=$2, start_date=$3, end_date=$4, category=$5, status=$6, prize=$7, url=$8, notes=$9 
         WHERE id=$10 AND user_id=$11`,
        [name, organizer, startDate, endDate, category, status, prize, url, notes, hackathonId, userId]
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
  } 
  
  else if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM hackathons WHERE id=$1 AND user_id=$2', [hackathonId, userId]);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
