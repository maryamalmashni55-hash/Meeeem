import React, { useState, useEffect, useCallback } from 'react';
import { TributeMessage } from './types';
import { SendEnvelopeSection } from './components/SendEnvelopeSection';
import { LiveEnvelopesGallery } from './components/LiveEnvelopesGallery';
import { EnvelopeModal } from './components/EnvelopeModal';
import {
  fetchMessages,
  subscribeToRealtimeMessages,
  likeTributeMessage,
  deduplicateMessages,
} from './services/supabaseClient';

export default function App() {
  const [messages, setMessages] = useState<TributeMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<TributeMessage | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchMessages();
      setMessages(deduplicateMessages(data));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Refresh the shared Neon-backed gallery when realtime updates arrive.
    const unsubscribe = subscribeToRealtimeMessages((updatedMessages) => {
      setMessages(deduplicateMessages(updatedMessages));
      setSelectedMessage((current) => {
        if (!current) return null;
        const found = updatedMessages.find((m) => m.id === current.id);
        return found || current;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const handleMessageSent = (newMsg: TributeMessage) => {
    setMessages((prev) => deduplicateMessages([newMsg, ...prev]));
  };

  const handleLike = async (id: string, currentLikes: number) => {
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m))
    );
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
    }

    try {
      await likeTributeMessage(id, currentLikes);
    } catch (err) {
      console.error('Failed to record like:', err);
    }
  };

  return (
    <div className="min-h-screen bg-homeland-pattern text-[#FAF8F5] relative selection:bg-emerald-500/30 selection:text-white">
      {/* القسم الأول: قسم إرسال الظرف */}
      <SendEnvelopeSection
        onMessageSent={handleMessageSent}
        totalCount={messages.length}
      />

      {/* القسم الثاني: معرض الأظرف التفاعلي (Live Wall) */}
      <LiveEnvelopesGallery
        messages={messages}
        onSelectMessage={(msg) => setSelectedMessage(msg)}
        onLikeMessage={handleLike}
      />

      {/* نافذة فتح الظرف وقراءة الرسالة بحركة ثلاثية أبعاد */}
      {selectedMessage && (
        <EnvelopeModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onLike={handleLike}
        />
      )}
    </div>
  );
}

export { App };
