import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = 'chat' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Превышен лимит запросов. Попробуйте позже.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Требуется пополнение баланса Lovable AI.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Ошибка AI сервиса' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
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
