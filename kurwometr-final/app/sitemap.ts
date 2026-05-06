// ══════════════════════════════════════════════════════
// app/sitemap.ts
// ══════════════════════════════════════════════════════
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const BASE = process.env.NEXT_PUBLIC_URL || 'https://kurwomat.pl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url:BASE, lastModified:new Date(), changeFrequency:'hourly', priority:1.0 },
    { url:`${BASE}/piwo`, lastModified:new Date(), changeFrequency:'daily', priority:0.9 },
    { url:`${BASE}/premium`, lastModified:new Date(), changeFrequency:'weekly', priority:0.8 },
    { url:`${BASE}/o-nas`, lastModified:new Date(), changeFrequency:'monthly', priority:0.6 },
    { url:`${BASE}/blog`, lastModified:new Date(), changeFrequency:'weekly', priority:0.7 },
    { url:`${BASE}/regulamin`, lastModified:new Date(), changeFrequency:'monthly', priority:0.3 },
    { url:`${BASE}/polityka-prywatnosci`, lastModified:new Date(), changeFrequency:'monthly', priority:0.3 },
  ];

  const { data: posts } = await sb.from('posts').select('slug,updated_at').eq('published',true);
  const blogPages: MetadataRoute.Sitemap = (posts||[]).map(p=>({
    url:`${BASE}/blog/${p.slug}`, lastModified:new Date(p.updated_at), changeFrequency:'weekly', priority:0.6,
  }));

  const { data: leagues } = await sb.from('leagues').select('slug,created_at').eq('is_public',true);
  const leaguePages: MetadataRoute.Sitemap = (leagues||[]).map(l=>({
    url:`${BASE}/liga/${l.slug}`, lastModified:new Date(l.created_at), changeFrequency:'hourly', priority:0.5,
  }));

  return [...staticPages, ...blogPages, ...leaguePages];
}
