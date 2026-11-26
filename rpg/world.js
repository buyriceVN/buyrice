/* Du học Toronto – thế giới: va chạm, tìm đường, camera, vẽ bản đồ & nhân vật */
(function () {
  const R = window.TorontoRPG;
  const TS = R.TS = 48;   // kích thước 1 ô (px logic)

  const THEMES = {
    home: { wall: '#6d5646', wallTop: '#8a705c', wood: '#e8c595', woodLine: '#d9b07a', tile: '#eef1f4', tileLine: '#dde3e9', seat: '#4b7bec' },
    airport: { wall: '#8796a5', wallTop: '#a9b6c3', wood: '#e8c595', woodLine: '#d9b07a', tile: '#eef2f6', tileLine: '#dbe2ea', seat: '#3867d6' },
    plane: { wall: '#c9d1da', wallTop: '#e1e6ec', wood: '#dfe3e8', woodLine: '#d1d6dc', tile: '#e8ebef', tileLine: '#d6dbe1', seat: '#2c3e9e' },
    customs: { wall: '#6f7f8f', wallTop: '#93a2b1', wood: '#e8c595', woodLine: '#d9b07a', tile: '#f1f3f5', tileLine: '#dfe3e8', seat: '#2d3436' },
    toronto: { wall: '#6b5747', wallTop: '#8b7563', wood: '#caa27a', woodLine: '#b98f66', tile: '#eef2f6', tileLine: '#dbe2ea', seat: '#636e72' },
    pearson: { wall: '#8796a5', wallTop: '#a9b6c3', wood: '#e8c595', woodLine: '#d9b07a', tile: '#f1f4f7', tileLine: '#dbe2ea', seat: '#2d6a9f', summer: 1 },
    street: { wall: '#8b5e4a', wallTop: '#a8775f', wood: '#d9b48a', woodLine: '#c49b6e', tile: '#f0ede6', tileLine: '#ddd6c9', seat: '#c0392b', summer: 1 },
    tims: { wall: '#8e1b1f', wallTop: '#b3262c', wood: '#c9a27a', woodLine: '#b48d66', tile: '#f4ede3', tileLine: '#e3d7c8', seat: '#b3262c', summer: 1 },
    condo: { wall: '#7c8a96', wallTop: '#9aa7b2', wood: '#ddbb92', woodLine: '#cba67b', tile: '#eef1f4', tileLine: '#dde3e9', seat: '#5b7db1', summer: 1 },
    downtown: { wall: '#9a8a74', wallTop: '#b5a58e', wood: '#c9a27a', woodLine: '#b48d66', tile: '#ece8dc', tileLine: '#d8d1bf', seat: '#c0392b', summer: 1 }
  };

  R.THEMES = THEMES;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  R.rr = rr;
  const FONT = (w, z) => w + ' ' + z + 'px "Be Vietnam Pro", system-ui, sans-serif';
  R.FONT = FONT;
  function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }

  /* ---------- thế giới ---------- */
  R.World = function (ch) {
    const map = ch.map, H = map.length, W = map[0].length;
    const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W) ? ' ' : map[y][x];
    const solid = (x, y) => R.SOLID.has(at(x, y));
    const npcs = ch.npcs.map(n => Object.assign({}, n, { px: n.x + 0.5, py: n.y + 0.5, hx: n.x, hy: n.y, tx: null, ty: null, wait: 1 + Math.random() * 3, face: 1, t: Math.random() * 10, moving: false }));
    return { ch, map, W, H, at, solid, npcs };
  };

  /* va chạm hình tròn với ô tường */
  R.blocked = function (world, x, y, r) {
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) if (world.solid(Math.floor(x + dx), Math.floor(y + dy))) return true;
    return false;
  };

  /* tìm đường BFS 8 hướng; goalFn(tx,ty) → true khi tới đích */
  R.findPath = function (world, sx, sy, goalFn, avoid) {
    const W = world.W, H = world.H, key = (x, y) => y * W + x, prev = new Int32Array(W * H).fill(-2);
    const q = [[sx, sy]]; prev[key(sx, sy)] = -1; let end = null, head = 0;
    const free = (x, y) => !world.solid(x, y) && !(avoid && avoid.has(key(x, y)));
    while (head < q.length) {
      const [x, y] = q[head++];
      if (goalFn(x, y)) { end = [x, y]; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[key(nx, ny)] !== -2 || !free(nx, ny)) continue;
        if (dx && dy && (!free(x + dx, y) || !free(x, y + dy))) continue;
        prev[key(nx, ny)] = key(x, y); q.push([nx, ny]);
      }
      if (q.length > 4000) break;
    }
    if (!end) return null;
    const path = []; let k = key(end[0], end[1]);
    while (k !== -1 && prev[k] !== -1) { path.unshift([k % W + 0.5, Math.floor(k / W) + 0.5]); k = prev[k]; }
    return path;
  };

  /* ---------- vẽ bản đồ tĩnh (vẽ 1 lần vào canvas phụ) ---------- */
  R.renderMap = function (world, scale, floorOnly) {
    const ch = world.ch, th = THEMES[ch.theme] || THEMES.home, W = world.W, H = world.H;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(W * TS * scale); cv.height = Math.ceil(H * TS * scale);
    const c = cv.getContext('2d'); c.scale(scale, scale);
    const floorOf = (x, y) => { // sàn bên dưới đồ vật: lấy theo ô sàn gần nhất
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const t = world.at(x + dx, y + dy); if (R.FLOOR_T.includes(t) && t !== ' ') return t === 'R' ? '.' : t === 'k' ? ',' : t; }
      return ',';
    };
    function floor(t, x, y) {
      const X = x * TS, Y = y * TS;
      if (t === '.') { c.fillStyle = th.wood; c.fillRect(X, Y, TS, TS); c.fillStyle = th.woodLine; c.fillRect(X, Y + TS / 2 - 1, TS, 2); c.fillRect(X + ((y % 2) ? TS * 0.3 : TS * 0.7), Y, 2, TS / 2); c.fillRect(X + ((y % 2) ? TS * 0.75 : TS * 0.2), Y + TS / 2, 2, TS / 2); }
      else if (t === ',') { c.fillStyle = (x + y) % 2 ? th.tile : shade(th.tile, -6); c.fillRect(X, Y, TS, TS); c.strokeStyle = th.tileLine; c.lineWidth = 1; c.strokeRect(X + .5, Y + .5, TS - 1, TS - 1); }
      else if (t === ':') { c.fillStyle = '#bdb6a8'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#a9a294'; for (let i = 0; i < 4; i++) c.fillRect(X + hash(x, y + i) * TS, Y + hash(x + i, y) * TS, 4, 3); }
      else if (t === '~') { c.fillStyle = '#f6faff'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#dbe9f7'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(X + hash(x, y + i * 7) * TS, Y + hash(x + i * 3, y) * TS, 2.5, 0, 7); c.fill(); } }
      else if (t === '_') { c.fillStyle = '#3949ab'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#5c6bc0'; c.fillRect(X, Y + 4, TS, 3); c.fillRect(X, Y + TS - 7, TS, 3); }
      else if (t === 'a' || t === 'e') { c.fillStyle = '#5d6168'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#676b72'; for (let i = 0; i < 3; i++) c.fillRect(X + hash(x, y + i) * TS, Y + hash(x + i, y) * TS, 3, 3); if (t === 'e' && x % 2 === 0) { c.fillStyle = '#f5f5f0'; c.fillRect(X + 6, Y + TS / 2 - 2, TS - 12, 4); } }
      else if (t === 'z') { c.fillStyle = '#5d6168'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#f5f5f0'; for (let i = 0; i < 3; i++) c.fillRect(X + 4 + i * 15, Y, 8, TS); }
      else if (t === 'w') { c.fillStyle = '#d9d6cf'; c.fillRect(X, Y, TS, TS); c.strokeStyle = '#c4c0b7'; c.lineWidth = 1.5; c.strokeRect(X + .75, Y + .75, TS - 1.5, TS - 1.5); }
      else if (t === 'g') { c.fillStyle = '#7cb85f'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#6aa64f'; for (let i = 0; i < 5; i++) c.fillRect(X + hash(x, y + i) * TS, Y + hash(x + i, y) * TS, 3, 5); }
      else if (t === 'k') { c.fillStyle = th.tile; c.fillRect(X, Y, TS, TS); c.fillStyle = '#f4c20d'; c.fillRect(X, Y + TS - 14, TS, 14); c.fillStyle = '#d9a90b'; for (let i = 0; i < 6; i++) c.fillRect(X + 3 + i * 8, Y + TS - 11, 3, 3); }
      else if (t === 'Z') { c.fillStyle = '#3d8fd6'; c.fillRect(X, Y, TS, TS); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.beginPath(); const oy = (x % 2) * 10; c.moveTo(X + 4, Y + 16 + oy); c.quadraticCurveTo(X + 14, Y + 10 + oy, X + 24, Y + 16 + oy); c.quadraticCurveTo(X + 34, Y + 22 + oy, X + 44, Y + 16 + oy); c.stroke(); }
      else if (t === 'X') { c.fillStyle = '#3b3b3b'; c.fillRect(X, Y, TS, TS); c.fillStyle = '#6d4c41'; for (let i = 0; i < 3; i++) c.fillRect(X + i * 16 + 3, Y + 6, 8, TS - 12); c.fillStyle = '#b0b7bf'; c.fillRect(X, Y + 12, TS, 3); c.fillRect(X, Y + TS - 15, TS, 3); }
      else if (t === 'R') { c.fillStyle = '#c0392b'; c.fillRect(X, Y, TS, TS); c.strokeStyle = '#f5c542'; c.lineWidth = 3; c.strokeRect(X + 6, Y + 6, TS - 12, TS - 12); }
      else { c.fillStyle = th.tile; c.fillRect(X, Y, TS, TS); }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = world.at(x, y), X = x * TS, Y = y * TS;
      if (t === ' ') { c.fillStyle = ch.theme === 'toronto' ? '#e9f2fb' : ch.theme === 'plane' ? '#7fb2e5' : th.summer ? '#7cb85f' : '#2d3a2e'; c.fillRect(X, Y, TS, TS); if (ch.theme !== 'toronto' && ch.theme !== 'plane' && !th.summer) { c.fillStyle = '#3c4b3d'; c.fillRect(X + hash(x, y) * 30, Y + hash(y, x) * 30, 10, 10); } continue; }
      if (R.FLOOR_T.includes(t)) { floor(t, x, y); continue; }
      if (floorOnly) { floor((t === 'Z' || t === 'X') ? t : t === 'D' ? floorOf(x, y) : (t === '#' || t === 'W') ? ',' : floorOf(x, y), x, y); continue; }
      if (t === '#' || t === 'W') {
        c.fillStyle = th.wall; c.fillRect(X, Y, TS, TS); c.fillStyle = th.wallTop; c.fillRect(X, Y, TS, TS * 0.35);
        c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(X, Y + TS - 4, TS, 4);
        if (t === 'W') { c.fillStyle = ch.theme === 'plane' ? '#8fd0ff' : '#bfe6ff'; rr(c, X + 8, Y + 8, TS - 16, TS - 18, ch.theme === 'plane' ? 12 : 3); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
        continue;
      }
      floor(floorOf(x, y), x, y);
      if (t === 'D') { c.fillStyle = '#7b5a3c'; c.fillRect(X + 4, Y + 4, TS - 8, TS - 8); c.fillStyle = '#a47b52'; c.fillRect(X + 8, Y + 8, TS - 16, TS - 16); c.fillStyle = '#e8d3a7'; c.font = FONT(700, 10); c.textAlign = 'center'; c.fillText('⇆', X + TS / 2, Y + TS / 2 + 4); }
      else if (t === '=') { c.fillStyle = '#6d4c41'; c.fillRect(X, Y + 10, TS, TS - 10); c.fillStyle = '#a1887f'; c.fillRect(X, Y + 6, TS, 12); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(X, Y + TS - 4, TS, 4); }
      else if (t === 'S') { c.fillStyle = shade(th.seat, -25); rr(c, X + 6, Y + 4, TS - 12, TS - 8, 8); c.fill(); c.fillStyle = th.seat; rr(c, X + 9, Y + 14, TS - 18, TS - 20, 6); c.fill(); }
      else if (t === 'T') { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(X + TS / 2, Y + TS * .62, TS * .38, TS * .2, 0, 0, 7); c.fill(); c.fillStyle = '#8d6e63'; c.beginPath(); c.arc(X + TS / 2, Y + TS / 2, TS * .36, 0, 7); c.fill(); c.fillStyle = '#a1887f'; c.beginPath(); c.arc(X + TS / 2, Y + TS / 2 - 2, TS * .3, 0, 7); c.fill(); }
      else if (t === 'P') { const fl0 = floorOf(x, y), big = fl0 === ':' || fl0 === '~'; if (!big) { c.fillStyle = '#b5651d'; rr(c, X + 14, Y + 26, TS - 28, TS - 30, 4); c.fill(); } c.fillStyle = '#2e8b57'; c.beginPath(); c.arc(X + TS / 2, Y + TS * (big ? .45 : .38), TS * (big ? .42 : .3), 0, 7); c.fill(); c.fillStyle = '#3cb371'; c.beginPath(); c.arc(X + TS * .42, Y + TS * (big ? .38 : .32), TS * (big ? .24 : .16), 0, 7); c.fill(); if (fl0 === '~') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(X + TS / 2, Y + TS * .2, TS * .22, TS * .1, 0, 0, 7); c.fill(); } }
      else if (t === 'B') { c.fillStyle = ch.theme === 'toronto' && floorOf(x, y) === '~' ? '#795548' : '#4b7bec'; rr(c, X + 2, Y + 8, TS - 4, TS - 14, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; rr(c, X + 6, Y + 12, TS - 12, 10, 5); c.fill(); }
      else if (t === 'K') { c.fillStyle = '#95a5a6'; rr(c, X + 8, Y + 4, TS - 16, TS - 8, 6); c.fill(); c.fillStyle = '#2d3436'; rr(c, X + 12, Y + 9, TS - 24, 16, 3); c.fill(); c.fillStyle = '#74b9ff'; c.fillRect(X + 14, Y + 11, TS - 28, 12); }
      else if (t === 'L') { c.fillStyle = '#555'; c.fillRect(X, Y + 10, TS, TS - 20); c.fillStyle = '#777'; for (let i = 0; i < 4; i++) c.fillRect(X + i * 12 + 2, Y + 12, 8, TS - 24); if ((x + y) % 2 === 0) { c.fillStyle = ['#e17055', '#6c5ce7', '#00b894'][(x * 7 + y) % 3]; rr(c, X + 12, Y + 6, 24, 30, 5); c.fill(); } }
      else if (t === 'Q') { c.strokeStyle = '#d63031'; c.lineWidth = 4; c.beginPath(); c.moveTo(X, Y + TS / 2); c.lineTo(X + TS, Y + TS / 2); c.stroke(); c.fillStyle = '#b2bec3'; c.beginPath(); c.arc(X + TS / 2, Y + TS / 2, 7, 0, 7); c.fill(); c.fillStyle = '#636e72'; c.beginPath(); c.arc(X + TS / 2, Y + TS / 2, 4, 0, 7); c.fill(); }
      else if (t === 'O') { c.fillStyle = '#b2bec3'; c.fillRect(X, Y, TS, TS); }
    }
    if (floorOnly) return cv;
    // tháp CN mini (2x2 ô 'O')
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (world.at(x, y) === 'O' && world.at(x - 1, y) !== 'O' && world.at(x, y - 1) !== 'O') {
      const cx = (x + 1) * TS, cy = (y + 1) * TS; c.fillStyle = '#95a5a6'; c.beginPath(); c.arc(cx, cy, TS * .9, 0, 7); c.fill(); c.strokeStyle = '#636e72'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#7f8c8d'; c.beginPath(); c.arc(cx, cy, TS * .5, 0, 7); c.fill(); c.fillStyle = '#dfe6e9'; c.beginPath(); c.arc(cx, cy, TS * .22, 0, 7); c.fill(); c.fillStyle = '#d63031'; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill();
    }
    // nhãn ghế, biển hiệu
    (ch.labels || []).forEach(l => { c.font = FONT(700, 10); c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(l.text, l.x * TS + TS / 2, l.y * TS + TS / 2 + 7); });
    (ch.signs || []).forEach(s => {
      c.font = FONT(800, s.small ? 12 : 15); c.textAlign = 'center'; const w = c.measureText(s.text).width + 16, X = s.x * TS + TS / 2 - w / 2, Y = s.y * TS + 6;
      c.fillStyle = s.small ? 'rgba(255,255,255,.92)' : '#1e3a6b'; rr(c, X, Y, w, s.small ? 20 : 26, 6); c.fill(); c.fillStyle = s.small ? '#2d3436' : '#fff'; c.fillText(s.text, X + w / 2, Y + (s.small ? 14.5 : 18));
    });
    return cv;
  };
  function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, v + amt)); return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0'); }

  /* ---------- vẽ người (NPC) ---------- */
  R.drawPerson = function (c, L, x, y, t, moving, face) {
    const k = (L.small ? 0.8 : 1) * TS / 48, bob = moving ? Math.abs(Math.sin(t * 9)) * 3 : Math.sin(t * 2) * 0.8;
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 0, 15 * k, 5 * k, 0, 0, 7); c.fill();
    if (L.dog) { // chó nghiệp vụ
      const dx = 20 * k * (face < 0 ? -1 : 1); c.fillStyle = '#c68642'; rr(c, dx - 10 * k, -14 * k, 20 * k, 11 * k, 5 * k); c.fill(); c.beginPath(); c.arc(dx + 9 * k * (face < 0 ? -1 : 1), -16 * k, 6 * k, 0, 7); c.fill(); c.fillStyle = '#5d3a1a'; c.beginPath(); c.ellipse(dx + 7 * k * (face < 0 ? -1 : 1), -20 * k, 3 * k, 5 * k, 0, 0, 7); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(dx + 13 * k * (face < 0 ? -1 : 1), -16 * k, 1.5 * k, 0, 7); c.fill();
    }
    c.translate(0, -bob);
    const leg = moving ? Math.sin(t * 9) * 3 * k : 0;
    c.fillStyle = '#2d3436'; c.fillRect(-8 * k, -9 * k + leg, 6 * k, 9 * k - leg); c.fillRect(2 * k, -9 * k - leg, 6 * k, 9 * k + leg);
    // thân
    c.fillStyle = L.shirt; c.strokeStyle = '#222'; c.lineWidth = 2; rr(c, -14 * k, -34 * k, 28 * k, 27 * k, 10 * k); c.fill(); c.stroke();
    if (L.style === 'moose') { c.fillStyle = '#d2b48c'; rr(c, -8 * k, -28 * k, 16 * k, 16 * k, 6 * k); c.fill(); }
    if (L.plaid) { c.save(); rr(c, -14 * k, -34 * k, 28 * k, 27 * k, 10 * k); c.clip(); c.fillStyle = 'rgba(0,0,0,.22)'; for (let i = -14; i < 14; i += 7) c.fillRect(i * k, -34 * k, 2.5 * k, 27 * k); for (let j = -34; j < -7; j += 7) c.fillRect(-14 * k, j * k, 28 * k, 2.5 * k); c.restore(); c.strokeStyle = '#222'; c.lineWidth = 2; rr(c, -14 * k, -34 * k, 28 * k, 27 * k, 10 * k); c.stroke(); }
    if (L.num) { c.fillStyle = L.numColor || '#fff'; c.font = FONT(800, 11 * k); c.textAlign = 'center'; c.fillText(L.num, 0, -16 * k); }
    if (L.tote) { c.fillStyle = L.tote; rr(c, 9 * k, -26 * k, 10 * k, 13 * k, 2 * k); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 1.5; c.stroke(); }
    if (L.apron) { c.fillStyle = '#f1ede4'; rr(c, -9 * k, -28 * k, 18 * k, 20 * k, 3 * k); c.fill(); c.stroke(); }
    if (L.scarf) { c.fillStyle = L.scarf; c.beginPath(); c.moveTo(-8 * k, -34 * k); c.lineTo(8 * k, -34 * k); c.lineTo(0, -24 * k); c.closePath(); c.fill(); }
    if (L.lanyard) { c.strokeStyle = '#e74c3c'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6 * k, -34 * k); c.lineTo(0, -22 * k); c.lineTo(6 * k, -34 * k); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-4 * k, -23 * k, 8 * k, 9 * k); }
    if (L.badge) { c.fillStyle = '#f1c40f'; c.fillRect(5 * k, -29 * k, 5 * k, 4 * k); }
    if (L.guitar) { c.fillStyle = '#d35400'; c.beginPath(); c.ellipse(-12 * k, -18 * k, 9 * k, 7 * k, -0.5, 0, 7); c.fill(); c.fillStyle = '#6e2c00'; c.fillRect(-6 * k, -32 * k, 3 * k, 16 * k); }
    if (L.sign) { c.fillStyle = '#fff'; c.strokeStyle = '#222'; c.lineWidth = 1.5; rr(c, -20 * k, -30 * k, 40 * k, 14 * k, 3); c.fill(); c.stroke(); c.fillStyle = '#d63031'; c.font = FONT(800, 7 * k); c.textAlign = 'center'; c.fillText(L.sign, 0, -20 * k); }
    // đầu
    const hy = -46 * k, r = 13 * k;
    if (L.style === 'bun') { c.fillStyle = L.hair; c.beginPath(); c.arc(0, hy - r, r * .45, 0, 7); c.fill(); }
    if (L.style === 'pigtails') { c.fillStyle = L.hair; c.beginPath(); c.arc(-r * 1.05, hy, r * .38, 0, 7); c.arc(r * 1.05, hy, r * .38, 0, 7); c.fill(); }
    if (L.style === 'ponytail') { c.fillStyle = L.hair; c.beginPath(); c.ellipse(-face * r * 1.0, hy + r * .2, r * .3, r * .7, 0, 0, 7); c.fill(); }
    if (L.style === 'long') { c.fillStyle = L.hair; rr(c, -r * 1.05, hy - r * .4, r * 2.1, r * 1.7, r * .6); c.fill(); }
    if (L.style === 'moose') { c.strokeStyle = '#d2b48c'; c.lineWidth = 4 * k; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * .6, hy - r * .8); c.lineTo(-r * 1.6, hy - r * 1.6); c.moveTo(-r * 1.2, hy - r * 1.2); c.lineTo(-r * 1.5, hy - r * .8); c.moveTo(r * .6, hy - r * .8); c.lineTo(r * 1.6, hy - r * 1.6); c.moveTo(r * 1.2, hy - r * 1.2); c.lineTo(r * 1.5, hy - r * .8); c.stroke(); }
    c.fillStyle = L.skin; c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.arc(0, hy, r, 0, 7); c.fill(); c.stroke();
    if (L.style === 'conical') { c.fillStyle = '#f5deb3'; c.beginPath(); c.moveTo(-r * 1.5, hy - r * .35); c.lineTo(0, hy - r * 1.7); c.lineTo(r * 1.5, hy - r * .35); c.closePath(); c.fill(); c.stroke(); }
    else if (L.style === 'cap') { c.fillStyle = L.cap; c.beginPath(); c.arc(0, hy - r * .15, r * 1.02, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = '#111'; c.fillRect(-r * 1.1 + face * r * .3, hy - r * .25, r * 2.2, r * .22); if (L.badge) { c.fillStyle = '#f1c40f'; c.beginPath(); c.arc(0, hy - r * .6, 2.5 * k, 0, 7); c.fill(); } }
    else if (L.style === 'beanie') { c.fillStyle = L.beanie; c.beginPath(); c.arc(0, hy - r * .1, r * 1.02, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, hy - r * 1.1, 3.5 * k, 0, 7); c.fill(); }
    else if (L.style !== 'moose') { c.fillStyle = L.hair; c.beginPath(); c.arc(0, hy - r * .1, r * 1.0, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(r * .3, hy - r * .45); c.closePath(); c.fill(); }
    if (L.beard) { c.fillStyle = L.hair; c.globalAlpha = .8; c.beginPath(); c.arc(0, hy + r * .25, r * .75, 0.15 * Math.PI, 0.85 * Math.PI); c.fill(); c.globalAlpha = 1; }
    const ex = face * r * .18; c.fillStyle = '#222';
    c.beginPath(); c.arc(-r * .35 + ex, hy + r * .05, 1.8 * k, 0, 7); c.arc(r * .35 + ex, hy + r * .05, 1.8 * k, 0, 7); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = 1.6; c.beginPath(); c.arc(ex, hy + r * .3, r * .28, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    if (L.shades) { c.fillStyle = '#222'; rr(c, -r * .62 + ex, hy - r * .12, r * .52, r * .3, 3); c.fill(); rr(c, r * .1 + ex, hy - r * .12, r * .52, r * .3, 3); c.fill(); c.fillRect(-r * .12 + ex, hy - r * .06, r * .24, 2); }
    if (L.headset) { c.strokeStyle = '#222'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, hy - r * .1, r * 1.08, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.fillStyle = '#222'; c.beginPath(); c.arc(-r * 1.02, hy + r * .1, 3.5 * k, 0, 7); c.fill(); }
    if (L.glasses) { c.lineWidth = 1.5; c.beginPath(); c.arc(-r * .35 + ex, hy + r * .05, r * .26, 0, 7); c.moveTo(r * .61 + ex, hy + r * .05); c.arc(r * .35 + ex, hy + r * .05, r * .26, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(255,120,120,.35)'; c.beginPath(); c.arc(-r * .6, hy + r * .35, r * .15, 0, 7); c.arc(r * .6, hy + r * .35, r * .15, 0, 7); c.fill();
    c.restore();
  };

  /* ---------- vẽ vật tương tác (máy, ghế, điện thoại) ---------- */
  R.drawObject = function (c, o, x, y, t, glow) {
    if (o.kind === 'phone') { c.save(); c.translate(x, y - 14); c.rotate(Math.sin(t * 6) * (glow ? .15 : 0)); c.fillStyle = '#222'; rr(c, -7, -12, 14, 24, 3); c.fill(); c.fillStyle = '#74b9ff'; c.fillRect(-5, -9, 10, 16); c.restore(); }
    if (glow) { c.save(); c.strokeStyle = 'rgba(255,193,7,' + (0.55 + Math.sin(t * 5) * .35) + ')'; c.lineWidth = 4; rr(c, x - TS / 2 + 3, y - TS / 2 + 3 - (o.kind === 'phone' ? 0 : 0), TS - 6, TS - 6, 10); c.stroke(); c.restore(); }
  };
})();
