/* Du học Toronto – âm thanh & nhạc nền
   Mỗi âm là một "sự kiện âm thanh" có tên (key), ví dụ 'iced_capp_sip'. Khi phát một key, game tìm theo thứ tự:
   (a) file giáo viên tải lên ở trang "🎵 Âm thanh game" (Supabase: bảng docs, col = 'rpgsounds', file trong bucket media/rpg-sounds/)
   (b) file trong thư mục rpg/sounds/, khai báo ở rpg/sounds/sounds.json  → {"iced_capp_sip": {"file": "iced-capp-sip.mp3", "volume": 0.8}}
   (c) âm mặc định tự tạo bằng Web Audio API (không dùng nhạc có bản quyền)
   Câu thoại thu sẵn dùng key dạng 'voice:<id câu thoại>'. */
(function () {
  const R = window.TorontoRPG = window.TorontoRPG || {};
  const BASE = (function () { try { return new URL('sounds/', document.currentScript.src).href; } catch (e) { return 'rpg/sounds/'; } })();

  /* ---------- danh sách sự kiện mặc định (giáo viên đổi file / âm lượng được, thêm key mới được) ---------- */
  const DEFAULTS = [
    { key: 'music_landing', label: 'Nhạc ngắn khi bước xuống máy bay (đầu chương 4)', group: 'music', cat: 'Nhạc & khung cảnh' },
    { key: 'customs_stamp', label: 'Tiếng đóng dấu nhập cảnh', group: 'sfx', cat: 'Nhạc & khung cảnh' },
    { key: 'welcome_jingle', label: 'Nhạc chào mừng sau khi qua cửa hải quan (đầu chương 5)', group: 'music', cat: 'Nhạc & khung cảnh' },
    { key: 'uber_arrive', label: 'Báo xe Uber tới', group: 'sfx', cat: 'Nhạc & khung cảnh' },
    { key: 'car_door', label: 'Mở / đóng cửa xe', group: 'sfx', cat: 'Nhạc & khung cảnh' },
    { key: 'door_chime', label: 'Chuông cửa khi bước vào quán', group: 'sfx', cat: 'Nhạc & khung cảnh' },
    { key: 'iced_capp_sip', label: 'Hút ống hút Iced Capp', group: 'sfx', cat: 'Ở Tims' },
    { key: 'timbits_open', label: 'Mở hộp Timbits', group: 'sfx', cat: 'Ở Tims' },
    { key: 'tims_order_ding', label: 'Màn hình gọi số ở Tims', group: 'sfx', cat: 'Ở Tims' },
    { key: 'presto_tap', label: 'Chạm thẻ PRESTO', group: 'sfx', cat: 'Đi lại' },
    { key: 'train_arrive', label: 'Tàu điện ngầm vào ga', group: 'sfx', cat: 'Đi lại' },
    { key: 'train_announce', label: 'Chuông thông báo trên tàu', group: 'sfx', cat: 'Đi lại' },
    { key: 'footstep', label: 'Tiếng bước chân', group: 'sfx', cat: 'Đi lại', volume: 0.5 },
    { key: 'correct', label: 'Trả lời chuẩn', group: 'sfx', cat: 'Phản hồi' },
    { key: 'funny', label: 'Trả lời hài hước (vẫn qua)', group: 'sfx', cat: 'Phản hồi' },
    { key: 'wrong', label: 'Trả lời chưa ổn', group: 'sfx', cat: 'Phản hồi' },
    { key: 'item_get', label: 'Nhận đồ vào túi', group: 'sfx', cat: 'Phản hồi' },
    { key: 'chapter_done', label: 'Hoàn thành chương', group: 'sfx', cat: 'Phản hồi' },
    { key: 'music_airport', label: 'Nhạc nền sân bay', group: 'music', loop: 1, cat: 'Nhạc nền từng khu' },
    { key: 'music_koreatown', label: 'Nhạc nền phố Hàn trên Yonge St', group: 'music', loop: 1, cat: 'Nhạc nền từng khu' },
    { key: 'music_tims', label: 'Nhạc nền trong quán Tims', group: 'music', loop: 1, cat: 'Nhạc nền từng khu' },
    { key: 'music_downtown', label: 'Nhạc nền Downtown', group: 'music', loop: 1, cat: 'Nhạc nền từng khu' },
    { key: 'music_map', label: 'Nhạc nền bản đồ & căn hộ North York', group: 'music', loop: 1, cat: 'Nhạc nền từng khu' }
  ];
  const DEF = {}; DEFAULTS.forEach(d => { DEF[d.key] = d; });
  const groupOf = key => (DEF[key] && DEF[key].group) || (/^voice:/.test(key) ? 'voice' : /^music/.test(key) ? 'music' : 'sfx');

  /* ---------- tuỳ chọn người chơi (nhớ trong máy) ---------- */
  const LS = 'rpg-sound-v1';
  const prefs = { music: true, sfx: true, mv: 0.5, sv: 0.85 };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { }
  const savePrefs = () => { try { localStorage.setItem(LS, JSON.stringify(prefs)); } catch (e) { } };

  /* ---------- Web Audio ---------- */
  let ctx = null, bus = null, noiseBuf = null, unlocked = false;
  function ac() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    const g = () => ctx.createGain();
    bus = { master: g(), music: g(), duck: g(), sfx: g(), voice: g(), preview: g() };
    bus.music.connect(bus.duck); bus.duck.connect(bus.master);
    bus.sfx.connect(bus.master); bus.voice.connect(bus.master); bus.preview.connect(bus.master);
    bus.master.connect(ctx.destination);
    applyVol();
    return ctx;
  }
  function applyVol() {
    if (!ctx) return; const t = ctx.currentTime;
    bus.music.gain.setTargetAtTime(prefs.music ? prefs.mv : 0, t, 0.08);
    bus.sfx.gain.setTargetAtTime(prefs.sfx ? prefs.sv : 0, t, 0.05);
  }
  /* iPhone / Android chỉ cho phát tiếng sau lần chạm đầu tiên */
  function unlock() {
    const c = ac(); if (!c) return;
    if (c.state === 'suspended' && c.resume) c.resume().catch(() => { });
    if (unlocked) return; unlocked = true;
    try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) { }
  }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));

  /* ---------- nguồn âm ---------- */
  let remote = {}, local = {}, localLoaded = null;
  const dec = {}, loading = {}, bad = {};
  function loadLocal() {
    if (localLoaded) return localLoaded;
    localLoaded = fetch(BASE + 'sounds.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).then(j => {
      local = {};
      Object.keys(j || {}).forEach(k => { if (k.charAt(0) === '_') return; const v = j[k]; if (!v) return; const e = typeof v === 'string' ? { file: v } : Object.assign({}, v); if (e.file) e.url = new URL(e.file, BASE).href; local[k] = e; });
    }).catch(() => { local = {}; });
    return localLoaded;
  }
  function setRemote(map) { remote = {}; Object.values(map || {}).forEach(d => { if (d && d.key) remote[d.key] = d; }); }
  function entry(key, over) {
    const r = over || remote[key], l = local[key], d = DEF[key];
    const src = (r && r.url && !bad[r.url]) ? r : (l && l.url && !bad[l.url]) ? l : null;
    const pick = f => (r && r[f] != null && r[f] !== '') ? r[f] : (l && l[f] != null) ? l[f] : d ? d[f] : null;
    const vol = pick('volume'), loop = pick('loop');
    return { key, url: src ? src.url : null, from: src && src === r ? 'upload' : src ? 'file' : 'default', volume: vol == null ? 1 : Math.max(0, Math.min(1.5, +vol)), loop: !!loop, group: groupOf(key) };
  }
  function load(url) {
    if (dec[url]) return Promise.resolve(dec[url]);
    if (loading[url]) return loading[url];
    const c = ac(); if (!c) return Promise.reject(new Error('no audio'));
    loading[url] = fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(a => new Promise((ok, no) => { const p = c.decodeAudioData(a, ok, no); if (p && p.then) p.then(ok, no); }))
      .then(b => { dec[url] = b; delete loading[url]; return b; })
      .catch(e => { bad[url] = 1; delete loading[url]; throw e; });
    return loading[url];
  }
  function playBuf(b, out, vol, loop) {
    const c = ctx, g = c.createGain(), s = c.createBufferSource(); g.gain.value = vol; s.buffer = b; s.loop = !!loop; s.connect(g); g.connect(out); s.start();
    const h = { src: s, g, done: new Promise(ok => { s.onended = () => ok(true); }), stop(f) { try { if (f) { g.gain.setTargetAtTime(0, c.currentTime, f / 3); setTimeout(() => { try { s.stop(); g.disconnect(); } catch (e) { } }, f * 1000 + 60); } else { s.stop(); g.disconnect(); } } catch (e) { } } };
    return h;
  }

  /* ---------- phát một sự kiện ---------- */
  function play(key, o) {
    o = o || {}; if (!key) return null;
    const e = entry(key, o.entry); const grp = e.group;
    if (!o.preview && ((grp === 'sfx' && !prefs.sfx) || (grp === 'music' && !prefs.music))) return null;
    const c = ac(); if (!c) return null;
    if (grp === 'music' && e.loop && !o.preview && !o.once) { music(key); return null; }
    const out = o.preview ? bus.preview : grp === 'music' ? bus.music : grp === 'voice' ? bus.voice : bus.sfx;
    const vol = e.volume * (o.volume == null ? 1 : o.volume), loop = o.preview && e.loop;
    const h = { stopped: false, inner: null, stop(f) { this.stopped = true; if (this.inner) this.inner.stop(f); } };
    if (e.url) {
      const t0 = performance.now();
      const go = b => { if (h.stopped) return; if (!o.preview && performance.now() - t0 > 2500) return; h.inner = playBuf(b, out, vol, loop); };
      if (dec[e.url]) go(dec[e.url]);
      else load(e.url).then(go).catch(() => { if (!h.stopped) h.inner = synth(key, out, vol, loop); });
    } else h.inner = synth(key, out, vol, loop);
    return h;
  }

  /* ---------- nhạc nền: một bản tại một thời điểm, mờ dần khi đổi khu ---------- */
  let cur = null, want = null;
  function music(key) {
    want = key || null;
    if (cur && cur.key === key) return;
    if (cur) { cur.stop(1.4); cur = null; }
    if (!key || !prefs.music) return;
    const c = ac(); if (!c) return;
    const e = entry(key); const g = c.createGain(); g.gain.value = 0; g.connect(bus.music);
    const h = { key, g, inner: null, stopped: false, stop(f) { this.stopped = true; const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, (f || 0.3) / 3); const inner = this.inner; setTimeout(() => { try { if (inner) inner.stop(); g.disconnect(); } catch (er) { } }, (f || 0.3) * 1000 + 80); } };
    cur = h;
    const fadeIn = () => g.gain.setTargetAtTime(e.volume, c.currentTime + 0.05, 0.5);
    const useSynth = () => { if (h.stopped) return; h.inner = synthMusic(key, g); fadeIn(); };
    if (e.url) {
      const start = b => { if (h.stopped) return; h.inner = playBuf(b, g, 1, e.loop !== false || !DEF[key] || DEF[key].loop); fadeIn(); };
      if (dec[e.url]) start(dec[e.url]); else load(e.url).then(start).catch(useSynth);
    } else useSynth();
  }
  let duckN = 0;
  function duck(on) {
    duckN = Math.max(0, duckN + (on ? 1 : -1)); if (!ctx) return;
    bus.duck.gain.setTargetAtTime(duckN ? 0.28 : 1, ctx.currentTime, 0.18);
  }

  /* ---------- câu thoại thu sẵn ---------- */
  let voiceNow = null;
  function hasVoice(id) { return !!(id && entry('voice:' + id).url); }
  function playVoice(id) {
    const e = entry('voice:' + id); if (!e.url) return null;
    const c = ac(); if (!c) return null;
    stopVoice();
    const t0 = performance.now();
    return load(e.url).then(b => {
      if (performance.now() - t0 > 4000) return false;
      stopVoice(); duck(true); const h = playBuf(b, bus.voice, e.volume, false); voiceNow = h;
      return h.done.then(() => { if (voiceNow === h) { voiceNow = null; duck(false); } return true; });
    }).catch(() => false);
  }
  function stopVoice() { if (voiceNow) { const h = voiceNow; voiceNow = null; h.stop(); duck(false); } }

  /* =================== âm mặc định tự tạo =================== */
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function noise() { if (noiseBuf) return noiseBuf; const n = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return noiseBuf; }
  function env(gn, t, a, peak, dur, rel) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); gn.gain.setTargetAtTime(0.0001, t + Math.max(a, dur), rel || 0.08); }
  function tone(dest, t, freq, dur, o) {
    o = o || {}; const c = ctx, os = c.createOscillator(), g = c.createGain();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(freq, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = freq * 0.03; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + 0.5); }
    env(g, t, o.a || 0.008, o.g || 0.3, dur, o.r || 0.06);
    let node = os;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); node = f; }
    node.connect(g); g.connect(dest); os.start(t); os.stop(t + dur + (o.r || 0.06) * 6 + 0.05);
  }
  function bell(dest, t, m, dur, gv) { const f = mf(m); tone(dest, t, f, 0.02, { g: gv || 0.25, r: dur / 4 }); tone(dest, t, f * 2.01, 0.02, { g: (gv || 0.25) * 0.25, r: dur / 7 }); tone(dest, t, f * 3.98, 0.01, { g: (gv || 0.25) * 0.08, r: dur / 10 }); }
  function hiss(dest, t, dur, o) {
    o = o || {}; const c = ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise(); s.loop = true; f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 800, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 0.8;
    env(g, t, o.a || 0.005, o.g || 0.4, dur, o.r || 0.04);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + (o.r || 0.04) * 6 + 0.05);
  }
  const SFX = {
    correct(d, t) { tone(d, t, mf(76), 0.09, { type: 'triangle', g: 0.32 }); tone(d, t + 0.1, mf(83), 0.16, { type: 'triangle', g: 0.32 }); },
    funny(d, t) { tone(d, t, 260, 0.45, { to: 720, slide: 0.18, vib: 11, g: 0.28 }); tone(d, t + 0.2, 720, 0.25, { to: 240, slide: 0.25, g: 0.22 }); },
    wrong(d, t) { tone(d, t, 230, 0.12, { type: 'square', g: 0.12, lp: 900 }); tone(d, t + 0.14, 160, 0.22, { type: 'square', g: 0.12, lp: 700, to: 120 }); },
    item_get(d, t) { [72, 76, 79, 84].forEach((m, i) => tone(d, t + i * 0.07, mf(m), 0.09, { type: 'triangle', g: 0.25 })); bell(d, t + 0.3, 96, 0.8, 0.08); },
    chapter_done(d, t) { [67, 72, 76].forEach((m, i) => tone(d, t + i * 0.13, mf(m), 0.12, { type: 'triangle', g: 0.25 })); [72, 76, 79, 84].forEach(m => tone(d, t + 0.42, mf(m), 0.7, { type: 'triangle', g: 0.13, r: 0.3 })); },
    customs_stamp(d, t) { hiss(d, t, 0.03, { f: 3000, g: 0.25 }); tone(d, t + 0.02, 110, 0.12, { to: 55, g: 0.6 }); hiss(d, t + 0.02, 0.1, { f: 380, g: 0.5 }); hiss(d, t + 0.16, 0.02, { f: 2500, type: 'highpass', g: 0.08 }); },
    uber_arrive(d, t) { [0, 0.42].forEach(o => { bell(d, t + o, 88, 0.6, 0.18); bell(d, t + o + 0.13, 93, 0.9, 0.18); }); },
    car_door(d, t) { hiss(d, t, 0.05, { f: 1800, type: 'bandpass', g: 0.12 }); hiss(d, t + 0.05, 0.14, { f: 500, to: 200, g: 0.55 }); tone(d, t + 0.05, 85, 0.12, { to: 50, g: 0.5 }); },
    door_chime(d, t) { bell(d, t, 84, 1.4, 0.2); bell(d, t + 0.32, 79, 1.8, 0.2); },
    iced_capp_sip(d, t) { [0, 0.24, 0.5].forEach((o, i) => hiss(d, t + o, 0.16 + i * 0.03, { type: 'bandpass', f: 700 + i * 200, to: 2400 + i * 400, q: 4, g: 0.35 })); tone(d, t + 0.78, 330, 0.12, { to: 220, g: 0.08 }); },
    timbits_open(d, t) { for (let i = 0; i < 6; i++) hiss(d, t + i * 0.045 + Math.random() * 0.02, 0.025, { type: 'highpass', f: 1600 + Math.random() * 1500, g: 0.22 }); tone(d, t + 0.34, 620, 0.07, { to: 180, g: 0.35 }); },
    tims_order_ding(d, t) { bell(d, t, 81, 1.0, 0.22); bell(d, t + 0.35, 77, 1.4, 0.22); },
    presto_tap(d, t) { tone(d, t, 1250, 0.06, { type: 'square', g: 0.07 }); tone(d, t + 0.09, 1680, 0.1, { type: 'square', g: 0.07 }); },
    train_arrive(d, t) { hiss(d, t, 3.2, { f: 160, to: 900, g: 0.4, a: 1.8, r: 0.5 }); tone(d, t + 0.4, 300, 2.6, { to: 760, slide: 2.4, g: 0.05, a: 1.2, r: 0.4 }); [1.2, 1.55, 1.9, 2.25].forEach(o => hiss(d, t + o, 0.05, { f: 300, g: 0.3 })); hiss(d, t + 3.0, 0.6, { type: 'highpass', f: 3000, to: 1500, g: 0.12, r: 0.2 }); },
    train_announce(d, t) { [72, 76, 79].forEach((m, i) => bell(d, t + i * 0.34, m, 1.3, 0.2)); },
    footstep(d, t) { hiss(d, t, 0.045, { f: 280 + Math.random() * 260, g: 0.5 }); tone(d, t, 70 + Math.random() * 20, 0.04, { to: 45, g: 0.25 }); },
    music_landing(d, t) { [67, 72, 76, 79].forEach((m, i) => tone(d, t + i * 0.16, mf(m), 0.15, { type: 'triangle', g: 0.22 })); [72, 76, 79, 84].forEach(m => tone(d, t + 0.66, mf(m), 1.1, { type: 'sine', g: 0.12, r: 0.4 })); bell(d, t + 0.66, 96, 1.5, 0.06); },
    welcome_jingle(d, t) { [72, 74, 76, 79, 76, 79, 84].forEach((m, i) => tone(d, t + i * 0.13, mf(m), 0.12, { type: 'triangle', g: 0.22 })); [60, 64, 67, 72].forEach(m => tone(d, t + 0.95, mf(m), 1.0, { type: 'sine', g: 0.1, r: 0.4 })); }
  };
  function synth(key, out, vol, loop) {
    const c = ac(); if (!c) return null;
    const g = c.createGain(); g.gain.value = vol; g.connect(out);
    if (groupOf(key) === 'music' && (loop || !SFX[key])) { const m = synthMusic(key, g); return { stop() { m.stop(); setTimeout(() => { try { g.disconnect(); } catch (e) { } }, 400); } }; }
    const fn = SFX[key] || (k => (d, t) => { const b = 70 + (k.length * 7) % 14; tone(d, t, mf(b), 0.08, { type: 'triangle', g: 0.25 }); tone(d, t + 0.09, mf(b + 7), 0.14, { type: 'triangle', g: 0.25 }); })(key);
    fn(g, c.currentTime + 0.01);
    return { stop() { try { g.disconnect(); } catch (e) { } } };
  }

  /* nhạc nền tự tạo: vòng hợp âm + bass + giai điệu lặp 8 ô nhịp (tự sáng tác bằng thuật toán, không có bản quyền) */
  const SONGS = {
    music_airport: { bpm: 88, root: 57, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], scale: [0, 2, 4, 7, 9], lead: 'sine', drums: 0, density: 0.45 },
    music_koreatown: { bpm: 114, root: 62, prog: [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [-5, -2, 2, 5]], scale: [0, 3, 5, 7, 10], lead: 'square', drums: 2, density: 0.7 },
    music_tims: { bpm: 96, root: 60, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], scale: [0, 2, 4, 7, 9, 11], lead: 'triangle', drums: 1, density: 0.55 },
    music_downtown: { bpm: 122, root: 55, prog: [[0, 4, 7, 12], [7, 11, 14, 19], [9, 12, 16, 21], [5, 9, 12, 17]], scale: [0, 2, 4, 7, 9], lead: 'square', drums: 2, density: 0.75 },
    music_map: { bpm: 80, root: 64, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], scale: [0, 3, 5, 7, 10], lead: 'triangle', drums: 1, density: 0.4 }
  };
  function synthMusic(key, dest) {
    const c = ctx; let sg = SONGS[key];
    if (!sg) { let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0; const ks = Object.keys(SONGS); sg = SONGS[ks[h % ks.length]]; }
    const eighth = 60 / sg.bpm / 2; let next = c.currentTime + 0.1, step = 0, stopped = false;
    const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(dest);
    function schedule() {
      if (stopped) return;
      while (next < c.currentTime + 0.35) {
        const bar = Math.floor(step / 8), pos = step % 8, chord = sg.prog[bar % sg.prog.length], r = sg.root, t = next;
        if (pos === 0) chord.forEach(n => tone(lp, t, mf(r + n), eighth * 7.5, { type: 'triangle', g: 0.045, a: 0.08, r: 0.25 }));
        if (pos === 0 || pos === 4 || (sg.drums > 1 && pos === 6)) tone(lp, t, mf(r + chord[0] - 12), eighth * 1.6, { type: 'sine', g: 0.2, r: 0.08 });
        if (sg.drums) { if (pos % 4 === 0) tone(dest, t, 120, 0.06, { to: 45, g: 0.25 }); if (pos % 2 === 1) hiss(dest, t, 0.02, { type: 'highpass', f: 7000, g: sg.drums > 1 ? 0.06 : 0.035 }); if (sg.drums > 1 && pos === 4) hiss(dest, t, 0.08, { type: 'bandpass', f: 1800, g: 0.09 }); }
        const seed = (bar % 8) * 8 + pos;
        if (rnd(seed) < sg.density && !(bar % 8 === 7 && pos > 4)) {
          const deg = Math.floor(rnd(seed + 99) * sg.scale.length), oct = rnd(seed + 7) < 0.3 ? 24 : 12;
          const n = pos % 4 === 0 ? chord[Math.floor(rnd(seed + 3) * 3)] + 12 : sg.scale[deg] + oct;
          tone(lp, t, mf(r + n), eighth * (rnd(seed + 5) < 0.3 ? 1.8 : 0.85), { type: sg.lead, g: sg.lead === 'square' ? 0.035 : 0.07, r: 0.06 });
        }
        next += eighth; step++;
      }
    }
    schedule(); const iv = setInterval(schedule, 90);
    return { stop() { stopped = true; clearInterval(iv); try { lp.disconnect(); } catch (e) { } } };
  }

  /* ---------- xem trước (trang giáo viên) ---------- */
  let prevH = null;
  function preview(key, over) { stopPreview(); unlock(); prevH = play(key, { preview: true, entry: over }); return prevH; }
  function stopPreview() { if (prevH) { prevH.stop(); prevH = null; } }

  /* ---------- công khai ---------- */
  R.Sound = {
    DEFAULTS, BASE, prefs, groupOf, entry,
    init(o) { o = o || {}; setRemote(o.remote); ac(); return loadLocal().then(() => { Object.keys(Object.assign({}, local, remote)).forEach(k => { const e = entry(k); if (e.url && e.group === 'sfx') load(e.url).catch(() => { }); }); }); },
    setRemote, loadLocal, play, music, duck, hasVoice, playVoice, stopVoice, preview, stopPreview, unlock,
    localEntries: () => local,
    current: () => cur && cur.key,
    set(k, v) { prefs[k] = v; savePrefs(); applyVol(); if ((k === 'music') && v && want && !cur) music(want); if (k === 'music' && !v && cur) { cur.stop(0.6); cur = null; } },
    stopAll() { const w = want; music(null); want = w; stopVoice(); stopPreview(); duckN = 0; if (ctx) bus.duck.gain.value = 1; }
  };
})();
