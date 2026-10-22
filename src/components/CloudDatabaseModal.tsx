import React, { useState } from 'react';
import { X, Database, Check, Copy, AlertCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  getSupabaseConfig,
  setCustomSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabaseClient';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.key);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection(url, anonKey);
      setTestResult(result);
      if (result.success) {
        setCustomSupabaseConfig(url, anonKey);
        onConfigUpdated();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'حدث خطأ غير متوقع أثناء فحص الاتصال.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setCustomSupabaseConfig(url, anonKey);
    onConfigUpdated();
    onClose();
  };

  const sqlSchema = `-- تشغيل هذا الكود في Supabase SQL Editor لإنشاء جدول الأظرف الدائم:
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT 'مدارس قواعد المستقبل',
  message TEXT NOT NULL,
  envelope_color TEXT NOT NULL DEFAULT 'saudi-green',
  stamp_type TEXT NOT NULL DEFAULT 'saudi-emblem',
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل سياسات الأمان (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الأظرف المعروضة
CREATE POLICY "Allow public read"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (true);

-- السماح للجميع بإضافة أظرف شكر جديدة
CREATE POLICY "Allow public insert"
ON public.messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- السماح للجميع بزيادة نبضات الإعجاب
CREATE POLICY "Allow public update likes"
ON public.messages
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- تفعيل المزامنة اللحظية (Realtime) لتصل الأظرف لكل الشاشات فوراً
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`;

  const copySqlToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sqlSchema);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const copyVercelEnv = () => {
    const text = `VITE_SUPABASE_URL=${url || 'https://your-project.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${anonKey || 'your-anon-key'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedVercel(true);
      setTimeout(() => setCopiedVercel(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#092015] border-2 border-[#10B981]/50 rounded-3xl p-6 sm:p-8 text-[#FAF8F5] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-[#05140C] hover:bg-[#113B24] text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#10B981]/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>إعداد قاعدة البيانات السحابية الدائمة (Supabase)</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-xs text-slate-300">
              ضمان حفظ الأظرف والإعجابات وتزامنها اللحظي عند النشر على Vercel أو أي منصة سحابية
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`p-3.5 rounded-2xl border mb-6 flex items-start gap-2.5 text-xs sm:text-sm ${
            currentConfig.isConfigured
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="mt-0.5">
            {currentConfig.isConfigured ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <div className="font-bold">
              {currentConfig.isConfigured
                ? '🟢 قاعدة البيانات السحابية (Supabase) متصلة ونشطة'
                : '🟡 وضع التخزين التلقائي — بانتظار إدخال بيانات Supabase للنشر الدائم'}
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">
              {currentConfig.isConfigured
                ? 'يتم حفظ جميع الأظرف وقراءتها مباشرة من جدول Supabase وتحديثها لحظياً لكل الزوار.'
                : 'في بيئات النشر السحابية مثل Vercel، التخزين المحلي غير دائم. اربط Supabase لحفظ المشاركات بشكل دائم دون ضياع.'}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">
              رابط مشروع Supabase (Project URL):
            </label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#05140C] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-[#10B981] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">
              المفتاح العام (Anon Public Key):
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#05140C] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-[#10B981] outline-none font-mono"
            />
          </div>

          {/* Test connection button and result */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={testing || !url.trim() || !anonKey.trim()}
              onClick={handleTestConnection}
              className="px-4 py-2 rounded-xl bg-[#0E3522] hover:bg-[#15462F] text-emerald-200 border border-[#10B981]/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>{testing ? 'جاري فحص الاتصال...' : 'اختبار الاتصال بـ Supabase الآن'}</span>
            </button>

            <button
              type="button"
              onClick={copyVercelEnv}
              className="px-3.5 py-2 rounded-xl bg-[#05140C] hover:bg-[#112E1F] text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copiedVercel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedVercel ? 'تم نسخ متغيرات Vercel' : 'نسخ لمتغيرات Vercel'}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
              }`}
            >
              <div className="mt-0.5">
                {testResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              </div>
              <div>{testResult.message}</div>
            </div>
          )}
        </div>

        {/* SQL Schema Accordion / Box */}
        <div className="bg-[#05140C] rounded-2xl border border-slate-800 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">
              كود SQL لإنشاء الجدول وسياسات الأمان في Supabase:
            </span>
            <button
              type="button"
              onClick={copySqlToClipboard}
              className="px-2.5 py-1 rounded-lg bg-[#0E3522] hover:bg-[#15462F] text-emerald-300 text-[11px] font-semibold border border-[#10B981]/30 flex items-center gap-1 cursor-pointer"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'تم النسخ' : 'نسخ كود SQL'}</span>
            </button>
          </div>
          <pre className="text-[10px] text-slate-400 font-mono bg-[#020A06] p-3 rounded-xl overflow-x-auto max-h-36 leading-relaxed select-all">
            {sqlSchema}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#10B981]/20">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 underline"
          >
            <span>فتح موقع Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#34D399] to-[#10B981] text-[#05140C] text-xs font-bold hover:from-[#6EE7B7] transition-all cursor-pointer shadow-md shadow-[#10B981]/20"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudDatabaseModal;
