const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { username, password } = req.body;
  
  if (username === 'RIICUTIE' && password === '&?iBAN@YQIZyoT5WC@&') {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '1d' });
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
}
