export type EnvelopeColor = 'saudi-green' | 'royal-gold' | 'olive-khaki' | 'deep-navy' | 'pearl-white';

export type StampType = 'saudi-emblem' | 'shield' | 'honor-star' | 'falcon' | 'heart';

export interface TributeMessage {
  id: string;
  sender_name: string;
  grade: string;
  message: string;
  envelope_color: EnvelopeColor;
  stamp_type: StampType;
  likes: number;
  created_at: string;
}

export interface EnvelopeTheme {
  id: EnvelopeColor;
  name: string;
  bgGradient: string;
  flapGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

export interface StampInfo {
  id: StampType;
  name: string;
  iconName: string;
}
