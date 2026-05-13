export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { schoolName } = req.body || {};
  if (!schoolName) return res.status(400).json({ url: null });

  // Generate slug candidates from school name
  const slugCandidates = generateSlugs(schoolName);
  
  for (const slug of slugCandidates) {
    const url = `https://${slug}.campuslabs.com/engage`;
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (r.ok || r.status === 403 || r.status === 405) {
        return res.status(200).json({ url });
      }
    } catch(e) {}
  }

  return res.status(200).json({ url: null });
}

function generateSlugs(name) {
  const slugs = [];

  // Remove common suffixes
  const cleaned = name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  const words = cleaned.split(/\s+/);

  // Remove common stop words
  const stopWords = new Set(['university', 'of', 'the', 'at', 'a', 'and', 'college', 'institute', 'technology', 'state', 'school']);

  // Candidate 1: all words joined
  slugs.push(words.join(''));

  // Candidate 2: meaningful words only (no stop words)
  const meaningful = words.filter(w => !stopWords.has(w));
  if (meaningful.length > 0 && meaningful.join('') !== words.join('')) {
    slugs.push(meaningful.join(''));
  }

  // Candidate 3: first meaningful word only
  if (meaningful.length > 0) slugs.push(meaningful[0]);

  // Candidate 4: last word (often the city/identifier)
  const last = words[words.length - 1];
  if (!slugs.includes(last)) slugs.push(last);

  // Candidate 5: words with dashes
  slugs.push(words.join('-'));
  slugs.push(meaningful.join('-'));

  // Candidate 6: abbreviation (first letters of meaningful words)
  if (meaningful.length > 1) {
    slugs.push(meaningful.map(w => w[0]).join(''));
  }

  // Remove duplicates and empty
  return [...new Set(slugs)].filter(s => s.length > 1);
}
