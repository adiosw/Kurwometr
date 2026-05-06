/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async redirects() {
    return [
      { source: '/donate',  destination: '/piwo',                permanent: true },
      { source: '/privacy', destination: '/polityka-prywatnosci', permanent: true },
      { source: '/terms',   destination: '/regulamin',            permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'microphone=(self), geolocation=(self), camera=()' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',           value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type',            value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed',  value: '/' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
