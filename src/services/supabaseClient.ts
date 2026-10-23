import { TributeMessage } from '../types';

let inMemoryMessages: TributeMessage[] = [];

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
  const res = await fetch('/api/messages', { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !Array.isArray(data.messages)) {
    throw new Error(data?.error || 'تعذر تحميل الأظرف من قاعدة البيانات.');
  }
  inMemoryMessages = deduplicateMessages(data.messages);
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

  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender_name: newMsg.sender_name,
      grade: newMsg.grade,
      message: newMsg.message,
      envelope_color: newMsg.envelope_color,
      stamp_type: newMsg.stamp_type,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !data.message) {
    throw new Error(data?.error || 'تعذر حفظ الظرف في قاعدة البيانات.');
  }

  const saved = data.message;
  newMsg.id = String(saved.id);
  newMsg.created_at = saved.created_at || newMsg.created_at;
  newMsg.likes = Number(saved.likes) || 0;
  inMemoryMessages = deduplicateMessages([newMsg, ...inMemoryMessages]);

  return newMsg;
}

export async function likeTributeMessage(id: string, currentLikes: number): Promise<number> {
  const nextLikes = currentLikes + 1;

  const res = await fetch(`/api/messages/${id}/like`, { method: 'POST' });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'تعذر تحديث التفاعل.');
  }

  inMemoryMessages = inMemoryMessages.map((m) =>
    m.id === id ? { ...m, likes: Number(data.likes) || nextLikes } : m
  );
  return nextLikes;
}

export function subscribeToRealtimeMessages(
  onUpdate: (messages: TributeMessage[]) => void
): () => void {
  // Background polling every 6 seconds keeps all visitors and devices in sync through Neon.
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
  };
}
