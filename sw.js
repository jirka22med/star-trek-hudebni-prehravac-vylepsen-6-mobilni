// ============================================================
// 🖖 STAR TREK: Hudební Přehrávač – Service Worker
// Více admirál Jiřík & Admirál Claude.AI
// ============================================================

const CACHE_NAME = 'star-trek-player-v1';

// Soubory ke cachování při instalaci
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './miniPlayer.css',
  './casovac.css',
  './browser-status.css',
  './scrollbar.css',
  './zobrazit-panel-hlasitosti.css',
  './playlistSettings.css',
  './jirikovo-barveni-ui-tlacitek.css',
  './script.js',
  './myPlaylist.js',
  './backgroundManager.js',
  './colorManager.js',
  './notificationFix.js',
  './buttonVisibilityManager.js',
  './autoFade.js',
  './timer-module.js',
  './vyhledavac-skladeb.js',
  './miniPlayer.js',
  './universalni-perfomens-monitor.js',
  './bluetoothDisconnectMonitor.js',
  './sprava-rozhrani.js',
  './scrollbar.js',
  './lehka-atomovka.js',
  './jirikovo-barveni-ui-tlacitek.js',
  './playlistSettings.js',
  './playlistSync.js',
  './pokrocila-sprava-playlistu.js',
  './buttonVisibilityFirebase.js',
  './jirikovo-barveni-ui-tlacitek-firebase.js',
  './audioFirebaseFunctions.js'
];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('🖖 [SW] Instalace – více admirál Jiřík na můstku!');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cachujeme po jednom – aby jedna chyba nezabila zbytek
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.warn(`⚠️ [SW] Nelze cachovat: ${url}`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Cache připravena. Warp pohon online!');
        return self.skipWaiting();
      })
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('🚀 [SW] Aktivace – čistím staré cache...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log(`🗑️ [SW] Mažu starou cache: ${name}`);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH – Network First, fallback na Cache ────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase a externí API → vždy přes síť (nechceme cachovat)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('rajce.idnes') ||
    url.hostname.includes('githack.com') ||
    url.hostname.includes('raw.githubusercontent')
  ) {
    return; // Nechá browser zpracovat standardně
  }

  // Audio soubory → síť bez cache (mohou být velké)
  if (event.request.destination === 'audio') {
    return;
  }

  // Ostatní → Network First, pak Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Uložit čerstvou odpověď do cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback – vrátíme co máme v cache
        return caches.match(event.request).then(cached => {
          if (cached) {
            console.log(`📦 [SW] Offline – servuji z cache: ${event.request.url}`);
            return cached;
          }
          // Pokud ani cache nemáme – vrátíme index.html
          return caches.match('./index.html');
        });
      })
  );
});

// ─── MESSAGE ────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names =>
      Promise.all(names.map(name => caches.delete(name)))
    ).then(() => {
      console.log('🗑️ [SW] Všechny cache vymazány – lehká atomovka aktivována!');
    });
  }
});
