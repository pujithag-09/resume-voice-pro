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

    console.log('Generating report for session:', sessionId);

    // Get session, questions, and answers
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

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_order');

    if (questionsError) {
      console.error('Questions error:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('Answers error:', answersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch answers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetched data:', { questionsCount: questions?.length, answersCount: answers?.length });

    // Prepare data for AI evaluation
    const qaData = questions?.map(q => {
      const answer = answers?.find(a => a.question_id === q.id);
      return {
        question: q.question_text,
        answer: answer?.answer_text || '[No answer provided]',
        mode: answer?.answer_mode || 'none',
        responseTime: answer?.response_time || 0
      };
    });

    const systemPrompt = `You are an expert interview evaluator. Analyze the candidate's interview performance and provide detailed feedback.

Evaluate based on:
1. Clarity (0-100): How clear and articulate are the answers?
2. Content (0-100): How relevant and comprehensive is the content?
3. Confidence (0-100): How confident and assured do the answers sound?
4. Structure (0-100): How well-structured and organized are the answers?

Also provide:
- 3-5 key strengths (specific, actionable points)
- 3-5 areas for improvement (specific, actionable suggestions)
- Brief feedback for each question-answer pair`;

    const userPrompt = `Evaluate this interview performance:

Category: ${session.category}
Candidate Background:
${JSON.stringify(session.resume_data, null, 2)}

Questions & Answers:
${qaData?.map((qa, i) => `
Q${i + 1}: ${qa.question}
A${i + 1} (${qa.mode}): ${qa.answer}
Response Time: ${qa.responseTime}s
`).join('\n')}

Provide a comprehensive evaluation.`;

    console.log('Sending to AI for evaluation...');

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
            name: 'evaluate_interview',
            description: 'Evaluate interview performance with scores and feedback',
            parameters: {
              type: 'object',
              properties: {
                clarity_score: { type: 'integer', minimum: 0, maximum: 100 },
                content_score: { type: 'integer', minimum: 0, maximum: 100 },
                confidence_score: { type: 'integer', minimum: 0, maximum: 100 },
                structure_score: { type: 'integer', minimum: 0, maximum: 100 },
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 3,
                  maxItems: 5
                },
                improvements: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 3,
                  maxItems: 5
                },
                feedback: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      feedback: { type: 'string' }
                    }
                  }
                }
              },
              required: ['clarity_score', 'content_score', 'confidence_score', 'structure_score', 'strengths', 'improvements'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'evaluate_interview' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to evaluate interview' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ error: 'Failed to evaluate interview' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evaluation = JSON.parse(toolCall.function.arguments);

    console.log('Evaluation received:', evaluation);

    // Calculate overall score
    const overallScore = Math.round(
      (evaluation.clarity_score + evaluation.content_score + 
       evaluation.confidence_score + evaluation.structure_score) / 4
    );

    // Save report to database
    const reportData = {
      session_id: sessionId,
      overall_score: overallScore,
      clarity_score: evaluation.clarity_score,
      content_score: evaluation.content_score,
      confidence_score: evaluation.confidence_score,
      structure_score: evaluation.structure_score,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      feedback: evaluation.feedback || [],
    };

    const { data: insertedReport, error: insertError } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Report saved successfully');

    // Calculate statistics
    const totalQuestions = questions?.length || 0;
    const avgResponseTime = answers && answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + (a.response_time || 0), 0) / answers.length)
      : 0;
    const totalRecordingDuration = answers
      ? answers.reduce((sum, a) => sum + (a.audio_duration || 0), 0)
      : 0;

    return new Response(
      JSON.stringify({ 
        success: true,
        report: {
          ...insertedReport,
          statistics: {
            totalQuestions,
            avgResponseTime,
            totalRecordingDuration
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate report error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
