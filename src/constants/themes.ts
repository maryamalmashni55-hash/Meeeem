import { EnvelopeTheme, StampInfo } from '../types';

export const ENVELOPE_THEMES: Record<string, EnvelopeTheme> = {
  'saudi-green': {
    id: 'saudi-green',
    name: 'الأخضر السعودي',
    bgGradient: 'from-[#053018] via-[#0A4725] to-[#042412]',
    flapGradient: 'from-[#0E5C31] to-[#063B1E]',
    borderColor: 'border-[#10B981]/60',
    textColor: 'text-emerald-50',
    accentColor: '#10B981',
  },
  'royal-gold': {
    id: 'royal-gold',
    name: 'الذهبي المذهّب',
    bgGradient: 'from-[#2D2108] via-[#48350E] to-[#201705]',
    flapGradient: 'from-[#614713] to-[#3B2B0A]',
    borderColor: 'border-[#F3D079]/70',
    textColor: 'text-amber-50',
    accentColor: '#F3D079',
  },
  'olive-khaki': {
    id: 'olive-khaki',
    name: 'الزيتي العسكري',
    bgGradient: 'from-[#1E2619] via-[#2D3A25] to-[#161D12]',
    flapGradient: 'from-[#3B4C30] to-[#24301E]',
    borderColor: 'border-[#A3B899]/50',
    textColor: 'text-stone-100',
    accentColor: '#A3B899',
  },
  'deep-navy': {
    id: 'deep-navy',
    name: 'الكحلي الوقور',
    bgGradient: 'from-[#0A162B] via-[#122345] to-[#07101F]',
    flapGradient: 'from-[#193262] to-[#0E1E3C]',
    borderColor: 'border-[#60A5FA]/40',
    textColor: 'text-blue-50',
    accentColor: '#60A5FA',
  },
  'pearl-white': {
    id: 'pearl-white',
    name: 'الأبيض اللؤلؤي',
    bgGradient: 'from-[#1E232B] via-[#2C333F] to-[#181C22]',
    flapGradient: 'from-[#394252] to-[#232933]',
    borderColor: 'border-slate-300/50',
    textColor: 'text-slate-100',
    accentColor: '#F1F5F9',
  },
};

export const STAMP_OPTIONS: StampInfo[] = [
  {
    id: 'saudi-emblem',
    name: 'نخلة وسيفان',
    iconName: 'Palmtree',
  },
  {
    id: 'shield',
    name: 'درع الوطن',
    iconName: 'Shield',
  },
  {
    id: 'honor-star',
    name: 'نجمة الشرف',
    iconName: 'Star',
  },
  {
    id: 'falcon',
    name: 'صقر العزة',
    iconName: 'Flame',
  },
  {
    id: 'heart',
    name: 'نبض الوفاء',
    iconName: 'Heart',
  },
];

export const SUGGESTED_QUOTES = [
  'إلى أبطالنا البواسل المرابطين على حدود الوطن، شكراً لكم يا درعنا الحصين.. بفضل الله ثم تضحياتكم ننعم بالأمن والأمان في بلادنا الغالية 🇸🇦.',
  'شكراً حماة الوطن.. أنتم فخرنا وعزتنا وعيننا الساهرة. نرفع أكف الدعاء لكم دائماً بالنصر والتمكين والتوفيق والسداد.',
  'تحية إجلال وإكبار لجنودنا البواسل في كل ثغر من ثغور وطننا الحبيب.. دامت رايتنا خفاقة بكم وبشجاعتكم.',
  'حماة الوطن، أنتم صمام الأمان ورمز الشجاعة والتضحية. حفظكم الله ورعاكم ونصركم وسدد رميكم.',
];

export const GRADE_CHOICES = [
  'KG 1',
  'KG 2',
  'KG 3',
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'كادر معلمات مدارس قواعد المستقبل',
];
