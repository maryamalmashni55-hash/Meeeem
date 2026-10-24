import { pool } from '../../_db.js';

type Request = { method?: string; query?: Record<string, string | string[] | undefined> };
type Response = { status: (code: number) => Response; json: (body: unknown) => Response; setHeader: (name: string, value: string) => void };

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(
      'UPDATE public.messages SET likes = likes + 1 WHERE id = $1 RETURNING id, likes',
      [typeof req.query?.id === 'string' ? req.query.id : ''],
    );
    if (result.rowCount !== 1) return res.status(404).json({ success: false, error: 'Message not found' });
    return res.status(200).json({ success: true, ...result.rows[0] });
  } catch (error) {
    console.error('Neon likes API failed:', error);
    return res.status(500).json({ success: false, error: 'تعذر تحديث التفاعل.' });
  }
}
