import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { TributeMessage } from '../types';

// Read environment variables as specified by user
const envSupabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (import.meta.env?.VITE_SUPABASE_URL as string) ||
  '';

const envSupabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

export const INITIAL_TRIBUTE_MESSAGES: TributeMessage[] = [];

let inMemoryMessages: TributeMessage[] = [];
const listeners: Array<(messages: TributeMessage[]) => void> = [];

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('homeland_protectors_channel');
    broadcastChannel.onmessage = (event) => {
      if (event?.data?.type === 'SYNC_MESSAGES' && Array.isArray(event.data.messages)) {
        inMemoryMessages = deduplicateMessages(event.data.messages);
        listeners.forEach((cb) => {
          try {
            cb([...inMemoryMessages]);
          } catch (e) {
            console.error('Listener callback error:', e);
          }
        });
      }
    };
  } catch {
    // BroadcastChannel might fail in some sandboxed iframes
  }
}

function notifyMemoryListeners() {
  const current = [...inMemoryMessages];
  listeners.forEach((cb) => {
    try {
      cb(current);
    } catch (e) {
      console.error('Listener error:', e);
    }
  });

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'SYNC_MESSAGES', messages: current });
    } catch {
      // Ignore postMessage iframe restrictions
    }
  }
}

let activeSupabaseClient: SupabaseClient | null = null;
let activeChannel: RealtimeChannel | null = null;

export function getSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  let sessionUrl: string | null = null;
  let sessionKey: string | null = null;

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionUrl = window.sessionStorage.getItem('CUSTOM_SUPABASE_URL');
      sessionKey = window.sessionStorage.getItem('CUSTOM_SUPABASE_ANON_KEY');
    }
  } catch {
    // sessionStorage might be restricted in cross-origin iframe
  }

  const url = (sessionUrl || envSupabaseUrl || '').trim();
  const key = (sessionKey || envSupabaseAnonKey || '').trim();
  const isConfigured = Boolean(url && key && url.startsWith('http') && key.length > 10);

  return { url, key, isConfigured };
}

export function setCustomSupabaseConfig(url: string, key: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (url && key) {
        window.sessionStorage.setItem('CUSTOM_SUPABASE_URL', url.trim());
        window.sessionStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', key.trim());
      } else {
        window.sessionStorage.removeItem('CUSTOM_SUPABASE_URL');
        window.sessionStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
      }
    }
  } catch {}

  activeSupabaseClient = null;
  if (activeChannel) {
    try {
      activeChannel.unsubscribe();
    } catch {}
    activeChannel = null;
  }
}

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string }> {
  try {
    const trimmedUrl = (url || '').trim();
    const trimmedKey = (key || '').trim();
    if (!trimmedUrl.startsWith('http')) {
      return { success: false, message: 'رابط Supabase يجب أن يبدأ بـ https://' };
    }
    if (trimmedKey.length < 15) {
      return { success: false, message: 'مفتاح Anon Key غير صالح أو قصير جداً' };
    }
    const testClient = createClient(trimmedUrl, trimmedKey, { auth: { persistSession: false } });
    const { error } = await testClient.from('messages').select('id', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'تم الاتصال بـ Supabase، ولكن جدول messages غير موجود. يرجى إنشاء الجدول باستخدام كود SQL الموضح أدناه.',
        };
      }
      return { success: false, message: `تعذر الاتصال بقاعدة البيانات: ${error.message}` };
    }
    return {
      success: true,
      message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح! جدول الأظرف جاهز للحفظ والقراءة والمزامنة اللحظية.',
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'تعذر الاتصال بقاعدة بيانات Supabase' };
  }
}

export function initSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (activeSupabaseClient) return activeSupabaseClient;

  try {
    activeSupabaseClient = createClient(url, key, {
      auth: { persistSession: false },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return activeSupabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function deduplicateMessages(list: TributeMessage[]): TributeMessage[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const result: TributeMessage[] = [];

  for (const item of list) {
    if (!item) continue;
    const safeId = String(item.id || '').trim();
    const sName = String(item.sender_name || '').trim();
    const sMsg = String(item.message || '').trim();
    const contentKey = `${sName}__${sMsg}`;

    if (safeId && seenIds.has(safeId)) continue;
    if (contentKey && contentKey !== '__' && seenContent.has(contentKey)) continue;

    if (safeId) seenIds.add(safeId);
    if (contentKey && contentKey !== '__') seenContent.add(contentKey);

    result.push({
      id: safeId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender_name: sName || 'فاعل خير',
      grade: String(item.grade || 'مدارس قواعد المستقبل').trim(),
      message: sMsg,
      envelope_color: item.envelope_color || 'saudi-green',
      stamp_type: item.stamp_type || 'saudi-emblem',
      likes: Number(item.likes) || 0,
      created_at: item.created_at || new Date().toISOString(),
    });
  }

  return result;
}

export async function fetchMessages(): Promise<TributeMessage[]> {
  // 1. If Supabase is configured, use it as the primary permanent cloud database
  const supabase = initSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: TributeMessage[] = data.map((item: any) => ({
          id: String(item.id),
          sender_name: item.sender_name || 'فاعل خير',
          grade: item.grade || 'مدارس قواعد المستقبل',
          message: item.message || '',
          envelope_color: item.envelope_color || 'saudi-green',
          stamp_type: item.stamp_type || 'saudi-emblem',
          likes: Number(item.likes) || 0,
          created_at: item.created_at || new Date().toISOString(),
        }));

        inMemoryMessages = deduplicateMessages(mapped);
        return inMemoryMessages;
      }
    } catch (err) {
      console.warn('Supabase fetch error, checking API fallback:', err);
    }
  }

  // 2. Fetch from /api/messages (Vercel Serverless Function or Node server)
  try {
    const res = await fetch('/api/messages', {
      headers: { Accept: 'application/json' },
    });
    const cType = res.headers.get('content-type') || '';
    if (res.ok && cType.includes('application/json')) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.messages)) {
        inMemoryMessages = deduplicateMessages(data.messages);
        return inMemoryMessages;
      }
    }
  } catch (err) {
    // API unreachable
  }

  return inMemoryMessages;
}

