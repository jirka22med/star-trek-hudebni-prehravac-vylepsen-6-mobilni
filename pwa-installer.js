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
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 [PWA] Nová verze dostupná – bude aktivní po restartu.');
              }
            });
          });
        })
        .catch(err => console.error('❌ [PWA] Service Worker se neregistroval:', err));
    });
  } else {
    console.warn('⚠️ [PWA] Service Worker není podporován v tomto prohlížeči.');
  }

  // ─── 2. ZACHYCENÍ INSTALL PROMPTU ──────────────────────────
  // ⚠️ Viditelnost tlačítka řídí buttonVisibilityManager.js – sem nesaháme!
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📥 [PWA] Instalační prompt zachycen – čeká na náš modal.');
  });

  // ─── 3. KLIK NA TLAČÍTKO → OTEVŘÍT VLASTNÍ MODAL ───────────
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('install-app-button');
    if (!btn) {
      console.warn('⚠️ [PWA] Tlačítko #install-app-button nenalezeno v DOM.');
      return;
    }

    btn.addEventListener('click', () => {
      if (!deferredPrompt) {
        // Prompt není dostupný – zobrazíme fallback modal s manuálním návodem
        _showFallbackModal();
        return;
      }
      // Máme prompt – zobrazíme náš vlastní instalační modal
      _showInstallModal();
    });
  });

  // ─── 4. VLASTNÍ INSTALAČNÍ MODAL ────────────────────────────
  function _showInstallModal() {
    _removeModal(); // Odstraníme případný starý modal

    const overlay = document.createElement('div');
    overlay.id = 'pwa-modal-overlay';

    overlay.innerHTML = `
      <div id="pwa-modal">
        <div id="pwa-modal-header">
          <div id="pwa-modal-scanline"></div>
          <div id="pwa-modal-logo">🖖</div>
          <div id="pwa-modal-title">STAR TREK<br><span>HUDEBNÍ PŘEHRÁVAČ</span></div>
        </div>

        <div id="pwa-modal-body">
          <div class="pwa-modal-icon-row">
            <img
              src="https://raw.githubusercontent.com/jirka22med/star-trek-hudebni-prehravac-vylepsen-4-mobilni/main/icons/image_72x72.png"
              alt="ST ikona"
              id="pwa-modal-appicon"
              onerror="this.style.display='none'"
            />
          </div>

          <p class="pwa-modal-desc">
            Nainstaluj přehrávač přímo do systému.<br>
            Funguje offline · Bez prohlížeče · Warp rychlost 🚀
          </p>

          <ul class="pwa-modal-features">
            <li>⚡ Okamžité spuštění bez prohlížeče</li>
            <li>📦 Funguje offline (Service Worker)</li>
            <li>🎵 Plné ovládání hudby na ploše</li>
            <li>🔔 Notifikace flotily aktivní</li>
          </ul>
        </div>

        <div id="pwa-modal-footer">
          <button id="pwa-modal-cancel">✖ ZRUŠIT</button>
          <button id="pwa-modal-install">📥 INSTALOVAT</button>
        </div>

        <div id="pwa-modal-sig">Více admirál Jiřík &amp; Admirál Claude.AI 🖖</div>
      </div>
    `;

    _injectStyles();
    document.body.appendChild(overlay);

    // Animace vstupu
    requestAnimationFrame(() => overlay.classList.add('pwa-modal-visible'));

    // Zavřít kliknutím na overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) _removeModal();
    });

    // ZRUŠIT
    document.getElementById('pwa-modal-cancel').addEventListener('click', () => {
      _removeModal();
      _showPwaNotification('⚠️ Instalace zrušena – kdykoliv ji spusť znovu.', 'warning');
    });

    // INSTALOVAT → teprve tady voláme browser prompt
    document.getElementById('pwa-modal-install').addEventListener('click', async () => {
      _removeModal();
      console.log('🚀 [PWA] Uživatel potvrdil v našem modalu – spouštím browser prompt...');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`🖖 [PWA] Browser dialog: ${outcome}`);
      if (outcome === 'accepted') {
        _showPwaNotification('✅ Warp pohon online! Přehrávač nainstalován! 🚀', 'success');
      } else {
        _showPwaNotification('⚠️ Instalace zrušena v posledním kroku.', 'warning');
      }
      deferredPrompt = null;
    });

    // ESC klávesa
    const escHandler = (e) => {
      if (e.key === 'Escape') { _removeModal(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }

  // ─── 5. FALLBACK MODAL (bez promptu) ────────────────────────
  function _showFallbackModal() {
    _removeModal();

    const overlay = document.createElement('div');
    overlay.id = 'pwa-modal-overlay';

    // Detekce OS pro správný návod
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let instructions = '➡️ Menu prohlížeče → <strong>„Přidat na plochu"</strong> nebo <strong>„Nainstalovat aplikaci"</strong>';
    if (isIOS || isSafari) {
      instructions = '➡️ Tlačítko <strong>Sdílet</strong> (📤) → <strong>„Přidat na plochu"</strong>';
    }

    overlay.innerHTML = `
      <div id="pwa-modal">
        <div id="pwa-modal-header">
          <div id="pwa-modal-scanline"></div>
          <div id="pwa-modal-logo">🖖</div>
          <div id="pwa-modal-title">INSTALACE<br><span>MANUÁLNÍ POSTUP</span></div>
        </div>
        <div id="pwa-modal-body">
          <p class="pwa-modal-desc">
            Automatický instalátor není dostupný.<br>
            Postupuj podle navigace níže:
          </p>
          <div class="pwa-modal-manual-step">${instructions}</div>
          <p class="pwa-modal-subdesc">
            Důvod: prohlížeč ještě nevygeneroval instalační prompt,<br>
            nebo je app již nainstalována.
          </p>
        </div>
        <div id="pwa-modal-footer">
          <button id="pwa-modal-cancel" style="flex:1">✖ ZAVŘÍT</button>
        </div>
        <div id="pwa-modal-sig">Více admirál Jiřík &amp; Admirál Claude.AI 🖖</div>
      </div>
    `;

    _injectStyles();
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('pwa-modal-visible'));

    overlay.addEventListener('click', (e) => { if (e.target === overlay) _removeModal(); });
    document.getElementById('pwa-modal-cancel').addEventListener('click', _removeModal);

    const escHandler = (e) => {
      if (e.key === 'Escape') { _removeModal(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }

  // ─── 6. ODSTRANÍ MODAL ──────────────────────────────────────
  function _removeModal() {
    const existing = document.getElementById('pwa-modal-overlay');
    if (existing) {
      existing.classList.remove('pwa-modal-visible');
      setTimeout(() => existing.remove(), 300);
    }
  }

  // ─── 7. CSS STYLY PRO MODAL ─────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('pwa-modal-styles')) return; // Injektujeme jen jednou

    const style = document.createElement('style');
    style.id = 'pwa-modal-styles';
    style.textContent = `
      /* ── OVERLAY ── */
      #pwa-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(4px);
      }
      #pwa-modal-overlay.pwa-modal-visible {
        opacity: 1;
      }

      /* ── MODAL BOX ── */
      #pwa-modal {
        background: #000;
        border: 2px solid #00d4ff;
        border-radius: 12px;
        width: min(420px, 92vw);
        box-shadow:
          0 0 30px rgba(0, 212, 255, 0.4),
          0 0 80px rgba(0, 212, 255, 0.15),
          inset 0 0 40px rgba(0, 0, 0, 0.8);
        overflow: hidden;
        transform: scale(0.88);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: 'Courier New', Courier, monospace;
      }
      #pwa-modal-overlay.pwa-modal-visible #pwa-modal {
        transform: scale(1);
      }

      /* ── HEADER ── */
      #pwa-modal-header {
        position: relative;
        background: linear-gradient(135deg, #000d1a 0%, #001a2e 50%, #000d1a 100%);
        border-bottom: 2px solid #00d4ff;
        padding: 18px 20px 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        overflow: hidden;
      }
      #pwa-modal-scanline {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 212, 255, 0.04) 2px,
          rgba(0, 212, 255, 0.04) 4px
        );
        pointer-events: none;
      }
      #pwa-modal-logo {
        font-size: 2.2rem;
        z-index: 1;
        filter: drop-shadow(0 0 8px #00d4ff);
      }
      #pwa-modal-title {
        z-index: 1;
        color: #00d4ff;
        font-size: 1.05rem;
        font-weight: bold;
        letter-spacing: 2px;
        line-height: 1.4;
        text-shadow: 0 0 12px rgba(0, 212, 255, 0.8);
      }
      #pwa-modal-title span {
        color: #ffffff;
        font-size: 0.72rem;
        letter-spacing: 1px;
        opacity: 0.75;
      }

      /* ── BODY ── */
      #pwa-modal-body {
        padding: 20px 22px 16px;
        color: #ccc;
      }
      .pwa-modal-icon-row {
        display: flex;
        justify-content: center;
        margin-bottom: 14px;
      }
      #pwa-modal-appicon {
        width: 64px;
        height: 64px;
        border: 2px solid #00d4ff;
        border-radius: 14px;
        box-shadow: 0 0 16px rgba(0, 212, 255, 0.5);
      }
      .pwa-modal-desc {
        text-align: center;
        font-size: 0.85rem;
        color: #aaa;
        margin: 0 0 14px;
        line-height: 1.6;
      }
      .pwa-modal-features {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .pwa-modal-features li {
        font-size: 0.82rem;
        color: #cce8ff;
        padding: 6px 10px;
        background: rgba(0, 212, 255, 0.07);
        border-left: 3px solid #00d4ff;
        border-radius: 0 6px 6px 0;
      }
      .pwa-modal-manual-step {
        background: rgba(0, 212, 255, 0.1);
        border: 1px solid #00d4ff;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 0.85rem;
        color: #fff;
        text-align: center;
        margin: 10px 0 12px;
        line-height: 1.6;
      }
      .pwa-modal-subdesc {
        font-size: 0.72rem;
        color: #666;
        text-align: center;
        margin: 0;
        line-height: 1.5;
      }

      /* ── FOOTER ── */
      #pwa-modal-footer {
        display: flex;
        gap: 10px;
        padding: 14px 22px 12px;
        border-top: 1px solid #112233;
      }
      #pwa-modal-footer button {
        flex: 1;
        padding: 10px 14px;
        border-radius: 6px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.82rem;
        font-weight: bold;
        letter-spacing: 1px;
        cursor: pointer;
        border: 2px solid;
        transition: all 0.2s ease;
      }
      #pwa-modal-cancel {
        background: transparent;
        border-color: #444;
        color: #888;
      }
      #pwa-modal-cancel:hover {
        border-color: #C00000;
        color: #ff4444;
        background: rgba(192, 0, 0, 0.1);
      }
      #pwa-modal-install {
        background: linear-gradient(135deg, #003d5c, #00d4ff22);
        border-color: #00d4ff;
        color: #00d4ff;
        text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
        box-shadow: 0 0 14px rgba(0, 212, 255, 0.2);
      }
      #pwa-modal-install:hover {
        background: linear-gradient(135deg, #005580, #00d4ff44);
        box-shadow: 0 0 24px rgba(0, 212, 255, 0.5);
        transform: translateY(-1px);
      }

      /* ── SIGNATURE ── */
      #pwa-modal-sig {
        text-align: center;
        font-size: 0.65rem;
        color: #334;
        padding: 0 10px 10px;
        letter-spacing: 0.5px;
      }

      /* ── TOAST ── */
      #pwa-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 22px;
        border-radius: 8px;
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
        font-size: 13px;
        z-index: 9999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        transition: opacity 0.5s ease;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── 8. TOAST NOTIFIKACE ────────────────────────────────────
  function _showPwaNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message);
      return;
    }
    const existing = document.getElementById('pwa-toast');
    if (existing) existing.remove();

    const colors = { success: '#00cc66', warning: '#ffcc00', info: '#00aaff', error: '#C00000' };
    const textColors = { success: '#000', warning: '#000', info: '#000', error: '#fff' };

    const toast = document.createElement('div');
    toast.id = 'pwa-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      background: colors[type] || colors.info,
      color: textColors[type] || '#000'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  // ─── 9. DETEKCE ÚSPĚŠNÉ INSTALACE ───────────────────────────
  // ⚠️ Viditelnost tlačítka po instalaci řeší buttonVisibilityManager.js
  window.addEventListener('appinstalled', () => {
    console.log('🎉 [PWA] Aplikace nainstalována!');
    deferredPrompt = null;
    _showPwaNotification('🖖 Star Trek Přehrávač nainstalován do systému!', 'success');
  });

  // ─── 10. EXPORT PRO OSTATNÍ MODULY ──────────────────────────
  window.PWA_INSTALLER = {
    isInstalled: () =>
      window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone,
    hasPrompt: () => !!deferredPrompt,
    clearCache: () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
        console.log('☢️ [PWA] Lehká atomovka – čistím SW cache!');
      }
    },
    getPrompt: () => deferredPrompt,
    openModal: () => deferredPrompt ? _showInstallModal() : _showFallbackModal()
  };

  console.log('🖖 [PWA] pwa-installer.js načten. Více admirál Jiřík schválen!');
})();
