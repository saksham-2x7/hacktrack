export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `auth_token=; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Strict; Max-Age=0; Path=/`);

  res.status(200).json({ success: true });
}
