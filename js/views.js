/* MoneyMe — tampilan (views) & aksi (handlers) */
(function () {
  'use strict';
  const MM = window.MM, S = MM.S, V = MM.V, esc = MM.esc, rp = MM.rp, icon = MM.icon, $ = MM.$;

  const thisMonth = () => MM.today().slice(0, 7);
  V.hMonth = thisMonth(); V.hType = 'all'; V.hQ = ''; V.hLimit = 100;
  V.rMonth = thisMonth(); V.catTab = 'expense';

  const WICONS = ['💵', '🏦', '💳', '📱', '👛', '🏧', '💰', '🪙', '🐷', '💼'];
  const CICONS = ['🍜', '☕', '🚌', '⛽', '🛍️', '🧾', '🎬', '💊', '📚', '🏠', '👕', '🎮', '✈️', '🐾', '👶', '💡', '📞', '🎁', '💼', '🏪', '📈', '🎉', '💰', '📦'];
  const PALETTE = ['#C9A227', '#E0533D', '#F2A541', '#3E7CC9', '#8E44AD', '#3FA7C6', '#D9578B', '#6FAE45', '#B5473A', '#4A6FA5', '#A06CC1', '#4DB6A4'];

  MM.short = (n) => {
    const a = Math.abs(n), s = n < 0 ? '-' : '';
    const f = (v) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });
    if (a >= 1e9) return s + f(a / 1e9) + ' M';
    if (a >= 1e6) return s + f(a / 1e6) + ' jt';
    if (a >= 1e3) return s + f(a / 1e3) + ' rb';
    return s + a;
  };
  const signed = (n, type) => (n === 0 ? rp(0) : (type === 'income' ? '+' : '-') + rp(n));
  const empty = (emoji, msg) => '<div class="empty"><span>' + emoji + '</span><p>' + esc(msg) + '</p></div>';
  const sec = (title, link, href) => '<div class="sec"><h2>' + esc(title) + '</h2>' + (link ? '<a href="' + href + '">' + esc(link) + '</a>' : '') + '</div>';
  const monthNav = (k) => '<div class="mnav"><button class="icon-btn" data-act="m-shift" data-k="' + k + '" data-d="-1" aria-label="Bulan sebelumnya">' + icon('back') +
    '</button><b>' + MM.monthLabel(V[k + 'Month']) + '</b><button class="icon-btn" data-act="m-shift" data-k="' + k + '" data-d="1" aria-label="Bulan berikutnya">' + icon('next') + '</button></div>';

  /* ---------- komponen baris ---------- */
  function txRow(t, showDate) {
    const w = MM.wallet(t.walletId);
    let ic, title, sub, amt, cls;
    if (t.type === 'transfer') {
      const to = MM.wallet(t.toWalletId);
      ic = '🔁'; title = 'Transfer'; sub = (w ? w.name : '?') + ' → ' + (to ? to.name : '?'); amt = rp(t.amount); cls = 'tr';
    } else {
      const c = MM.cat(t.categoryId);
      ic = c ? c.icon : '❔'; title = c ? c.name : 'Tanpa kategori'; sub = w ? w.name : '';
      amt = signed(t.amount, t.type); cls = t.type === 'income' ? 'in' : 'out';
    }
    if (showDate) sub = MM.dayLabel(t.date) + ' · ' + sub;
    if (t.note) sub += ' · ' + t.note;
    return '<button class="tx" data-act="tx-edit" data-id="' + esc(t.id) + '"><span class="tx-ic">' + esc(ic) + '</span><span class="tx-b"><b>' + esc(title) +
      '</b><small>' + esc(sub) + '</small></span><span class="tx-a ' + cls + '">' + amt + '</span></button>';
  }
  function budgetRow(c, spent) {
    const b = MM.budgetOf(c.id);
    let body;
    if (b) {
      const pct = spent / b.amount, cls = pct > 1 ? 'over' : pct >= 0.8 ? 'warn' : 'ok';
      body = '<div class="bud-t"><span>' + esc(c.icon) + ' ' + esc(c.name) + '</span><b class="' + cls + '">' + Math.round(pct * 100) + '%</b></div>' +
        '<div class="prog ' + cls + '"><i style="width:' + Math.min(100, pct * 100).toFixed(1) + '%"></i></div>' +
        '<small>' + (pct > 1 ? '<span class="over">Lewat ' + rp(spent - b.amount) + '</span>' : 'Sisa ' + rp(b.amount - spent)) + ' · ' + rp(spent) + ' dari ' + rp(b.amount) + '</small>';
    } else {
      body = '<div class="bud-t"><span>' + esc(c.icon) + ' ' + esc(c.name) + '</span><b class="muted">Atur</b></div><small>Terpakai ' + rp(spent) + ' · belum ada budget</small>';
    }
    return '<button class="bud" data-act="budget-edit" data-id="' + esc(c.id) + '">' + body + '</button>';
  }
  const row = (act, id, ic, title, sub, right) => '<button class="row" data-act="' + act + '"' + (id ? ' data-id="' + esc(id) + '"' : '') + '><span class="row-ic">' + ic +
    '</span><span class="row-t">' + title + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + (right != null ? right : icon('next')) + '</button>';
  const link = (href, ic, title, sub) => '<a class="row" href="' + href + '"><span class="row-ic">' + ic + '</span><span class="row-t">' + title + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + icon('next') + '</a>';

  /* ---------- halaman ---------- */
  function vOnboard() {
    const step = V.onbStep || 1;
    const dots = '<div class="onb-dots" aria-label="Langkah ' + step + ' dari 2"><i class="' + (step === 1 ? 'on' : '') + '"></i><i class="' + (step === 2 ? 'on' : '') + '"></i></div>';
    if (step === 1) {
      return '<div class="onb">' + dots + MM.logo(64) + '<h1>Selamat datang di <span>MoneyMe</span> 👋</h1>' +
        '<p>Ngatur duit itu bukan soal pelit, tapi biar hidup lebih tenang. Nggak perlu ribet, nggak perlu sampai burnout. Konsisten dikit-dikit, biar cepet kaya! 🚀</p>' +
        '<ul class="onb-list">' +
        '<li><span>💸</span><div><b>Tahu uangmu lari ke mana</b><small>Nggak ada lagi drama "kok saldo udah tipis?" di akhir bulan.</small></div></li>' +
        '<li><span>🧘</span><div><b>Santai, anti burnout</b><small>Cukup 10 detik per catatan. Nggak harus sempurna, yang penting rutin.</small></div></li>' +
        '<li><span>📈</span><div><b>Kebiasaan kecil, hasil besar</b><small>Langkah kecil hari ini, tabungan & mimpi besar nanti.</small></div></li></ul>' +
        '<div class="card pad onb-form"><label class="lbl" for="onb-name">Nama panggilan</label>' +
        '<input class="inp" id="onb-name" data-in="onb-name" maxlength="30" autocomplete="given-name" placeholder="Mas Bara" value="' + esc(V.onbName || '') + '">' +
        '<label class="lbl" for="onb-job">Pekerjaan</label>' +
        '<input class="inp" id="onb-job" data-in="onb-job" maxlength="40" autocomplete="organization-title" placeholder="CEO" value="' + esc(V.onbJob || '') + '"></div>' +
        '<button class="btn primary full big" data-act="onb-next">Lanjut</button>' +
        '<label class="link">Punya file backup? Pulihkan di sini<input type="file" accept=".json,application/json" hidden data-in="import"></label></div>';
    }
    return '<div class="onb">' + dots + '<div class="onb-hero">💛</div><h1>Tentang <span>MoneyMe</span></h1>' +
      '<p>MoneyMe adalah aplikasi manajemen keuangan pribadi yang <b>100% gratis</b>. Tanpa iklan, tanpa daftar akun, bisa dipakai offline, dan semua data tersimpan aman di HP kamu sendiri.</p>' +
      '<div class="onb-pray"><span>🤲</span><p>Nggak perlu bayar apa-apa, cukup <b>doain yang bikin sehat terus</b> aja ya!</p></div>' +
      '<button class="btn primary full big" data-act="onb-start">Mulai Sekarang</button>' +
      '<button class="link" data-act="onb-back">Kembali</button></div>';
  }

  function vHome() {
    const m = thisMonth(), sm = MM.summary(m), bal = MM.balances(), ws = MM.activeWallets();
    let h = '<section class="hero"><span class="hero-l">Total Saldo</span><div class="hero-amt">' + rp(MM.totalBalance()) + '</div>' +
      '<div class="hero-row"><div><small>▲ Pemasukan ' + MM.monthShort(m) + '</small><b>' + rp(sm.income) + '</b></div>' +
      '<div><small>▼ Pengeluaran ' + MM.monthShort(m) + '</small><b>' + rp(sm.expense) + '</b></div></div></section>';

    const lb = S.settings.lastBackup;
    if (S.transactions.length >= 10 && (!lb || Date.now() - lb > 30 * 864e5)) {
      h += '<a class="notice" href="#/backup"><span>🛡️</span><span><b>' + (lb ? 'Sudah lama belum backup' : 'Amankan datamu') + '</b><small>Simpan file backup agar data tidak hilang saat ganti HP.</small></span>' + icon('next') + '</a>';
    }

    h += sec('Dompet', 'Kelola', '#/wallets') + '<div class="wallets">' +
      ws.map((w) => '<button class="wcard" data-act="wallet-edit" data-id="' + esc(w.id) + '"><span>' + esc(w.icon) + '</span><small>' + esc(w.name) + '</small><b>' + rp(bal[w.id]) + '</b></button>').join('') +
      '<button class="wcard add" data-act="wallet-new"><span>＋</span><small>Tambah</small><b>Dompet</b></button></div>';

    const sp = MM.spentByCat(m);
    const buds = MM.activeCats('expense').filter((c) => MM.budgetOf(c.id))
      .map((c) => ({ c, p: (sp[c.id] || 0) / MM.budgetOf(c.id).amount })).sort((a, b) => b.p - a.p).slice(0, 3);
    h += sec('Budget ' + MM.monthLabel(m), 'Semua', '#/budgets');
    h += buds.length ? '<div class="card">' + buds.map((x) => budgetRow(x.c, sp[x.c.id] || 0)).join('') + '</div>'
      : '<a class="notice soft" href="#/budgets"><span>🎯</span><span><b>Atur budget bulanan</b><small>Batasi pengeluaran per kategori supaya tidak boros.</small></span>' + icon('next') + '</a>';

    const recent = MM.sortTx(S.transactions.slice()).slice(0, 5);
    h += sec('Transaksi Terakhir', recent.length ? 'Semua' : '', '#/history');
    h += recent.length ? '<div class="card">' + recent.map((t) => txRow(t, true)).join('') + '</div>'
      : empty('📝', 'Belum ada transaksi. Ketuk tombol + di kanan bawah untuk mulai mencatat.');
    return h;
  }

  function groupedTx(list) {
    const groups = [];
    list.forEach((t) => {
      const g = groups[groups.length - 1];
      if (g && g.date === t.date) g.items.push(t); else groups.push({ date: t.date, items: [t] });
    });
    return groups.map((g) => {
      const net = g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);
      return '<div class="day"><span>' + MM.dayLabel(g.date) + '</span><b class="' + (net > 0 ? 'in' : net < 0 ? 'out' : '') + '">' + (net > 0 ? '+' : '') + rp(net) + '</b></div>' +
        '<div class="card">' + g.items.map((t) => txRow(t)).join('') + '</div>';
    }).join('');
  }

  function histList() {
    const q = V.hQ.trim().toLowerCase();
    let arr = MM.monthTx(V.hMonth).filter((t) => V.hType === 'all' || t.type === V.hType);
    if (q) arr = arr.filter((t) => {
      const c = MM.cat(t.categoryId), w = MM.wallet(t.walletId);
      return (t.note || '').toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q)) || (w && w.name.toLowerCase().includes(q));
    });
    if (!arr.length) return empty('🗒️', q || V.hType !== 'all' ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi di bulan ini.');
    MM.sortTx(arr);
    const shown = arr.slice(0, V.hLimit);
    let h = '<p class="count">' + arr.length + ' transaksi</p>' + groupedTx(shown);
    if (arr.length > shown.length) h += '<button class="btn ghost full" data-act="h-more">Tampilkan lebih banyak</button>';
    return h;
  }
  function vHistory() {
    return monthNav('h') +
      '<div class="search">' + icon('search') + '<input type="search" placeholder="Cari catatan, kategori, dompet" data-in="hq" value="' + esc(V.hQ) + '" aria-label="Cari"></div>' +
      '<div class="chips">' + [['all', 'Semua'], ['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer']]
        .map(([k, l]) => '<button class="chip' + (V.hType === k ? ' on' : '') + '" data-act="h-type" data-k="' + k + '">' + l + '</button>').join('') + '</div>' +
      '<div id="hist">' + histList() + '</div>';
  }

  const daysIn = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
  const activeDays = (m) => (m > thisMonth() ? 0 : m === thisMonth() ? new Date().getDate() : daysIn(m));
  const rangeLabel = (m) => { const [y, mo] = m.split('-').map(Number); const ms = MM.MS[mo - 1]; return '01 ' + ms + ' ' + y + ' – ' + daysIn(m) + ' ' + ms + ' ' + y; };
  const pctTxt = (p) => (p > 0 && p < 1 ? '<1' : Math.round(p)) + ' %';
  function catTotals(m, type) {
    const o = {};
    for (const t of MM.monthTx(m)) if (t.type === type) o[t.categoryId] = (o[t.categoryId] || 0) + t.amount;
    return Object.entries(o).map(([id, v]) => ({ id, c: MM.cat(id), v })).sort((a, b) => b.v - a.v);
  }
  const catName = (c) => (c ? c.icon + ' ' + c.name : '❔ Tanpa kategori');

  function reportChart(m) {
    const sm = MM.summary(m), items = catTotals(m, 'expense');
    let h = '';
    if (!items.length) h += empty('📊', 'Belum ada pengeluaran di bulan ini.');
    else {
      items.forEach((it, i) => (it.color = PALETTE[i % PALETTE.length]));
      h += '<div class="card pad">' + MM.donut(items.map((i) => ({ label: i.c ? i.c.name : 'Tanpa kategori', value: i.v, color: i.color })), MM.short(sm.expense), 'Total') +
        '<div class="legend2">' + items.map((i) => '<button class="lgr" data-act="cat-detail" data-id="' + esc(i.id) + '"><span class="pct" style="background:' + i.color + '">' +
          pctTxt((i.v / sm.expense) * 100) + '</span><span class="lgn">' + esc(catName(i.c)) + '</span><b>' + rp(i.v) + '</b>' + icon('next') + '</button>').join('') + '</div></div>';
    }
    const rows = [];
    for (let i = 5; i >= 0; i--) { const mm = MM.shiftMonth(m, -i), s = MM.summary(mm); rows.push({ label: MM.monthShort(mm), income: s.income, expense: s.expense, active: i === 0 }); }
    h += sec('Tren 6 Bulan') + '<div class="card pad">' + MM.bars(rows) +
      '<div class="keys"><span><i class="k-in"></i>Pemasukan</span><span><i class="k-out"></i>Pengeluaran</span></div></div>';
    return h;
  }
  function catBars(m, type) {
    const items = catTotals(m, type);
    if (!items.length) return empty(type === 'expense' ? '🧾' : '💰', type === 'expense' ? 'Belum ada pengeluaran.' : 'Belum ada pemasukan.');
    const max = items[0].v;
    return '<div class="card">' + items.map((i) => '<button class="cb" data-act="cat-detail" data-id="' + esc(i.id) + '"><div class="cb-t"><span>' + esc(catName(i.c)) + '</span><b class="' +
      (type === 'income' ? 'in' : '') + '">' + (type === 'income' ? '+' : '') + rp(i.v) + '</b>' + icon('next') + '</div><div class="cb-bar ' + type + '"><i style="width:' +
      Math.max(2, (i.v / max) * 100).toFixed(1) + '%"></i></div></button>').join('') + '</div>';
  }
  function reportCats(m) {
    const sm = MM.summary(m), d = activeDays(m);
    const r = (l, v, cls, extra) => '<div class="sr' + (extra ? ' ' + extra : '') + '"><span>' + l + '</span><b class="' + (cls || '') + '">' + v + '</b></div>';
    return '<div class="card pad sumtbl">' +
      r('Pengeluaran', rp(sm.expense), 'out') + r('rata-rata harian', rp(d ? sm.expense / d : 0), '', 'sub') +
      r('Pemasukan', '+' + rp(sm.income), 'in') + r('rata-rata harian', '+' + rp(d ? sm.income / d : 0), '', 'sub') +
      r('Selisih', (sm.net > 0 ? '+' : '') + rp(sm.net), sm.net >= 0 ? 'in' : 'out', 'tot') + '</div>' +
      sec('Pengeluaran per Kategori') + catBars(m, 'expense') + sec('Pemasukan per Kategori') + catBars(m, 'income');
  }
  function vReport() {
    const m = V.rMonth, tab = V.rTab || 'chart';
    return monthNav('r') + '<p class="range">' + rangeLabel(m) + '</p>' +
      '<div class="seg"><button class="' + (tab === 'chart' ? 'on' : '') + '" data-act="r-tab" data-k="chart">Grafik</button><button class="' +
      (tab === 'cat' ? 'on' : '') + '" data-act="r-tab" data-k="cat">Kategori</button></div>' +
      (tab === 'chart' ? reportChart(m) : reportCats(m));
  }

  function vCatDetail() {
    const id = V.detailCat, c = MM.cat(id), m = V.rMonth;
    if (!id) { setTimeout(() => location.replace('#/report'), 0); return ''; }
    const type = c ? c.type : 'expense';
    const txs = MM.sortTx(MM.monthTx(m).filter((t) => t.categoryId === id || (!c && t.type === type && !MM.cat(t.categoryId))));
    const total = txs.reduce((s, t) => s + t.amount, 0), all = MM.summary(m)[type];
    let h = monthNav('r') + '<div class="card dhead"><div class="di">' + esc(c ? c.icon : '❔') + '</div><h2>' + esc(c ? c.name : 'Tanpa kategori') + '</h2>' +
      '<b class="' + (type === 'income' ? 'in' : 'out') + '">' + (type === 'income' ? '+' : '') + rp(total) + '</b><small>' + txs.length + ' transaksi · ' +
      (all ? pctTxt((total / all) * 100).replace(' ', '') : '0%') + ' dari total ' + (type === 'income' ? 'pemasukan' : 'pengeluaran') + ' · rata-rata ' +
      rp(activeDays(m) ? total / activeDays(m) : 0) + '/hari</small></div>';
    if (c && type === 'expense' && m === thisMonth()) h += sec('Budget') + '<div class="card">' + budgetRow(c, total) + '</div>';
    h += sec('Transaksi');
    h += txs.length ? groupedTx(txs) : empty('🗒️', 'Tidak ada transaksi kategori ini di ' + MM.monthLabel(m) + '.');
    return h;
  }

  function vMore() {
    const th = { system: 'Ikuti sistem', light: 'Terang', dark: 'Gelap' }[S.settings.theme || 'system'];
    const lb = S.settings.lastBackup;
    const nm = S.settings.name || '';
    return '<div class="group"><h3>Profil</h3><div class="card">' +
      row('profile-open', '', '<span class="avatar">' + esc((nm || '?').charAt(0).toUpperCase()) + '</span>', esc(nm || 'Atur nama'), esc(S.settings.job || 'Pekerjaan belum diisi')) + '</div></div>' +
      '<div class="group"><h3>Kelola</h3><div class="card">' +
      link('#/wallets', '👛', 'Dompet', MM.activeWallets().length + ' dompet aktif') +
      link('#/categories', '🏷️', 'Kategori', 'Atur kategori pemasukan & pengeluaran') +
      link('#/budgets', '🎯', 'Budget Bulanan', 'Batas pengeluaran per kategori') + '</div></div>' +
      '<div class="group"><h3>Pengaturan</h3><div class="card">' +
      row('theme-open', '', '🌗', 'Tampilan', th) +
      row('pin-toggle', '', '🔒', 'Kunci PIN', S.settings.pinHash ? 'Aktif' : 'Nonaktif', '<span class="sw' + (S.settings.pinHash ? ' on' : '') + '"><i></i></span>') + '</div></div>' +
      '<div class="group"><h3>Data</h3><div class="card">' +
      link('#/backup', '🛡️', 'Backup &amp; Pulihkan', lb ? 'Terakhir ' + new Date(lb).toLocaleDateString('id-ID') : 'Belum pernah backup') +
      row('reset', '', '🗑️', '<span class="out">Hapus Semua Data</span>', 'Mulai dari awal', '') + '</div></div>' +
      '<p class="about">' + MM.logo(28) + '<span><b>MoneyMe</b> v1.0<br>Data tersimpan hanya di perangkat ini, tanpa internet.</span></p>';
  }

  function vWallets() {
    const b = MM.balances(), act = MM.activeWallets(), arch = S.wallets.filter((w) => w.archived);
    const r = (w) => row('wallet-edit', w.id, esc(w.icon), esc(w.name), 'Saldo awal ' + rp(w.initialBalance || 0), '<b class="row-r">' + rp(b[w.id]) + '</b>');
    return '<div class="total"><small>Total saldo</small><b>' + rp(MM.totalBalance()) + '</b></div>' +
      '<div class="card">' + act.map(r).join('') + '</div>' +
      '<button class="btn primary full" data-act="wallet-new">＋ Tambah Dompet</button>' +
      (arch.length ? sec('Diarsipkan') + '<div class="card faded">' + arch.map(r).join('') + '</div>' : '') +
      '<p class="hint">Ketuk dompet untuk mengubah nama, ikon, atau saldo awal. Pindahkan uang antar dompet lewat tombol + lalu pilih <b>Transfer</b>.</p>';
  }

  function vCategories() {
    const t = V.catTab, list = S.categories.filter((c) => c.type === t);
    const act = list.filter((c) => !c.archived), arch = list.filter((c) => c.archived);
    const r = (c) => row('cat-edit', c.id, esc(c.icon), esc(c.name), '');
    return '<div class="seg"><button class="' + (t === 'expense' ? 'on' : '') + '" data-act="cat-tab" data-k="expense">Pengeluaran</button><button class="' +
      (t === 'income' ? 'on' : '') + '" data-act="cat-tab" data-k="income">Pemasukan</button></div>' +
      (act.length ? '<div class="card">' + act.map(r).join('') + '</div>' : empty('🏷️', 'Belum ada kategori.')) +
      '<button class="btn primary full" data-act="cat-new">＋ Tambah Kategori</button>' +
      (arch.length ? sec('Diarsipkan') + '<div class="card faded">' + arch.map(r).join('') + '</div>' : '');
  }

  function vBudgets() {
    const m = thisMonth(), sp = MM.spentByCat(m), cats = MM.activeCats('expense');
    const withB = cats.filter((c) => MM.budgetOf(c.id)), noB = cats.filter((c) => !MM.budgetOf(c.id));
    const tb = withB.reduce((s, c) => s + MM.budgetOf(c.id).amount, 0), ts = withB.reduce((s, c) => s + (sp[c.id] || 0), 0);
    withB.sort((a, b) => (sp[b.id] || 0) / MM.budgetOf(b.id).amount - (sp[a.id] || 0) / MM.budgetOf(a.id).amount);
    let h = '';
    if (tb) {
      const p = ts / tb, cls = p > 1 ? 'over' : p >= 0.8 ? 'warn' : 'ok';
      h += '<div class="card pad"><div class="bud-t"><span>Total budget ' + MM.monthLabel(m) + '</span><b class="' + cls + '">' + Math.round(p * 100) + '%</b></div>' +
        '<div class="prog ' + cls + '"><i style="width:' + Math.min(100, p * 100).toFixed(1) + '%"></i></div><small class="muted">' + rp(ts) + ' dari ' + rp(tb) +
        (p > 1 ? ' · <span class="over">lewat ' + rp(ts - tb) + '</span>' : ' · sisa ' + rp(tb - ts)) + '</small></div>';
    }
    if (withB.length) h += sec('Sudah diatur') + '<div class="card">' + withB.map((c) => budgetRow(c, sp[c.id] || 0)).join('') + '</div>';
    if (noB.length) h += sec('Belum diatur') + '<div class="card">' + noB.map((c) => budgetRow(c, sp[c.id] || 0)).join('') + '</div>';
    return h + '<p class="hint">Ketuk kategori untuk mengatur batas per bulan. Budget otomatis berlaku setiap bulan.</p>';
  }

  function vBackup() {
    const lb = S.settings.lastBackup;
    return '<div class="card pad info"><span>🛡️</span><p>Data MoneyMe <b>hanya tersimpan di perangkat ini</b>. Simpan file backup secara rutin (misalnya ke Google Drive atau WhatsApp ke diri sendiri) supaya data aman saat ganti HP atau data browser terhapus.</p></div>' +
      '<p class="muted center">Backup terakhir: <b>' + (lb ? new Date(lb).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'belum pernah') + '</b></p>' +
      '<button class="btn primary full big" data-act="export">Simpan File Backup</button>' +
      '<label class="btn ghost full">Pulihkan dari File Backup<input type="file" accept=".json,application/json" hidden data-in="import"></label>' +
      '<p class="hint">Memulihkan akan <b>mengganti semua data</b> saat ini dengan isi file backup.</p>';
  }

  const ROUTES = {
    home: { tab: 'home', view: vHome },
    history: { tab: 'history', title: 'Riwayat', view: vHistory },
    report: { tab: 'report', title: 'Laporan', view: vReport },
    more: { tab: 'more', title: 'Lainnya', view: vMore },
    wallets: { tab: 'more', title: 'Dompet', back: 1, view: vWallets },
    categories: { tab: 'more', title: 'Kategori', back: 1, view: vCategories },
    budgets: { tab: 'more', title: 'Budget Bulanan', back: 1, view: vBudgets },
    backup: { tab: 'more', title: 'Backup & Pulihkan', back: 1, view: vBackup },
    catdetail: { tab: 'report', title: 'Detail Kategori', back: 1, parent: 'report', view: vCatDetail }
  };
  const route = () => { const r = (location.hash || '').replace(/^#\/?/, '') || 'home'; return ROUTES[r] ? r : 'home'; };
  const NAV = [['home', 'home', 'Beranda'], ['history', 'list', 'Riwayat'], ['report', 'chart', 'Laporan'], ['more', 'more', 'Lainnya']];

  MM.render = () => {
    const top = $('#top'), view = $('#view'), nav = $('#nav'), fab = $('#fab');
    if (!S.settings.onboarded) {
      top.innerHTML = nav.innerHTML = fab.innerHTML = '';
      view.innerHTML = vOnboard();
      document.body.classList.add('onboard');
      return;
    }
    document.body.classList.remove('onboard');
    const r = route(), R = ROUTES[r];
    top.innerHTML = r === 'home'
      ? '<div class="bar brand">' + MM.logo(34) + '<div>' + (S.settings.name ? '<h1>Halo, ' + esc(S.settings.name) + ' 👋</h1>' : '<h1>Money<span>Me</span></h1>') + '<small>' + MM.longDate() + '</small></div></div>'
      : '<div class="bar">' + (R.back ? '<button class="icon-btn" data-act="back" aria-label="Kembali">' + icon('back') + '</button>' : '') + '<h1>' + esc(R.title) + '</h1></div>';
    view.innerHTML = R.view();
    nav.innerHTML = NAV.map(([k, ic, l]) => '<a href="#/' + k + '" class="' + (R.tab === k ? 'on' : '') + '"' + (R.tab === k ? ' aria-current="page"' : '') + '>' + icon(ic) + '<span>' + l + '</span></a>').join('');
    fab.innerHTML = ['home', 'history', 'report'].includes(r) ? '<button class="fab" data-act="tx-new" aria-label="Catat transaksi">' + icon('plus') + '</button>' : '';
    if (r !== V.lastRoute) { window.scrollTo(0, 0); V.lastRoute = r; }
  };

  MM.applyTheme = () => {
    const t = S.settings.theme || 'system';
    const dark = t === 'dark' || (t === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = dark ? '#15120B' : '#FFFFFF';
  };

  /* ---------- sheet: transaksi ---------- */
  const walletSelect = (key, sel) => {
    const b = MM.balances();
    const ws = S.wallets.filter((w) => !w.archived || w.id === sel);
    return '<select class="inp" data-in="' + key + '">' + ws.map((w) => '<option value="' + esc(w.id) + '"' + (w.id === sel ? ' selected' : '') + '>' +
      esc(w.icon + ' ' + w.name) + ' (' + rp(b[w.id]) + ')</option>').join('') + '</select>';
  };
  function txSheet() {
    const D = V.tx;
    let h = MM.sheetHead(D.id ? 'Ubah Transaksi' : 'Catat Transaksi') + '<div class="seg seg3">' +
      [['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer']].map(([k, l]) => '<button class="' + (D.type === k ? 'on ' + k : '') + '" data-act="tx-type" data-k="' + k + '">' + l + '</button>').join('') +
      '</div><div class="amt big ' + D.type + '"><span>Rp</span><input id="f-amt" inputmode="numeric" autocomplete="off" placeholder="0" data-in="amt" data-k="tx" value="' + (D.amount ? MM.num(D.amount) : '') + '" aria-label="Nominal"></div>';
    if (D.type !== 'transfer') {
      const cats = S.categories.filter((c) => c.type === D.type && (!c.archived || c.id === D.categoryId));
      h += '<label class="lbl">Kategori</label><div class="cats">' + cats.map((c) => '<button class="cat' + (c.id === D.categoryId ? ' on' : '') + '" data-act="tx-cat" data-id="' + esc(c.id) + '"><span>' +
        esc(c.icon) + '</span><small>' + esc(c.name) + '</small></button>').join('') + '</div>' +
        '<label class="lbl">Dompet</label>' + walletSelect('tx-wallet', D.walletId);
    } else {
      h += '<label class="lbl">Dari dompet</label>' + walletSelect('tx-wallet', D.walletId) + '<label class="lbl">Ke dompet</label>' + walletSelect('tx-to', D.toWalletId);
    }
    h += '<div class="grid2"><div><label class="lbl">Tanggal</label><input class="inp" type="date" data-in="tx-date" value="' + esc(D.date) + '"></div>' +
      '<div><label class="lbl">Catatan</label><input class="inp" data-in="tx-note" maxlength="100" placeholder="opsional" value="' + esc(D.note || '') + '"></div></div>' +
      '<button class="btn primary full big" data-act="tx-save">Simpan</button>' +
      (D.id ? '<button class="btn ghost full danger-t" data-act="tx-del">Hapus transaksi</button>' : '');
    return h;
  }
  function openTx(t) {
    const ws = MM.activeWallets();
    if (!ws.length) return MM.toast('Tambahkan dompet terlebih dahulu');
    if (t) V.tx = Object.assign({}, t);
    else {
      const wid = V.lastWallet && ws.some((w) => w.id === V.lastWallet) ? V.lastWallet : ws[0].id;
      V.tx = { type: 'expense', amount: 0, categoryId: null, walletId: wid, toWalletId: null, date: MM.today(), note: '' };
    }
    MM.openSheet(txSheet());
    if (!t) setTimeout(() => { const a = $('#f-amt'); if (a) a.focus(); }, 250);
  }

  /* ---------- sheet: dompet / kategori / budget / tema ---------- */
  const emojiGrid = (k, list, sel) => '<div class="emojis">' + list.map((e) => '<button class="emo' + (e === sel ? ' on' : '') + '" data-act="pick-emo" data-k="' + k + '" data-e="' + e + '">' + e + '</button>').join('') + '</div>';
  function walletSheet(w) {
    V.wd = w ? Object.assign({}, w) : { name: '', icon: '🏦', initialBalance: 0 };
    const d = V.wd;
    MM.openSheet(MM.sheetHead(w ? 'Ubah Dompet' : 'Tambah Dompet') +
      '<label class="lbl">Nama dompet</label><input class="inp" data-in="wd-name" maxlength="30" placeholder="mis. BCA, GoPay, Tabungan" value="' + esc(d.name) + '">' +
      '<label class="lbl">Ikon</label>' + emojiGrid('wd', WICONS, d.icon) +
      '<label class="lbl">Saldo awal</label><div class="amt"><span>Rp</span><input inputmode="numeric" autocomplete="off" placeholder="0" data-in="amt" data-k="wd" value="' + (d.initialBalance ? MM.num(d.initialBalance) : '') + '"></div>' +
      '<p class="hint">Saldo awal = jumlah uang di dompet ini sebelum mulai mencatat.</p>' +
      '<button class="btn primary full big" data-act="wallet-save">Simpan</button>' +
      (w ? (w.archived ? '<button class="btn ghost full" data-act="wallet-arch">Aktifkan kembali</button>'
        : '<button class="btn ghost full danger-t" data-act="wallet-del">' + (MM.walletUsed(w.id) ? 'Arsipkan dompet' : 'Hapus dompet') + '</button>') : ''));
  }
  function catSheet(c) {
    V.cd = c ? Object.assign({}, c) : { name: '', icon: '📦', type: V.catTab };
    const d = V.cd;
    MM.openSheet(MM.sheetHead(c ? 'Ubah Kategori' : 'Tambah Kategori') +
      (c ? '' : '<div class="seg" id="cd-seg"><button class="' + (d.type === 'expense' ? 'on' : '') + '" data-act="cd-type" data-k="expense">Pengeluaran</button><button class="' +
        (d.type === 'income' ? 'on' : '') + '" data-act="cd-type" data-k="income">Pemasukan</button></div>') +
      '<label class="lbl">Nama kategori</label><input class="inp" data-in="cd-name" maxlength="20" placeholder="mis. Kopi, Bensin" value="' + esc(d.name) + '">' +
      '<label class="lbl">Ikon</label>' + emojiGrid('cd', CICONS, d.icon) +
      '<button class="btn primary full big" data-act="cat-save">Simpan</button>' +
      (c ? (c.archived ? '<button class="btn ghost full" data-act="cat-arch">Aktifkan kembali</button>'
        : '<button class="btn ghost full danger-t" data-act="cat-del">' + (MM.catUsed(c.id) ? 'Arsipkan kategori' : 'Hapus kategori') + '</button>') : ''));
  }
  function budgetSheet(c) {
    const b = MM.budgetOf(c.id), spent = MM.spentByCat(thisMonth())[c.id] || 0;
    V.bd = { categoryId: c.id, amount: b ? b.amount : 0 };
    MM.openSheet(MM.sheetHead('Budget ' + c.icon + ' ' + c.name) +
      '<label class="lbl">Batas pengeluaran per bulan</label><div class="amt big"><span>Rp</span><input id="f-bud" inputmode="numeric" autocomplete="off" placeholder="0" data-in="amt" data-k="bd" value="' + (b ? MM.num(b.amount) : '') + '"></div>' +
      '<p class="hint">Bulan ini sudah terpakai <b>' + rp(spent) + '</b>.</p>' +
      '<button class="btn primary full big" data-act="budget-save">Simpan</button>' +
      (b ? '<button class="btn ghost full danger-t" data-act="budget-del">Hapus budget</button>' : ''));
    setTimeout(() => { const a = $('#f-bud'); if (a) a.focus(); }, 250);
  }

  /* ---------- kunci PIN ---------- */
  let fails = 0, blockedUntil = 0;
  MM.lock = () => {
    if (!S.settings.pinHash) return;
    MM.closeSheet();
    $('#dialog').innerHTML = '';
    const L = $('#lock');
    L.innerHTML = '<div class="lock-in">' + MM.logo(56) + MM.pinPad() + '<button class="link" data-act="pin-forgot">Lupa PIN?</button></div>';
    L.classList.add('on');
    document.body.classList.add('noscroll');
    V.locked = true;
    MM.pinStart({
      lock: true, title: 'Masukkan PIN', msg: 'MoneyMe terkunci',
      onDone: async (p) => {
        if (Date.now() < blockedUntil) return MM.pinUpdate({ msg: 'Tunggu 30 detik lalu coba lagi', err: true }, true);
        if (await MM.checkPin(p)) {
          fails = 0; MM.pinKill(); V.locked = false;
          L.classList.remove('on'); L.innerHTML = ''; document.body.classList.remove('noscroll');
        } else if (++fails >= 5) {
          fails = 0; blockedUntil = Date.now() + 30000;
          MM.pinUpdate({ msg: 'Terlalu banyak salah. Coba lagi 30 detik.', err: true }, true);
        } else MM.pinUpdate({ msg: 'PIN salah, sisa ' + (5 - fails) + ' kesempatan', err: true }, true);
      }
    });
  };

  /* ---------- aksi klik ---------- */
  const H = (MM.H = {});
  const done = (msg) => { MM.closeSheet(); MM.render(); if (msg) MM.toast(msg); };

  H['sheet-close'] = () => MM.closeSheet();
  H.back = () => { const R = ROUTES[route()]; if (V.navd) history.back(); else location.hash = '#/' + (R.parent || 'more'); };
  H['r-tab'] = (el) => { V.rTab = el.dataset.k; MM.render(); };
  H['cat-detail'] = (el) => { V.detailCat = el.dataset.id; location.hash = '#/catdetail'; };
  H['m-shift'] = (el) => { const k = el.dataset.k; V[k + 'Month'] = MM.shiftMonth(V[k + 'Month'], +el.dataset.d); V.hLimit = 100; MM.render(); };
  H['h-type'] = (el) => { V.hType = el.dataset.k; V.hLimit = 100; MM.render(); };
  H['h-more'] = () => { V.hLimit += 100; $('#hist').innerHTML = histList(); };

  H['onb-next'] = () => {
    if (!(V.onbName || '').trim()) { MM.toast('Isi nama kamu dulu ya'); const n = $('#onb-name'); if (n) n.focus(); return; }
    V.onbStep = 2; MM.render(); window.scrollTo(0, 0);
  };
  H['onb-back'] = () => { V.onbStep = 1; MM.render(); window.scrollTo(0, 0); };
  H['onb-start'] = async () => {
    const name = (V.onbName || '').trim();
    await MM.seed({ name, job: (V.onbJob || '').trim() });
    location.hash = '#/home';
    MM.render();
    MM.toast('Siap, ' + name + '! Atur saldo awal di kartu Dompet ya');
  };

  H['profile-open'] = () => {
    V.pf = { name: S.settings.name || '', job: S.settings.job || '' };
    MM.openSheet(MM.sheetHead('Profil') +
      '<label class="lbl" for="pf-name">Nama panggilan</label><input class="inp" id="pf-name" data-in="pf-name" maxlength="30" placeholder="Mas Bara" value="' + esc(V.pf.name) + '">' +
      '<label class="lbl" for="pf-job">Pekerjaan</label><input class="inp" id="pf-job" data-in="pf-job" maxlength="40" placeholder="CEO" value="' + esc(V.pf.job) + '">' +
      '<button class="btn primary full big" data-act="profile-save">Simpan</button>');
  };
  H['profile-save'] = async () => {
    const name = V.pf.name.trim();
    if (!name) return MM.toast('Nama wajib diisi');
    await MM.set('name', name);
    await MM.set('job', V.pf.job.trim());
    done('Profil disimpan');
  };

  H['tx-new'] = () => openTx(null);
  H['tx-edit'] = (el) => { const t = S.transactions.find((x) => x.id === el.dataset.id); if (t) openTx(t); };
  H['tx-type'] = (el) => {
    const D = V.tx, k = el.dataset.k;
    if (k === D.type) return;
    if (k === 'transfer') {
      const ws = MM.activeWallets();
      if (ws.length < 2) return MM.toast('Butuh minimal 2 dompet untuk transfer');
      if (!D.toWalletId || D.toWalletId === D.walletId) D.toWalletId = (ws.find((w) => w.id !== D.walletId) || ws[0]).id;
    }
    D.type = k; D.categoryId = null;
    MM.setSheet(txSheet());
  };
  H['tx-cat'] = (el) => {
    V.tx.categoryId = el.dataset.id;
    document.querySelectorAll('.cat').forEach((b) => b.classList.toggle('on', b === el));
  };
  H['tx-save'] = async () => {
    const D = V.tx;
    if (!D.amount) return MM.toast('Isi nominalnya dulu ya');
    if (D.type !== 'transfer' && !D.categoryId) return MM.toast('Pilih kategorinya dulu');
    if (D.type === 'transfer' && D.walletId === D.toWalletId) return MM.toast('Dompet asal dan tujuan harus berbeda');
    const now = Date.now();
    const t = {
      id: D.id || MM.uid(), type: D.type, amount: D.amount, walletId: D.walletId,
      toWalletId: D.type === 'transfer' ? D.toWalletId : null, categoryId: D.type === 'transfer' ? null : D.categoryId,
      date: /^\d{4}-\d{2}-\d{2}$/.test(D.date) ? D.date : MM.today(), note: (D.note || '').trim(), createdAt: D.createdAt || now, updatedAt: now
    };
    await MM.put('transactions', t);
    V.lastWallet = t.walletId;
    let msg = D.id ? 'Perubahan disimpan' : 'Transaksi tersimpan';
    if (t.type === 'expense') {
      const b = MM.budgetOf(t.categoryId), spent = MM.spentByCat(MM.monthOf(t.date))[t.categoryId] || 0;
      if (b && spent > b.amount) msg = '⚠️ Budget ' + MM.cat(t.categoryId).name + ' sudah terlampaui';
      else if (b && spent >= b.amount * 0.8) msg = 'Budget ' + MM.cat(t.categoryId).name + ' tinggal ' + rp(b.amount - spent);
    }
    done(msg);
  };
  H['tx-del'] = async () => {
    if (!(await MM.confirm({ title: 'Hapus transaksi?', msg: 'Transaksi ini akan dihapus permanen.', ok: 'Hapus', danger: true }))) return;
    await MM.remove('transactions', V.tx.id);
    done('Transaksi dihapus');
  };

  H['pick-emo'] = (el) => {
    V[el.dataset.k].icon = el.dataset.e;
    el.parentNode.querySelectorAll('.emo').forEach((b) => b.classList.toggle('on', b === el));
  };

  H['wallet-new'] = () => walletSheet(null);
  H['wallet-edit'] = (el) => { const w = MM.wallet(el.dataset.id); if (w) walletSheet(w); };
  H['wallet-save'] = async () => {
    const d = V.wd, name = (d.name || '').trim();
    if (!name) return MM.toast('Nama dompet wajib diisi');
    await MM.put('wallets', Object.assign({ id: MM.uid(), archived: false, createdAt: Date.now() }, d, { name, initialBalance: d.initialBalance || 0 }));
    done(d.id ? 'Dompet diperbarui' : 'Dompet ditambahkan');
  };
  H['wallet-del'] = async () => {
    const w = MM.wallet(V.wd.id);
    if (MM.activeWallets().length <= 1) return MM.toast('Minimal harus ada 1 dompet aktif');
    if (MM.walletUsed(w.id)) {
      if (!(await MM.confirm({ title: 'Arsipkan dompet?', msg: 'Dompet ini punya transaksi, jadi akan diarsipkan (disembunyikan dan tidak dihitung di total saldo). Riwayat tetap aman.', ok: 'Arsipkan' }))) return;
      await MM.put('wallets', Object.assign({}, w, { archived: true }));
      return done('Dompet diarsipkan');
    }
    if (!(await MM.confirm({ title: 'Hapus dompet?', msg: 'Dompet "' + w.name + '" akan dihapus.', ok: 'Hapus', danger: true }))) return;
    await MM.remove('wallets', w.id);
    done('Dompet dihapus');
  };
  H['wallet-arch'] = async () => { await MM.put('wallets', Object.assign({}, MM.wallet(V.wd.id), { archived: false })); done('Dompet aktif kembali'); };

  H['cat-tab'] = (el) => { V.catTab = el.dataset.k; MM.render(); };
  H['cat-new'] = () => catSheet(null);
  H['cat-edit'] = (el) => { const c = MM.cat(el.dataset.id); if (c) catSheet(c); };
  H['cd-type'] = (el) => {
    V.cd.type = el.dataset.k;
    document.querySelectorAll('#cd-seg button').forEach((b) => b.classList.toggle('on', b === el));
  };
  H['cat-save'] = async () => {
    const d = V.cd, name = (d.name || '').trim();
    if (!name) return MM.toast('Nama kategori wajib diisi');
    await MM.put('categories', Object.assign({ id: MM.uid(), archived: false }, d, { name }));
    V.catTab = d.type;
    done(d.id ? 'Kategori diperbarui' : 'Kategori ditambahkan');
  };
  H['cat-del'] = async () => {
    const c = MM.cat(V.cd.id);
    if (MM.catUsed(c.id)) {
      if (!(await MM.confirm({ title: 'Arsipkan kategori?', msg: 'Kategori ini dipakai di transaksi, jadi akan diarsipkan (tidak muncul saat mencatat). Riwayat tetap aman.', ok: 'Arsipkan' }))) return;
      await MM.put('categories', Object.assign({}, c, { archived: true }));
      return done('Kategori diarsipkan');
    }
    if (!(await MM.confirm({ title: 'Hapus kategori?', msg: 'Kategori "' + c.name + '" akan dihapus.', ok: 'Hapus', danger: true }))) return;
    const b = MM.budgetOf(c.id);
    if (b) await MM.remove('budgets', b.id);
    await MM.remove('categories', c.id);
    done('Kategori dihapus');
  };
  H['cat-arch'] = async () => { await MM.put('categories', Object.assign({}, MM.cat(V.cd.id), { archived: false })); done('Kategori aktif kembali'); };

  H['budget-edit'] = (el) => { const c = MM.cat(el.dataset.id); if (c) budgetSheet(c); };
  H['budget-save'] = async () => {
    const d = V.bd, b = MM.budgetOf(d.categoryId);
    if (!d.amount) { if (b) await MM.remove('budgets', b.id); return done(b ? 'Budget dihapus' : ''); }
    await MM.put('budgets', { id: b ? b.id : MM.uid(), categoryId: d.categoryId, amount: d.amount });
    done('Budget disimpan');
  };
  H['budget-del'] = async () => { const b = MM.budgetOf(V.bd.categoryId); if (b) await MM.remove('budgets', b.id); done('Budget dihapus'); };

  H['theme-open'] = () => {
    const cur = S.settings.theme || 'system';
    MM.openSheet(MM.sheetHead('Tampilan') + '<div class="card">' +
      [['system', '📱', 'Ikuti sistem'], ['light', '☀️', 'Terang'], ['dark', '🌙', 'Gelap']].map(([k, ic, l]) =>
        row('theme', '', ic, l, '', '<span class="radio' + (cur === k ? ' on' : '') + '"></span>').replace('data-act="theme"', 'data-act="theme" data-k="' + k + '"')).join('') + '</div>');
  };
  H.theme = async (el) => { await MM.set('theme', el.dataset.k); MM.applyTheme(); done(); };

  H['pin-toggle'] = async () => {
    if (S.settings.pinHash) {
      MM.openSheet(MM.sheetHead('Matikan Kunci PIN') + MM.pinPad());
      return MM.pinStart({
        title: 'Masukkan PIN saat ini', msg: '',
        onDone: async (p) => {
          if (await MM.checkPin(p)) { await MM.clearPin(); done('Kunci PIN dimatikan'); }
          else MM.pinUpdate({ msg: 'PIN salah', err: true }, true);
        }
      });
    }
    if (!(await MM.confirm({ title: 'Aktifkan Kunci PIN?', msg: 'PIN 4 angka akan diminta setiap membuka MoneyMe. Jika lupa PIN, satu-satunya cara adalah menghapus semua data, jadi pastikan sudah backup.', ok: 'Lanjut' }))) return;
    let first = null;
    MM.openSheet(MM.sheetHead('Buat Kunci PIN') + MM.pinPad());
    MM.pinStart({
      title: 'Buat PIN baru', msg: 'Masukkan 4 angka',
      onDone: async (p) => {
        if (!first) { first = p; MM.pinUpdate({ title: 'Ulangi PIN', msg: 'Masukkan sekali lagi', err: false }); }
        else if (p === first) { await MM.setPin(p); done('Kunci PIN aktif'); }
        else { first = null; MM.pinUpdate({ title: 'Buat PIN baru', msg: 'PIN tidak sama, ulangi dari awal', err: true }, true); }
      }
    });
  };
  H['pin-key'] = (el) => MM.pinKey(el.dataset.k);
  H['pin-del'] = () => MM.pinDel();
  H['pin-forgot'] = async () => {
    if (!(await MM.confirm({ title: 'Lupa PIN?', msg: 'Satu-satunya cara adalah menghapus SEMUA data MoneyMe di perangkat ini, lalu mulai dari awal (atau pulihkan dari file backup). Lanjutkan?', ok: 'Hapus semua data', danger: true }))) return;
    await MM.resetAll();
    location.hash = '';
    location.reload();
  };
  H.reset = async () => {
    if (!(await MM.confirm({ title: 'Hapus semua data?', msg: 'Semua transaksi, dompet, kategori, budget, dan PIN akan dihapus permanen dari perangkat ini. Tindakan ini tidak bisa dibatalkan.', ok: 'Hapus semua', danger: true }))) return;
    await MM.resetAll();
    location.hash = '';
    location.reload();
  };

  H.export = async () => {
    const name = 'moneyme-backup-' + MM.today() + '.json';
    const blob = new Blob([JSON.stringify(MM.exportData())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    await MM.set('lastBackup', Date.now());
    MM.render();
    MM.toast('File ' + name + ' disimpan');
  };

  /* ---------- aksi input ---------- */
  const IN = (MM.IN = {});
  IN.amt = (el) => {
    const n = MM.parseAmt(el.value);
    el.value = n ? MM.num(n) : '';
    const k = el.dataset.k;
    if (k === 'tx') V.tx.amount = n; else if (k === 'wd') V.wd.initialBalance = n; else if (k === 'bd') V.bd.amount = n;
  };
  IN['onb-name'] = (el) => (V.onbName = el.value);
  IN['onb-job'] = (el) => (V.onbJob = el.value);
  IN['pf-name'] = (el) => (V.pf.name = el.value);
  IN['pf-job'] = (el) => (V.pf.job = el.value);
  IN['tx-wallet'] = (el) => (V.tx.walletId = el.value);
  IN['tx-to'] = (el) => (V.tx.toWalletId = el.value);
  IN['tx-date'] = (el) => (V.tx.date = el.value);
  IN['tx-note'] = (el) => (V.tx.note = el.value);
  IN['wd-name'] = (el) => (V.wd.name = el.value);
  IN['cd-name'] = (el) => (V.cd.name = el.value);
  IN.hq = (el) => { V.hQ = el.value; V.hLimit = 100; $('#hist').innerHTML = histList(); };
  IN.import = async (el) => {
    const f = el.files && el.files[0];
    el.value = '';
    if (!f) return;
    let d;
    try { d = JSON.parse(await f.text()); } catch (e) { return MM.confirm({ title: 'Gagal membaca file', msg: 'File ini bukan file backup MoneyMe yang valid.', ok: 'OK', cancel: '' }); }
    const err = MM.validateBackup(d);
    if (err) return MM.confirm({ title: 'Tidak bisa dipulihkan', msg: err, ok: 'OK', cancel: '' });
    const n = d.transactions.length;
    if (!(await MM.confirm({ title: 'Pulihkan backup?', msg: 'Berisi ' + n + ' transaksi dan ' + d.wallets.length + ' dompet. ' + (S.settings.onboarded ? 'Semua data saat ini akan diganti.' : ''), ok: 'Pulihkan' }))) return;
    await MM.importData(d);
    MM.applyTheme();
    location.hash = '#/home';
    MM.render();
    MM.toast('Data berhasil dipulihkan');
  };
})();
