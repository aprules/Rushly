export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const DECOGRO_KEY = 'ak_live_14d8946a76e2c99814586ab48a64c555.sk_63c8b9956ddd90770208b352d9fb01b9ff463b4fdd4fd6548bb5663e2d951113';
  const { page = 1, search = '' } = req.query;

  const params = new URLSearchParams({ limit: 50, page });
  if (search) params.append('search', search);

  try {
    const response = await fetch(`https://app.decogro.com/board/schools/get_data?${params}`, {
      headers: {
        'Authorization': `Bearer ${DECOGRO_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
