# Database Setup Instructions

To complete the backend setup, you need to run the following SQL script in your Supabase SQL Editor.

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL below
5. Run the query

## SQL Script:

```sql
-- Create storage buckets for resumes and voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('resumes', 'resumes', false),
  ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('technical', 'behavioral', 'communication')),
  resume_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL,
  question_order int NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create answers table
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

-- Create reports table
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

-- Create policies (public access for MVP - restrict later)
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

-- Storage policies for resumes bucket
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

-- Storage policies for voice-recordings bucket
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON public.questions(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_id ON public.answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON public.reports(session_id);
```

## Verification

After running the script, verify:
- 4 tables created: `sessions`, `questions`, `answers`, `reports`
- 2 storage buckets created: `resumes`, `voice-recordings`
- RLS enabled on all tables
- Policies created for public access
- Indexes created for performance

## Next Steps

Once the database is set up, the application will be able to:
- Upload and parse resumes
- Generate AI-powered interview questions
- Store text and voice answers
- Evaluate performance and generate reports
- Export reports as PDFs

## Security Note

The current policies allow public access for MVP purposes. In production, you should:
1. Implement user authentication
2. Restrict access to user-owned sessions only
3. Add rate limiting
4. Implement file size limits
5. Add content validation
