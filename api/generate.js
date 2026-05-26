// Halfsaid — /api/generate
// Proxies streaming request to Groq API. API key never leaves the server.

const SYSTEM_PROMPTS = {
  ua: `Ти — Halfsaid, експерт з промпт-інжинірингу. Твоя задача — перетворити сиру ідею або чернетку користувача на потужний, готовий до використання промпт для AI-інструментів.

ГОЛОВНЕ ПРАВИЛО: ти не переформатовуєш і не перефразовуєш вхідний текст — ти створюєш НОВИЙ, значно кращий промпт на основі ідеї користувача.

Що робити:
• Заповни всі [плейсхолдери] і шаблонні місця конкретним, реальним змістом — жодних дужок у результаті
• Додай свою експертизу: специфічні деталі, техніки, нюанси яких немає у вхідному тексті
• Зроби промпт значно багатшим, конкретнішим і ефективнішим ніж оригінал
• Результат повинен бути одразу готовим до вставки — без правок з боку користувача

Правила виводу:
• ТІЛЬКИ готовий промпт — без вступу, коментарів, пояснень
• Мова: українська
• Результат має бути мінімум у 2-3 рази детальнішим за вхідний текст`,

  en: `You are Halfsaid, a prompt engineering expert. Your task is to transform a rough idea or draft into a powerful, ready-to-use prompt for AI tools.

CORE RULE: you do not reformat or rephrase the input — you create a NEW, significantly better prompt based on the user's idea.

What to do:
• Fill in all [placeholders] and template slots with specific, real content — no brackets in the output
• Add your expertise: specific details, techniques, nuances not present in the input
• Make the prompt significantly richer, more specific and more effective than the original
• The result must be immediately ready to paste — no editing needed from the user

Output rules:
• ONLY the ready prompt — no intro, comments, or explanations
• Language: English
• Result must be at least 2-3x more detailed than the input`,
};

const TYPE_HINTS = {
  ua: {
    photo:   'Це промпт для генерації зображення. Заповни всі плейсхолдери конкретними деталями. Додай: точний художній стиль з прикладами художників або епох, конкретне освітлення (золота година, студійне, дифузне), детальну колірну палітру з назвами кольорів, композицію (правило третин, симетрія, перспектива), настрій і атмосферу, технічні параметри для Midjourney (--ar, --style, --v) або DALL-E.',
    video:   'Це промпт для відео або сценарію. Заповни всі плейсхолдери реальним змістом. Напиши конкретний сценарій з таймкодами, реальним текстом для озвучки або субтитрів, описом кожної сцени, ракурсами камери, монтажними переходами, конкретною музикою або звуковим дизайном.',
    post:    'Це промпт для посту в соцмережах. Заповни всі плейсхолдери. Напиши конкретний гачок першого рядка, структуру тіла з реальними тезами, емоційний заклик до дії, 5-10 релевантних хештегів, рекомендації щодо візуалу.',
    text:    'Це промпт для тексту або статті. Заповни всі плейсхолдери. Визнач конкретну структуру з заголовками, тон і стиль з прикладами, цільову аудиторію з деталями, ключові тези які треба розкрити, SEO-ключові слова якщо потрібно.',
    general: 'Заповни всі плейсхолдери конкретним змістом. Додай: чіткий контекст і роль для AI, детальне завдання з кроками, конкретні вимоги до результату, формат і обсяг відповіді, приклади якщо допоможуть.',
  },
  en: {
    photo:   'This is an image generation prompt. Fill all placeholders with specific details. Add: exact artistic style with artist or era examples, specific lighting (golden hour, studio, diffused), detailed color palette with color names, composition (rule of thirds, symmetry, perspective), mood and atmosphere, technical parameters for Midjourney (--ar, --style, --v) or DALL-E.',
    video:   'This is a video or screenplay prompt. Fill all placeholders with real content. Write a specific script with timecodes, real voiceover or subtitle text, description of each scene, camera angles, editing transitions, specific music or sound design.',
    post:    'This is a social media post prompt. Fill all placeholders. Write a specific first-line hook, body structure with real points, emotional call-to-action, 5-10 relevant hashtags, visual recommendations.',
    text:    'This is a text or article prompt. Fill all placeholders. Define specific structure with headings, tone and style with examples, target audience with details, key points to cover, SEO keywords if needed.',
    general: 'Fill all placeholders with specific content. Add: clear context and role for AI, detailed task with steps, specific output requirements, format and length, examples if helpful.',
  },
};

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { input, type = 'general', lang = 'ua' } = req.body ?? {};

  if (!input?.trim()) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  const systemText = [
    SYSTEM_PROMPTS[lang] ?? SYSTEM_PROMPTS.ua,
    TYPE_HINTS[lang]?.[type] ?? TYPE_HINTS.ua.general,
  ].join('\n\n');

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemText },
          { role: 'user', content: input },
        ],
        max_tokens: 2048,
        temperature: 0.8,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

    // Stream SSE back to the browser
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch { /* skip malformed chunk */ }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
}
