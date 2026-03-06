/**
 * /api/llm — Vercel serverless proxy for OpenRouter LLM calls.
 * Keeps the API key server-side. The client sends the same Anthropic-style
 * messages payload; we forward it to OpenRouter and relay the response.
 */

export default async function handler(req, res) {
  // CORS headers for same-origin fetch from the static frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    // Use a cheap, fast model by default
    const resolvedModel = model || 'anthropic/claude-haiku-3';

    // OpenRouter uses OpenAI-compatible chat completions format
    const openRouterMessages = [];
    if (system) {
      openRouterMessages.push({ role: 'system', content: system });
    }
    if (messages) {
      openRouterMessages.push(...messages);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai-aquarium-phaser.vercel.app',
        'X-Title': 'AI Aquarium',
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: max_tokens || 256,
        messages: openRouterMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: 'LLM request failed', detail: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}
