import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Session = {
  id: string;
  category: string;
  resume_data: any;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  session_id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  created_at: string;
};

export type Answer = {
  id: string;
  session_id: string;
  question_id: string;
  answer_text: string;
  answer_mode: 'text' | 'voice';
  response_time: number;
  audio_duration: number;
  audio_url: string | null;
  created_at: string;
};

export type Report = {
  id: string;
  session_id: string;
  overall_score: number;
  clarity_score: number;
  content_score: number;
  confidence_score: number;
  structure_score: number;
  strengths: string[];
  improvements: string[];
  feedback: Array<{ question: string; feedback: string }>;
  generated_at: string;
};
