// public/sw.js — Kurwomat v3 Service Worker
const CACHE = 'kurwomat-v3';
const STATIC = ['/', '/manifest.json', '/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  scheduleEveningPush();
});

self.addEventListener('fetch', e => {
  if (new URL(e.request.url).hostname.includes('supabase.co')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
    )
  );
});

// ── PUSH ──
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🔥 Kurwomat', {
      body: data.body || 'Polska dzisiaj klnie. Sprawdź ranking Twojej ligi!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [100, 50, 100, 50, 200],
      tag: 'kurwomat-daily',
      renotify: true,
      actions: [
        { action: 'open',    title: '💢 Otwórz Kurwomat' },
        { action: 'dismiss', title: 'Zamknij' },
      ],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow(url);
    })
  );
});

// ── 19:30 SCHEDULER ──
function scheduleEveningPush() {
  const now = new Date();
  const target = new Date();
  target.setHours(19, 30, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();

  setTimeout(async () => {
    try {
      const r = await fetch('/api/push-data');
      const d = await r.json();
      const body = `Dziś padło ${(d.today_total||0).toLocaleString('pl-PL')} kurw w Polsce. Twoja liga czeka na Twój wynik!`;
      await self.registration.showNotification('🔥 Kurwomat — Wieczorny Raport', {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200, 100, 400],
        tag: 'kurwomat-evening',
        actions: [
          { action: 'open',    title: '🏆 Sprawdź ligę' },
          { action: 'dismiss', title: 'Zamknij' },
        ],
        data: { url: '/' },
      });
    } catch {}
    scheduleEveningPush();
  }, delay);
}

// ── BACKGROUND SYNC ──
self.addEventListener('sync', e => {
  if (e.tag === 'sync-clicks') e.waitUntil(syncOfflineClicks());
});

async function syncOfflineClicks() {
  const db = await openIDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const items = await new Promise(res => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
  });
  for (const item of items) {
    try {
      await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      store.delete(item.id);
    } catch {}
  }
}

function openIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('kurwomat', 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore('queue', { autoIncrement: true, keyPath: 'id' });
    r.onsuccess = e => res(e.target.result);
    r.onerror = rej;
  });
}
