// Halfsaid — /api/regenerate
// Regenerates a selected fragment of the generated prompt based on user instructions.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { instructions, context, lang = 'ua' } = req.body ?? {};

  if (!instructions?.trim()) {
    return res.status(400).json({ error: 'Instructions are required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  const systemText = lang === 'ua'
    ? `Ти — Halfsaid, експерт з промпт-інжинірингу. Користувач хоче переробити певний уривок з готового AI-промпта.

Твоя задача: створи новий варіант цього уривку.

Правила:
• Відповідай ТІЛЬКИ новим варіантом уривку — без пояснень і коментарів
• Зберігай стиль, тон і мову оригінального промпта
• Новий варіант має органічно вписуватись у контекст решти промпта`
    : `You are Halfsaid, a prompt engineering expert. The user wants to rephrase a fragment of their AI prompt.

Your task: create a new version of this fragment.

Rules:
• Respond with ONLY the new fragment — no explanations or meta-commentary
• Preserve the style, tone and language of the original prompt
• The new version must fit naturally into the context of the rest of the prompt`;

  const userMessage = context
    ? (lang === 'ua'
        ? `Повний промпт (для контексту):\n${context}\n\nУривок для переробки:\n${instructions}`
        : `Full prompt (for context):\n${context}\n\nFragment to rephrase:\n${instructions}`)
    : instructions;

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
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.85,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

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
