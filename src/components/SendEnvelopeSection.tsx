import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, Shield, Check, Heart, Star, Sparkles, Flame, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { EnvelopeColor, StampType, TributeMessage } from '../types';
import { ENVELOPE_THEMES, STAMP_OPTIONS, SUGGESTED_QUOTES, GRADE_CHOICES } from '../constants/themes';
import { createTributeMessage } from '../services/supabaseClient';
import { soundManager } from '../utils/soundEffects';

interface SendEnvelopeSectionProps {
  onMessageSent: (newMessage: TributeMessage) => void;
  totalCount: number;
}

export const SendEnvelopeSection: React.FC<SendEnvelopeSectionProps> = ({
  onMessageSent,
  totalCount,
}) => {
  const [senderName, setSenderName] = useState('');
  const [grade, setGrade] = useState(GRADE_CHOICES[0]);
  const [customGrade, setCustomGrade] = useState('');
  const [message, setMessage] = useState('');
  const [envelopeColor, setEnvelopeColor] = useState<EnvelopeColor>('saudi-green');
  const [stampType, setStampType] = useState<StampType>('saudi-emblem');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<TributeMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return Boolean(window.sessionStorage.getItem('HOMELAND_ENVELOPE_SENT'));
      }
    } catch {
      // sessionStorage restricted in some iframe modes
    }
    return false;
  });

  const activeThemeId = (lastSubmittedMessage && hasAlreadySubmitted)
    ? lastSubmittedMessage.envelope_color
    : envelopeColor;

  const selectedTheme =
    ENVELOPE_THEMES[activeThemeId] ||
    ENVELOPE_THEMES['saudi-green'] ||
    Object.values(ENVELOPE_THEMES)[0];

  const triggerNationalConfetti = () => {
    try {
      // 1. Central burst (Green, Emerald, Gold, White)
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#006C35', '#10B981', '#34D399', '#D4AF37', '#F3D079', '#FFFFFF'],
        scalar: 1.2,
      });

      // 2. Left side cannon
      setTimeout(() => {
        try {
          confetti({
            particleCount: 70,
            angle: 60,
            spread: 60,
            origin: { x: 0.05, y: 0.75 },
            colors: ['#10B981', '#34D399', '#D4AF37', '#FFFFFF'],
          });
        } catch {}
      }, 150);

      // 3. Right side cannon
      setTimeout(() => {
        try {
          confetti({
            particleCount: 70,
            angle: 120,
            spread: 60,
            origin: { x: 0.95, y: 0.75 },
            colors: ['#10B981', '#34D399', '#D4AF37', '#FFFFFF'],
          });
        } catch {}
      }, 300);

      // 4. Cascading golden stars & confetti rain
      setTimeout(() => {
        try {
          confetti({
            particleCount: 80,
            spread: 120,
            origin: { y: 0.2 },
            gravity: 0.9,
            ticks: 250,
            colors: ['#D4AF37', '#F3D079', '#10B981', '#FFFFFF'],
          });
        } catch {}
      }, 500);
    } catch {
      // Confetti should never block submission
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedSender = senderName.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSender) {
      setErrorMessage('يرجى كتابة اسم المرسل أو المرسلة.');
      return;
    }
    if (!trimmedMessage) {
      setErrorMessage('يرجى كتابة نص رسالة الشكر لحماة الوطن.');
      return;
    }

    setIsSubmitting(true);
    setIsSealing(true);

    const finalGrade = customGrade.trim() ? customGrade.trim() : grade;

    try {
      // Audio & visual feedback wrapped safely
      try {
        soundManager.playTributeSend();
      } catch {}
      triggerNationalConfetti();

      // Persist to server backend & cloud database
      const created = await createTributeMessage({
        sender_name: trimmedSender,
        grade: finalGrade,
        message: trimmedMessage,
        envelope_color: envelopeColor,
        stamp_type: stampType,
      });

      // Record device submission safely
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('HOMELAND_ENVELOPE_SENT', 'true');
        }
      } catch {}

      setLastSubmittedMessage(created);
      setHasAlreadySubmitted(true);

      // Notify parent to update wall immediately
      if (typeof onMessageSent === 'function' && created) {
        onMessageSent(created);
      }

      // Reset fields for fresh entry
      setSenderName('');
      setMessage('');
      setCustomGrade('');
      setIsSealing(false);
    } catch (err: any) {
      console.error('Error submitting envelope:', err);
      setIsSealing(false);
      const msg = err?.message && typeof err.message === 'string' && err.message.length < 120
        ? err.message
        : 'حدث خطأ أثناء حفظ الظرف في قاعدة البيانات، يرجى المحاولة مرة أخرى.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewEnvelope = () => {
    setHasAlreadySubmitted(false);
    setLastSubmittedMessage(null);
    setErrorMessage(null);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('HOMELAND_ENVELOPE_SENT');
      }
    } catch {}
  };

  const handleScrollToWall = () => {
    try {
      const wall = document.getElementById('live-wall');
      if (wall && typeof wall.scrollIntoView === 'function') {
        wall.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {}
  };

  const renderStampIcon = (id: StampType) => {
    switch (id) {
      case 'saudi-emblem':
        return <span className="text-base font-bold">🇸🇦</span>;
      case 'shield':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'honor-star':
        return <Star className="w-5 h-5 text-amber-300 fill-amber-300/40" />;
      case 'falcon':
        return <Flame className="w-5 h-5 text-emerald-300" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-rose-400 fill-rose-400/40" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <section id="send-envelope" className="pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-[#0A2618]/90 backdrop-blur-md rounded-3xl border border-[#10B981]/30 p-6 sm:p-10 shadow-2xl mb-12 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-40 bg-[#10B981]/15 blur-3xl rounded-full pointer-events-none" />

        {/* School & Identity Department Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05170E] border border-[#10B981]/40 text-emerald-300 text-xs sm:text-sm font-semibold mb-5">
          <span>مدارس قواعد المستقبل العالمية</span>
          <span className="text-slate-500">·</span>
          <span>مبادرة من قسم مواد الهوية الوطنية</span>
        </div>

        {/* Main Initiative Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
          مبادرة «شكر وتقدير لحماة الوطن 🇸🇦»
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
          إلى جنودنا وأبطالنا البواسل المرابطين في كل ثغر.. بفضل الله ثم بتضحياتكم وعيونكم الساهرة ننعم بالأمن ونبني المستقبل. نسطر لكم هنا أصدق رسائل الفخر والاعتزاز والدعاء.
        </p>

        {/* Counter of Envelopes in the Header */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#05170E] border border-[#10B981]/40 text-xs sm:text-sm shadow-inner">
            <span className="text-emerald-300 font-medium">إجمالي الأظرف في المعرض:</span>
            <span className="text-[#34D399] font-black text-base sm:text-xl tabular-nums">{totalCount}</span>
            <span className="text-slate-400">ظرف ✉️</span>
          </div>
        </div>
      </div>

      {/* Section 1: Form & Envelope Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form or Success Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#092015] rounded-3xl p-6 sm:p-8 border border-[#10B981]/30 shadow-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-4 tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>القسم الأول: تجهيز وإرسال ظرف الشكر</span>
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-rose-300 mb-0.5">تنبيه أثناء الإرسال:</div>
                <div>{errorMessage}</div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs text-rose-400 hover:text-white px-2 py-1 rounded cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {hasAlreadySubmitted ? (
            <div className="bg-[#05140C] rounded-2xl p-6 sm:p-8 border border-[#10B981]/50 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-950/60">
                <Check className="w-8 h-8 text-[#34D399]" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] text-xs font-semibold mb-3 border border-[#10B981]/40">
                ✨ تم حفظ الظرف بنجاح
              </span>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                تم إرسال ظرفك بنجاح لحماة الوطن 🇸🇦
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
                تم حفظ ظرفك بشكل دائم ومشترك في قاعدة البيانات السحابية ليظهر فوراً أمام جميع الزوار والطلاب في المعرض التفاعلي تقديراً لحماة وطننا.
              </p>

              {lastSubmittedMessage && (
                <div className="bg-[#092015] border border-[#10B981]/30 rounded-xl p-4 mb-6 text-right text-xs">
                  <div className="text-slate-400 mb-1">
                    المرسل: <span className="text-white font-bold">{lastSubmittedMessage.sender_name}</span> ({lastSubmittedMessage.grade})
                  </div>
                  <div className="text-emerald-200 font-amiri text-sm line-clamp-2">
                    «{lastSubmittedMessage.message}»
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleScrollToWall}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#34D399] to-[#10B981] text-[#05140C] text-xs sm:text-sm font-bold hover:from-[#6EE7B7] transition-all cursor-pointer shadow-lg shadow-[#10B981]/25 inline-flex items-center justify-center gap-2"
                >
                  <span>مشاهدة الأظرف في المعرض التفاعلي ⬇️</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForNewEnvelope}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0F3523] hover:bg-[#15462F] text-emerald-200 border border-[#10B981]/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>كتابة ظرف آخر ✍️</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Sender & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
                    اسم المرسل / المرسلة <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الطالب فهد محمد / أسرة الصف الأول"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#05140C] border border-slate-700 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white text-sm outline-none transition-all placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
                    الصف أو المرحلة الدراسية
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value);
                      setCustomGrade('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#05140C] border border-slate-700 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white text-sm outline-none transition-all"
                  >
                    {GRADE_CHOICES.map((choice) => (
                      <option key={choice} value={choice} className="bg-[#092015]">
                        {choice}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Grade input */}
              <div>
                <input
                  type="text"
                  placeholder="أو اكتب الصف/الفصل يدوياً (اختياري)"
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-lg bg-[#05140C]/60 border border-slate-800 text-xs text-slate-300 placeholder:text-slate-500 focus:border-[#10B981]/70 outline-none"
                />
              </div>

              {/* Envelope Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-2">
                  اختر لون الظرف:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.values(ENVELOPE_THEMES).map((th) => {
                    const isSelected = envelopeColor === th.id;
                    return (
                      <button
                        type="button"
                        key={th.id}
                        onClick={() => setEnvelopeColor(th.id)}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#10B981] bg-[#0F3523] shadow-md shadow-[#10B981]/20 scale-102'
                            : 'border-slate-800 bg-[#05140C] hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-br ${th.bgGradient} border border-white/20 shadow-inner flex items-center justify-center`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="truncate w-full text-center text-[11px]">{th.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stamp selector */}
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
                  اختر رمز الختم الوطني:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {STAMP_OPTIONS.map((st) => {
                    const isSelected = stampType === st.id;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setStampType(st.id)}
                        className={`p-2 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#10B981] bg-[#0F3523] text-emerald-200'
                            : 'border-slate-800 bg-[#05140C] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {renderStampIcon(st.id)}
                        <span className="text-[10px] truncate w-full text-center">{st.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Quotes */}
              <div>
                <div className="text-xs font-medium text-slate-300 mb-1.5">
                  عبارات جاهزة لحماة الوطن (انقر للاستخدام الفوري):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUOTES.map((q, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setMessage(q)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#05140C] text-slate-300 hover:text-emerald-200 hover:bg-[#0E2E1D] border border-slate-800 transition-colors cursor-pointer text-right max-w-full truncate"
                    >
                      «{q.substring(0, 42)}...»
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-emerald-200">
                    نص رسالة الشكر لحماة الوطن 🇸🇦 <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {message.length} حرفاً
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="اكتب هنا كلمات الشكر والوفاء والدعاء لجنودنا وأبطالنا حماة الوطن..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05140C] border border-slate-700 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white text-sm outline-none transition-all placeholder:text-slate-500 font-amiri text-base leading-relaxed"
                />
              </div>

              {/* Submit button with loading spinner */}
              <button
                type="submit"
                disabled={isSubmitting || !senderName.trim() || !message.trim()}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-[#05140C] bg-gradient-to-r from-[#34D399] via-[#10B981] to-[#059669] hover:from-[#6EE7B7] hover:to-[#10B981] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#10B981]/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري ختم وحفظ الظرف في قاعدة البيانات...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 rotate-180" />
                    <span>إغلاق الظرف وإرساله لحماة الوطن 🇸🇦</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Envelope Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full sticky top-8">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>معاينة الظرف</span>
              <span className="text-emerald-400 font-bold">{selectedTheme.name}</span>
            </div>

            {/* Envelope Card */}
            <div
              className={`relative w-full aspect-[1.38/1] rounded-2xl p-6 bg-gradient-to-br ${selectedTheme.bgGradient} border-2 ${selectedTheme.borderColor} shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                isSealing ? 'scale-95 brightness-110' : ''
              }`}
            >
              {/* Flap Graphic */}
              <div
                className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b ${selectedTheme.flapGradient} opacity-90 border-b border-white/20`}
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }}
              />

              {/* Recipient */}
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-200/90 font-medium">
                    إلى الأبطال البواسل:
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>حماة الوطن</span>
                    <span>🇸🇦</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-300 text-left">
                  مدارس قواعد المستقبل
                </div>
              </div>

              {/* Center Seal */}
              <div className="relative z-20 flex justify-center items-center my-auto">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#10B981] via-[#059669] to-[#044E29] flex items-center justify-center text-white shadow-xl border-2 border-emerald-300/40 transform hover:scale-105 transition-transform">
                  {renderStampIcon(
                    (lastSubmittedMessage && hasAlreadySubmitted)
                      ? lastSubmittedMessage.stamp_type
                      : stampType
                  )}
                </div>
              </div>

              {/* Sender Details */}
              <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400">المرسل:</div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px]">
                    {(lastSubmittedMessage && hasAlreadySubmitted)
                      ? lastSubmittedMessage.sender_name
                      : (senderName.trim() || 'اسم المرسل هنا')}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400">الصف:</div>
                  <div className="text-xs font-medium text-emerald-200">
                    {(lastSubmittedMessage && hasAlreadySubmitted)
                      ? lastSubmittedMessage.grade
                      : (customGrade.trim() || grade)}
                  </div>
                </div>
              </div>
            </div>

            {/* Note badge */}
            <div className="mt-4 p-4 rounded-xl bg-[#092015] border border-[#10B981]/20 text-xs text-slate-300">
              <span className="font-bold text-emerald-300 block mb-1">
                🇸🇦 مبادرة وفاء وطنية
              </span>
              تُحفظ جميع الرسائل بشكل دائم ومشترك في قاعدة البيانات لتظهر مباشرة أمام كافة الزوار تقديراً لتضحيات حماة وطننا الغالي.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SendEnvelopeSection;
