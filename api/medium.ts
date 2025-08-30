// /api/medium.ts
import { XMLParser } from 'fast-xml-parser';

const HANDLE = 'chris_74915'; // stays server-side (not exposed to the client)
const FEED = `https://medium.com/feed/@${HANDLE}`;

const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '').trim();

export default async function handler(req: any, res: any) {
  const limit = Math.min(Number(req.query.limit) || 3, 10);

  try {
    const rss = await fetch(FEED, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // Vercel Node runtime has global fetch (Node 18+), no extra lib needed
    }).then(r => r.text());

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(rss);

    const items = (json?.rss?.channel?.item || [])
      .slice(0, limit)
      .map((it: any) => ({
        title: it.title,
        link: Array.isArray(it.link) ? it.link[0] : it.link,
        description: stripHtml(it.description || it['content:encoded'] || ''),
        pubDate: it.pubDate
      }));

    // Cache at the edge for 30 minutes; allow stale for a day
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ items });
  } catch (err) {
    // Fail-soft to keep the UI clean
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    res.status(200).json({ items: [] });
  }
}