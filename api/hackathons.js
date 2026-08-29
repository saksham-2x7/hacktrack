const { getPool } = require('./db');
const { requireAuth } = require('./auth/middleware');

async function handler(req, res) {
  const pool = getPool();
  const userId = req.user.userId;

  if (req.method === 'GET') {
    try {
      const query = `
        SELECT h.*, 
          COALESCE(
            (SELECT json_agg(json_build_object('id', u.id, 'displayName', u.display_name, 'username', u.username)) 
             FROM team_members tm 
             JOIN users u ON u.id = tm.user_id 
             WHERE tm.hackathon_id = h.id
            ), '[]'::json
          ) as team_members
        FROM hackathons h
        WHERE h.user_id = $1 
           OR h.id IN (SELECT hackathon_id FROM team_members WHERE user_id = $1)
        ORDER BY h.start_date ASC
      `;
      const result = await pool.query(query, [userId]);
      return res.status(200).json(result.rows.map(r => ({
        id: r.id,
        leaderId: r.user_id,
        name: r.name,
        organizer: r.organizer,
        startDate: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : null,
        endDate: r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : null,
        category: r.category,
        status: r.status,
        prize: r.prize,
        url: r.url,
        notes: r.notes,
        teamSize: r.team_size || 1,
        teamMembers: typeof r.team_members === 'string' ? JSON.parse(r.team_members) : (r.team_members || [])
      })));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { name, organizer, startDate, endDate, category, status, prize, url, notes, teamSize, teamMembers } = req.body;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const result = await client.query(
          `INSERT INTO hackathons (user_id, name, organizer, start_date, end_date, category, status, prize, url, notes, team_size) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [userId, name, organizer, startDate, endDate, category, status, prize, url, notes, teamSize || 1]
        );
        const hackathonId = result.rows[0].id;
        
        if (teamMembers && teamMembers.length > 0) {
          for (let m of teamMembers) {
            await client.query(
              'INSERT INTO team_members (hackathon_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [hackathonId, m]
            );
          }
        }
        
        await client.query('COMMIT');
        return res.status(201).json({ id: hackathonId });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
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