export async function createTributeMessage(
  payload: Omit<TributeMessage, 'id' | 'likes' | 'created_at'>
): Promise<TributeMessage> {
  const newMsg: TributeMessage = {
    ...payload,
    sender_name: (payload.sender_name || '').trim(),
    grade: (payload.grade || '').trim() || 'مدارس قواعد المستقبل',
    message: (payload.message || '').trim(),
    envelope_color: payload.envelope_color || 'saudi-green',
    stamp_type: payload.stamp_type || 'saudi-emblem',
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    likes: 0,
    created_at: new Date().toISOString(),
  };

  let savedInSupabase = false;

  // 1. If Supabase is configured, insert directly into permanent cloud database
  const supabase = initSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_name: newMsg.sender_name,
            grade: newMsg.grade,
            message: newMsg.message,
            envelope_color: newMsg.envelope_color,
            stamp_type: newMsg.stamp_type,
            likes: 0,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        newMsg.id = String(data.id);
        newMsg.created_at = data.created_at || newMsg.created_at;
        savedInSupabase = true;
      } else if (error) {
        console.error('Supabase insert error:', error);
      }
    } catch (err) {
      console.warn('Failed to insert directly into Supabase:', err);
    }
  }

  // 2. Persist to /api/messages (Vercel Serverless Function & Node backend)
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender_name: newMsg.sender_name,
        grade: newMsg.grade,
        message: newMsg.message,
        envelope_color: newMsg.envelope_color,
        stamp_type: newMsg.stamp_type,
      }),
    });

    const cType = res.headers.get('content-type') || '';
    if (res.ok && cType.includes('application/json')) {
      const data = await res.json();
      if (data?.success && data?.message && !savedInSupabase) {
        newMsg.id = String(data.message.id || newMsg.id);
        newMsg.created_at = data.message.created_at || newMsg.created_at;
      }
    }
  } catch (err) {
    console.warn('Could not save to /api/messages:', err);
  }

  inMemoryMessages = deduplicateMessages([newMsg, ...inMemoryMessages]);
  notifyMemoryListeners();

  return newMsg;
}

export async function likeTributeMessage(id: string, currentLikes: number): Promise<number> {
  const nextLikes = currentLikes + 1;

  // 1. Update Supabase if configured
  const supabase = initSupabase();
  if (supabase) {
    try {
      await supabase.from('messages').update({ likes: nextLikes }).eq('id', id);
    } catch (err) {
      console.warn('Error updating like on Supabase:', err);
    }
  }

  // 2. Update via API
  try {
    await fetch(`/api/messages/${id}/like`, { method: 'POST' });
  } catch {}

  inMemoryMessages = inMemoryMessages.map((m) => (m.id === id ? { ...m, likes: nextLikes } : m));
  notifyMemoryListeners();
  return nextLikes;
}

export function subscribeToRealtimeMessages(
  onUpdate: (messages: TributeMessage[]) => void
): () => void {
  listeners.push(onUpdate);

  // Setup Supabase Realtime subscription
  const supabase = initSupabase();
  if (supabase) {
    try {
      if (activeChannel) {
        activeChannel.unsubscribe();
      }

      activeChannel = supabase
        .channel('homeland-messages-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          async () => {
            const updated = await fetchMessages();
            onUpdate(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  // Background polling every 6 seconds so all visitors/devices stay in sync
  const pollInterval = setInterval(async () => {
    try {
      const updated = await fetchMessages();
      onUpdate(updated);
    } catch {
      // Ignore background poll errors
    }
  }, 6000);

  return () => {
    clearInterval(pollInterval);
    const idx = listeners.indexOf(onUpdate);
    if (idx !== -1) listeners.splice(idx, 1);
    if (activeChannel) {
      activeChannel.unsubscribe();
      activeChannel = null;
    }
  };
}
