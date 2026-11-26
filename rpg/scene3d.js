/* Du học Toronto – dựng không gian 3D góc nhìn thứ nhất cho từng chương (Three.js) */
(function () {
  const R = window.TorontoRPG;
  const WALL_H = 2.7, EYE = 1.5;
  R.EYE = EYE;
  const SKY = { home: 0xbfe6ff, airport: 0xbfe6ff, plane: 0x8fc8ff, customs: 0xcfd8e3, toronto: 0xdfeaf5 };
  const WALL3D = { home: ['#efe2cc', '#c9a27a'], airport: ['#e6ecf2', '#9fb0c2'], plane: ['#eef1f5', '#c9d1da'], customs: ['#e4e9ef', '#8b9bab'], toronto: ['#eadccb', '#a88b6e'] };
  const GROUND = { home: 0x6f8f5a, airport: 0x8a8f96, plane: 0x8fc8ff, customs: 0x9aa3ad, toronto: 0xf4f8fc };

  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  function textTex(text, o) {
    o = o || {}; const z = o.size || 40, pad = 18;
    const m = document.createElement('canvas').getContext('2d'); m.font = '800 ' + z + 'px "Be Vietnam Pro", system-ui, sans-serif';
    const w = Math.ceil(m.measureText(text).width + pad * 2), h = Math.ceil(z * 1.6);
    const tex = canvasTex(w, h, (c) => { c.fillStyle = o.bg || '#1e3a6b'; R.rr(c, 2, 2, w - 4, h - 4, o.radius == null ? 14 : o.radius); c.fill(); if (o.border) { c.strokeStyle = o.border; c.lineWidth = 4; c.stroke(); } c.fillStyle = o.color || '#fff'; c.font = '800 ' + z + 'px "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 2); });
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

    const isOut = t => t === ':' || t === '~';
    const floorOf = (x, y) => { const t = world.at(x, y); if ('.,:~_R'.includes(t)) return t; for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const u = world.at(x + dx, y + dy); if ('.,:~_R'.includes(u)) return u; } return ','; };
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

    /* trần nhà cho khu trong nhà */
    const ceil = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = world.at(x, y); if (t !== ' ' && t !== '#' && t !== 'W' && !isOut(floorOf(x, y)) && t !== 'O') ceil.push([x, y]); }
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
        if (out) { add(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8), mat('trunk', 0x6d4c41), cx, 0.7, cz); add(new THREE.ConeGeometry(0.75, 2.0, 10), mat('pine', 0x2e7d4f), cx, 2.2, cz); if (ch.theme === 'toronto') add(new THREE.ConeGeometry(0.42, 0.7, 10), mat('snow', 0xffffff), cx, 2.95, cz); }
        else { add(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 12), mat('pot', 0xb5651d), cx, 0.2, cz); add(new THREE.SphereGeometry(0.38, 12, 10), mat('leaf', 0x2e8b57), cx, 0.78, cz); }
      }
      else if (t === 'B') { const c = isOut(floorOf(x, y)) ? mat('bench', 0x795548) : mat('sofa', 0x4b7bec); add(box, c, cx, 0.25, cz, 0.98, 0.5, 0.8); add(box, c, cx, 0.65, cz - 0.33, 0.98, 0.6, 0.16); }
      else if (t === 'K') { add(box, mat('kiosk', 0x95a5a6), cx, 0.7, cz, 0.6, 1.4, 0.45); const scr = add(new THREE.PlaneGeometry(0.42, 0.32), mat('screen', 0x74b9ff, { emissive: 0x1d4f8a }), cx, 1.12, cz + 0.231); }
      else if (t === 'L') { add(box, mat('belt', 0x444444), cx, 0.25, cz, 1, 0.5, 0.9); if ((x + y) % 2 === 0) add(box, mat('bag' + ((x * 7 + y) % 3), [0xe17055, 0x6c5ce7, 0x00b894][(x * 7 + y) % 3]), cx, 0.75, cz, 0.45, 0.5, 0.6); }
      else if (t === 'Q') { add(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), mat('post', 0xb2bec3), cx, 0.5, cz); add(box, mat('rope', 0xd63031), cx, 0.9, cz, 1, 0.05, 0.05); }
      else if (t === 'D') { add(box, wood, cx, WALL_H - 0.25, cz, 1, 0.5, 1); }
      else if (t === 'O' && world.at(x - 1, y) !== 'O' && world.at(x, y - 1) !== 'O') {
        const tx = x + 1, tz = y + 1; const gm = mat('tower', 0xb2bec3);
        add(new THREE.CylinderGeometry(0.35, 0.9, 14, 12), gm, tx, 7, tz); add(new THREE.CylinderGeometry(1.2, 1.0, 1.1, 16), mat('pod', 0x7f8c8d), tx, 10.5, tz); add(new THREE.CylinderGeometry(0.06, 0.12, 5, 8), gm, tx, 16.5, tz);
      }
    }
    /* biển hiệu */
    (ch.signs || []).forEach(sg => {
      const tex = textTex(sg.text, sg.small ? { bg: '#ffffff', color: '#2d3436', size: 34, border: '#2d3436' } : { size: 44 });
      const h = sg.small ? 0.32 : 0.5, w = h * tex.userData.aspect;
      const tx = Math.floor(sg.x + 0.5), ty = Math.floor(sg.y);
      const onWall = world.at(tx, ty) === '#' || world.at(tx, ty) === 'W';
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
      if (onWall) m.position.set(sg.x + 0.5, WALL_H - 0.45, ty + 1.02); else m.position.set(sg.x + 0.5, sg.small ? 2.35 : 2.3, sg.y + 0.5);
      scene.add(m);
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
        if (n.kind === 'phone') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.02), mat('phone', 0x222222)); p.position.set(0, 0.92, 0); p.rotation.x = -0.4; g.add(p); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.16), mat('screen', 0x74b9ff, { emissive: 0x1d4f8a })); sc.position.set(0, 0.92, 0.012); sc.rotation.x = -0.4; g.add(sc); } }
      const nameS = spriteOf(textTex(n.name, { bg: n.main ? 'rgba(214,48,49,.95)' : 'rgba(255,255,255,.92)', color: n.main ? '#fff' : '#2d3436', size: 30, radius: 20 }), 0.16);
      nameS.position.y = n.object ? 1.55 : ((R.LOOKS[n.look] || {}).small ? 1.5 : 1.9); g.add(nameS);
      const bang = spriteOf(textTex('!', { bg: '#ffc107', color: '#222', size: 56, radius: 40, border: '#222' }), 0.34); bang.position.y = nameS.position.y + 0.32; g.add(bang);
      const chat = spriteOf(textTex('💬', { bg: 'rgba(0,0,0,0)', size: 44 }), 0.3); chat.position.y = nameS.position.y + 0.28; g.add(chat);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), new THREE.MeshBasicMaterial({ color: 0xffc107, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
      return { n, g, body, nameS, bang, chat, ring };
    });
    return { scene, actors, snow, update(t) { if (snow) { const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - 0.012; if (y < 0) y = 8; p.setY(i, y); } p.needsUpdate = true; } } };
  };
})();
