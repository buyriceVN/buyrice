/* Du học Toronto – giao diện, vòng lặp game, nhiệm vụ, lưu tiến độ (góc nhìn thứ nhất) */
(function () {
  const R = window.TorontoRPG, esc = R.esc;

  function loadSave(owner) { try { return JSON.parse(localStorage.getItem('rpg-world-' + owner) || 'null') || null; } catch (e) { return null; } }
  function freshSave() { return { cur: 0, ch: {}, items: [], notes: [], pts: 0 }; }

  R.open = function (cfg) {
    R.close();
    if (!window.THREE) { alert('Trình duyệt chưa tải được thư viện 3D.'); return; }
    const owner = cfg.owner || 'guest';
    const S = Object.assign(freshSave(), loadSave(owner) || {});
    const save = () => { try { localStorage.setItem('rpg-world-' + owner, JSON.stringify(S)); } catch (e) { } };
    const prefs = { vi: false, voice: true }; try { prefs.vi = localStorage.getItem('rpg-vi') === '1'; prefs.voice = localStorage.getItem('rpg-voice') !== '0'; } catch (e) { }
    const chState = id => S.ch[id] || (S.ch[id] = { obj: 0, done: false, met: {} });
    const unlocked = i => cfg.teacher || i === 0 || !!(S.ch[R.CHAPTERS[i - 1].id] || {}).done;
    const touch = matchMedia('(pointer: coarse)').matches;

    /* ---------- DOM ---------- */
    const root = document.createElement('div'); root.className = 'trpg' + (touch ? ' touch' : '');
    root.innerHTML = '<div class="tr-top"><div class="tr-brand">🍁 <span>Du học Toronto</span></div><div class="tr-chs"></div><span class="grow"></span>' +
      '<span class="tr-pts" title="Điểm lá phong"></span><button class="tr-btn" data-a="bag" title="Túi đồ">🎒</button><button class="tr-btn" data-a="notes" title="Sổ tay mẫu câu">📒</button>' +
      '<button class="tr-btn tr-vi-t" data-a="vi" title="Hiện nghĩa tiếng Việt">VI</button>' + (R.canSpeak ? '<button class="tr-btn tr-voice-t" data-a="voice" title="Tự đọc to câu tiếng Anh">🔊</button>' : '') + '<button class="tr-btn" data-a="close" title="Thoát game">✕</button></div>' +
      '<div class="tr-main"><canvas class="tr-cv"></canvas><div class="tr-cross"></div><div class="tr-quest"></div><div class="tr-compass" hidden><b>➤</b><span></span></div><div class="tr-zone"></div><div class="tr-float"></div>' +
      '<div class="tr-joy"><i></i></div><div class="tr-turn"><button data-a="turnL" title="Xoay trái">⟲</button><button data-a="turnR" title="Xoay phải">⟳</button></div>' +
      '<button class="tr-talk" data-a="talk" hidden></button><div class="tr-dlg" hidden></div><div class="tr-panel" hidden></div>' +
      '<div class="tr-help">W/S đi tới·lui · A/D bước ngang · Q/E hoặc ←/→ xoay · kéo chuột để nhìn quanh · bấm vào người để tới gần · <b>F</b> nói chuyện</div></div>';
    document.body.appendChild(root); document.body.classList.add('rpgopen');
    const $ = s => root.querySelector(s);
    const cv = $('.tr-cv'), main = $('.tr-main'), panel = $('.tr-panel'), talkBtn = $('.tr-talk'), compass = $('.tr-compass');

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 220);
    const ray = new THREE.Raycaster();

    let world = null, sc = null, ch = null, chIdx = 0, near = null, zoneName = '', raf = 0, last = 0, time = 0, running = true, chPts = 0, chLearned = [];
    let goal = null, goalNpc = null, tries = 0, turnHold = 0, viewOff = 0;
    const busy = () => dlg.active() || !panel.hidden;

    const ctl = R.Controls({
      el: main, joy: $('.tr-joy'), busy: () => busy(),
      blocked: (nx, nz) => { if (R.blocked(world, nx, nz, 0.26)) return true; if (ctl.path) return false; for (const n of world.npcs) if (!n.object && Math.hypot(n.px - nx, n.py - nz) < 0.5 && Math.hypot(n.px - ctl.x, n.py - ctl.z) >= Math.hypot(n.px - nx, n.py - nz)) return true; return false; },
      onTap: (x, y) => onTap(x, y), onStuck: () => repath()
    });
    const dlg = R.Dialogue({
      el: $('.tr-dlg'), name: cfg.name || 'You', vi: () => prefs.vi, voice: () => prefs.voice, toast: t => float(t),
      onItem(id) { if (!S.items.includes(id)) { S.items.push(id); save(); } const it = R.ITEMS[id]; if (it) float('🎒 Nhận được: ' + it[0] + ' ' + it[1]); },
      onPoints(n, label) { S.pts += n; chPts += n; save(); float(label, true); paintTop(); },
      onLearn(entry) { const e = Object.assign({ ch: ch.id }, entry); if (!S.notes.some(x => x.en === e.en)) { S.notes.push(e); chLearned.push(e.en); save(); } },
      onWrong() { main.classList.remove('shake'); void main.offsetWidth; main.classList.add('shake'); },
      onEnd: r => onTalkEnd(r)
    });

    /* ---------- chương ---------- */
    function disposeScene() { if (!sc) return; sc.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); }); }
    function loadChapter(i, showIntro) {
      chIdx = i; ch = R.CHAPTERS[i]; S.cur = i; save();
      const st = chState(ch.id); if (st.done && st.obj >= ch.objectives.length) st.obj = 0;
      world = R.World(ch); disposeScene(); sc = R.buildScene(world);
      ctl.x = ch.spawn[0] + 0.5; ctl.z = ch.spawn[1] + 0.5; ctl.pitch = 0; ctl.sit = false; ctl.eye = R.EYE; ctl.path = null; ctl.clear();
      goal = null; chPts = 0; chLearned = []; zoneName = '';
      for (let k = 0; k < st.obj; k++) applyObjective(ch.objectives[k], true);
      if (!ctl.sit) { const o = curObj(), t = o && world.npcs.find(n => n.id === o.target); ctl.yaw = t ? R.yawTo(ctl.x, ctl.z, t.px, t.py) : 0; }
      paintTop(); paintQuest(); resize();
      if (showIntro) introPanel(); else activateObjective();
    }
    function curObj() { const st = chState(ch.id); return ch.objectives[st.obj] || null; }
    function applyObjective(o, past) {
      if (o && o.move) { const n = world.npcs.find(x => x.id === o.move.id); if (n) { n.px = o.move.x + 0.5; n.py = o.move.y + 0.5; n.hx = o.move.x; n.hy = o.move.y; } }
      if (past && o && o.target === 'seat') sitDown();
    }
    function activateObjective() {
      const o = curObj(); paintQuest(); if (!o) return;
      if (o.move) applyObjective(o, false);
      if (o.auto) setTimeout(() => { if (!busy() && curObj() === o) talkTo(world.npcs.find(n => n.id === o.target)); }, 900);
    }
    function completeObjective() {
      const st = chState(ch.id); st.obj++; save();
      if (st.obj >= ch.objectives.length) { st.done = true; save(); paintTop(); paintQuest(); setTimeout(chapterDone, 400); return; }
      float('🎯 Nhiệm vụ mới: ' + curObj().text); activateObjective();
    }

    /* ---------- nói chuyện ---------- */
    function talkTo(n) {
      if (!n || dlg.active()) return;
      ctl.path = null; ctl.clear(); goal = null;
      if (!ctl.sit) {
        const d = Math.hypot(ctl.x - n.px, ctl.z - n.py), want = n.object ? 1.2 : 1.85;   // lùi lại một chút để nhìn rõ người đối diện
        if (d < want && d > 0.01) { const gx = n.px + (ctl.x - n.px) / d * want, gz = n.py + (ctl.z - n.py) / d * want; if (!R.blocked(world, gx, gz, 0.26)) ctl.glideTo = [gx, gz]; }
        ctl.faceTo(n.px, n.py);
      }
      const o = curObj(), st = chState(ch.id);
      const quest = o && o.target === n.id && (n.talks || []).find(t => t.obj === o.id);
      if (quest) { dlg.start(n, quest.steps, { quest: o.id }); return; }
      const side = (n.talks || []).find(t => !t.obj);
      if (side) { dlg.start(n, side.steps, { side: n.id }); return; }
      const myIdx = ch.objectives.findIndex(x => x.target === n.id);
      const line = (myIdx >= 0 && myIdx < st.obj) || st.done ? n.after : n.before;
      if (line && line[0]) dlg.start(n, [{ t: 's', en: line[0], vi: line[1] }], { idle: 1 });
      else dlg.start(n, [{ t: 'n', vi: o ? 'Chưa tới lúc này. Nhiệm vụ hiện tại: ' + o.text : 'Em đã xong chương này rồi!' }], { idle: 1 });
    }
    function onTalkEnd(r) {
      const st = chState(ch.id);
      if (r.meta && r.meta.quest && r.completed) { const o = curObj(); if (o && o.id === r.meta.quest) { if (o.target === 'seat') sitDown(); completeObjective(); } }
      else if (r.meta && r.meta.side && r.completed && !st.met[r.meta.side]) { st.met[r.meta.side] = 1; S.pts += 5; chPts += 5; save(); float('+5 🍁 Làm quen người mới!', true); paintTop(); }
      if (r.learned) float('📒 +' + r.learned + ' mẫu câu vào sổ tay');
    }
    function sitDown() {
      const s = world.npcs.find(n => n.id === 'seat'); if (!s) return;
      ctl.x = s.px; ctl.z = s.py; ctl.sit = true; ctl.eye = 1.1; ctl.yaw = Math.PI / 2; ctl.pitch = -0.05; ctl.faceYaw = null;   // nhìn về phía đầu máy bay
      ctl.onStand = () => { ctl.z = 3.5; };
    }

    /* ---------- đi tới NPC / điểm bấm ---------- */
    function occupied(except) { const s = new Set(); world.npcs.forEach(n => { if (n !== except && !n.object) s.add(Math.floor(n.py) * world.W + Math.floor(n.px)); }); return s; }
    function startPath(onArrive) { const p = R.findPath(world, Math.floor(ctl.x), Math.floor(ctl.z), goal, occupied(goalNpc)); ctl.goPath(p, onArrive); return p; }
    function repath() { if (!goal || ++tries > 25) { ctl.path = null; return; } startPath(ctl.onArrive); }
    function walkTo(n) {
      if (ctl.sit) ctl.standUp();
      if (Math.hypot(n.px - ctl.x, n.py - ctl.z) <= (n.range || 1.5)) { talkTo(n); return; }
      const range = (n.range || 1.5) - 0.15; goal = (x, y) => Math.hypot(x + 0.5 - n.px, y + 0.5 - n.py) <= range; goalNpc = n; tries = 0;
      if (!startPath(() => talkTo(n))) float('Không tới được chỗ đó.', true);
    }
    function onTap(cx, cy) {
      const r = cv.getBoundingClientRect(); const v = new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, camera);
      const hits = ray.intersectObjects(sc.actors.map(a => a.body), false);
      if (hits.length && hits[0].distance < 30) { walkTo(hits[0].object.userData.npc); return; }
      const p = new THREE.Vector3();
      if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) && p.distanceTo(camera.position) < 25) {
        const tx = Math.floor(p.x), ty = Math.floor(p.z); if (ctl.sit) ctl.standUp();
        goal = world.solid(tx, ty) ? (x, y) => Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1 : (x, y) => x === tx && y === ty; goalNpc = null; tries = 0; startPath(null);
      }
    }

    /* ---------- bảng thông tin ---------- */
    function showPanel(html, cls) { panel.className = 'tr-panel ' + (cls || ''); panel.innerHTML = '<div class="tr-card">' + html + '</div>'; panel.hidden = false; ctl.clear(); }
    function hidePanel() { panel.hidden = true; panel.innerHTML = ''; }
    function introPanel() {
      showPanel('<div class="tr-ci">' + ch.icon + '</div><div class="tr-ct">Chương ' + (chIdx + 1) + ' · ' + esc(ch.title) + '</div><p>' + esc(ch.intro) + '</p>' +
        '<div class="tr-objs">' + ch.objectives.map((o, k) => '<div>' + (k + 1) + '. ' + esc(o.text) + '</div>').join('') + '</div>' +
        '<p class="tr-small">' + (touch ? 'Kéo cần điều khiển bên trái để đi, kéo màn hình để nhìn quanh, chạm vào người để tới gần.' : 'W/S đi tới·lui, A/D bước ngang, Q/E xoay, kéo chuột để nhìn quanh. Lại gần rồi bấm <b>F</b> để nói chuyện.') +
        ' Người có dấu <b class="tr-ex">!</b> là nhiệm vụ chính, có 💬 là người qua đường để luyện thêm. La bàn phía trên chỉ hướng mục tiêu.</p><button class="tr-next" data-a="go">Bắt đầu ▶</button>');
    }
    function chapterDone() {
      const nx = R.CHAPTERS[chIdx + 1], learned = chLearned.slice(-8);
      showPanel('<div class="tr-ci">🎉</div><div class="tr-ct">Hoàn thành chương ' + (chIdx + 1) + ': ' + esc(ch.title) + '</div><p>+' + chPts + ' 🍁 trong chương này · tổng ' + S.pts + ' 🍁</p>' +
        (learned.length ? '<div class="tr-learn"><div class="tr-small">Mẫu câu mới (bấm để nghe):</div>' + learned.map(t => '<button class="tr-chip" data-a="say" data-t="' + esc(t) + '">🔊 ' + esc(t) + '</button>').join('') + '</div>' : '') +
        (nx ? '<button class="tr-next" data-a="nextch">Chương ' + (chIdx + 2) + ': ' + esc(nx.title) + ' ▶</button>' : '<p><b>Em đã hoàn thành cả hành trình đến Toronto!</b> Xem lại các mẫu câu trong 📒 Sổ tay nhé.</p><button class="tr-next" data-a="notes">📒 Mở sổ tay</button>') +
        '<button class="tr-link" data-a="stay">Ở lại khám phá tiếp</button>');
    }
    function bagPanel() {
      showPanel('<div class="tr-ct">🎒 Túi đồ</div>' + (S.items.length ? '<div class="tr-items">' + S.items.map(k => { const it = R.ITEMS[k]; return it ? '<div class="tr-item"><span class="tr-ii">' + it[0] + '</span><div><b>' + esc(it[1]) + '</b><div class="tr-small">' + esc(it[2]) + '</div></div></div>' : ''; }).join('') + '</div>' : '<p class="tr-small">Túi còn trống. Làm nhiệm vụ để nhận đồ nhé!</p>') + '<button class="tr-next" data-a="closepanel">Đóng</button>');
    }
    function notesPanel() {
      const by = R.CHAPTERS.map(c => ({ c, list: S.notes.filter(n => n.ch === c.id) })).filter(x => x.list.length);
      showPanel('<div class="tr-ct">📒 Sổ tay mẫu câu</div>' + (by.length ? by.map(x => '<div class="tr-nb"><div class="tr-nbh">' + x.c.icon + ' ' + esc(x.c.title) + '</div>' + x.list.map(n => '<div class="tr-note">' + (R.canSpeak ? '<button class="tr-sp" data-a="say" data-t="' + esc(n.en) + '">🔊</button>' : '') + '<div><div>' + esc(n.en) + '</div>' + (n.tip ? '<div class="tr-small">' + esc(n.tip) + '</div>' : '') + '</div></div>').join('') + '</div>').join('') : '<p class="tr-small">Chưa có mẫu câu nào. Nói chuyện với NPC để ghi vào sổ tay nhé!</p>') + '<button class="tr-next" data-a="closepanel">Đóng</button>', 'wide');
    }

    /* ---------- HUD ---------- */
    function paintTop() {
      $('.tr-chs').innerHTML = R.CHAPTERS.map((c, i) => { const st = S.ch[c.id] || {}; const ok = unlocked(i); return '<button class="tr-ch' + (i === chIdx ? ' on' : '') + (st.done ? ' done' : '') + '" data-a="ch" data-i="' + i + '"' + (ok ? '' : ' disabled') + ' title="Chương ' + (i + 1) + ': ' + esc(c.title) + '">' + (ok ? c.icon : '🔒') + '<span>' + (i + 1) + '</span>' + (st.done ? '<i>✓</i>' : '') + '</button>'; }).join('');
      $('.tr-pts').textContent = '🍁 ' + S.pts;
      $('.tr-vi-t').classList.toggle('on', prefs.vi); const vt = $('.tr-voice-t'); if (vt) vt.classList.toggle('on', prefs.voice);
    }
    let questOpen = window.innerWidth > 700;
    function paintQuest() {
      const st = chState(ch.id), o = curObj();
      $('.tr-quest').innerHTML = '<div class="tr-qrow"><button class="tr-qh" data-a="quest">🎯 ' + (o ? esc(o.text) : 'Chương đã hoàn thành!') + '</button>' + (o ? '<button class="tr-guide" data-a="guide" title="Tự đi tới mục tiêu">🧭 Đi tới</button>' : '') + '</div>' +
        (questOpen ? '<div class="tr-ql">' + ch.objectives.map((x, k) => '<div class="' + (k < st.obj ? 'ok' : k === st.obj ? 'cur' : '') + '">' + (k < st.obj ? '✓' : k === st.obj ? '▶' : '○') + ' ' + esc(x.text) + '</div>').join('') + '</div>' : '');
    }
    function float(text, small) { const f = document.createElement('div'); f.className = 'tr-fl' + (small ? ' sm' : ''); f.textContent = text; $('.tr-float').appendChild(f); setTimeout(() => f.remove(), small ? 1300 : 2600); }

    /* ---------- nút & phím ---------- */
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a;
      if (a === 'close') return R.close();
      if (a === 'go' || a === 'closepanel' || a === 'stay') { hidePanel(); if (a === 'go') activateObjective(); return; }
      if (a === 'nextch') { hidePanel(); return loadChapter(chIdx + 1, true); }
      if (a === 'ch') { if (dlg.active()) return; hidePanel(); return loadChapter(+b.dataset.i, true); }
      if (a === 'bag') { if (!dlg.active()) bagPanel(); return; }
      if (a === 'notes') { if (!dlg.active()) notesPanel(); return; }
      if (a === 'vi') { prefs.vi = !prefs.vi; try { localStorage.setItem('rpg-vi', prefs.vi ? '1' : '0'); } catch (e2) { } paintTop(); dlg.repaint(); return; }
      if (a === 'voice') { prefs.voice = !prefs.voice; try { localStorage.setItem('rpg-voice', prefs.voice ? '1' : '0'); } catch (e2) { } if (!prefs.voice) try { speechSynthesis.cancel(); } catch (e3) { } paintTop(); return; }
      if (a === 'say') return R.speak(b.dataset.t, 1);
      if (a === 'talk') return near && talkTo(near);
      if (a === 'quest') { questOpen = !questOpen; paintQuest(); return; }
      if (a === 'guide') { const o = curObj(); const n = o && world.npcs.find(x => x.id === o.target); if (n) walkTo(n); }
    });
    const turnBtns = $('.tr-turn');
    turnBtns.addEventListener('pointerdown', e => { const b = e.target.closest('[data-a]'); if (!b) return; e.preventDefault(); e.stopPropagation(); turnHold = b.dataset.a === 'turnL' ? 1 : -1; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => turnBtns.addEventListener(ev, () => { turnHold = 0; }));
    function onKey(e) {
      if (dlg.active()) { dlg.key(e); return; }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (!panel.hidden) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); const go = panel.querySelector('[data-a=go],[data-a=nextch]'); if (go && e.key === 'Enter') go.click(); else hidePanel(); } return; }
      const k = e.key.toLowerCase();
      if ((k === 'f' || k === ' ' || k === 'enter') && near) { e.preventDefault(); talkTo(near); return; }
      if (k === 'escape') { R.close(); return; }
      ctl.keydown(e);
    }
    function onKeyUp(e) { ctl.keyup(e); }
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);
    const onBlur = () => ctl.clear(); window.addEventListener('blur', onBlur);

    /* ---------- cập nhật ---------- */
    function update(dt) {
      time += dt;
      if (turnHold) { ctl.yaw = R.norm(ctl.yaw + turnHold * 2.2 * dt); ctl.faceYaw = null; }
      ctl.update(dt);
      world.npcs.forEach(n => {
        n.t += dt; if (n.object || !n.wander) return;
        if (Math.hypot(n.px - ctl.x, n.py - ctl.z) < 2.2) { n.moving = false; return; }
        if (n.tx == null) { n.wait -= dt; if (n.wait <= 0) { for (let k = 0; k < 6; k++) { const tx = n.hx + Math.round((Math.random() * 2 - 1) * n.wander), ty = n.hy + Math.round((Math.random() * 2 - 1) * n.wander); if (!world.solid(tx, ty)) { n.tx = tx + 0.5; n.ty = ty + 0.5; break; } } n.wait = 2 + Math.random() * 3; } n.moving = false; return; }
        const vx = n.tx - n.px, vy = n.ty - n.py, d = Math.hypot(vx, vy); if (d < 0.08) { n.tx = null; n.moving = false; return; }
        const s = 0.9 * dt, nx = n.px + vx / d * s, ny = n.py + vy / d * s;
        if (R.blocked(world, nx, ny, 0.25) || Math.hypot(nx - ctl.x, ny - ctl.z) < 0.7) { n.tx = null; n.moving = false; return; }
        n.px = nx; n.py = ny; n.moving = true;
      });
      near = null; let best = 99;
      world.npcs.forEach(n => { const d = Math.hypot(n.px - ctl.x, n.py - ctl.z); if (d > (n.range || 1.5)) return; const diff = Math.abs(R.norm(R.yawTo(ctl.x, ctl.z, n.px, n.py) - ctl.yaw)); const score = d + (diff > 1.1 ? 3 : diff); if (score < best) { best = score; near = n; } });
      talkBtn.hidden = !near;
      if (near) { const label = (near.object ? '👉 ' + (near.label || near.name) : '💬 Nói chuyện với ' + near.name); if (talkBtn.dataset.l !== label) { talkBtn.dataset.l = label; talkBtn.innerHTML = esc(label) + (touch ? '' : ' <kbd>F</kbd>'); } }
      const z = (ch.zones || []).find(z => ctl.x >= z.x && ctl.x < z.x + z.w && ctl.z >= z.y && ctl.z < z.y + z.h);
      if (z && z.name !== zoneName) { zoneName = z.name; const zl = $('.tr-zone'); zl.textContent = '📍 ' + z.name; zl.classList.remove('show'); void zl.offsetWidth; zl.classList.add('show'); }
    }
    function syncActors() {
      const o = curObj(), st = chState(ch.id);
      sc.actors.forEach(a => {
        const n = a.n; a.g.position.set(n.px, 0, n.py);
        const target = !!(o && o.target === n.id), d = Math.hypot(n.px - ctl.x, n.py - ctl.z);
        if (!n.object && a.body) a.body.position.y = n.moving ? Math.abs(Math.sin(n.t * 9)) * 0.05 : Math.sin(n.t * 2) * 0.008;
        a.bang.visible = target; a.bang.position.y = a.nameS.position.y + 0.34 + Math.sin(time * 4) * 0.05;
        a.chat.visible = !target && !n.object && !n.main && !st.met[n.id] && d < 10;
        a.nameS.visible = d < 9 || target;
        a.ring.visible = target || near === n; a.ring.material.color.set(target ? 0xffc107 : 0xd63031); a.ring.material.opacity = 0.55 + Math.sin(time * 5) * 0.35;
      });
      const t = o && world.npcs.find(n => n.id === o.target);
      if (t && panel.hidden && !dlg.active()) {
        const diff = R.norm(R.yawTo(ctl.x, ctl.z, t.px, t.py) - ctl.yaw), dist = Math.hypot(t.px - ctl.x, t.py - ctl.z);
        compass.hidden = false; compass.querySelector('b').style.transform = 'rotate(' + (-90 - diff * 180 / Math.PI) + 'deg)';
        compass.querySelector('span').textContent = (t.object ? (t.label || t.name) : t.name) + ' · ' + Math.max(1, Math.round(dist * 1.2)) + ' m';
      } else compass.hidden = true;
    }
    function resize() { const w = main.clientWidth, h = main.clientHeight; renderer.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px'; camera.aspect = w / Math.max(1, h); camera.fov = w < h ? 80 : 70; camera.updateProjectionMatrix(); }
    function loop(ts) {
      if (!running) return;
      const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
      if (!busy()) update(dt); else { time += dt; talkBtn.hidden = true; ctl.moving = false; if (ctl.faceYaw != null || ctl.glideTo) ctl.update(dt); }
      // điện thoại: khi đang trò chuyện, đẩy khung nhìn lên để thấy mặt người đối diện phía trên hộp thoại
      const h = main.clientHeight, w = main.clientWidth, wantOff = dlg.active() && w < 900 ? h * 0.26 : 0;
      viewOff += (wantOff - viewOff) * Math.min(1, dt * 6); if (Math.abs(viewOff) > 0.5) camera.setViewOffset(w, h, 0, viewOff, w, h); else if (camera.view && camera.view.enabled) camera.clearViewOffset();
      syncActors(); sc.update(time); ctl.apply(camera); renderer.render(sc.scene, camera);
      raf = requestAnimationFrame(loop);
    }
    const onResize = () => resize(); window.addEventListener('resize', onResize);

    /* ---------- bắt đầu ---------- */
    let start = 0; const want = cfg.chId ? R.CHAPTERS.findIndex(c => c.id === cfg.chId) : -1;
    if (want >= 0 && unlocked(want)) start = want; else if (unlocked(S.cur || 0)) start = S.cur || 0;
    if (want >= 0 && !unlocked(want)) setTimeout(() => float('Em cần hoàn thành chương trước để mở chương ' + (want + 1) + ' nhé.'), 300);
    paintTop(); loadChapter(start, true);
    raf = requestAnimationFrame(loop);

    R._cleanup = () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', onResize); window.removeEventListener('blur', onBlur); try { speechSynthesis.cancel(); } catch (e) { } disposeScene(); try { renderer.dispose(); } catch (e) { } root.remove(); document.body.classList.remove('rpgopen'); };
    R._debug = { get S() { return S; }, ctl, get world() { return world; }, get ch() { return ch; }, dlg, talkTo, walkTo, loadChapter, curObj, get near() { return near; },
      screenOf(x, y, h) { const v = new THREE.Vector3(x, h == null ? 1.2 : h, y).project(camera); const r = cv.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height, v.z]; } };
  };
  R.close = function () { if (R._cleanup) { R._cleanup(); R._cleanup = null; } };
})();
