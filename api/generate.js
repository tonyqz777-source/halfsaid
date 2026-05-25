// Halfsaid — /api/generate
// Proxies streaming request to Gemini API. API key never leaves the server.

const SYSTEM_PROMPTS = {
  ua: `Ти — Halfsaid, експерт з промпт-інжинірингу. Перетвори просту ідею користувача на детальний, структурований, готовий до використання промпт для AI-інструментів.

Правила виводу:
• Відповідай ТІЛЬКИ готовим промптом — без вступних слів, пояснень і коментарів
• Промпт має бути конкретним, технічно точним і одразу готовим до вставки в AI-інструмент
• Мова промпту: українська
• Структуруй логічно: роль/контекст → завдання → технічні деталі → обмеження`,

  en: `You are Halfsaid, a prompt engineering expert. Transform the user's rough idea into a detailed, structured, ready-to-use prompt for AI tools.

Output rules:
• Respond with ONLY the ready prompt — no preamble, explanations or meta-commentary
• The prompt must be specific, technically precise, and immediately ready to paste into an AI tool
• Prompt language: English
• Structure logically: role/context → task → technical details → constraints`,
};

const TYPE_HINTS = {
  ua: {
    photo:   'Тип: зображення. Включи: художній стиль, освітлення, колірну гаму, композицію, настрій, технічні параметри для Midjourney/DALL-E/Stable Diffusion.',
    video:   'Тип: відео. Включи: структуру (вступ/розгортка/фінал), темп монтажу, музику, візуальний стиль, платформу (Runway/Sora/Kling).',
    post:    'Тип: пост для соцмереж. Включи: платформу, гачок першого рядка, структуру тіла, заклик до дії, хештеги, рекомендований тип медіа.',
    text:    'Тип: текст/стаття. Включи: структуру, тон, цільову аудиторію, ключові тези, SEO-вимоги, заклик до дії.',
    general: 'Тип: загальне завдання. Включи: контекст, чітку ціль, вимоги до виконання, очікуваний формат і обсяг результату.',
  },
  en: {
    photo:   'Type: image. Include: artistic style, lighting, color palette, composition, mood, technical parameters for Midjourney/DALL-E/Stable Diffusion.',
    video:   'Type: video. Include: structure (intro/development/ending), edit pacing, music, visual style, platform (Runway/Sora/Kling).',
    post:    'Type: social media post. Include: platform, first-line hook, body structure, call-to-action, hashtags, recommended media type.',
    text:    'Type: text/article. Include: structure, tone, target audience, key points, SEO requirements, call to action.',
    general: 'Type: general task. Include: context, clear goal, execution requirements, expected format and output length.',
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const systemText = [
    SYSTEM_PROMPTS[lang] ?? SYSTEM_PROMPTS.ua,
    TYPE_HINTS[lang]?.[type] ?? TYPE_HINTS.ua.general,
  ].join('\n\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents: [{ role: 'user', parts: [{ text: input }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.8,
          topP: 0.95,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: errText });
    }

    // Stream SSE back to the browser
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = geminiRes.body.getReader();
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
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
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
