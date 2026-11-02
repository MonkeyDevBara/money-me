/* MoneyMe — inisialisasi & event global */
(function () {
  'use strict';
  const MM = window.MM, S = MM.S;

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('sheet-back')) return MM.closeSheet();
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = MM.H[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type === 'file' || !el.dataset || !el.dataset.in) return;
    const fn = MM.IN[el.dataset.in];
    if (fn) fn(el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.type === 'file' && el.dataset.in) MM.IN[el.dataset.in](el);
  });
  document.addEventListener('keydown', (e) => {
    if (MM.pinActive() && !e.target.matches('input,textarea,select')) {
      if (/^\d$/.test(e.key)) MM.pinKey(e.key);
      else if (e.key === 'Backspace') MM.pinDel();
      return;
    }
    if (e.key === 'Escape') MM.closeSheet();
    // Enter di form sheet = simpan
    if (e.key === 'Enter' && e.target.matches('.sheet input:not([type=search])')) {
      const btn = document.querySelector('.sheet .btn.primary');
      if (btn) { e.preventDefault(); e.target.blur(); btn.click(); }
    }
  });
  window.addEventListener('hashchange', () => { MM.V.navd = true; MM.closeSheet(); MM.render(); });
  // Chrome/Android: simpan prompt install agar bisa dipicu dari tombol "Pasang Sekarang"
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); MM.V.bip = e; });
  window.addEventListener('appinstalled', () => { MM.V.bip = null; MM.toast('MoneyMe terpasang di layar utama 🎉'); });

  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 60000 && S.settings.pinHash && !MM.V.locked) MM.lock();
  });

  (async function init() {
    try {
      await MM.load();
    } catch (err) {
      document.getElementById('view').innerHTML = '<div class="empty"><span>⚠️</span><p><b>MoneyMe tidak bisa membuka penyimpanan.</b><br>' + MM.esc(err.message) +
        '<br><br>Pastikan tidak memakai mode penyamaran/private, lalu muat ulang halaman.</p></div>';
      return;
    }
    MM.applyTheme();
    if (window.matchMedia) {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(MM.applyTheme);
    }
    if (S.settings.pinHash) MM.lock();
    MM.render();
    document.body.classList.add('ready');

    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  })();
})();
