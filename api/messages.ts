import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10
);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;

// Fallback file path (supports /tmp in serverless environments like Vercel)
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'messages.json');

function ensureDbFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf-8');
  } catch {}
}

function readLocalMessages(): any[] {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessages(messages: any[]): boolean {
  try {
    ensureDbFile();
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Fetch all messages
  if (req.method === 'GET') {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return res.status(200).json({ success: true, messages: data });
        }
      } catch (err: any) {
        console.warn('Supabase fetch error in serverless handler:', err);
      }
    }

    const list = readLocalMessages();
    return res.status(200).json({ success: true, messages: list });
  }

  // 2. POST: Insert new message
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const sender_name = (body.sender_name || '').trim();
      const message = (body.message || '').trim();
      const grade = (body.grade || '').trim() || 'مدارس قواعد المستقبل';
      const envelope_color = body.envelope_color || 'saudi-green';
      const stamp_type = body.stamp_type || 'saudi-emblem';

      if (!sender_name) {
        return res.status(400).json({ success: false, error: 'اسم المرسل مطلوب' });
      }
      if (!message) {
        return res.status(400).json({ success: false, error: 'نص الرسالة مطلوب' });
      }

      // If Supabase is configured, insert directly into the cloud database
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .insert([
              {
                sender_name,
                grade,
                message,
                envelope_color,
                stamp_type,
                likes: 0,
              },
            ])
            .select()
            .single();

          if (!error && data) {
            return res.status(201).json({ success: true, message: data });
          } else if (error) {
            console.error('Supabase insert error:', error);
          }
        } catch (err: any) {
          console.error('Supabase exception in serverless:', err);
        }
      }

      // Fallback local storage
      const currentList = readLocalMessages();
      const existing = currentList.find(
        (m: any) => m.sender_name?.trim() === sender_name && m.message?.trim() === message
      );

      if (existing) {
        return res.status(200).json({ success: true, message: existing, duplicate: true });
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

      writeLocalMessages([newRecord, ...currentList]);
      return res.status(201).json({ success: true, message: newRecord });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
