import express from 'express';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// In this container environment, nginx listens on 8080 and proxies traffic to 3000.
// If process.env.PORT is 8080 or not provided, the Node app must listen on 3000.
const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? Number(process.argv[portArgIdx + 1]) : null;
const PORT = cliPort || (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const messageColumns = `
  id,
  sender_name,
  grade,
  message,
  envelope_color,
  stamp_type,
  likes,
  created_at
`;

// REST API Endpoints
app.get('/api/messages', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${messageColumns} FROM public.messages ORDER BY created_at DESC`);
    res.json({ success: true, messages: result.rows });
  } catch (err: any) {
    console.error('Neon message read failed:', err);
    res.status(500).json({ success: false, error: 'تعذر تحميل الأظرف من قاعدة البيانات.' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { sender_name, grade, message, envelope_color, stamp_type } = req.body;
  const sender = typeof sender_name === 'string' ? sender_name.trim() : '';
  const text = typeof message === 'string' ? message.trim() : '';

  if (!sender) return res.status(400).json({ success: false, error: 'اسم المرسل مطلوب' });
  if (!text) return res.status(400).json({ success: false, error: 'نص الرسالة مطلوب' });

  try {
    const result = await pool.query(
      `INSERT INTO public.messages (sender_name, grade, message, envelope_color, stamp_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${messageColumns}`,
      [sender, typeof grade === 'string' && grade.trim() ? grade.trim() : 'مدارس قواعد المستقبل', text,
        typeof envelope_color === 'string' && envelope_color ? envelope_color : 'saudi-green',
        typeof stamp_type === 'string' && stamp_type ? stamp_type : 'saudi-emblem']
    );
    if (result.rowCount !== 1) throw new Error('Database insert returned no row');
    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err: any) {
    console.error('Neon message insert failed:', err);
    res.status(500).json({ success: false, error: 'تعذر حفظ الظرف في قاعدة البيانات.' });
  }
});

app.post('/api/messages/:id/like', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE public.messages SET likes = likes + 1 WHERE id = $1 RETURNING id, likes',
      [req.params.id]
    );
    if (result.rowCount !== 1) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, ...result.rows[0] });
  } catch (err: any) {
    console.error('Neon like update failed:', err);
    res.status(500).json({ success: false, error: 'تعذر تحديث التفاعل.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      // The hosted preview proxies HTTP but does not expose Vite's HMR WebSocket.
      // Disable the client socket so it cannot report "WebSocket closed without opened".
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
