const { getPool } = require('./db');

export default async function handler(req, res) {
  try {
    const pool = getPool();
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create hackathons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hackathons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        organizer VARCHAR(255),
        start_date DATE,
        end_date DATE,
        category VARCHAR(100),
        status VARCHAR(50),
        prize VARCHAR(255),
        url VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.status(200).json({ success: true, message: 'Database tables initialized successfully!' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
