const { getPool } = require('./db');
const { requireAuth } = require('./auth/middleware');

async function handler(req, res) {
  const pool = getPool();
  const userId = req.user.userId;

  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM hackathons WHERE user_id = $1 ORDER BY start_date ASC', [userId]);
      return res.status(200).json(result.rows.map(r => ({
        id: r.id,
        name: r.name,
        organizer: r.organizer,
        startDate: r.start_date ? r.start_date.toISOString().split('T')[0] : null,
        endDate: r.end_date ? r.end_date.toISOString().split('T')[0] : null,
        category: r.category,
        status: r.status,
        prize: r.prize,
        url: r.url,
        notes: r.notes
      })));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { name, organizer, startDate, endDate, category, status, prize, url, notes } = req.body;
      const result = await pool.query(
        `INSERT INTO hackathons (user_id, name, organizer, start_date, end_date, category, status, prize, url, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [userId, name, organizer, startDate, endDate, category, status, prize, url, notes]
      );
      return res.status(201).json({ id: result.rows[0].id });
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
