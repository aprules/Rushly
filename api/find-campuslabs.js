export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { schoolName } = req.body || {};
  if (!schoolName) return res.status(400).json({ url: null });

  try {
    // Search Google for the school's CampusLabs URL
    const query = encodeURIComponent(`${schoolName} campuslabs.com engage`);
    const searchRes = await fetch(`https://www.google.com/search?q=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await searchRes.text();

    // Extract campuslabs.com URLs from the search results
    const matches = html.match(/https?:\/\/[a-z0-9\-]+\.campuslabs\.com\/engage[^\s"&<]*/gi);
    if (!matches || matches.length === 0) return res.status(200).json({ url: null });

    // Clean and return the first match
    const url = matches[0].replace(/\\u003d/g, '=').split('&')[0];
    if (!url.includes('campuslabs.com')) return res.status(200).json({ url: null });

    return res.status(200).json({ url });
  } catch (e) {
    return res.status(200).json({ url: null, error: e.message });
  }
}
