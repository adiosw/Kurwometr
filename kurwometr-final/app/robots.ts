// ══════════════════════════════════════════════════════
// app/robots.ts
// ══════════════════════════════════════════════════════
export default function robots() {
  return {
    rules: [{ userAgent:'*', allow:'/', disallow:['/api/','/auth/'] }],
    sitemap: `${process.env.NEXT_PUBLIC_URL}/sitemap.xml`,
  };
}
