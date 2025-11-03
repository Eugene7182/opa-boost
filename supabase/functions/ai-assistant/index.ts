import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hugging Face Configuration
const HF_TOKEN = Deno.env.get('HUGGING_FACE_API_TOKEN');
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Input validation
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Требуется авторизация' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Неверный токен авторизации' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, type = 'chat' } = await req.json();

    if (!HF_TOKEN) {
      throw new Error('HUGGING_FACE_API_TOKEN is not configured');
    }

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Сообщения должны быть непустым массивом' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Максимум ${MAX_MESSAGES} сообщений` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') {
        return new Response(JSON.stringify({ error: 'Неверный формат сообщения' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ error: `Максимальная длина сообщения ${MAX_MESSAGE_LENGTH} символов` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let systemPrompt = '';
    
    if (type === 'chat') {
      systemPrompt = `Вы - AI-ассистент для системы управления полевыми продажами. 
      Помогайте менеджерам и промоутерам принимать решения на основе данных о продажах, конкурентах и рынке.
      Давайте конкретные, практичные рекомендации. Будьте кратким и по делу.`;
    } else if (type === 'decisions') {
      systemPrompt = `Вы - AI-аналитик для принятия бизнес-решений в сфере розничных продаж.
      Анализируйте данные о продажах, складских остатках, конкурентах и рыночных трендах.
      Выявляйте проблемы, возможности и давайте приоритизированные рекомендации.`;
    } else if (type === 'simulation') {
      systemPrompt = `Вы - AI-симулятор для моделирования бизнес-сценариев в розничных продажах.
      Анализируйте "что если" сценарии: изменение цен, промо-акции, расширение в новые регионы.
      Предсказывайте влияние на продажи, прибыль и рыночную долю. Показывайте риски и возможности.`;
    }

    // Build prompt for Hugging Face
    const prompt = `${systemPrompt}\n\n${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')}\n\nAssistant:`;

    console.log('Calling Hugging Face API for user:', user.id);

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
        options: {
          use_cache: false,
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Превышен лимит запросов Hugging Face. Попробуйте позже.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 503) {
        return new Response(JSON.stringify({ error: 'Модель загружается. Попробуйте через 20 секунд.' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Ошибка AI сервиса' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse Hugging Face response and convert to streaming format
    const data = await response.json();
    const generatedText = data[0]?.generated_text || '';

    // Convert to SSE format compatible with existing frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Split text into chunks for streaming effect
        const words = generatedText.split(' ');
        let currentChunk = '';
        
        for (let i = 0; i < words.length; i++) {
          currentChunk += (i > 0 ? ' ' : '') + words[i];
          
          if (currentChunk.length >= 20 || i === words.length - 1) {
            const chunk = {
              choices: [{
                delta: {
                  content: currentChunk
                }
              }]
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            currentChunk = '';
          }
        }
        
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('AI assistant error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Неизвестная ошибка' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
