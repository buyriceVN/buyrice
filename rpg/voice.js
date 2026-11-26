/* Du học Toronto – giọng đọc từng nhân vật
   - Mỗi nhân vật có hồ sơ giọng: giới tính (g), cao độ (pitch), tốc độ (rate) – lấy từ R.LOOKS (data.js), ghi đè được bằng npc.vg / npc.rate.
   - Chọn giọng tốt nhất có trên máy: ưu tiên en-CA rồi en-US; ưu tiên tên có Natural / Neural / Enhanced / Premium / Google…;
     tách giọng nam & nữ, mỗi nhân vật một giọng khác nhau nếu máy có đủ giọng.
   - Câu thoại có file thu sẵn (key 'voice:<id câu>' trong trang "🎵 Âm thanh game" hoặc sounds.json) thì phát file thay cho giọng máy. */
(function () {
  const R = window.TorontoRPG = window.TorontoRPG || {};
  const OK = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  R.canSpeak = OK;

  const FEMALE = /\b(samantha|karen|victoria|allison|ava|susan|zira|jenny|aria|emma|joanna|salli|kendra|kimberly|ivy|tessa|moira|fiona|serena|clara|nora|libby|sonia|michelle|natasha|linda|heather|catherine|female|woman|zoe|nicky|shelley|sandy|flo|grandma|martha|kathy|vicki|amy|olivia|emily|hazel|sara|jessa|nancy|monica|ana|elizabeth|jane|ruth|kate|lisa|anna|siri female)\b/i;
  const MALE = /\b(daniel|alex|fred|david|mark|guy|eric|ryan|tom|aaron|arthur|oliver|james|liam|christopher|roger|steffan|brian|rishi|male|reed|ralph|junior|grandpa|rocko|albert|bruce|gordon|lee|thomas|george|andrew|william|davis|tony|jason|matthew|evan|nathan|noah|ethan|gary|richard|sam|siri male)\b/i;
  const genderOf = v => /google us english/i.test(v.name) ? 'f' : FEMALE.test(v.name) ? 'f' : MALE.test(v.name) ? 'm' : '?';
  function score(v) {
    let s = 0; const L = String(v.lang || '').replace('_', '-').toLowerCase(), n = v.name || '';
    s += L === 'en-ca' ? 6 : L === 'en-us' ? 5 : L === 'en-gb' ? 2 : 1;
    if (/natural|neural|enhanced|premium|online|siri|wavenet/i.test(n)) s += 5;
    if (/google/i.test(n)) s += 3;
    if (/compact|espeak|robot|novelty|whisper|bells|bubbles|bad news|boing|cellos|trinoids|zarvox|jester|organ|superstar|wobble|albert|bahh/i.test(n)) s -= 12;
    if (v.localService === false) s += 1;
    return s;
  }
  const vkey = v => v.voiceURI || v.name;

  let voices = [], assigned = {};
  function refresh() { try { voices = OK ? speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang || '')) : []; } catch (e) { voices = []; } assigned = {}; }
  if (OK) { refresh(); try { speechSynthesis.addEventListener('voiceschanged', refresh); } catch (e) { } }

  /* hồ sơ giọng của một NPC (hoặc của người dẫn chuyện) */
  function profile(n) {
    if (!n) return { id: '_narrator', g: 'f', pitch: 1, rate: 0.95 };
    const L = (R.LOOKS && R.LOOKS[n.voice || n.look]) || {};
    const pitch = n.pitch || L.pitch || 1;
    return { id: n.vid || n.id || n.voice || n.look || '_npc', g: n.vg || L.g || (pitch >= 1.1 ? 'f' : 'm'), pitch, rate: n.rate || L.rate || 0.95 };
  }
  function voiceFor(p) {
    if (Object.prototype.hasOwnProperty.call(assigned, p.id)) return assigned[p.id];
    if (!voices.length) refresh();
    let cand = voices.filter(v => genderOf(v) === p.g);
    const exact = cand.length > 0;
    if (!cand.length) cand = voices.filter(v => genderOf(v) === '?');
    if (!cand.length) cand = voices.slice();
    if (!cand.length) return null;              // chưa tải xong danh sách giọng – lần sau thử lại
    const used = {}; Object.values(assigned).forEach(a => { if (a && a.v) used[vkey(a.v)] = (used[vkey(a.v)] || 0) + 1; });
    let best = null, bs = -1e9;
    cand.forEach(v => { const s = score(v) - (used[vkey(v)] || 0) * 3.5; if (s > bs) { bs = s; best = v; } });
    return (assigned[p.id] = { v: best, exact, share: used[vkey(best)] || 0 });
  }

  /* mở khoá giọng đọc trên điện thoại ở lần chạm đầu tiên */
  let unlocked = false;
  function unlockSpeech() {
    if (!OK || unlocked) return; unlocked = true;
    try { const u = new SpeechSynthesisUtterance('.'); u.volume = 0; u.lang = 'en-US'; speechSynthesis.speak(u); speechSynthesis.resume(); } catch (e) { }
  }
  ['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockSpeech, { capture: true, passive: true }));

  let token = 0, duckTimer = 0, ducked = false;
  function setDuck(on) { if (!R.Sound) return; if (on && !ducked) { ducked = true; R.Sound.duck(true); } else if (!on && ducked) { ducked = false; R.Sound.duck(false); } }
  const clean = t => String(t || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\bthe 6ix\b/gi, 'the six').replace(/\b6ix\b/g, 'six').replace(/🍁|[\u{1F300}-\u{1FAFF}]/gu, '').replace(/…/g, '...');

  function tts(text, o, my) {
    if (!OK) return;
    const p = profile(o.who), a = voiceFor(p);
    let pitch = p.pitch;
    if (a && a.exact) pitch = 1 + (p.pitch - 1) * 0.35;           // đã có giọng đúng giới tính → chỉ chỉnh nhẹ cho khác nhau
    if (a && a.share) pitch += (a.share % 2 ? 0.08 : -0.08) * Math.ceil(a.share / 2);   // dùng chung giọng → đổi cao độ để phân biệt
    const u = new SpeechSynthesisUtterance(clean(text));
    if (a && a.v) { u.voice = a.v; u.lang = a.v.lang; } else u.lang = 'en-CA';
    u.rate = o.rate || p.rate || 0.95; u.pitch = Math.max(0.5, Math.min(1.8, pitch)); u.volume = 1;
    u.onstart = () => { if (my === token) setDuck(true); };
    u.onend = u.onerror = () => { if (my === token) setDuck(false); };
    clearTimeout(duckTimer); duckTimer = setTimeout(() => { if (my === token) setDuck(false); }, 1800 + String(text).length * 85);
    const go = () => { if (my !== token) return; try { speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) { } };
    // Chrome trên Android bỏ qua câu mới nếu gọi speak ngay sau cancel → chờ ~90ms
    try { if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(go, 90); } else go(); } catch (e) { }
  }

  /* đọc một câu: o = { who: npc, id: id câu thoại, rate } */
  R.say = function (text, o) {
    o = o || {}; if (!text) return;
    const my = ++token;
    if (R.Sound) R.Sound.stopVoice();
    if (o.id && R.Sound && R.Sound.hasVoice(o.id)) {
      try { if (OK && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch (e) { }
      const pr = R.Sound.playVoice(o.id);
      if (pr) { pr.then(ok => { if (!ok && my === token) tts(text, o, my); }); return; }
    }
    tts(text, o, my);
  };
  R.stopSpeech = function () { token++; try { if (OK) speechSynthesis.cancel(); } catch (e) { } if (R.Sound) R.Sound.stopVoice(); setDuck(false); };
  /* tương thích code cũ: R.speak(text, pitch) */
  R.speak = function (text, x) { R.say(text, typeof x === 'object' && x ? x : {}); };
  R.voiceInfo = function (n) { const p = profile(n), a = voiceFor(p); return { profile: p, voice: a && a.v ? a.v.name + ' (' + a.v.lang + ')' : null }; };
  R.voiceList = () => voices.map(v => ({ name: v.name, lang: v.lang, g: genderOf(v), score: score(v) }));
})();
