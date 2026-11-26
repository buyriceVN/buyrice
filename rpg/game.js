/* Du học Toronto – giao diện, điều khiển, nhiệm vụ, lưu tiến độ */
(function () {
  const R = window.TorontoRPG, TS = R.TS, esc = R.esc;
  const SPEED = 3.4;      // ô / giây
  const PR = 0.28;        // bán kính va chạm người chơi (ô)

  function loadSave(owner) { try { return JSON.parse(localStorage.getItem('rpg-world-' + owner) || 'null') || null; } catch (e) { return null; } }
  function freshSave() { return { cur: 0, ch: {}, items: [], notes: [], pts: 0 }; }

  R.open = function (cfg) {
    R.close();
    const owner = cfg.owner || 'guest';
    const S = Object.assign(freshSave(), loadSave(owner) || {});
    const save = () => { try { localStorage.setItem('rpg-world-' + owner, JSON.stringify(S)); } catch (e) { } };
    const prefs = { vi: false, voice: true }; try { prefs.vi = localStorage.getItem('rpg-vi') === '1'; prefs.voice = localStorage.getItem('rpg-voice') !== '0'; } catch (e) { }
    const chState = id => S.ch[id] || (S.ch[id] = { obj: 0, done: false, met: {} });
    const unlocked = i => cfg.teacher || i === 0 || !!(S.ch[R.CHAPTERS[i - 1].id] || {}).done;

    /* ---------- DOM ---------- */
    const root = document.createElement('div'); root.className = 'trpg';
    root.innerHTML = '<div class="tr-top"><div class="tr-brand">🍁 <span>Du học Toronto</span></div><div class="tr-chs"></div><span class="grow"></span>' +
      '<span class="tr-pts" title="Điểm lá phong"></span><button class="tr-btn" data-a="bag" title="Túi đồ">🎒</button><button class="tr-btn" data-a="notes" title="Sổ tay mẫu câu">📒</button>' +
      '<button class="tr-btn tr-vi-t" data-a="vi" title="Hiện nghĩa tiếng Việt">VI</button>' + (R.canSpeak ? '<button class="tr-btn tr-voice-t" data-a="voice" title="Tự đọc to câu tiếng Anh">🔊</button>' : '') + '<button class="tr-btn" data-a="close" title="Thoát game">✕</button></div>' +
      '<div class="tr-main"><canvas class="tr-cv"></canvas><div class="tr-quest"></div><div class="tr-zone"></div><div class="tr-float"></div>' +
      '<button class="tr-talk" data-a="talk" hidden></button><div class="tr-dlg" hidden></div><div class="tr-panel" hidden></div>' +
      '<div class="tr-help">WASD / ↑↓←→ để đi · bấm hoặc chạm vào bản đồ/NPC để tới đó · <b>E</b> để nói chuyện</div></div>';
    document.body.appendChild(root); document.body.classList.add('rpgopen');
    const $ = s => root.querySelector(s);
    const cv = $('.tr-cv'), ctx = cv.getContext('2d'), panel = $('.tr-panel'), talkBtn = $('.tr-talk');
    const avatar = new Image(); avatar.src = cfg.avatar || 'dog.png';

    let world = null, mapImg = null, mapScale = 1, ch = null, chIdx = 0, P = null, cam = { x: 0, y: 0, z: 1 }, vw = 0, vh = 0, dpr = 1;
    let keys = {}, path = null, pendingTalk = null, near = null, zoneName = '', raf = 0, last = 0, time = 0, running = true, chPts = 0, chLearned = [];

    const dlg = R.Dialogue({
      el: $('.tr-dlg'), name: cfg.name || 'You', vi: () => prefs.vi, voice: () => prefs.voice, toast,
      onItem(id) { if (!S.items.includes(id)) { S.items.push(id); save(); } const it = R.ITEMS[id]; if (it) float('🎒 Nhận được: ' + it[0] + ' ' + it[1]); paintTop(); },
      onPoints(n, label) { S.pts += n; chPts += n; save(); float(label, true); paintTop(); },
      onLearn(entry) { const e = Object.assign({ ch: ch.id }, entry); if (!S.notes.some(x => x.en === e.en)) { S.notes.push(e); chLearned.push(e.en); save(); } },
      onWrong() { shake(); },
      onEnd: onTalkEnd
    });

    /* ---------- chương ---------- */
    function loadChapter(i, showIntro) {
      chIdx = i; ch = R.CHAPTERS[i]; S.cur = i; save();
      const st = chState(ch.id); if (st.done && st.obj >= ch.objectives.length) { st.obj = 0; }   // chơi lại chương đã xong
      world = R.World(ch); dpr = Math.min(2, window.devicePixelRatio || 1); mapScale = dpr * 1.2; mapImg = R.renderMap(world, mapScale);
      P = { x: ch.spawn[0] + 0.5, y: ch.spawn[1] + 0.5, face: 1, moving: false, sit: false };
      path = null; pendingTalk = null; chPts = 0; chLearned = []; zoneName = '';
      for (let k = 0; k < st.obj; k++) applyObjective(ch.objectives[k], true);
      paintTop(); paintQuest(); resize();
      if (showIntro) introPanel(); else activateObjective();
    }
    function curObj() { const st = chState(ch.id); return ch.objectives[st.obj] || null; }
    function applyObjective(o, past) { if (o && o.move) { const n = world.npcs.find(x => x.id === o.move.id); if (n) { n.px = o.move.x + 0.5; n.py = o.move.y + 0.5; n.hx = o.move.x; n.hy = o.move.y; } } if (past && o && o.target === 'seat') sitDown(); }
    function activateObjective() {
      const o = curObj(); paintQuest(); if (!o) return;
      if (o.move) applyObjective(o, false);
      if (o.auto) setTimeout(() => { if (!dlg.active() && panel.hidden && curObj() === o) talkTo(world.npcs.find(n => n.id === o.target)); }, 900);
    }
    function completeObjective() {
      const st = chState(ch.id); st.obj++; save();
      if (st.obj >= ch.objectives.length) { st.done = true; save(); paintTop(); paintQuest(); setTimeout(chapterDone, 400); return; }
      float('🎯 Nhiệm vụ mới: ' + curObj().text); activateObjective();
    }

    /* ---------- nói chuyện ---------- */
    function talkTo(n) {
      if (!n || dlg.active()) return;
      path = null; pendingTalk = null; keys = {};
      if (!n.object) n.face = P.x < n.px ? -1 : 1;
      const o = curObj(), st = chState(ch.id);
      const quest = o && o.target === n.id && (n.talks || []).find(t => t.obj === o.id);
      if (quest) { dlg.start(n, quest.steps, { quest: o.id }); return; }
      const side = (n.talks || []).find(t => !t.obj);
      if (side) { dlg.start(n, side.steps, { side: n.id }); return; }
      // NPC chính khi chưa/đã tới lượt
      const myIdx = ch.objectives.findIndex(x => x.target === n.id);
      const line = (myIdx >= 0 && myIdx < st.obj) || st.done ? n.after : n.before;
      if (line && line[0]) dlg.start(n, [{ t: 's', en: line[0], vi: line[1] }], { idle: 1 });
      else dlg.start(n, [{ t: 'n', vi: o ? 'Chưa tới lúc này. Nhiệm vụ hiện tại: ' + o.text : 'Em đã xong chương này rồi!' }], { idle: 1 });
    }
    function onTalkEnd(r) {
      const st = chState(ch.id);
      if (r.meta && r.meta.quest && r.completed) {
        const o = curObj(); if (o && o.id === r.meta.quest) { if (o.target === 'seat') sitDown(); completeObjective(); }
      } else if (r.meta && r.meta.side && r.completed && !st.met[r.meta.side]) {
        st.met[r.meta.side] = 1; S.pts += 5; chPts += 5; save(); float('+5 🍁 Làm quen người mới!', true); paintTop();
      }
      if (r.learned) float('📒 +' + r.learned + ' mẫu câu vào sổ tay');
    }
    function sitDown() { const s = world.npcs.find(n => n.id === 'seat'); if (!s) return; P.x = s.px; P.y = s.py; P.sit = true; P.face = 1; }

    /* ---------- bảng thông tin ---------- */
    function showPanel(html, cls) { panel.className = 'tr-panel ' + (cls || ''); panel.innerHTML = '<div class="tr-card">' + html + '</div>'; panel.hidden = false; keys = {}; }
    function hidePanel() { panel.hidden = true; panel.innerHTML = ''; }
    function introPanel() {
      showPanel('<div class="tr-ci">' + ch.icon + '</div><div class="tr-ct">Chương ' + (chIdx + 1) + ' · ' + esc(ch.title) + '</div><p>' + esc(ch.intro) + '</p>' +
        '<div class="tr-objs">' + ch.objectives.map((o, k) => '<div>' + (k + 1) + '. ' + esc(o.text) + '</div>').join('') + '</div>' +
        '<p class="tr-small">Đi tới NPC có dấu <b class="tr-ex">!</b> để làm nhiệm vụ. NPC có 💬 là người qua đường, nói chuyện để luyện thêm và nhận 🍁.</p>' +
        '<button class="tr-next" data-a="go">Bắt đầu ▶</button>');
    }
    function chapterDone() {
      const nx = R.CHAPTERS[chIdx + 1];
      const learned = chLearned.slice(-8);
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
      showPanel('<div class="tr-ct">📒 Sổ tay mẫu câu</div>' + (by.length ? by.map(x => '<div class="tr-nb"><div class="tr-nbh">' + x.c.icon + ' ' + esc(x.c.title) + '</div>' + x.list.map(n => '<div class="tr-note"><button class="tr-sp" data-a="say" data-t="' + esc(n.en) + '">🔊</button><div><div>' + esc(n.en) + '</div>' + (n.tip ? '<div class="tr-small">' + esc(n.tip) + '</div>' : '') + '</div></div>').join('') + '</div>').join('') : '<p class="tr-small">Chưa có mẫu câu nào. Nói chuyện với NPC để ghi vào sổ tay nhé!</p>') + '<button class="tr-next" data-a="closepanel">Đóng</button>', 'wide');
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
      $('.tr-quest').innerHTML = '<div class="tr-qrow"><button class="tr-qh" data-a="quest">🎯 ' + (o ? esc(o.text) : 'Chương đã hoàn thành!') + '</button>' + (o ? '<button class="tr-guide" data-a="guide" title="Tự đi tới mục tiêu">🧭 Đi tới</button>' : '') + '</div>' + (questOpen ? '<div class="tr-ql">' + ch.objectives.map((x, k) => '<div class="' + (k < st.obj ? 'ok' : k === st.obj ? 'cur' : '') + '">' + (k < st.obj ? '✓' : k === st.obj ? '▶' : '○') + ' ' + esc(x.text) + '</div>').join('') + '</div>' : '');
    }
    function float(text, small) { const f = document.createElement('div'); f.className = 'tr-fl' + (small ? ' sm' : ''); f.textContent = text; $('.tr-float').appendChild(f); setTimeout(() => f.remove(), small ? 1300 : 2600); }
    function toast(t) { float(t); }
    function shake() { const m = $('.tr-main'); m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); }

    /* ---------- điều khiển ---------- */
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a;
      if (a === 'close') return R.close();
      if (a === 'go' || a === 'closepanel' || a === 'stay') { hidePanel(); if (a === 'go') activateObjective(); return; }
      if (a === 'nextch') { hidePanel(); return loadChapter(chIdx + 1, true); }
      if (a === 'ch') { const i = +b.dataset.i; if (dlg.active()) return; hidePanel(); return loadChapter(i, true); }
      if (a === 'bag') { if (dlg.active()) return; return bagPanel(); }
      if (a === 'notes') { if (dlg.active()) return; return notesPanel(); }
      if (a === 'vi') { prefs.vi = !prefs.vi; try { localStorage.setItem('rpg-vi', prefs.vi ? '1' : '0'); } catch (e2) { } paintTop(); dlg.repaint(); return; }
      if (a === 'voice') { prefs.voice = !prefs.voice; try { localStorage.setItem('rpg-voice', prefs.voice ? '1' : '0'); } catch (e2) { } if (!prefs.voice) try { speechSynthesis.cancel(); } catch (e3) { } paintTop(); return; }
      if (a === 'say') return R.speak(b.dataset.t, 1);
      if (a === 'talk') return near && talkTo(near);
      if (a === 'quest') { questOpen = !questOpen; paintQuest(); }
      if (a === 'guide') { const o = curObj(); const n = o && world.npcs.find(x => x.id === o.target); if (n) walkTo(n); }
    });
    function onKey(e) {
      if (dlg.active()) { dlg.key(e); return; }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (!panel.hidden) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); const go = panel.querySelector('[data-a=go],[data-a=nextch]'); if (go && e.key === 'Enter') go.click(); else hidePanel(); } return; }
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { e.preventDefault(); keys[k] = true; path = null; pendingTalk = null; goal = null; }
      else if ((k === 'e' || k === ' ' || k === 'enter') && near) { e.preventDefault(); talkTo(near); }
      else if (k === 'escape') R.close();
    }
    function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => { keys = {}; });
    cv.addEventListener('pointerdown', e => {
      if (dlg.active() || !panel.hidden) return;
      const r = cv.getBoundingClientRect(); const wx = (e.clientX - r.left - vw / 2) / cam.z / TS + cam.x, wy = (e.clientY - r.top - vh / 2) / cam.z / TS + cam.y;
      let hit = null, hd = 0.75; world.npcs.forEach(n => { const d = Math.hypot(n.px - wx, (n.object ? n.py : n.py - 0.45) - wy); if (d < hd) { hd = d; hit = n; } });
      const sx = Math.floor(P.x), sy = Math.floor(P.y);
      if (P.sit) { P.sit = false; P.y += 2; }
      if (hit) walkTo(hit);
      else {
        const tx = Math.floor(wx), ty = Math.floor(wy);
        if (world.solid(tx, ty)) { // bấm vào đồ vật: đi tới ô trống gần nhất
          goal = (x, y) => Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1;
        } else goal = (x, y) => x === tx && y === ty;
        goalNpc = null; tries = 0; path = R.findPath(world, sx, sy, goal, occupied());
        pendingTalk = null; if (path) { marker = { x: tx + 0.5, y: ty + 0.5, t: time }; }
      }
    });
    let marker = null, goal = null, goalNpc = null, tries = 0;
    function repath() { // bị NPC chặn đường: tìm đường khác
      if (!goal || ++tries > 25) { path = null; pendingTalk = null; return; }
      path = R.findPath(world, Math.floor(P.x), Math.floor(P.y), goal, occupied(goalNpc)); if (!path) pendingTalk = null;
    }
    function walkTo(n) {
      if (P.sit) { P.sit = false; P.y += 2; }
      if (Math.hypot(n.px - P.x, n.py - P.y) <= (n.range || 1.5)) { talkTo(n); return; }
      const range = (n.range || 1.5) - 0.15;
      goal = (x, y) => Math.hypot(x + 0.5 - n.px, y + 0.5 - n.py) <= range; goalNpc = n; tries = 0;
      path = R.findPath(world, Math.floor(P.x), Math.floor(P.y), goal, occupied(n)); pendingTalk = path ? n : null;
      if (!path) float('Không tới được chỗ đó.', true);
    }
    function occupied(except) { const s = new Set(); world.npcs.forEach(n => { if (n !== except && !n.object) s.add(Math.floor(n.py) * world.W + Math.floor(n.px)); }); return s; }

    /* ---------- cập nhật ---------- */
    function update(dt) {
      time += dt;
      let dx = 0, dy = 0;
      if (keys.arrowleft || keys.a) dx -= 1; if (keys.arrowright || keys.d) dx += 1; if (keys.arrowup || keys.w) dy -= 1; if (keys.arrowdown || keys.s) dy += 1;
      if ((dx || dy) && P.sit) { P.sit = false; P.y += 2; }
      if (!dx && !dy && path && path.length) {
        const [tx, ty] = path[0]; const vx = tx - P.x, vy = ty - P.y, d = Math.hypot(vx, vy);
        if (d < 0.12) { path.shift(); if (!path.length) { path = null; if (pendingTalk) { const n = pendingTalk; pendingTalk = null; talkTo(n); } } }
        else { dx = vx / d; dy = vy / d; }
      }
      P.moving = !!(dx || dy);
      if (P.moving) {
        const l = Math.hypot(dx, dy) || 1, s = SPEED * dt; dx = dx / l * s; dy = dy / l * s; if (dx) P.face = dx < 0 ? -1 : 1;
        const tryMove = (nx, ny) => { if (R.blocked(world, nx, ny, PR)) return false; for (const n of world.npcs) if (!n.object && Math.hypot(n.px - nx, n.py - ny) < 0.55 && Math.hypot(n.px - P.x, n.py - P.y) >= Math.hypot(n.px - nx, n.py - ny)) return false; return true; };
        const mx = tryMove(P.x + dx, P.y); if (mx) P.x += dx;
        const my = tryMove(P.x, P.y + dy); if (my) P.y += dy;
        if (path && !mx && !my) repath();
      }
      // NPC đi lang thang
      world.npcs.forEach(n => {
        n.t += dt; if (n.object || !n.wander) return;
        const close = Math.hypot(n.px - P.x, n.py - P.y) < 2 || dlg.active();
        if (close) { n.moving = false; n.face = P.x < n.px ? -1 : 1; return; }
        if (n.tx == null) { n.wait -= dt; if (n.wait <= 0) { for (let k = 0; k < 6; k++) { const tx = n.hx + Math.round((Math.random() * 2 - 1) * n.wander), ty = n.hy + Math.round((Math.random() * 2 - 1) * n.wander); if (!world.solid(tx, ty)) { n.tx = tx + 0.5; n.ty = ty + 0.5; break; } } n.wait = 2 + Math.random() * 3; } n.moving = false; return; }
        const vx = n.tx - n.px, vy = n.ty - n.py, d = Math.hypot(vx, vy); if (d < 0.08) { n.tx = null; n.moving = false; return; }
        const s = 1.1 * dt, nx = n.px + vx / d * s, ny = n.py + vy / d * s;
        if (R.blocked(world, nx, ny, 0.25) || Math.hypot(nx - P.x, ny - P.y) < 0.6) { n.tx = null; n.moving = false; return; }
        n.px = nx; n.py = ny; n.moving = true; if (Math.abs(vx) > 0.05) n.face = vx < 0 ? -1 : 1;
      });
      // NPC gần nhất trong tầm nói chuyện
      near = null; let nd = 99; world.npcs.forEach(n => { const d = Math.hypot(n.px - P.x, n.py - P.y); if (d <= (n.range || 1.5) && d < nd) { nd = d; near = n; } });
      const busy = dlg.active() || !panel.hidden;
      talkBtn.hidden = !near || busy;
      if (near && !busy) { const label = (near.object ? '👉 ' : '💬 ') + (near.object ? near.label || near.name : 'Nói chuyện với ' + near.name); if (talkBtn.dataset.l !== label) { talkBtn.dataset.l = label; talkBtn.innerHTML = esc(label) + ' <kbd>E</kbd>'; } }
      // khu vực
      const z = (ch.zones || []).find(z => P.x >= z.x && P.x < z.x + z.w && P.y >= z.y && P.y < z.y + z.h);
      if (z && z.name !== zoneName) { zoneName = z.name; const zl = $('.tr-zone'); zl.textContent = '📍 ' + z.name; zl.classList.remove('show'); void zl.offsetWidth; zl.classList.add('show'); }
    }

    /* ---------- vẽ ---------- */
    function resize() {
      const m = $('.tr-main'); vw = m.clientWidth; vh = m.clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
      cam.z = Math.max(0.62, Math.min(1.35, Math.min(vw / (TS * (vw < 640 ? 8 : 15)), vh / (TS * 9))));
    }
    function draw() {
      const z = cam.z; const mw = world.W * TS * z, mh = world.H * TS * z;
      let cx = P.x * TS * z - vw / 2, cy = P.y * TS * z - vh / 2;
      cx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, cx)); cy = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, cy));
      cam.x = (cx + vw / 2) / z / TS; cam.y = (cy + vh / 2) / z / TS;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = ch.theme === 'plane' ? '#7fb2e5' : ch.theme === 'toronto' ? '#e9f2fb' : '#2d3a2e'; ctx.fillRect(0, 0, vw, vh);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(mapImg, -cx, -cy, mw, mh);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, -cx * dpr, -cy * dpr);
      if (marker && time - marker.t < 0.6) { ctx.strokeStyle = 'rgba(214,48,49,' + (1 - (time - marker.t) / 0.6) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(marker.x * TS, marker.y * TS, 8 + (time - marker.t) * 30, 0, 7); ctx.stroke(); }
      const o = curObj();
      const ents = world.npcs.map(n => ({ y: n.py, n })).concat([{ y: P.y + (P.sit ? 0.6 : 0), p: 1 }]).sort((a, b) => a.y - b.y);
      for (const e of ents) {
        if (e.p) { drawPlayer(); continue; }
        const n = e.n, X = n.px * TS, Y = n.py * TS + TS * 0.3, target = o && o.target === n.id;
        if (n.object) { R.drawObject(ctx, n, n.px * TS, n.py * TS, time, target); }
        else R.drawPerson(ctx, R.LOOKS[n.look] || R.LOOKS.man, X, Y, n.t, n.moving, n.face);
        const headY = n.object ? n.py * TS - TS * 0.55 : Y - TS * 1.32;
        if (target) { const b = Math.sin(time * 5) * 3; ctx.fillStyle = '#ffc107'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, headY - 12 + b, 11, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#222'; ctx.font = R.FONT(900, 15); ctx.textAlign = 'center'; ctx.fillText('!', X, headY - 6.5 + b); }
        else if (!n.object && !n.main && !chState(ch.id).met[n.id]) { ctx.font = R.FONT(400, 15); ctx.textAlign = 'center'; ctx.fillText('💬', X + 12, headY - 2 + Math.sin(time * 3 + n.t) * 2); }
        if (near === n || target || n.main) { ctx.font = R.FONT(700, 11); ctx.textAlign = 'center'; const w = ctx.measureText(n.name).width + 10; ctx.fillStyle = near === n ? 'rgba(214,48,49,.92)' : 'rgba(255,255,255,.88)'; R.rr(ctx, X - w / 2, Y + 4, w, 16, 8); ctx.fill(); ctx.fillStyle = near === n ? '#fff' : '#2d3436'; ctx.fillText(n.name, X, Y + 16); }
      }
    }
    function drawArrow() {
      const o = curObj(); const n = o && world.npcs.find(x => x.id === o.target); if (!n) return;
      const sx = vw / 2 + (n.px - cam.x) * TS * cam.z, sy = vh / 2 + (n.py - cam.y) * TS * cam.z, m = 34;
      if (sx > m && sx < vw - m && sy > m + 40 && sy < vh - m) return;
      const ax = Math.max(m, Math.min(vw - m, sx)), ay = Math.max(m + 40, Math.min(vh - m, sy)), ang = Math.atan2(sy - vh / 2, sx - vw / 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = '#ffc107'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    function drawPlayer() {
      const X = P.x * TS, Y = P.y * TS + TS * 0.32, h = TS * 1.3, iw = avatar.naturalWidth && avatar.naturalHeight ? Math.min(TS * 1.9, h * avatar.naturalWidth / avatar.naturalHeight) : h * 0.84;
      const bob = P.moving ? Math.abs(Math.sin(time * 11)) * 4 : Math.sin(time * 2) * 1;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(X, Y, iw * 0.34, 6, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(X, Y - bob); if (P.face < 0) ctx.scale(-1, 1); if (P.moving) ctx.rotate(Math.sin(time * 11) * 0.05);
      if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, -iw / 2, -h, iw, h); else { ctx.fillStyle = '#d9b77f'; R.rr(ctx, -16, -40, 32, 40, 12); ctx.fill(); }
      ctx.restore();
      ctx.font = R.FONT(800, 11); ctx.textAlign = 'center'; const nm = cfg.name || 'You'; const w = ctx.measureText(nm).width + 12;
      ctx.fillStyle = '#2e7d32'; R.rr(ctx, X - w / 2, Y - h - 20 - bob, w, 16, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(nm, X, Y - h - 8 - bob);
    }
    function loop(ts) {
      if (!running) return;
      const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
      if (!dlg.active() && panel.hidden) update(dt); else { time += dt; world.npcs.forEach(n => { n.t += dt; n.moving = false; }); P.moving = false; talkBtn.hidden = true; }
      draw(); if (panel.hidden && !dlg.active()) drawArrow(); raf = requestAnimationFrame(loop);
    }
    const onResize = () => resize(); window.addEventListener('resize', onResize);

    /* ---------- bắt đầu ---------- */
    let start = 0; const want = cfg.chId ? R.CHAPTERS.findIndex(c => c.id === cfg.chId) : -1;
    if (want >= 0 && unlocked(want)) start = want; else if (unlocked(S.cur || 0)) start = S.cur || 0;
    if (want >= 0 && !unlocked(want)) setTimeout(() => float('Em cần hoàn thành chương trước để mở chương ' + (want + 1) + ' nhé.'), 300);
    paintTop(); loadChapter(start, true);
    raf = requestAnimationFrame(loop);

    R._cleanup = () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', onResize); try { speechSynthesis.cancel(); } catch (e) { } root.remove(); document.body.classList.remove('rpgopen'); };
    R._debug = { get S() { return S; }, get P() { return P; }, get world() { return world; }, get ch() { return ch; }, dlg, talkTo, loadChapter, curObj, screenOf(x, y) { const r = cv.getBoundingClientRect(); return [r.left + vw / 2 + (x - cam.x) * TS * cam.z, r.top + vh / 2 + (y - cam.y) * TS * cam.z]; } };
  };
  R.close = function () { if (R._cleanup) { R._cleanup(); R._cleanup = null; } };
})();
