/* MoneyBos — core: util, IndexedDB, state, perhitungan */
(function () {
  'use strict';
  const MM = (window.MM = { V: {} });

  /* ---------- util ---------- */
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const nf = new Intl.NumberFormat('id-ID');
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  MM.MS = MS;
  MM.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  MM.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  MM.num = (n) => nf.format(Math.round(n));
  MM.rp = (n) => (n < 0 ? '-' : '') + 'Rp ' + nf.format(Math.abs(Math.round(n)));
  MM.parseAmt = (s) => parseInt(String(s || '').replace(/\D/g, '').slice(0, 12) || '0', 10);
  MM.today = () => ymd(new Date());
  MM.monthOf = (d) => d.slice(0, 7);
  MM.shiftMonth = (m, delta) => {
    let [y, mo] = m.split('-').map(Number);
    mo += delta - 1;
    y += Math.floor(mo / 12);
    mo = ((mo % 12) + 12) % 12;
    return y + '-' + pad(mo + 1);
  };
  MM.monthLabel = (m) => { const [y, mo] = m.split('-'); return MONTHS[mo - 1] + ' ' + y; };
  MM.monthShort = (m) => MS[Number(m.split('-')[1]) - 1];
  MM.dayLabel = (d) => {
    if (d === MM.today()) return 'Hari ini';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (d === ymd(y)) return 'Kemarin';
    const [Y, M, D] = d.split('-').map(Number);
    return DAYS[new Date(Y, M - 1, D).getDay()] + ', ' + D + ' ' + MS[M - 1] + ' ' + Y;
  };
  MM.longDate = () => {
    const n = new Date();
    return DAYS[n.getDay()] + ', ' + n.getDate() + ' ' + MONTHS[n.getMonth()] + ' ' + n.getFullYear();
  };

  /* ---------- IndexedDB ---------- */
  const STORES = ['wallets', 'categories', 'transactions', 'budgets', 'settings'];
  let db;
  function open() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('Browser tidak mendukung penyimpanan lokal (IndexedDB).'));
      const r = indexedDB.open('moneyme', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('wallets', { keyPath: 'id' });
        d.createObjectStore('categories', { keyPath: 'id' });
        const t = d.createObjectStore('transactions', { keyPath: 'id' });
        t.createIndex('date', 'date');
        d.createObjectStore('budgets', { keyPath: 'id' });
        d.createObjectStore('settings', { keyPath: 'key' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error('Gagal membuka penyimpanan.'));
      r.onblocked = () => rej(new Error('Penyimpanan terblokir. Tutup tab MoneyBos lain.'));
    });
  }
  function run(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => res(out ? out.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }

  /* ---------- state ---------- */
  const S = (MM.S = { wallets: [], categories: [], transactions: [], budgets: [], settings: {} });

  MM.load = async () => {
    db = await open();
    for (const st of STORES) {
      const rows = await run(st, 'readonly', (s) => s.getAll());
      if (st === 'settings') { S.settings = {}; rows.forEach((r) => (S.settings[r.key] = r.value)); }
      else S[st] = rows;
    }
  };
  MM.put = async (store, obj) => {
    await run(store, 'readwrite', (s) => s.put(obj));
    const arr = S[store];
    const i = arr.findIndex((x) => x.id === obj.id);
    if (i >= 0) arr[i] = obj; else arr.push(obj);
  };
  MM.remove = async (store, id) => {
    await run(store, 'readwrite', (s) => s.delete(id));
    S[store] = S[store].filter((x) => x.id !== id);
  };
  MM.set = async (key, value) => {
    await run('settings', 'readwrite', (s) => s.put({ key, value }));
    S.settings[key] = value;
  };
  MM.unset = async (key) => {
    await run('settings', 'readwrite', (s) => s.delete(key));
    delete S.settings[key];
  };
  async function replaceAll(store, rows) {
    await run(store, 'readwrite', (s) => { s.clear(); rows.forEach((r) => s.put(r)); });
    S[store] = rows;
  }
  MM.resetAll = async () => {
    for (const st of STORES) await run(st, 'readwrite', (s) => s.clear());
    S.wallets = []; S.categories = []; S.transactions = []; S.budgets = []; S.settings = {};
  };

  /* ---------- seed ---------- */
  const DEF_EXP = [['Makan', '🍜'], ['Kopi', '☕'], ['Jajan', '🍿'], ['Transport', '🚌'], ['Belanja', '🛍️'], ['Tagihan', '🧾'], ['Hiburan', '🎬'], ['Kesehatan', '💊'], ['Pendidikan', '📚'], ['Rumah', '🏠'], ['Lainnya', '📦']];
  const DEF_INC = [['Gaji', '💼'], ['Bonus', '🎁'], ['Usaha', '🏪'], ['Hadiah', '🎉'], ['Lainnya', '💰']];
  MM.seed = async ({ name, job }) => {
    const now = Date.now();
    await replaceAll('wallets', [
      { id: MM.uid(), name: 'Tunai', icon: '💵', initialBalance: 0, archived: false, createdAt: now },
      { id: MM.uid(), name: 'Rekening', icon: '🏦', initialBalance: 0, archived: false, createdAt: now + 1 }
    ]);
    const mk = (type) => ([n, icon]) => ({ id: MM.uid(), type, name: n, icon, archived: false });
    await replaceAll('categories', DEF_EXP.map(mk('expense')).concat(DEF_INC.map(mk('income'))));
    await MM.set('name', name || '');
    await MM.set('job', job || '');
    await MM.set('theme', 'system');
    await MM.set('onboarded', true);
  };

  /* ---------- query & hitung ---------- */
  MM.wallet = (id) => S.wallets.find((w) => w.id === id);
  MM.cat = (id) => S.categories.find((c) => c.id === id);
  MM.activeWallets = () => S.wallets.filter((w) => !w.archived);
  MM.activeCats = (type) => S.categories.filter((c) => c.type === type && !c.archived);

  MM.balances = () => {
    const b = {};
    S.wallets.forEach((w) => (b[w.id] = w.initialBalance || 0));
    for (const t of S.transactions) {
      if (t.type === 'income') b[t.walletId] = (b[t.walletId] || 0) + t.amount;
      else if (t.type === 'expense') b[t.walletId] = (b[t.walletId] || 0) - t.amount;
      else if (t.type === 'transfer') {
        b[t.walletId] = (b[t.walletId] || 0) - t.amount;
        b[t.toWalletId] = (b[t.toWalletId] || 0) + t.amount;
      }
    }
    return b;
  };
  MM.totalBalance = () => {
    const b = MM.balances();
    return MM.activeWallets().reduce((s, w) => s + b[w.id], 0);
  };
  MM.sortTx = (arr) => arr.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  MM.monthTx = (m) => S.transactions.filter((t) => t.date.startsWith(m));
  MM.summary = (m) => {
    let income = 0, expense = 0;
    for (const t of MM.monthTx(m)) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    }
    return { income, expense, net: income - expense };
  };
  MM.spentByCat = (m) => {
    const o = {};
    for (const t of MM.monthTx(m)) if (t.type === 'expense') o[t.categoryId] = (o[t.categoryId] || 0) + t.amount;
    return o;
  };
  MM.budgetOf = (catId) => S.budgets.find((b) => b.categoryId === catId);
  MM.walletUsed = (id) => S.transactions.some((t) => t.walletId === id || t.toWalletId === id);
  MM.catUsed = (id) => S.transactions.some((t) => t.categoryId === id);

  /* ---------- PIN ---------- */
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  MM.hashPin = async (pin, salt, alg) => {
    if (alg === 'pbkdf2') {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
      return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = salt + pin;
    for (let i = 0; i < 2000; i++) h = cyrb53(salt + h + pin, i).toString(36);
    return h;
  };
  MM.setPin = async (pin) => {
    const salt = MM.uid() + MM.uid();
    const alg = window.crypto && crypto.subtle ? 'pbkdf2' : 'simple';
    await MM.set('pinSalt', salt);
    await MM.set('pinAlg', alg);
    await MM.set('pinHash', await MM.hashPin(pin, salt, alg));
  };
  MM.checkPin = async (pin) => (await MM.hashPin(pin, S.settings.pinSalt, S.settings.pinAlg)) === S.settings.pinHash;
  MM.clearPin = async () => { await MM.unset('pinHash'); await MM.unset('pinSalt'); await MM.unset('pinAlg'); };

  /* ---------- backup ---------- */
  MM.exportData = () => ({
    app: 'moneyme', version: 1, exportedAt: new Date().toISOString(),
    wallets: S.wallets, categories: S.categories, transactions: S.transactions, budgets: S.budgets,
    settings: { theme: S.settings.theme || 'system', name: S.settings.name || '', job: S.settings.job || '', photo: S.settings.photo || '' }
  });
  MM.validateBackup = (d) => {
    if (!d || d.app !== 'moneyme') return 'Ini bukan file backup MoneyBos.';
    for (const k of ['wallets', 'categories', 'transactions', 'budgets']) if (!Array.isArray(d[k])) return 'File backup rusak (data ' + k + ' tidak ada).';
    if (!d.wallets.length) return 'File backup tidak berisi dompet.';
    const ids = new Set(d.wallets.map((w) => w.id));
    for (const w of d.wallets) if (!w.id || typeof w.name !== 'string') return 'Data dompet rusak.';
    for (const c of d.categories) if (!c.id || typeof c.name !== 'string' || !['income', 'expense'].includes(c.type)) return 'Data kategori rusak.';
    for (const t of d.transactions) {
      if (!t.id || !['income', 'expense', 'transfer'].includes(t.type) || !Number.isFinite(t.amount) || t.amount <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !ids.has(t.walletId) || (t.type === 'transfer' && !ids.has(t.toWalletId)))
        return 'Ada transaksi yang rusak di file backup.';
      if (!Number.isFinite(t.createdAt)) t.createdAt = Date.now();
    }
    for (const b of d.budgets) if (!b.id || !b.categoryId || !Number.isFinite(b.amount)) return 'Data budget rusak.';
    return null;
  };
  MM.importData = async (d) => {
    await replaceAll('wallets', d.wallets);
    await replaceAll('categories', d.categories);
    await replaceAll('transactions', d.transactions);
    await replaceAll('budgets', d.budgets);
    await MM.set('onboarded', true);
    const st = d.settings || {};
    if (st.theme) await MM.set('theme', st.theme);
    if (typeof st.name === 'string' && st.name) await MM.set('name', st.name.slice(0, 30));
    if (typeof st.job === 'string') await MM.set('job', st.job.slice(0, 40));
    if (typeof st.photo === 'string' && st.photo.length < 400000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(st.photo)) await MM.set('photo', st.photo);
  };

  /* Foto profil: dipotong persegi & diperkecil 256px, disimpan sebagai data URL di IndexedDB (lokal) */
  MM.photoFromFile = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const n = 256, side = Math.min(img.naturalWidth, img.naturalHeight);
      if (!side) { URL.revokeObjectURL(url); return reject(new Error('empty')); }
      const c = document.createElement('canvas'); c.width = c.height = n;
      c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, n, n);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
})();
