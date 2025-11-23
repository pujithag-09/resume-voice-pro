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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating questions for session:', sessionId);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resumeData = session.resume_data;
    const category = session.category;

    console.log('Category:', category);
    console.log('Resume data:', resumeData);

    // Generate questions using AI
    const systemPrompt = `You are an expert interview question generator. Generate exactly 5 diverse, professional interview questions based on the candidate's resume and the chosen category (${category}).

Rules:
- Generate DIVERSE questions covering different aspects
- Avoid repetitive questions on the same topic
- Questions should be specific to the candidate's background
- Mix difficulty levels (entry, intermediate, advanced)
- For technical: cover different skills, projects, and technologies
- For behavioral: cover teamwork, leadership, challenges, adaptability, conflict resolution
- For communication: cover explanations, presentations, stakeholder management, feedback`;

    const userPrompt = `Generate 5 diverse ${category} interview questions for this candidate:

Name: ${resumeData?.name || 'Candidate'}
Skills: ${resumeData?.skills?.join(', ') || 'Not specified'}
Projects: ${resumeData?.projects?.join(', ') || 'Not specified'}
Experience: ${resumeData?.experience?.join(', ') || 'Not specified'}
Education: ${resumeData?.education?.join(', ') || 'Not specified'}
Certifications: ${resumeData?.certifications?.join(', ') || 'Not specified'}

Return 5 questions that are diverse and cover multiple areas.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_questions',
            description: 'Generate 5 diverse interview questions',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      type: { type: 'string' }
                    },
                    required: ['text', 'type']
                  },
                  minItems: 5,
                  maxItems: 5
                }
              },
              required: ['questions'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { questions } = JSON.parse(toolCall.function.arguments);

    console.log('Generated questions:', questions);

    // Save questions to database
    const questionsToInsert = questions.map((q: any, index: number) => ({
      session_id: sessionId,
      question_text: q.text,
      question_type: q.type || category,
      question_order: index + 1,
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Questions saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        questions: insertedQuestions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate questions error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
