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

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'messages.json');

function readLocalMessages(): any[] {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessages(messages: any[]): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

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

  // 1. If Supabase is configured
  if (supabase) {
    try {
      const { data: current } = await supabase
        .from('messages')
        .select('likes')
        .eq('id', id)
        .single();

      const newLikes = (Number(current?.likes) || 0) + 1;
      const { error } = await supabase
        .from('messages')
        .update({ likes: newLikes })
        .eq('id', id);

      if (!error) {
        return res.status(200).json({ success: true, id, likes: newLikes });
      }
    } catch (err: any) {
      console.warn('Supabase like error:', err);
    }
  }

  // 2. Fallback local file
  const currentList = readLocalMessages();
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
    writeLocalMessages(nextList);
    return res.status(200).json({ success: true, id, likes: updatedLikes });
  }

  return res.status(404).json({ success: false, error: 'Message not found' });
}
