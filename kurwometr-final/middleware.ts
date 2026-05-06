import { NextRequest, NextResponse } from 'next/server';

// In-memory store (works per serverless instance; for production use Upstash Redis)
const rateStore = new Map<string, { count: number; reset: number }>();

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000; // 1 minute

const RATE_LIMITED_PATHS = ['/api/voice', '/api/share', '/api/donate', '/api/donation'];

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function hashIP(ip: string): string {
  // Simple hash for privacy
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only rate-limit specific API paths
  const isRateLimited = RATE_LIMITED_PATHS.some(p => pathname.startsWith(p));
  if (!isRateLimited) return NextResponse.next();

  const ip = getClientIP(req);
  const key = `${hashIP(ip)}:${pathname.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();

  const record = rateStore.get(key);

  if (!record || now > record.reset) {
    rateStore.set(key, { count: 1, reset: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (record.count >= RATE_LIMIT) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Spokojnie, hej. Max 20 requestów na minutę. Oddech.',
        retryAfter: Math.ceil((record.reset - now) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((record.reset - now) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.reset),
        },
      }
    );
  }

  record.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/voice/:path*', '/api/share/:path*', '/api/donate/:path*', '/api/donation/:path*'],
};
