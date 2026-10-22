import React, { useState, useMemo } from 'react';
import { Search, Heart, Shield, Star, Flame, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { TributeMessage, StampType } from '../types';
import { ENVELOPE_THEMES } from '../constants/themes';
import { soundManager } from '../utils/soundEffects';

interface LiveEnvelopesGalleryProps {
  messages: TributeMessage[];
  onSelectMessage: (msg: TributeMessage) => void;
  onLikeMessage: (id: string, currentLikes: number) => void;
}

export const LiveEnvelopesGallery: React.FC<LiveEnvelopesGalleryProps> = ({
  messages,
  onSelectMessage,
  onLikeMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  const safeMessages = useMemo(() => {
    return Array.isArray(messages)
      ? messages.filter((m): m is TributeMessage => Boolean(m && typeof m === 'object'))
      : [];
  }, [messages]);

  // Extract unique grades safely
  const grades = useMemo(() => {
    const s = new Set<string>();
    safeMessages.forEach((m) => {
      if (m.grade && typeof m.grade === 'string' && m.grade.trim()) {
        s.add(m.grade.trim());
      }
    });
    return Array.from(s);
  }, [safeMessages]);

  const filteredMessages = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return safeMessages.filter((m) => {
      const sName = String(m.sender_name || '').toLowerCase();
      const sMsg = String(m.message || '').toLowerCase();
      const sGrade = String(m.grade || '').toLowerCase();

      const matchSearch =
        !q || sName.includes(q) || sMsg.includes(q) || sGrade.includes(q);

      const matchGrade = selectedGrade === 'ALL' || String(m.grade || '').trim() === selectedGrade;

      return matchSearch && matchGrade;
    });
  }, [safeMessages, searchQuery, selectedGrade]);

  const renderStampIcon = (id: StampType) => {
    switch (id) {
      case 'saudi-emblem':
        return <span className="text-sm font-bold">🇸🇦</span>;
      case 'shield':
        return <Shield className="w-4 h-4 text-emerald-300" />;
      case 'honor-star':
        return <Star className="w-4 h-4 text-amber-300 fill-amber-300/40" />;
      case 'falcon':
        return <Flame className="w-4 h-4 text-emerald-300" />;
      case 'heart':
        return <Heart className="w-4 h-4 text-rose-400 fill-rose-400/40" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const handleHeartClick = (e: React.MouseEvent, m: TributeMessage) => {
    e.stopPropagation();
    soundManager.playHeartSound();
    onLikeMessage(m.id, m.likes);
  };

  return (
    <section id="live-wall" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#10B981]/20">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#092015] border border-[#10B981]/30 text-emerald-300 text-xs mb-3 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>القسم الثاني: معرض الأظرف التفاعلي (Live Wall)</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 flex flex-wrap items-center justify-center gap-2">
          <span>معرض رسائل الفخر لحماة الوطن 🇸🇦</span>
          <span className="text-xs sm:text-sm font-bold text-[#34D399] bg-[#05140C] border border-[#10B981]/40 px-3 py-1 rounded-full tabular-nums">
            {messages.length} {messages.length === 1 ? 'ظرف' : messages.length === 2 ? 'ظرفان' : 'أظرف'}
          </span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm">
          انقر على أي ظرف لفتحه وقراءة رسالة الشكر، أو اضغط زر القلب لنبض المحبة
        </p>
      </div>

      {/* Filter and Search Bar (Shown only when there are messages) */}
      {messages.length > 0 && (
        <div className="bg-[#092015] p-3.5 sm:p-4 rounded-2xl border border-[#10B981]/30 shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو كلمات الرسالة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#05140C] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-[#10B981] outline-none transition-colors"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedGrade('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedGrade === 'ALL'
                  ? 'bg-[#10B981] text-[#05140C]'
                  : 'bg-[#05140C] text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              جميع الصفوف ({messages.length})
            </button>
            {grades.slice(0, 4).map((gr) => (
              <button
                key={gr}
                onClick={() => setSelectedGrade(gr)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-[#10B981] text-[#05140C]'
                    : 'bg-[#05140C] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {gr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Envelopes Grid */}
      {messages.length === 0 ? (
        <div className="text-center py-16 px-6 bg-[#092015]/60 rounded-3xl border border-[#10B981]/20 max-w-lg mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#05140C] border border-[#10B981]/30 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-950/50">
            <Mail className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            لا توجد أظرف معروضة حالياً
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
            المعرض بانتظار مشاركاتكم.. كن أول من يُسطر كلمات الفخر والدعاء لحماة وطننا الغالي 🇸🇦 عبر نموذج إرسال الظرف أعلاه!
          </p>
          <button
            onClick={() => {
              const form = document.getElementById('send-envelope');
              if (form) form.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#34D399] to-[#10B981] text-[#05140C] text-xs font-bold hover:from-[#6EE7B7] transition-all cursor-pointer shadow-lg shadow-[#10B981]/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>إرسال أول ظرف الآن</span>
          </button>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-14 bg-[#092015]/40 rounded-2xl border border-slate-800">
          <Mail className="w-9 h-9 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">لا توجد أظرف تطابق بحثك حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMessages.map((m, idx) => {
            const defaultTheme = ENVELOPE_THEMES['saudi-green'] || Object.values(ENVELOPE_THEMES)[0];
            const theme = (m.envelope_color && ENVELOPE_THEMES[m.envelope_color]) || defaultTheme;
            const itemKey = m.id || `env-card-${idx}`;
            return (
              <div
                key={itemKey}
                onClick={() => onSelectMessage(m)}
                className={`group relative rounded-2xl p-5 bg-gradient-to-br ${theme.bgGradient} border-2 ${theme.borderColor} shadow-xl hover:shadow-2xl hover:shadow-[#10B981]/20 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between aspect-[1.35/1] overflow-hidden`}
              >
                {/* Triangular flap */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b ${theme.flapGradient} opacity-90 border-b border-white/20 transition-transform duration-300 group-hover:-translate-y-1`}
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  }}
                />

                {/* Recipient & Open Hint */}
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] text-white/70">إلى حماة الوطن:</div>
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                      <span>جنودنا البواسل</span>
                      <span>🇸🇦</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-emerald-200 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 group-hover:bg-[#10B981] group-hover:text-[#05140C] transition-colors">
                    <span>افتح الظرف</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>

                {/* Center Stamp */}
                <div className="relative z-20 flex justify-center items-center my-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] via-[#059669] to-[#044E29] flex items-center justify-center text-white shadow-xl border-2 border-emerald-300/40 transform group-hover:scale-110 transition-transform">
                    {renderStampIcon(m.stamp_type)}
                  </div>
                </div>

                {/* Footer: Sender and Heart button */}
                <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10">
                  <div className="max-w-[70%]">
                    <div className="text-[10px] text-slate-300">المرسل:</div>
                    <div className="text-xs font-bold text-white truncate">
                      {m.sender_name}
                    </div>
                    <div className="text-[11px] text-emerald-200 truncate">
                      {m.grade}
                    </div>
                  </div>

                  {/* Like button */}
                  <button
                    type="button"
                    onClick={(e) => handleHeartClick(e, m)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/60 text-slate-200 transition-colors cursor-pointer shrink-0"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 fill-rose-500/20" />
                    <span className="text-xs font-bold text-white tabular-nums">
                      {m.likes}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LiveEnvelopesGallery;
