export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { schoolName } = req.body || {};
  if (!schoolName) return res.status(400).json({ url: null });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://rushly-ten.vercel.app',
        'X-Title': 'Rushly'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{
          role: 'user',
          content: `What is the CampusLabs Engage URL for ${schoolName}? It looks like https://schoolname.campuslabs.com/engage or https://schoolname.campuslabs.com/engage/organizations. Reply with ONLY the URL or "none".`
        }],
        max_tokens: 100
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || 'none';
    if (text === 'none' || !text.includes('campuslabs.com')) return res.status(200).json({ url: null });
    return res.status(200).json({ url: text });
  } catch (e) {
    return res.status(200).json({ url: null });
  }
}
