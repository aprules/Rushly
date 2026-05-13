export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { page = 1, search = '' } = req.query;
  const DECOGRO_KEY = 'ak_live_14d8946a76e2c99814586ab48a64c555.sk_63c8b9956ddd90770208b352d9fb01b9ff463b4fdd4fd6548bb5663e2d951113';

  const params = new URLSearchParams({ table_id: 'schools', limit: 50, page });
  if (search) params.append('search', search);

  const urls = [
    `https://api.decogro.com/v1/board/data?${params}`,
    `https://api.decogro.com/v1/table/data?${params}`,
    `https://api.decogro.com/v1/tables/schools/data?${new URLSearchParams({ limit: 50, page })}`,
    `https://api.decogro.com/v1/boards/schools/data?${new URLSearchParams({ limit: 50, page })}`,
    `https://api.decogro.com/board/schools/get_data?${new URLSearchParams({ limit: 50, page })}`,
    `https://api.decogro.com/v1/school/list?${new URLSearchParams({ limit: 50, page })}`,
  ];

  const results = {};
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'Authorization': `Bearer ${DECOGRO_KEY}`, 'Content-Type': 'application/json' }
      });
      const text = await r.text();
      results[url] = { status: r.status, preview: text.slice(0, 150) };
    } catch (e) {
      results[url] = { error: e.message };
    }
  }

  res.status(200).json(results);
}
