import React, { useState, useEffect, useCallback } from 'react';
import { Database } from 'lucide-react';
import { TributeMessage } from './types';
import { SendEnvelopeSection } from './components/SendEnvelopeSection';
import { LiveEnvelopesGallery } from './components/LiveEnvelopesGallery';
import { EnvelopeModal } from './components/EnvelopeModal';
import { CloudDatabaseModal } from './components/CloudDatabaseModal';
import {
  fetchMessages,
  subscribeToRealtimeMessages,
  likeTributeMessage,
  deduplicateMessages,
  getSupabaseConfig,
} from './services/supabaseClient';

export default function App() {
  const [messages, setMessages] = useState<TributeMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<TributeMessage | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [isCloudConfigured, setIsCloudConfigured] = useState(() => getSupabaseConfig().isConfigured);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchMessages();
      setMessages(deduplicateMessages(data));
      setIsCloudConfigured(getSupabaseConfig().isConfigured);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Setup Supabase Realtime subscription
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
    <div className="min-h-screen bg-homeland-pattern text-[#FAF8F5] relative selection:bg-emerald-500/30 selection:text-white pb-12">
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

      {/* شارة إعدادات وتأكيد قاعدة البيانات السحابية الدائمة */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setShowDbModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-[#092015]/95 hover:bg-[#0F3523] border border-[#10B981]/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          title="فحص حالة قاعدة البيانات السحابية (Supabase) وإعدادات Vercel"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudConfigured ? 'bg-[#34D399] shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[11px]">
            {isCloudConfigured ? 'قاعدة البيانات السحابية (Supabase)' : 'إعدادات قاعدة البيانات (Vercel/Supabase)'}
          </span>
        </button>
      </div>

      {/* نافذة فحص وإعداد قاعدة البيانات السحابية */}
      <CloudDatabaseModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        onConfigUpdated={loadData}
      />
    </div>
  );
}
