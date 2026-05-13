export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { page = 1, search = '' } = req.body || {};

  const prompt = search
    ? `Use the DecoGro MCP tool to fetch schools from the "schools" board, page ${page}, limit 50, search term: "${search}". Return ONLY a JSON object: {"schools": [{"record_id": number, "name": string, "campuslabsUrl": string or null, "status": "done"|"inprogress"|"none"}], "total": number, "totalPages": number}. Map "Campus Labs Site" to campuslabsUrl. CampusLabs Status: "Done"="done", "In progress"="inprogress", empty="none".`
    : `Use the DecoGro MCP tool to fetch schools from the "schools" board, page ${page}, limit 50. Return ONLY a JSON object: {"schools": [{"record_id": number, "name": string, "campuslabsUrl": string or null, "status": "done"|"inprogress"|"none"}], "total": number, "totalPages": number}. Map "Campus Labs Site" to campuslabsUrl. CampusLabs Status: "Done"="done", "In progress"="inprogress", empty="none".`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a data assistant. Always respond with pure JSON only — no markdown, no explanation, no backticks.',
        messages: [{ role: 'user', content: prompt }],
        mcp_servers: [{
          type: 'url',
          url: 'https://mcp.decogro.com/mcp',
          name: 'decogro'
        }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
