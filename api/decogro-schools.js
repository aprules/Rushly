export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const DECOGRO_KEY = 'ak_live_14d8946a76e2c99814586ab48a64c555.sk_63c8b9956ddd90770208b352d9fb01b9ff463b4fdd4fd6548bb5663e2d951113';
  const { page = 1, search = '' } = req.query;

  const params = new URLSearchParams({ table_id: 'schools', limit: 50, page });
  if (search) params.append('search', search);

  const attempts = [
    `https://app.decogro.com/api/boards/data?${params}`,
    `https://app.decogro.com/api/v1/boards/data?${params}`,
    `https://api.decogro.com/v1/boards/data?${params}`,
    `https://api.decogro.com/boards/data?${params}`,
  ];

  const results = {};
  for (const url of attempts) {
    try {
      const r = await fetch(url, {
        headers: { 'Authorization': `Bearer ${DECOGRO_KEY}`, 'Content-Type': 'application/json' }
      });
      const text = await r.text();
      results[url] = { status: r.status, preview: text.slice(0, 200) };
    } catch (e) {
      results[url] = { error: e.message };
    }
  }

  res.status(200).json(results);
}
