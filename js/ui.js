/* MoneyMe — komponen UI: ikon, sheet, dialog, toast, grafik, PIN pad */
(function () {
  'use strict';
  const MM = window.MM, esc = MM.esc;
  const $ = (s) => document.querySelector(s);
  MM.$ = $;

  /* ---------- ikon ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
    more: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="M9 18l6-6-6-6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    del: '<path d="M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM17 9l-6 6M11 9l6 6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };
  MM.icon = (n) => '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
  MM.logo = (size = 36) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E2C35A"/><stop offset="1" stop-color="#A9830F"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#lg)"/><path d="M16 46V20l16 15 16-15v26" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- sheet (bottom sheet) ---------- */
  MM.openSheet = (html) => {
    const root = $('#overlay');
    root.innerHTML = '<div class="sheet-back"><div class="sheet" role="dialog" aria-modal="true">' + html + '</div></div>';
    document.body.classList.add('noscroll');
    requestAnimationFrame(() => root.firstChild && root.firstChild.classList.add('show'));
  };
  MM.setSheet = (html) => { const s = $('.sheet'); if (s) s.innerHTML = html; };
  MM.closeSheet = () => {
    $('#overlay').innerHTML = '';
    document.body.classList.remove('noscroll');
    MM.pinStop();
  };
  MM.sheetHead = (title) => '<div class="sheet-grip"></div><div class="sheet-head"><h3>' + esc(title) + '</h3><button class="icon-btn" data-act="sheet-close" aria-label="Tutup">' + MM.icon('close') + '</button></div>';

  /* ---------- dialog konfirmasi ---------- */
  MM.confirm = ({ title, msg, ok = 'Ya', cancel = 'Batal', danger = false }) => new Promise((res) => {
    const d = $('#dialog');
    d.innerHTML = '<div class="dlg-back"><div class="dlg" role="alertdialog"><h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p><div class="dlg-btns">' +
      (cancel ? '<button class="btn ghost" data-v="0">' + esc(cancel) + '</button>' : '') +
      '<button class="btn ' + (danger ? 'danger' : 'primary') + '" data-v="1">' + esc(ok) + '</button></div></div></div>';
    d.onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (b || e.target.classList.contains('dlg-back')) { d.innerHTML = ''; d.onclick = null; res(!!b && b.dataset.v === '1'); }
    };
  });

  /* ---------- toast ---------- */
  let tt;
  MM.toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('show'), 2200);
  };

  /* ---------- grafik ---------- */
  MM.donut = (items, center, sub) => {
    // items: [{label, value, color}] — donut dengan label di luar + garis penghubung
    const W = 360, H = 250, cx = 180, cy = 125, R = 80, sw = 34, r = R - sw / 2, C = 2 * Math.PI * r;
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const f2 = (n) => n.toFixed(2);
    let acc = 0;
    const segs = [], labels = [];
    items.forEach((it) => {
      const f = it.value / total, start = acc;
      acc += f;
      const len = items.length > 1 ? Math.max(f * C - 1.2, 0.6) : C;
      segs.push('<circle r="' + f2(r) + '" cx="' + cx + '" cy="' + cy + '" fill="none" stroke="' + it.color + '" stroke-width="' + sw +
        '" stroke-dasharray="' + f2(len) + ' ' + f2(C) + '" stroke-dashoffset="' + f2(-start * C) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>');
      const a = (start + f / 2) * 2 * Math.PI - Math.PI / 2, cos = Math.cos(a), sin = Math.sin(a);
      labels.push({ it, right: cos >= 0, x0: cx + (R + 1) * cos, y0: cy + (R + 1) * sin, x1: cx + (R + 12) * cos, y: cy + (R + 12) * sin });
    });
    // atur jarak label per sisi supaya tidak bertumpuk
    const GAP = 16, TOP = 10, BOT = H - 8;
    [true, false].forEach((side) => {
      const L = labels.filter((l) => l.right === side).sort((p, q) => p.y - q.y);
      for (let i = 0; i < L.length; i++) L[i].y = Math.max(L[i].y, TOP, i ? L[i - 1].y + GAP : TOP);
      for (let i = L.length - 1; i >= 0; i--) L[i].y = Math.min(L[i].y, i === L.length - 1 ? BOT : L[i + 1].y - GAP);
    });
    const labs = labels.map((l) => {
      const xl = l.right ? cx + R + 24 : cx - R - 24;
      const name = l.it.label.length > 11 ? l.it.label.slice(0, 10) + '…' : l.it.label;
      return '<polyline points="' + f2(l.x0) + ',' + f2(l.y0) + ' ' + f2(l.x1) + ',' + f2(l.y) + ' ' + xl + ',' + f2(l.y) + '" fill="none" stroke="' + l.it.color + '" stroke-width="1.1"/>' +
        '<text x="' + (xl + (l.right ? 4 : -4)) + '" y="' + f2(l.y + 4) + '" text-anchor="' + (l.right ? 'start' : 'end') + '" class="dl">' + esc(name) + '</text>';
    }).join('');
    return '<svg class="donut2" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik pengeluaran per kategori">' + segs.join('') + labs +
      '<text x="' + cx + '" y="' + (cy - 5) + '" class="dc-s">' + esc(sub) + '</text><text x="' + cx + '" y="' + (cy + 15) + '" class="dc-b">' + esc(center) + '</text></svg>';
  };
  MM.bars = (rows) => {
    // rows: [{label, income, expense, active}]
    const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.expense)));
    const W = 320, H = 150, base = 124, gw = W / rows.length, bw = 13;
    const g = rows.map((r, i) => {
      const x = i * gw + gw / 2;
      const hi = (r.income / max) * 108, he = (r.expense / max) * 108;
      return '<rect x="' + (x - bw - 1.5) + '" y="' + (base - hi) + '" width="' + bw + '" height="' + Math.max(hi, 1) + '" rx="3" fill="var(--inc)"/>' +
        '<rect x="' + (x + 1.5) + '" y="' + (base - he) + '" width="' + bw + '" height="' + Math.max(he, 1) + '" rx="3" fill="var(--exp)"/>' +
        '<text x="' + x + '" y="' + (base + 18) + '" text-anchor="middle" class="bar-l' + (r.active ? ' on' : '') + '">' + esc(r.label) + '</text>';
    }).join('');
    return '<svg class="bars" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Tren pemasukan dan pengeluaran 6 bulan"><line x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '" stroke="var(--line)"/>' + g + '</svg>';
  };

  /* ---------- PIN pad ---------- */
  let PS = null; // {buf, cfg, busy}
  MM.pinPad = () => '<div class="pin"><h2 id="pin-title"></h2><p id="pin-msg"></p><div class="dots">' + '<i></i>'.repeat(4) + '</div><div class="keypad">' +
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button data-act="pin-key" data-k="' + n + '">' + n + '</button>').join('') +
    '<span></span><button data-act="pin-key" data-k="0">0</button><button data-act="pin-del" aria-label="Hapus">' + MM.icon('del') + '</button></div></div>';
  function refresh(shake) {
    if (!PS) return;
    const t = $('#pin-title'), m = $('#pin-msg');
    if (t) t.textContent = PS.cfg.title || '';
    if (m) { m.textContent = PS.cfg.msg || ''; m.className = PS.cfg.err ? 'err' : ''; }
    document.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i < PS.buf.length));
    if (shake) { const d = $('.dots'); if (d) { d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); } }
  }
  MM.pinStart = (cfg) => { PS = { buf: '', cfg, busy: false }; refresh(); };
  MM.pinUpdate = (patch, shake) => { if (PS) { Object.assign(PS.cfg, patch); refresh(shake); } };
  MM.pinStop = () => { if (PS && !PS.cfg.lock) PS = null; };
  MM.pinKill = () => { PS = null; };
  MM.pinKey = (k) => {
    if (!PS || PS.busy || PS.buf.length >= 4) return;
    PS.buf += k;
    refresh();
    if (PS.buf.length === 4) {
      PS.busy = true;
      const cur = PS, pin = PS.buf;
      setTimeout(async () => {
        await cur.cfg.onDone(pin);
        if (PS === cur) { cur.buf = ''; cur.busy = false; refresh(); }
      }, 130);
    }
  };
  MM.pinDel = () => { if (PS && !PS.busy) { PS.buf = PS.buf.slice(0, -1); refresh(); } };
  MM.pinActive = () => !!PS;
})();
