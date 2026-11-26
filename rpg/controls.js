/* Du học Toronto – điều khiển góc nhìn thứ nhất: đi, xoay, nhìn quanh, nhún bước chân, va chạm */
(function () {
  const R = window.TorontoRPG;
  const SPEED = 2.6, TURN = 2.2, PR = 0.26;
  const norm = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  R.norm = norm;
  R.yawTo = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz));   // góc quay để nhìn từ (fx,fz) về (tx,tz)

  /* opts: { el (khung game), joy (phần tử cần điều khiển ảo), busy(), onTap(clientX, clientY), blocked(nx, nz) } */
  R.Controls = function (opts) {
    const C = { x: 0, z: 0, yaw: 0, pitch: 0, bob: 0, moving: false, path: null, onArrive: null, faceYaw: null, eye: R.EYE, sit: false, onStand: null };
    const keys = {};
    let joyVec = null, look = null;
    const isTyping = e => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    const MOVE_KEYS = ['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
    C.keydown = e => { const k = e.key.toLowerCase(); if (isTyping(e) || !MOVE_KEYS.includes(k)) return false; keys[k] = true; e.preventDefault(); C.path = null; C.onArrive = null; return true; };
    C.keyup = e => { keys[e.key.toLowerCase()] = false; };
    C.clear = () => { for (const k in keys) keys[k] = false; joyVec = null; };

    /* chuột / chạm: kéo để nhìn quanh, chạm nhanh để chọn */
    const el = opts.el;
    el.addEventListener('pointerdown', e => {
      if (opts.busy() || e.target.tagName !== 'CANVAS') return;
      look = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
    });
    window.addEventListener('pointermove', e => {
      if (!look || e.pointerId !== look.id) return;
      const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY;
      if (Math.hypot(e.clientX - look.sx, e.clientY - look.sy) > 6) { C.yaw = norm(C.yaw - dx * 0.0055); C.pitch = Math.max(-0.6, Math.min(0.5, C.pitch - dy * 0.004)); C.path = null; C.faceYaw = null; }
    });
    window.addEventListener('pointerup', e => {
      if (!look || e.pointerId !== look.id) return;
      const tap = Math.hypot(e.clientX - look.sx, e.clientY - look.sy) < 8 && performance.now() - look.t < 400; look = null;
      if (tap && !opts.busy()) opts.onTap(e.clientX, e.clientY);
    });
    window.addEventListener('pointercancel', () => { look = null; });

    /* cần điều khiển ảo (điện thoại) */
    const joy = opts.joy, knob = joy.querySelector('i'); let jid = null, jc = null;
    joy.addEventListener('pointerdown', e => { e.preventDefault(); jid = e.pointerId; const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; joy.setPointerCapture(jid); moveJoy(e); C.path = null; });
    const moveJoy = e => { if (e.pointerId !== jid) return; let dx = e.clientX - jc.x, dy = e.clientY - jc.y; const d = Math.hypot(dx, dy), m = jc.r * 0.75; if (d > m) { dx = dx / d * m; dy = dy / d * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; joyVec = { x: dx / m, y: dy / m }; };
    joy.addEventListener('pointermove', moveJoy);
    const endJoy = e => { if (e.pointerId !== jid) return; jid = null; joyVec = null; knob.style.transform = ''; };
    joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);

    C.goPath = (path, onArrive) => { C.path = path && path.length ? path : null; C.onArrive = onArrive || null; if (!C.path && onArrive) onArrive(); };
    C.faceTo = (tx, tz) => { C.faceYaw = R.yawTo(C.x, C.z, tx, tz); C.pitch = 0; };
    C.standUp = () => { if (!C.sit) return; C.sit = false; C.eye = R.EYE; if (C.onStand) C.onStand(); };

    C.update = function (dt) {
      if (C.glideTo) { const [gx, gz] = C.glideTo, dx = gx - C.x, dz = gz - C.z, d = Math.hypot(dx, dz); if (d < 0.02) C.glideTo = null; else { const s = Math.min(d, dt * 2.5); C.x += dx / d * s; C.z += dz / d * s; } }
      let fwd = 0, side = 0, turn = 0;
      if (keys.w || keys.arrowup) fwd += 1; if (keys.s || keys.arrowdown) fwd -= 1;
      if (keys.a) side -= 1; if (keys.d) side += 1;
      if (keys.q || keys.arrowleft) turn += 1; if (keys.e || keys.arrowright) turn -= 1;
      if (joyVec) { fwd = -joyVec.y; turn = -joyVec.x * 0.9; if (Math.abs(fwd) < 0.15) fwd = 0; }
      if (turn) { C.yaw = norm(C.yaw + turn * TURN * dt); C.faceYaw = null; }
      if ((fwd || side) && C.sit) C.standUp();
      // tự đi theo đường (bấm/chạm vào NPC hoặc mặt sàn)
      if (!fwd && !side && C.path) {
        const [tx, tz] = C.path[0], dx = tx - C.x, dz = tz - C.z, d = Math.hypot(dx, dz);
        if (d < 0.12) { C.path.shift(); if (!C.path.length) { C.path = null; const cb = C.onArrive; C.onArrive = null; if (cb) cb(); } }
        else { const want = R.yawTo(C.x, C.z, tx, tz), diff = norm(want - C.yaw); C.yaw = norm(C.yaw + Math.max(-1, Math.min(1, diff)) * Math.min(1, dt * 7)); fwd = Math.abs(diff) < 1.2 ? 1 : 0.2; }
      }
      if (C.faceYaw != null) { const diff = norm(C.faceYaw - C.yaw); C.yaw = norm(C.yaw + diff * Math.min(1, dt * 8)); if (Math.abs(diff) < 0.01) C.faceYaw = null; }
      C.moving = !!(fwd || side);
      if (C.moving) {
        const sp = SPEED * dt * (keys.shift ? 1.5 : 1), fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
        let mx = (fx * fwd + rx * side), mz = (fz * fwd + rz * side); const l = Math.hypot(mx, mz) || 1; mx = mx / l * sp * Math.min(1, Math.hypot(fwd, side)); mz = mz / l * sp * Math.min(1, Math.hypot(fwd, side));
        const okX = !opts.blocked(C.x + mx, C.z), okZ = !opts.blocked(C.x + (okX ? mx : 0), C.z + mz);
        if (okX) C.x += mx; if (okZ) C.z += mz;
        if (!okX && !okZ && C.path && opts.onStuck) opts.onStuck();
        C.bob += dt * 9;
      } else C.bob += (Math.round(C.bob / Math.PI) * Math.PI - C.bob) * Math.min(1, dt * 8);
    };
    C.apply = function (cam) {
      const b = Math.sin(C.bob * 2) * 0.035, roll = Math.sin(C.bob) * 0.008;
      cam.position.set(C.x, C.eye + (C.moving ? b : 0), C.z);
      cam.rotation.set(C.pitch, C.yaw, C.moving ? roll : 0, 'YXZ');
    };
    C.R = PR;
    return C;
  };
})();
