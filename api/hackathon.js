const { getPool } = require('./db');
const { requireAuth } = require('./auth/middleware');

async function handler(req, res) {
  const pool = getPool();
  const userId = req.user.userId;
  const hackathonId = req.query.id;

  if (!hackathonId) return res.status(400).json({ error: 'Missing hackathon ID' });

  // Verify ownership (Only Leader can edit/delete)
  try {
    const check = await pool.query('SELECT user_id FROM hackathons WHERE id = $1', [hackathonId]);
    if (check.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden: Only the Team Leader can edit this hackathon' });
  } catch(e) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, organizer, startDate, endDate, category, status, prize, url, notes, teamSize, teamMembers } = req.body;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query(
          `UPDATE hackathons SET name=$1, organizer=$2, start_date=$3, end_date=$4, category=$5, status=$6, prize=$7, url=$8, notes=$9, team_size=$10 
           WHERE id=$11 AND user_id=$12`,
          [name, organizer, startDate, endDate, category, status, prize, url, notes, teamSize || 1, hackathonId, userId]
        );
        
        // Re-sync team members
        await client.query('DELETE FROM team_members WHERE hackathon_id = $1', [hackathonId]);
        
        if (teamMembers && teamMembers.length > 0) {
          for (let m of teamMembers) {
            await client.query(
              'INSERT INTO team_members (hackathon_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [hackathonId, m]
            );
          }
        }
        
        await client.query('COMMIT');
        return res.status(200).json({ success: true });
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
