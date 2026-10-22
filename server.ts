import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Persistent database file on disk: data/messages.json
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'messages.json');

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readStoredMessages() {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read messages DB:', err);
    return [];
  }
}

function writeStoredMessages(messages: any[]) {
  try {
    ensureDbFile();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(messages, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Failed to write messages DB:', err);
    return false;
  }
}

// REST API Endpoints
app.get('/api/messages', (req, res) => {
  try {
    const list = readStoredMessages();
    res.json({ success: true, messages: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { sender_name, grade, message, envelope_color, stamp_type } = req.body;

    if (!sender_name || typeof sender_name !== 'string' || !sender_name.trim()) {
      return res.status(400).json({ success: false, error: 'اسم المرسل مطلوب' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'نص الرسالة مطلوب' });
    }

    const currentList = readStoredMessages();

    // Check for exact duplicates within the current list
    const existing = currentList.find(
      (m: any) =>
        m.sender_name?.trim() === sender_name.trim() &&
        m.message?.trim() === message.trim()
    );

    if (existing) {
      return res.json({ success: true, message: existing, duplicate: true });
    }

    const newRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      sender_name: sender_name.trim(),
      grade: (grade && typeof grade === 'string' && grade.trim()) || 'مدارس قواعد المستقبل',
      message: message.trim(),
      envelope_color: envelope_color || 'saudi-green',
      stamp_type: stamp_type || 'saudi-emblem',
      likes: 0,
      created_at: new Date().toISOString(),
    };

    const updatedList = [newRecord, ...currentList];
    writeStoredMessages(updatedList);

    res.status(201).json({ success: true, message: newRecord });
  } catch (err: any) {
    console.error('Error inserting message:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

app.post('/api/messages/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const currentList = readStoredMessages();
    let updatedLikes = 0;
    let found = false;

    const nextList = currentList.map((m: any) => {
      if (m.id === id) {
        found = true;
        updatedLikes = (Number(m.likes) || 0) + 1;
        return { ...m, likes: updatedLikes };
      }
      return m;
    });

    if (found) {
      writeStoredMessages(nextList);
      return res.json({ success: true, id, likes: updatedLikes });
    }

    res.status(404).json({ success: false, error: 'Message not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
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
