import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'messages.json');

function ensureDbFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring DB file:', err);
  }
}

function readStoredMessages(): any[] {
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

function writeStoredMessages(messages: any[]): boolean {
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

// Vite plugin to handle /api/messages directly in dev mode
function apiMessagesDevPlugin(): Plugin {
  return {
    name: 'api-messages-dev-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        if (url === '/api/messages') {
          if (req.method === 'GET') {
            const list = readStoredMessages();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, messages: list }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const sender_name = (parsed.sender_name || '').trim();
                const message = (parsed.message || '').trim();
                const grade = (parsed.grade || '').trim() || 'مدارس قواعد المستقبل';
                const envelope_color = parsed.envelope_color || 'saudi-green';
                const stamp_type = parsed.stamp_type || 'saudi-emblem';

                if (!sender_name) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: false, error: 'اسم المرسل مطلوب' }));
                  return;
                }
                if (!message) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: false, error: 'نص الرسالة مطلوب' }));
                  return;
                }

                const currentList = readStoredMessages();

                // Check for duplicate message from same sender
                const existing = currentList.find(
                  (m: any) =>
                    m.sender_name?.trim() === sender_name &&
                    m.message?.trim() === message
                );

                if (existing) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, message: existing, duplicate: true }));
                  return;
                }

                const newRecord = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                  sender_name,
                  grade,
                  message,
                  envelope_color,
                  stamp_type,
                  likes: 0,
                  created_at: new Date().toISOString(),
                };

                const updatedList = [newRecord, ...currentList];
                writeStoredMessages(updatedList);

                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, message: newRecord }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
              }
            });
            return;
          }
        }

        if (url.startsWith('/api/messages/') && url.endsWith('/like') && req.method === 'POST') {
          const parts = url.split('/');
          const id = parts[3];
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
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, id, likes: updatedLikes }));
            return;
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: 'Message not found' }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMessagesDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
      ),
      'process.env': JSON.stringify({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
      }),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
