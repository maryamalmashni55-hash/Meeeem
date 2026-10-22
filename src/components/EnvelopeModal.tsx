import React, { useEffect, useState } from 'react';
import { X, Heart, Printer, Share2, Shield, Star, Flame, Check } from 'lucide-react';
import { TributeMessage, StampType } from '../types';
import { soundManager } from '../utils/soundEffects';

interface EnvelopeModalProps {
  message: TributeMessage | null;
  onClose: () => void;
  onLike: (id: string, currentLikes: number) => void;
}

export const EnvelopeModal: React.FC<EnvelopeModalProps> = ({ message, onClose, onLike }) => {
  const [copied, setCopied] = useState(false);
  const [hasLikedLocally, setHasLikedLocally] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  useEffect(() => {
    if (message) {
      soundManager.playEnvelopeOpen();
      setIsOpening(true);
      const timer = setTimeout(() => setIsOpening(false), 250);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!message) return null;

  const handleLike = () => {
    soundManager.playHeartSound();
    setHasLikedLocally(true);
    onLike(message.id, message.likes);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `«${message.message}» — رسالة شكر لحماة الوطن 🇸🇦 من ${message.sender_name} (${message.grade}) - مدارس قواعد المستقبل العالمية`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStampIcon = (id: StampType) => {
    switch (id) {
      case 'saudi-emblem':
        return <span className="text-xl font-bold">🇸🇦</span>;
      case 'shield':
        return <Shield className="w-6 h-6 text-emerald-600" />;
      case 'honor-star':
        return <Star className="w-6 h-6 text-amber-500 fill-amber-500" />;
      case 'falcon':
        return <Flame className="w-6 h-6 text-emerald-600" />;
      case 'heart':
        return <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl bg-[#092015] rounded-3xl border-2 border-[#10B981]/50 shadow-2xl p-6 sm:p-10 transition-all transform duration-400 ${
          isOpening ? 'scale-90 opacity-0 -translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="إغلاق الرسالة"
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-[#05140C] hover:bg-[#113B24] text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#10B981]/20 text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-emerald-200">
              مدارس قواعد المستقبل العالمية
            </span>
            <span>·</span>
            <span>مبادرة من قسم مواد الهوية الوطنية</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px] tabular-nums">
            {(() => {
              try {
                const d = new Date(message.created_at);
                return isNaN(d.getTime())
                  ? 'اليوم'
                  : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
              } catch {
                return 'اليوم';
              }
            })()}
          </div>
        </div>

        {/* Parchment Letter */}
        <div className="relative bg-[#FAF7EE] text-[#142319] rounded-2xl p-6 sm:p-8 shadow-inner border border-[#10B981]/30 overflow-hidden">
          {/* Subtle Green/Gold Corner Accents */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-600/20 to-transparent pointer-events-none rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-emerald-600/20 to-transparent pointer-events-none rounded-tr-full" />

          {/* Letter Title */}
          <div className="text-center mb-6">
            <div className="text-xs font-bold text-emerald-800 tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <span>مبادرة شكر وتقدير لحماة الوطن</span>
              <span>🇸🇦</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#053018] font-serif">
              إلى جنودنا وأبطالنا البواسل حماة الوطن
            </h3>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#10B981] to-transparent mx-auto mt-2" />
          </div>

          {/* Message content in Amiri font */}
          <div className="my-6 text-base sm:text-xl text-[#1E3023] font-amiri leading-relaxed whitespace-pre-wrap text-justify selection:bg-emerald-500/20">
            {message.message}
          </div>

          {/* Letter Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-emerald-900/15 mt-8">
            <div>
              <div className="text-xs text-stone-500 mb-0.5">كاتب الرسالة:</div>
              <div className="text-base sm:text-lg font-bold text-[#053018]">
                {message.sender_name}
              </div>
              <div className="text-xs font-semibold text-emerald-800">
                {message.grade}
              </div>
            </div>

            {/* Stamp / Seal */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-md border-2 border-emerald-500/40">
                {renderStampIcon(message.stamp_type)}
              </div>
              <span className="text-[10px] text-stone-600 mt-1 font-semibold">
                ختم الوفاء
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              hasLikedLocally
                ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50'
                : 'bg-[#05140C] hover:bg-[#0D2D1B] text-slate-200 border border-slate-700 hover:border-rose-400'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                hasLikedLocally ? 'text-rose-400 fill-rose-500 scale-125' : 'text-slate-400'
              }`}
            />
            <span>{hasLikedLocally ? 'أضفت إعجابك' : 'أضف نبضة إعجاب'}</span>
            <span className="text-xs font-bold text-emerald-300 tabular-nums">
              ({message.likes})
            </span>
          </button>

          {/* Share & Print */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#05140C] hover:bg-[#0D2D1B] text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'مشاركة'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#05140C] hover:bg-[#0D2D1B] text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كبطاقة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvelopeModal;
