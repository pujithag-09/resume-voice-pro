import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { sessionId, questionId, answerText, answerMode, responseTime, audioData, audioDuration } = await req.json();

    if (!sessionId || !questionId || !answerMode) {
      return new Response(
        JSON.stringify({ error: 'Session ID, question ID, and answer mode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Submitting answer:', { sessionId, questionId, answerMode });

    let finalAnswerText = answerText;
    let audioUrl = null;

    // Handle voice answer
    if (answerMode === 'voice' && audioData) {
      console.log('Processing voice answer...');

      // Upload audio to storage
      const audioFileName = `${sessionId}/${questionId}_${Date.now()}.webm`;
      const binaryAudio = processBase64Chunks(audioData);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(audioFileName, binaryAudio, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('Audio upload error:', uploadError);
      } else {
        console.log('Audio uploaded:', uploadData.path);
        audioUrl = uploadData.path;

        // Transcribe audio if Lovable AI is available
        if (lovableApiKey && !answerText) {
          console.log('Transcribing audio...');
          
          try {
            const formData = new FormData();
            const blob = new Blob([binaryAudio], { type: 'audio/webm' });
            formData.append('file', blob, 'audio.webm');
            formData.append('model', 'whisper-1');

            const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
              },
              body: formData,
            });

            if (transcribeResponse.ok) {
              const transcribeResult = await transcribeResponse.json();
              finalAnswerText = transcribeResult.text;
              console.log('Transcription successful');
            } else {
              console.error('Transcription failed:', await transcribeResponse.text());
              finalAnswerText = '[Voice answer recorded - transcription unavailable]';
            }
          } catch (transcribeError) {
            console.error('Transcription error:', transcribeError);
            finalAnswerText = '[Voice answer recorded - transcription unavailable]';
          }
        }
      }
    }

    // Save answer to database
    const answerData = {
      session_id: sessionId,
      question_id: questionId,
      answer_text: finalAnswerText || '',
      answer_mode: answerMode,
      response_time: responseTime || 0,
      audio_duration: audioDuration || 0,
      audio_url: audioUrl,
    };

    const { data: insertedAnswer, error: insertError } = await supabase
      .from('answers')
      .insert(answerData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save answer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Answer saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        answer: insertedAnswer
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Submit answer error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
