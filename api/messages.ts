import { messageColumns, pool } from './_db';

type Request = { method?: string; body?: Record<string, unknown> };
type Response = { status: (code: number) => Response; json: (body: unknown) => Response; setHeader: (name: string, value: string) => void };

export default async function handler(req: Request, res: Response) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query(`SELECT ${messageColumns} FROM public.messages ORDER BY created_at DESC`);
      return res.status(200).json({ success: true, messages: result.rows });
    }

    if (req.method === 'POST') {
      const { sender_name, grade, message, envelope_color, stamp_type } = req.body ?? {};
      const sender = typeof sender_name === 'string' ? sender_name.trim() : '';
      const text = typeof message === 'string' ? message.trim() : '';

      if (!sender) return res.status(400).json({ success: false, error: 'اسم المرسل مطلوب' });
      if (!text) return res.status(400).json({ success: false, error: 'نص الرسالة مطلوب' });

      const result = await pool.query(
        `INSERT INTO public.messages (sender_name, grade, message, envelope_color, stamp_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${messageColumns}`,
        [
          sender,
          typeof grade === 'string' && grade.trim() ? grade.trim() : 'مدارس قواعد المستقبل',
          text,
          typeof envelope_color === 'string' && envelope_color ? envelope_color : 'saudi-green',
          typeof stamp_type === 'string' && stamp_type ? stamp_type : 'saudi-emblem',
        ],
      );

      if (result.rowCount !== 1) throw new Error('Database insert returned no row');
      return res.status(201).json({ success: true, message: result.rows[0] });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Neon messages API failed:', error);
    return res.status(500).json({ success: false, error: 'تعذر الاتصال بقاعدة البيانات.' });
  }
}
