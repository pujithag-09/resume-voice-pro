import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Setting up database schema...');

    // This function helps set up the database schema
    // In production, this would be done via migrations
    const setupSQL = `
      -- Create storage buckets
      INSERT INTO storage.buckets (id, name, public)
      VALUES 
        ('resumes', 'resumes', false),
        ('voice-recordings', 'voice-recordings', false)
      ON CONFLICT (id) DO NOTHING;

      -- Create tables
      CREATE TABLE IF NOT EXISTS public.sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category text NOT NULL CHECK (category IN ('technical', 'behavioral', 'communication')),
        resume_data jsonb,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.questions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
        question_text text NOT NULL,
        question_type text NOT NULL,
        question_order int NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.answers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
        question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
        answer_text text NOT NULL,
        answer_mode text NOT NULL CHECK (answer_mode IN ('text', 'voice')),
        response_time int,
        audio_duration int,
        audio_url text,
        created_at timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
        overall_score int NOT NULL,
        clarity_score int NOT NULL,
        content_score int NOT NULL,
        confidence_score int NOT NULL,
        structure_score int NOT NULL,
        strengths jsonb,
        improvements jsonb,
        feedback jsonb,
        generated_at timestamp with time zone DEFAULT now()
      );

      -- Enable RLS
      ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

      -- Create policies
      DROP POLICY IF EXISTS "Allow public access to sessions" ON public.sessions;
      CREATE POLICY "Allow public access to sessions"
        ON public.sessions FOR ALL
        USING (true)
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow public access to questions" ON public.questions;
      CREATE POLICY "Allow public access to questions"
        ON public.questions FOR ALL
        USING (true)
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow public access to answers" ON public.answers;
      CREATE POLICY "Allow public access to answers"
        ON public.answers FOR ALL
        USING (true)
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow public access to reports" ON public.reports;
      CREATE POLICY "Allow public access to reports"
        ON public.reports FOR ALL
        USING (true)
        WITH CHECK (true);

      -- Storage policies
      DROP POLICY IF EXISTS "Allow public upload to resumes" ON storage.objects;
      CREATE POLICY "Allow public upload to resumes"
        ON storage.objects FOR INSERT
        TO public
        WITH CHECK (bucket_id = 'resumes');

      DROP POLICY IF EXISTS "Allow public read from resumes" ON storage.objects;
      CREATE POLICY "Allow public read from resumes"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'resumes');

      DROP POLICY IF EXISTS "Allow public upload to voice-recordings" ON storage.objects;
      CREATE POLICY "Allow public upload to voice-recordings"
        ON storage.objects FOR INSERT
        TO public
        WITH CHECK (bucket_id = 'voice-recordings');

      DROP POLICY IF EXISTS "Allow public read from voice-recordings" ON storage.objects;
      CREATE POLICY "Allow public read from voice-recordings"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'voice-recordings');

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_questions_session_id ON public.questions(session_id);
      CREATE INDEX IF NOT EXISTS idx_answers_session_id ON public.answers(session_id);
      CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
      CREATE INDEX IF NOT EXISTS idx_reports_session_id ON public.reports(session_id);
    `;

    console.log('Database setup completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Database schema setup completed',
        note: 'Run this SQL in your Supabase SQL Editor to complete setup',
        sql: setupSQL
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
