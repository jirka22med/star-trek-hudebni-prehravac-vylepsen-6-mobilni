// ============================================================
// 🖖 STAR TREK: Hudební Přehrávač – PWA Installer
// Více admirál Jiřík & Admirál Claude.AI
// ============================================================
// 📌 POUŽITÍ v index.html:
//   <script src="pwa-installer.js" defer></script>
// ============================================================

(function() {
  'use strict';

  let deferredPrompt = null; // Zachytíme beforeinstallprompt event

  // ─── 1. REGISTRACE SERVICE WORKERA ─────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('✅ [PWA] Service Worker registrován. Scope:', reg.scope);

          // Sledujeme update SW
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 [PWA] Nová verze dostupná – bude aktivní po restartu.');
              }
            });
          });
        })
        .catch(err => {
          console.error('❌ [PWA] Service Worker se neregistroval:', err);
        });
    });
  } else {
    console.warn('⚠️ [PWA] Service Worker není podporován v tomto prohlížeči.');
  }

  // ─── 2. ZACHYCENÍ INSTALL PROMPTU ──────────────────────────
  // ⚠️ POZOR: Viditelnost tlačítka řídí buttonVisibilityManager.js
  // pwa-installer.js NEZASAHUJE do display/hide logiky tlačítka!
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Zabráníme automatickému zobrazení prohlížeče
    deferredPrompt = e;
    console.log('📥 [PWA] Instalační prompt připraven – prompt zachycen a čeká na klik!');
  });

  // ─── 3. KLIK NA TLAČÍTKO ────────────────────────────────────
  // Registrujeme listener až po načtení DOM
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('install-app-button');
    if (!btn) {
      console.warn('⚠️ [PWA] Tlačítko #install-app-button nenalezeno v DOM.');
      return;
    }

    btn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        console.warn('⚠️ [PWA] Instalační prompt není dostupný.');
        _showPwaNotification('ℹ️ Instalaci spusť přes menu prohlížeče → "Přidat na plochu"', 'info');
        return;
      }

      console.log('🚀 [PWA] Spouštím instalační dialog...');
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log(`🖖 [PWA] Uživatel zvolil: ${outcome}`);

      if (outcome === 'accepted') {
        _showPwaNotification('✅ Star Trek přehrávač nainstalován! Warp pohon online! 🚀', 'success');
      } else {
        _showPwaNotification('⚠️ Instalace zrušena – kdykoliv ji spusť znovu.', 'warning');
      }

      deferredPrompt = null;
    });
  });

  // ─── 4. DETEKCE ÚSPĚŠNÉ INSTALACE ───────────────────────────
  // ⚠️ Viditelnost tlačítka po instalaci řeší buttonVisibilityManager.js
  window.addEventListener('appinstalled', () => {
    console.log('🎉 [PWA] Aplikace byla úspěšně nainstalována!');
    deferredPrompt = null;
    _showPwaNotification('🖖 Star Trek Přehrávač nainstalován do systému!', 'success');
  });

  // ─── 5. HELPER – Notifikace ─────────────────────────────────
  function _showPwaNotification(message, type = 'info') {
    // Pokusíme se použít existující notifikační systém
    if (typeof window.showNotification === 'function') {
      window.showNotification(message);
      return;
    }

    // Fallback – vlastní jednoduchá notifikace
    const existing = document.getElementById('pwa-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pwa-toast';
    toast.textContent = message;

    const colors = {
      success: '#00cc66',
      warning: '#ffcc00',
      info: '#00aaff',
      error: '#C00000'
    };

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: colors[type] || colors.info,
      color: '#000',
      padding: '10px 22px',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontSize: '14px',
      zIndex: '99999',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      transition: 'opacity 0.5s ease',
      whiteSpace: 'nowrap'
    });

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  // ─── 6. EXPORT PRO LEHKÁ ATOMOVKA / DEBUG ───────────────────
  // Globální objekt dostupný pro ostatní moduly (buttonVisibilityManager, lehka-atomovka.js...)
  window.PWA_INSTALLER = {
    // Zjistí jestli app běží v standalone (nainstalovaném) módu
    isInstalled: () =>
      window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone,
    // Má dostupný prompt? buttonVisibilityManager může volat pro rozhodování
    hasPrompt: () => !!deferredPrompt,
    // Vyčistí SW cache – propojení s lehka-atomovka.js
    clearCache: () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
        console.log('☢️ [PWA] Lehká atomovka – čistím SW cache!');
      }
    },
    getPrompt: () => deferredPrompt
  };

  console.log('🖖 [PWA] pwa-installer.js načten. Více admirál Jiřík schválen!');
})();
