import { pool } from './_db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const id = req.query.id || req.body?.id;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Message ID is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE public.messages SET likes = likes + 1 WHERE id = $1 RETURNING id, likes',
      [id],
    );
    if (result.rowCount !== 1) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    return res.status(200).json({ success: true, ...result.rows[0] });
  } catch (error) {
    console.error('Neon like update failed:', error);
    return res.status(500).json({ success: false, error: 'تعذر تحديث التفاعل.' });
  }
}
