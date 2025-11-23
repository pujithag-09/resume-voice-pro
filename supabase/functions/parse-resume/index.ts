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
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!file || !category) {
      return new Response(
        JSON.stringify({ error: 'File and category are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Uploading resume file:', file.name);

    // Upload file to storage
    const fileName = `${sessionId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File uploaded successfully:', uploadData.path);

    // Get file content for parsing
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(uploadData.path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file for parsing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to text (simplified - in production use proper PDF parser)
    const fileText = await fileData.text();
    
    // Use AI to parse resume if Lovable AI is available
    let parsedData = {
      name: 'Candidate',
      email: '',
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
    };

    if (lovableApiKey) {
      console.log('Parsing resume with AI...');
      
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a resume parser. Extract structured information from resumes and return it as JSON with fields: name, email, education (array), skills (array), projects (array), experience (array), certifications (array).'
              },
              {
                role: 'user',
                content: `Parse this resume and extract structured data:\n\n${fileText.substring(0, 10000)}`
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'parse_resume',
                description: 'Extract structured resume data',
                parameters: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    education: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    skills: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    projects: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    experience: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    certifications: { 
                      type: 'array',
                      items: { type: 'string' }
                    }
                  },
                  required: ['name', 'skills'],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'parse_resume' } }
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            parsedData = JSON.parse(toolCall.function.arguments);
            console.log('Resume parsed successfully with AI');
          }
        } else {
          console.error('AI parsing failed:', await aiResponse.text());
        }
      } catch (aiError) {
        console.error('AI parsing error:', aiError);
      }
    }

    // Update session with parsed resume data
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ 
        resume_data: parsedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save parsed data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resume parsing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionId,
        parsedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Parse resume error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
