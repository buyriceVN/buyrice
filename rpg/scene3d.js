/* Du học Toronto – dựng không gian 3D góc nhìn thứ nhất cho từng chương (Three.js) */
(function () {
  const R = window.TorontoRPG;
  const WALL_H = 2.7, EYE = 1.5;
  R.EYE = EYE;
  const SKY = { home: 0xbfe6ff, airport: 0xbfe6ff, plane: 0x8fc8ff, customs: 0xcfd8e3, toronto: 0xdfeaf5, pearson: 0x9fd8ff, street: 0x8fd3ff, tims: 0x9fd8ff, condo: 0x9fd8ff, downtown: 0x8fd3ff };
  const WALL3D = { home: ['#efe2cc', '#c9a27a'], airport: ['#e6ecf2', '#9fb0c2'], plane: ['#eef1f5', '#c9d1da'], customs: ['#e4e9ef', '#8b9bab'], toronto: ['#eadccb', '#a88b6e'],
    pearson: ['#eef2f6', '#9fb0c2'], street: ['#c98f6e', '#7a4f3c'], tims: ['#f3e6d6', '#b3262c'], condo: ['#f1eee8', '#8d99a6'], downtown: ['#e8dfcf', '#8a7a64'] };
  const GROUND = { home: 0x6f8f5a, airport: 0x8a8f96, plane: 0x8fc8ff, customs: 0x9aa3ad, toronto: 0xf4f8fc, pearson: 0x7fa86a, street: 0x7fb069, tims: 0x7fb069, condo: 0x7fb069, downtown: 0x7fb069 };

  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  function textTex(text, o) {
    o = o || {}; const z = o.size || 40, pad = 18;
    const m = document.createElement('canvas').getContext('2d'); m.font = '800 ' + z + 'px "Be Vietnam Pro", system-ui, sans-serif';
    const w = Math.ceil(m.measureText(text).width + pad * 2), h = Math.ceil(z * 1.6);
    const tex = canvasTex(w, h, (c) => { c.fillStyle = o.bg || '#1e3a6b'; R.rr(c, 2, 2, w - 4, h - 4, o.radius == null ? 14 : o.radius); c.fill(); if (o.border) { c.strokeStyle = o.border; c.lineWidth = 4; c.stroke(); } if (o.stripe) { c.fillStyle = o.stripe; c.fillRect(8, 6, w - 16, Math.max(4, h * 0.09)); } c.fillStyle = o.color || '#fff'; c.font = '800 ' + z + 'px "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 2); });
    tex.userData = { aspect: w / h }; return tex;
  }
  R.textTex = textTex;
  function spriteOf(tex, height) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(height * (tex.userData.aspect || 1), height, 1); return s; }
  R.spriteOf = spriteOf;

  /* nhân vật NPC: vẽ 2D (dùng hàm vẽ có sẵn) thành ảnh đứng, luôn quay mặt về phía người chơi */
  function personTex(look) {
    const W = 160, H = 196;
    const tex = canvasTex(W, H, (c) => { c.translate(W / 2, H - 6); c.scale(2.9, 2.9); R.drawPerson(c, look, 0, 0, 0, false, 0); });
    tex.userData = { aspect: W / H }; return tex;
  }

  function add2(g, geo, m, x, y, z, sx, sy, sz) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (sx != null) o.scale.set(sx, sy, sz); g.add(o); return o; }
  const M3 = {}; const lam = (k, c, e) => M3[k] || (M3[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, e || {})));
  /* xe hơi kiểu sticker: thân, cabin, cửa kính, 4 bánh */
  function buildCar(g, n) {
    const B = new THREE.BoxGeometry(1, 1, 1), col = n.color || 0x6c7a89, parts = [];
    parts.push(add2(g, B, lam('car' + col, col), 0, 0.55, 0, 2.5, 0.6, 1.25));
    parts.push(add2(g, B, lam('car' + col, col), -0.1, 1.05, 0, 1.4, 0.5, 1.15));
    parts.push(add2(g, B, lam('glass', 0x9fd6ff), -0.1, 1.06, 0, 1.42, 0.36, 1.17));
    const wg = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14); [[-0.8, 0.62], [0.8, 0.62], [-0.8, -0.62], [0.8, -0.62]].forEach(([x, z]) => { const w = add2(g, wg, lam('tyre', 0x222222), x, 0.28, z); w.rotation.x = Math.PI / 2; parts.push(w); });
    parts.push(add2(g, B, lam('lightF', 0xfff6c2, { emissive: 0x806f2a }), 1.26, 0.6, 0.4, 0.04, 0.14, 0.24)); parts.push(add2(g, B, lam('lightF', 0xfff6c2, { emissive: 0x806f2a }), 1.26, 0.6, -0.4, 0.04, 0.14, 0.24));
    if (n.plate) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.17), new THREE.MeshBasicMaterial({ map: R.textTex(n.plate, { bg: '#ffffff', color: '#1d3f8a', size: 40, radius: 6, border: '#1d3f8a' }), side: THREE.DoubleSide })); p.position.set(-1.26, 0.55, 0); p.rotation.y = -Math.PI / 2; g.add(p); parts.push(p);
      const p2 = p.clone(); p2.position.set(1.27, 0.42, 0); p2.rotation.y = Math.PI / 2; g.add(p2); parts.push(p2); }
    if (n.roof) { const s = spriteOf(R.textTex(n.roof, { bg: '#111', color: '#fff', size: 30, radius: 8 }), 0.2); s.position.set(-0.1, 1.5, 0); g.add(s); }
    if (n.ry) parts.forEach(o => { o.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), n.ry); o.rotation.y += n.ry; });
  }
  /* lối vào ga tàu điện ngầm kiểu TTC (vẽ lại theo ảnh tham khảo ga Finch): khối gạch men màu be, mái hắt trắng,
     biển đen viền vàng có tên ga, cửa kính sọc đỏ, và mái vòm kính che cầu thang xuống ga */
  function buildEntrance(g, n) {
    const B = new THREE.BoxGeometry(1, 1, 1), name = n.station || 'Finch';
    const tile = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#d8c6a0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b9a77f'; c.lineWidth = 2; for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x <= w; x += 32) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 16); c.stroke(); } });
    tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(2, 2);
    add2(g, B, new THREE.MeshLambertMaterial({ map: tile }), 1.3, 1.25, 0, 3.0, 2.5, 1.8);
    add2(g, B, lam('roofW', 0xf4f4f2), 1.3, 2.62, 0.15, 3.5, 0.32, 2.3);
    const signT = R.textTex(name + '   🚇 🚌', { bg: '#1c1c1c', color: '#ffffff', size: 44, radius: 4, stripe: '#f4c20d' });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9 / signT.userData.aspect), new THREE.MeshBasicMaterial({ map: signT })); sign.position.set(1.6, 2.08, 0.915); g.add(sign);
    const door = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#cfe3ee'; c.fillRect(0, 0, w, h); c.strokeStyle = '#9aa6ad'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke(); c.fillStyle = '#d63031'; c.fillRect(0, h * 0.42, w, 8); c.fillStyle = 'rgba(40,40,40,.55)'; c.fillRect(w * 0.18, h * 0.6, w * 0.12, h * 0.36); });
    const dr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), new THREE.MeshBasicMaterial({ map: door })); dr.position.set(1.65, 0.8, 0.915); g.add(dr);
    // mái vòm kính che cầu thang
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.6, 20, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshLambertMaterial({ color: 0xa9d4ea, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    arch.rotation.x = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.rotation.z = Math.PI / 2; arch.position.set(-1.3, 1.55, 0.1); g.add(arch);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 6, 20, Math.PI), lam('archF', 0x6d5644)); ring.position.set(-1.3, 1.55, 0.9); g.add(ring);
    add2(g, B, lam('archW', 0xc9b48c), -2.0, 0.75, 0.1, 0.12, 1.5, 1.6); add2(g, B, lam('archW', 0xc9b48c), -0.6, 0.75, 0.1, 0.12, 1.5, 1.6);
    add2(g, B, lam('stairs', 0x4a4a4a), -1.3, 0.02, 0.1, 1.2, 0.04, 1.5);
    const s2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2 / signT.userData.aspect), new THREE.MeshBasicMaterial({ map: signT })); s2.position.set(-1.3, 1.55, 0.97); g.add(s2);
  }
  /* xe buýt TTC (vẽ lại theo ảnh tham khảo): mái đỏ, sọc trắng, dải cửa kính tối, thân dưới đỏ, bảng LED cam ở đầu xe */
  function buildBus(g, n) {
    const B = new THREE.BoxGeometry(1, 1, 1), L = 4.6, Wd = 1.25, H = 1.55, route = n.route || '39 FINCH EAST';
    const side = canvasTex(512, 160, (c, w, h) => {
      c.fillStyle = '#d7262e'; c.fillRect(0, 0, w, h);                       // đỏ
      c.fillStyle = '#ffffff'; c.fillRect(0, h * 0.16, w, h * 0.07);          // sọc trắng dưới mái
      c.fillStyle = '#1d2329'; c.fillRect(0, h * 0.24, w, h * 0.38);          // dải kính tối
      c.strokeStyle = '#3a434c'; c.lineWidth = 4; for (let x = 70; x < w; x += 72) { c.beginPath(); c.moveTo(x, h * 0.24); c.lineTo(x, h * 0.62); c.stroke(); }
      c.fillStyle = '#ffffff'; c.fillRect(0, h * 0.63, w, h * 0.08);          // sọc trắng giữa thân
      c.fillStyle = '#b81f26'; c.fillRect(0, h * 0.9, w, h * 0.1);
      c.fillStyle = '#9aa3ab'; c.fillRect(w * 0.06, h * 0.24, w * 0.08, h * 0.66);   // cửa trước
      c.fillRect(w * 0.52, h * 0.24, w * 0.08, h * 0.66);                               // cửa sau
    });
    const front = canvasTex(256, 200, (c, w, h) => {
      c.fillStyle = '#d7262e'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#111'; c.fillRect(w * 0.06, h * 0.04, w * 0.88, h * 0.16);
      c.fillStyle = '#ffb020'; c.font = '800 26px ui-monospace,Menlo,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(route, w / 2, h * 0.125);
      c.fillStyle = '#26313a'; c.fillRect(w * 0.06, h * 0.22, w * 0.88, h * 0.4);
      c.fillStyle = '#ffffff'; c.fillRect(0, h * 0.64, w, h * 0.06);
      c.fillStyle = '#fff6c2'; c.fillRect(w * 0.08, h * 0.74, w * 0.16, h * 0.07); c.fillRect(w * 0.76, h * 0.74, w * 0.16, h * 0.07);
      c.fillStyle = '#222'; c.fillRect(0, h * 0.88, w, h * 0.12);
    });
    const sideM = new THREE.MeshLambertMaterial({ map: side }), frontM = new THREE.MeshLambertMaterial({ map: front }), red = lam('busRed', 0xc8232b);
    // hộp thân xe: [+x đầu xe, -x đuôi, +y mái, -y gầm, +z hông, -z hông]
    const body = new THREE.Mesh(B, [frontM, red, red, lam('tyre', 0x222222), sideM, sideM]); body.scale.set(L, H, Wd); body.position.set(0, 0.32 + H / 2, 0); g.add(body);
    add2(g, B, lam('busRoof', 0xd02a32), -0.3, 0.32 + H + 0.06, 0, L * 0.7, 0.12, Wd * 0.8);
    const wg = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14); [[1.45, 0.6], [1.45, -0.6], [-1.3, 0.6], [-1.3, -0.6]].forEach(([x, z]) => { const w = add2(g, wg, lam('tyre', 0x222222), x, 0.3, z); w.rotation.x = Math.PI / 2; });
    if (n.ry) g.children.forEach(o => { if (o.userData && o.userData.npc) return; o.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), n.ry); o.rotation.y += n.ry; });
  }
  /* tàu điện ngầm: thân bạc, sọc đỏ, cửa & cửa sổ */
  function buildTrain(g, n) {
    const L = n.len || 12, B = new THREE.BoxGeometry(1, 1, 1);
    const tex = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#d5dade'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.fillRect(0, h * 0.72, w, h * 0.08); for (let i = 0; i < 8; i++) { c.fillStyle = '#2b3a4a'; c.fillRect(14 + i * 62, 22, 40, 44); } c.fillStyle = '#8f9aa3'; for (let i = 0; i < 4; i++) c.fillRect(56 + i * 124, 20, 26, 82); });
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(L / 6, 1);
    add2(g, B, new THREE.MeshLambertMaterial({ map: tex }), 0, 1.45, 0, L, 2.3, 1.9);
    add2(g, B, lam('troof', 0xb0b7bf), 0, 2.65, 0, L, 0.12, 1.7);
  }

  R.buildScene = function (world) {
    const ch = world.ch, th = R.THEMES[ch.theme] || R.THEMES.home, W = world.W, H = world.H;
    const scene = new THREE.Scene();
    const sky = SKY[ch.theme] || 0xbfe6ff; scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(sky, 14, 42);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8ae9c, 2.3));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(W * 0.3, 12, H * 0.2); scene.add(sun);
    const mats = {};
    const mat = (key, color, extra) => mats[key] || (mats[key] = new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {})));
    const box = new THREE.BoxGeometry(1, 1, 1);
    const add = (geo, m, x, y, z, sx, sy, sz, ry) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (sx != null) o.scale.set(sx, sy, sz); if (ry) o.rotation.y = ry; scene.add(o); return o; };

    /* sàn: một mặt phẳng lớn với ảnh sàn vẽ sẵn */
    const floorCv = R.renderMap(world, 1.4, true);
    const floorTex = new THREE.CanvasTexture(floorCv); floorTex.colorSpace = THREE.SRGBColorSpace; floorTex.anisotropy = 8;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: floorTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, H / 2); scene.add(floor);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat('ground', GROUND[ch.theme] || 0x777777)); ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, -0.02, H / 2); scene.add(ground);

    const isOut = t => R.OUT_T.includes(t) && t !== ' ';
    const summer = !!th.summer;
    const floorOf = (x, y) => { const t = world.at(x, y); if (R.FLOOR_T.includes(t)) return t; for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const u = world.at(x + dx, y + dy); if (R.FLOOR_T.includes(u)) return u; } return ','; };
    const walkable = (x, y) => { const t = world.at(x, y); return t !== ' ' && !R.SOLID.has(t); };

    /* tường (gộp thành InstancedMesh để chạy nhẹ) */
    const wc = WALL3D[ch.theme] || WALL3D.home;
    const wallTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = wc[0]; c.fillRect(0, 0, w, h); c.fillStyle = wc[1]; c.fillRect(0, h * 0.9, w, h * 0.1); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(0, 0, w, h * 0.04); });
    const winTex = canvasTex(128, 256, (c, w, h) => {
      c.fillStyle = wc[0]; c.fillRect(0, 0, w, h); c.fillStyle = wc[1]; c.fillRect(0, h * 0.9, w, h * 0.1);
      c.fillStyle = ch.theme === 'plane' ? '#9fd6ff' : '#bfe6ff'; c.strokeStyle = '#fff'; c.lineWidth = 6;
      if (ch.theme === 'plane') { R.rr(c, 28, 70, 72, 100, 34); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(64, 135, 22, 9, 0, 0, 7); c.fill(); }
      else { c.fillRect(14, 40, 100, 130); c.strokeRect(14, 40, 100, 130); c.beginPath(); c.moveTo(64, 40); c.lineTo(64, 170); c.stroke(); }
    });
    const walls = [], wins = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = world.at(x, y); if (t === '#') walls.push([x, y]); else if (t === 'W') wins.push([x, y]); }
    const inst = (list, m, h, y0) => { if (!list.length) return; const im = new THREE.InstancedMesh(box, m, list.length); const o = new THREE.Object3D(); list.forEach(([x, y, hh], i) => { const hgt = hh || h; o.position.set(x + 0.5, (y0 || 0) + hgt / 2, y + 0.5); o.scale.set(1, hgt, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); scene.add(im); };
    inst(walls, new THREE.MeshLambertMaterial({ map: wallTex }), WALL_H);
    inst(wins, new THREE.MeshLambertMaterial({ map: winTex }), WALL_H);

    /* nhà cao tầng phía trên các bức tường mặt phố (chương ngoài trời: ch.tall = số mét thêm) */
    if (ch.tall) {
      const fac = [['#c98f6e', '#8a5a44'], ['#d9cbb3', '#9a8a74'], ['#9fb3c8', '#5d7389'], ['#e3b778', '#a87a3c'], ['#b9c7b0', '#6f8466']];
      const facTex = fac.map(([a, b]) => canvasTex(128, 256, (c, w, h) => { c.fillStyle = a; c.fillRect(0, 0, w, h); c.fillStyle = '#cfe9ff'; for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { c.fillRect(18 + i * 52, 18 + j * 60, 40, 38); } c.fillStyle = b; for (let j = 0; j < 4; j++) c.fillRect(0, 60 + j * 60 - 6, w, 5); }));
      const facM = facTex.map(t => new THREE.MeshLambertMaterial({ map: t }));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const t = world.at(x, y); if (t !== '#' && t !== 'W') continue;
        let front = false; for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const u = world.at(x + dx, y + dy); if (isOut(u)) front = true; }
        if (!front) continue;
        const k = Math.floor(x / 5) % fac.length, hh = ch.tall + ((Math.floor(x / 5) * 7) % 3) * 2;
        add(box, facM[k], x + 0.5, WALL_H + hh / 2, y + 0.5, 1, hh, 1);
      }
    }

    /* trần nhà cho khu trong nhà */
    const ceil = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = world.at(x, y); if (t !== ' ' && t !== '#' && t !== 'W' && !isOut(floorOf(x, y)) && t !== 'O' && t !== 'Z' && !ch.noCeil) ceil.push([x, y]); }
    if (ceil.length) { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: ch.theme === 'plane' ? 0xe9edf2 : 0xe8e2d8, side: THREE.DoubleSide }), ceil.length); const o = new THREE.Object3D(); ceil.forEach(([x, y], i) => { o.position.set(x + 0.5, WALL_H, y + 0.5); o.rotation.set(Math.PI / 2, 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); scene.add(im);
      // đèn trần
      const lamp = new THREE.MeshBasicMaterial({ color: 0xfffbea }); ceil.forEach(([x, y]) => { if (x % 3 === 1 && y % 3 === 1) add(box, lamp, x + 0.5, WALL_H - 0.02, y + 0.5, 0.5, 0.03, 0.5); }); }

    /* hàng rào / bụi cây quanh khu ngoài trời để không thấy mép bản đồ */
    const fence = [];
    for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
      const t = world.at(x, y); if (t !== ' ') continue; let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const u = world.at(x + dx, y + dy); if (isOut(u) || (u !== ' ' && isOut(floorOf(x + dx, y + dy)) && !R.SOLID.has(u))) { near = true; break; } }
      if (near) fence.push([x, y]);
    }
    const hedge = ch.theme === 'toronto' ? mat('hedgeS', 0xe9f1f8) : mat('hedge', 0x4f8a3c);
    fence.forEach(([x, y]) => add(box, hedge, x + 0.5, 0.55, y + 0.5, 1, 1.1, 1));
    if (fence.length) { // nhà cao tầng phía xa
      const rnd = i => (Math.sin(i * 12.9898) * 43758.5453) % 1;
      for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = Math.max(W, H) * 0.75 + Math.abs(rnd(i)) * 8; const hh = 4 + Math.abs(rnd(i + 3)) * (ch.theme === 'toronto' ? 16 : 7);
        const b = add(box, mat('bld' + (i % 4), [0x9aa7b4, 0xb8c2cc, 0xa39182, 0x8696a7][i % 4]), W / 2 + Math.cos(a) * r, hh / 2, H / 2 + Math.sin(a) * r, 3 + Math.abs(rnd(i + 7)) * 3, hh, 3); }
    }

    /* đồ đạc theo từng ô */
    const wood = mat('wood', 0x8d6e63), woodTop = mat('woodTop', 0xa1887f), seatM = mat('seat', new THREE.Color(th.seat).getHex()), seatD = mat('seatD', new THREE.Color(th.seat).multiplyScalar(0.7).getHex());
    const plane = ch.theme === 'plane';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = world.at(x, y), cx = x + 0.5, cz = y + 0.5;
      if (t === '=') { add(box, wood, cx, 0.5, cz, 1, 1, 0.9); add(box, woodTop, cx, 1.04, cz, 1.04, 0.08, 1.0); }
      else if (t === 'S') {
        add(box, seatM, cx, 0.25, cz, 0.78, 0.5, 0.72);
        if (plane) add(box, seatD, cx + 0.33, 0.75, cz, 0.14, 1.0, 0.76); else add(box, seatD, cx, 0.7, cz - 0.3, 0.78, 0.6, 0.12);
      }
      else if (t === 'T') { add(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), woodTop, cx, 0.76, cz); add(new THREE.CylinderGeometry(0.06, 0.08, 0.74, 8), wood, cx, 0.37, cz); }
      else if (t === 'P') {
        const out = isOut(floorOf(x, y));
        if (out && summer) { add(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 8), mat('trunk', 0x6d4c41), cx, 0.8, cz); add(new THREE.SphereGeometry(0.8, 12, 10), mat('maple', (x + y) % 3 ? 0x3f9b4a : 0x58b05a), cx, 2.15, cz); add(new THREE.SphereGeometry(0.5, 10, 8), mat('maple2', 0x4caf50), cx + 0.35, 2.55, cz - 0.2); }
        else if (out) { add(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8), mat('trunk', 0x6d4c41), cx, 0.7, cz); add(new THREE.ConeGeometry(0.75, 2.0, 10), mat('pine', 0x2e7d4f), cx, 2.2, cz); if (ch.theme === 'toronto') add(new THREE.ConeGeometry(0.42, 0.7, 10), mat('snow', 0xffffff), cx, 2.95, cz); }
        else { add(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 12), mat('pot', 0xb5651d), cx, 0.2, cz); add(new THREE.SphereGeometry(0.38, 12, 10), mat('leaf', 0x2e8b57), cx, 0.78, cz); }
      }
      else if (t === 'B') { const c = isOut(floorOf(x, y)) ? mat('bench', 0x795548) : mat('sofa', 0x4b7bec); add(box, c, cx, 0.25, cz, 0.98, 0.5, 0.8); add(box, c, cx, 0.65, cz - 0.33, 0.98, 0.6, 0.16); }
      else if (t === 'K') { add(box, mat('kiosk', 0x95a5a6), cx, 0.7, cz, 0.6, 1.4, 0.45); const scr = add(new THREE.PlaneGeometry(0.42, 0.32), mat('screen', 0x74b9ff, { emissive: 0x1d4f8a }), cx, 1.12, cz + 0.231); }
      else if (t === 'L') { add(box, mat('belt', 0x444444), cx, 0.25, cz, 1, 0.5, 0.9); if ((x + y) % 2 === 0) add(box, mat('bag' + ((x * 7 + y) % 3), [0xe17055, 0x6c5ce7, 0x00b894][(x * 7 + y) % 3]), cx, 0.75, cz, 0.45, 0.5, 0.6); }
      else if (t === 'Q') { add(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), mat('post', 0xb2bec3), cx, 0.5, cz); add(box, mat('rope', 0xd63031), cx, 0.9, cz, 1, 0.05, 0.05); }
      else if (t === 'D') { add(box, wood, cx, WALL_H - 0.25, cz, 1, 0.5, 1); }
      else if (t === 'F') { add(box, mat('shelf', 0xd7ccc8), cx, 0.8, cz, 0.95, 1.6, 0.7); [0.35, 0.8, 1.25].forEach((hy, j) => { for (let i = 0; i < 3; i++) add(box, mat('prod' + ((x + i + j) % 5), [0xe74c3c, 0xf1c40f, 0x27ae60, 0x3498db, 0xe67e22][(x + i + j) % 5]), cx - 0.3 + i * 0.3, hy + 0.13, cz + 0.12, 0.22, 0.26, 0.3); }); }
      else if (t === 'X') { add(box, mat('rail', 0xaab2ba), cx, 0.04, cz - 0.25, 1, 0.06, 0.06); add(box, mat('rail', 0xaab2ba), cx, 0.04, cz + 0.25, 1, 0.06, 0.06); }
      else if (t === 'J') { add(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8), mat('lamp', 0x37474f), cx, 1.6, cz); add(box, mat('lampH', 0xfff3c4, { emissive: 0x6b5b1e }), cx, 3.2, cz, 0.4, 0.12, 0.25); }
      else if (t === 'O' && world.at(x - 1, y) !== 'O' && world.at(x, y - 1) !== 'O') {
        const tx = x + 1, tz = y + 1; const gm = mat('tower', 0xb2bec3);
        add(new THREE.CylinderGeometry(0.35, 0.9, 14, 12), gm, tx, 7, tz); add(new THREE.CylinderGeometry(1.2, 1.0, 1.1, 16), mat('pod', 0x7f8c8d), tx, 10.5, tz); add(new THREE.CylinderGeometry(0.06, 0.12, 5, 8), gm, tx, 16.5, tz);
      }
    }
    /* biển hiệu */
    (ch.signs || []).forEach(sg => {
      const tex = textTex(sg.text, Object.assign(sg.small ? { bg: '#ffffff', color: '#2d3436', size: 34, border: '#2d3436' } : { size: 44 }, sg.bg ? { bg: sg.bg } : {}, sg.color ? { color: sg.color } : {}, sg.border ? { border: sg.border } : {}, sg.stripe ? { stripe: sg.stripe, radius: 4 } : {}));
      const h = sg.h || (sg.small ? 0.32 : 0.5), w = h * tex.userData.aspect;
      const tx = Math.floor(sg.x + 0.5), ty = Math.floor(sg.y);
      const onWall = world.at(tx, ty) === '#' || world.at(tx, ty) === 'W' || (world.at(tx, ty) === 'D' && (world.at(tx - 1, ty) === '#' || world.at(tx + 1, ty) === '#'));
      if (onWall || sg.ry != null) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
        if (onWall) m.position.set(sg.x + 0.5, sg.z || WALL_H - 0.45, ty + 1.02); else m.position.set(sg.x + 0.5, sg.z || 2.3, sg.y + 0.5);
        if (sg.ry) m.rotation.y = sg.ry;
        scene.add(m);
      } else {   // biển đứng giữa không gian: luôn quay về phía người chơi để đọc được từ mọi hướng
        const sp = spriteOf(tex, h); sp.position.set(sg.x + 0.5, sg.z || (sg.small ? 2.35 : 2.3), sg.y + 0.5); scene.add(sp);
      }
    });
    /* nhãn số ghế (máy bay) */
    (ch.labels || []).forEach(l => { const s = spriteOf(textTex(l.text, { bg: '#ffffff', color: '#1d2d4a', size: 30, radius: 8 }), 0.17); s.position.set(l.x + 0.5, 1.36, l.y + 0.5); scene.add(s); });
    /* tuyết rơi */
    let snow = null;
    const outT = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isOut(floorOf(x, y)) && world.at(x, y) !== ' ') outT.push([x, y]);
    if (ch.theme === 'toronto' && outT.length) { const n = 600, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const [tx, ty] = outT[Math.floor(Math.random() * outT.length)]; pos[i * 3] = tx + Math.random(); pos[i * 3 + 1] = Math.random() * 8; pos[i * 3 + 2] = ty + Math.random(); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })); scene.add(snow); }

    /* NPC & vật tương tác */
    const actors = world.npcs.map(n => {
      const g = new THREE.Group(); g.position.set(n.px, 0, n.py); scene.add(g);
      let body = null;
      if (!n.object) { body = spriteOf(personTex(R.LOOKS[n.look] || R.LOOKS.man), (R.LOOKS[n.look] || {}).small ? 1.35 : 1.74); body.center.set(0.5, 0); g.add(body); body.userData.npc = n; }
      else { const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.65; hit.userData.npc = n; g.add(hit); body = hit;
        if (n.kind === 'car') { buildCar(g, n); hit.scale.set(2.6, 1, 1.4); }
        else if (n.kind === 'train') { buildTrain(g, n); hit.scale.set(n.len || 12, 2, 2.4); hit.position.y = 1.2; }
        else if (n.kind === 'bus') { buildBus(g, n); hit.scale.set(5.6, 1.6, 1.6); hit.position.y = 1.0; }
        else if (n.kind === 'station') { buildEntrance(g, n); hit.scale.set(5, 2, 2); hit.position.x = 0.2; }
        else if (n.kind === 'presto') { add2(g, box, mat('prpost', 0x455a64), 0, 0.55, 0, 0.18, 1.1, 0.18); add2(g, box, mat('prhead', 0x2d3436), 0, 1.18, 0, 0.34, 0.26, 0.12); add2(g, new THREE.PlaneGeometry(0.22, 0.14), mat('prscr', 0x7bed9f, { emissive: 0x1e6b3a }), 0, 1.2, 0.065); }
        else if (n.kind === 'map') { const mt = canvasTex(256, 180, (c, w, h) => { c.fillStyle = '#fffdf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#9fd3f5'; c.fillRect(0, h * 0.78, w, h * 0.22); [['#f4c20d', 'M120 20 L120 120 L100 150'], ['#2e8b3d', 'M20 115 L236 112'], ['#8e44ad', 'M120 60 L190 60'], ['#e67e22', 'M40 90 L230 95']].forEach(([col, d]) => { c.strokeStyle = col; c.lineWidth = 7; c.stroke(new Path2D(d)); }); c.fillStyle = '#d63031'; c.beginPath(); c.arc(120, 40, 8, 0, 7); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); });
          const bd = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), new THREE.MeshBasicMaterial({ map: mt })); bd.position.set(0, 1.5, n.face === 'n' ? 0.45 : -0.45); if (n.face === 'n') bd.rotation.y = Math.PI; g.add(bd); }
        else if (n.kind === 'phone') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.02), mat('phone', 0x222222)); p.position.set(0, 0.92, 0); p.rotation.x = -0.4; g.add(p); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.16), mat('screen', 0x74b9ff, { emissive: 0x1d4f8a })); sc.position.set(0, 0.92, 0.012); sc.rotation.x = -0.4; g.add(sc); } }
      const nameS = spriteOf(textTex(n.name, { bg: n.main ? 'rgba(214,48,49,.95)' : 'rgba(255,255,255,.92)', color: n.main ? '#fff' : '#2d3436', size: 30, radius: 20 }), 0.16);
      nameS.position.y = n.object ? (n.labelY || 1.55) : ((R.LOOKS[n.look] || {}).small ? 1.5 : 1.9); g.add(nameS);
      const bang = spriteOf(textTex('!', { bg: '#ffc107', color: '#222', size: 56, radius: 40, border: '#222' }), 0.34); bang.position.y = nameS.position.y + 0.32; g.add(bang);
      const chat = spriteOf(textTex('💬', { bg: 'rgba(0,0,0,0)', size: 44 }), 0.3); chat.position.y = nameS.position.y + 0.28; g.add(chat);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), new THREE.MeshBasicMaterial({ color: 0xffc107, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
      return { n, g, body, nameS, bang, chat, ring };
    });
    return { scene, actors, snow, update(t) { if (snow) { const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - 0.012; if (y < 0) y = 8; p.setY(i, y); } p.needsUpdate = true; } } };
  };
})();
