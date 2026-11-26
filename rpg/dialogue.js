/* Du học Toronto – hệ thống hội thoại & luyện tiếng Anh */
(function () {
  const R = window.TorontoRPG;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  R.esc = esc;

  /* ---------- giọng đọc (Web Speech API, có dự phòng) ---------- */
  R.canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  R.canListen = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  R.speak = function (text, pitch) {
    if (!R.canSpeak || !text) return;
    if (window.appSpeak) { window.appSpeak(text, { pitch: pitch || 1, rate: 0.92 }); return; }
    try {
      const u = new SpeechSynthesisUtterance(String(text).replace(/[“”]/g, '"')); u.lang = 'en-US'; u.rate = 0.92; u.pitch = pitch || 1;
      const vs = speechSynthesis.getVoices(); const v = vs.find(x => /^en[-_](US|CA)/i.test(x.lang)) || vs.find(x => /^en/i.test(x.lang)); if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { }
  };
  try { if (R.canSpeak) speechSynthesis.getVoices(); } catch (e) { }

  /* so khớp câu nói/gõ với các lựa chọn */
  const words = t => String(t).toLowerCase().replace(/[“”"'.,!?;:()]/g, ' ').replace(/\bi'm\b/g, 'i am').split(/\s+/).filter(Boolean);
  R.similarity = function (said, target) { const A = new Set(words(said)), B = words(target); if (!B.length || !A.size) return 0; let hit = 0; B.forEach(w => { if (A.has(w)) hit++; }); return hit / Math.max(B.length, A.size); };

  /* ---------- hộp thoại ----------
     opts: { el, name, vi(), voice(), onItem(id), onPoints(n, label), onLearn(entry), onEnd(result) } */
  R.Dialogue = function (opts) {
    const el = opts.el; let D = null;
    const fill = t => String(t || '').replace(/\{name\}/g, opts.name);
    function start(npc, steps, meta) {
      D = { npc, steps, i: 0, phase: '', line: null, picked: null, wrong: {}, hint: false, tip: null, better: null, learned: 0, miss: 0, meta: meta || {} };
      el.hidden = false; run();
    }
    const pitchOf = who => { const n = who || D.npc; const look = R.LOOKS[(n && (n.voice || n.look)) || ''] || {}; return look.pitch || 1; };
    const nameOf = () => D.npc.name;
    function run() {
      D.hint = false; D.tip = null; D.better = null; D.retry = false;
      while (D.i < D.steps.length && D.steps[D.i].t === 'i') { opts.onItem(D.steps[D.i].item); D.i++; }
      if (D.i >= D.steps.length) return end(true);
      const st = D.steps[D.i];
      if (st.t === 's') { D.line = { en: fill(st.en), vi: fill(st.vi) }; D.picked = null; D.wrong = {}; D.phase = 'line'; if (opts.voice()) R.speak(D.line.en, pitchOf()); const nx = D.steps[D.i + 1]; if (nx && nx.t === 'c') { D.i++; D.phase = 'choose'; } }
      else if (st.t === 'c') { D.phase = 'choose'; D.picked = null; D.wrong = {}; }
      else if (st.t === 'n') { D.phase = 'narr'; }
      paint();
    }
    function next() {
      if (!D) return;
      if (D.phase === 'react' || D.phase === 'line' || D.phase === 'narr') { D.i++; run(); }
    }
    function choose(k) {
      const st = D.steps[D.i]; if (!st || st.t !== 'c' || D.phase !== 'choose' || D.wrong[k] || !st.opts[k]) return;
      const o = st.opts[k]; const first = !Object.keys(D.wrong).length;
      D.picked = { en: fill(o.en), ok: o.ok };
      if (o.r) { D.line = { en: fill(o.r[0]), vi: fill(o.r[1]) }; if (opts.voice()) setTimeout(() => R.speak(D.line.en, pitchOf()), 60); }
      if (o.ok >= 1) {
        D.phase = 'react'; D.tip = o.tip || null; const pts = first ? 10 : 4; opts.onPoints(pts, first ? '+10 🍁' : '+4 🍁');
        opts.onLearn({ en: fill(o.en), tip: o.tip || st.hint || '' }); D.learned++;
      } else if (o.ok > 0) {
        D.phase = 'react'; opts.onPoints(3, '+3 😆'); const best = st.opts.find(x => x.ok >= 1); D.better = best ? fill(best.en) : null; D.tip = o.tip || null;
        if (best) { opts.onLearn({ en: fill(best.en), tip: best.tip || st.hint || '' }); D.learned++; }
      } else { D.wrong[k] = 1; D.miss++; D.phase = 'choose'; D.tip = o.tip || st.hint || null; D.retry = true; if (opts.onWrong) opts.onWrong(); }
      paint();
    }
    function end(completed) { const r = { completed, learned: D ? D.learned : 0, miss: D ? D.miss : 0, npc: D && D.npc, meta: D && D.meta }; D = null; el.hidden = true; el.innerHTML = ''; try { speechSynthesis.cancel(); } catch (e) { } opts.onEnd(r); }
    function paint() {
      const st = D.steps[D.i], vi = opts.vi();
      let h = '<div class="tr-dhead"><span class="tr-dname">' + (D.npc.object ? ({ phone: '📱 ', kiosk: '🖥️ ', seat: '💺 ' }[D.npc.kind] || '👉 ') : '💬 ') + esc(nameOf()) + '</span><span class="grow"></span><button class="tr-dx" data-d="quit" title="Rời cuộc trò chuyện">✕</button></div>';
      if (D.phase === 'narr') h += '<div class="tr-narr">' + esc(fill(st.vi)) + '</div>';
      if (D.picked) h += '<div class="tr-me"><b>' + esc(opts.name) + ':</b> ' + esc(D.picked.en) + '</div>';
      if (D.line && D.phase !== 'narr') h += '<div class="tr-line"><span class="tr-en">' + esc(D.line.en) + '</span>' + (R.canSpeak ? ' <button class="tr-sp" data-d="say" title="Nghe phát âm">🔊</button>' : '') + (vi ? '<div class="tr-vi">' + esc(D.line.vi) + '</div>' : '<button class="tr-vb" data-d="vi1">Xem nghĩa tiếng Việt</button>') + '</div>';
      if (D.phase === 'choose') {
        h += '<div class="tr-q">' + (D.retry && Object.keys(D.wrong).length ? '<span class="tr-bad">Chưa ổn lắm, thử câu khác nhé!</span>' : 'Em trả lời thế nào?') + '</div>';
        if (D.tip && Object.keys(D.wrong).length) h += '<div class="tr-tip">💡 ' + esc(D.tip) + '</div>';
        h += '<div class="tr-opts">' + st.opts.map((o, k) => '<button class="tr-opt' + (D.wrong[k] ? ' bad' : '') + '" data-d="opt" data-k="' + k + '"' + (D.wrong[k] ? ' disabled' : '') + '><b>' + (k + 1) + '</b>' + esc(fill(o.en)) + '</button>').join('') + '</div>';
        h += '<div class="tr-tools"><button class="tr-tb" data-d="hint">💡 Gợi ý</button>' + (R.canListen ? '<button class="tr-tb" data-d="mic">🎤 Nói</button>' : '') + '<form class="tr-type" data-d="typeform"><input placeholder="Hoặc tự gõ câu trả lời tiếng Anh…" autocomplete="off"><button class="tr-tb">Gửi</button></form></div>';
        if (D.hint) h += '<div class="tr-hint">' + esc(st.hint || '') + '</div>';
      } else if (D.phase === 'react') {
        if (D.better) h += '<div class="tr-tip">✅ Câu chuẩn hơn: <b>' + esc(D.better) + '</b>' + (R.canSpeak ? ' <button class="tr-sp" data-d="saybetter">🔊</button>' : '') + '</div>';
        if (D.tip) h += '<div class="tr-tip">💡 ' + esc(D.tip) + '</div>';
        h += '<div class="tr-act"><button class="tr-next" data-d="next">Tiếp ▶ <small>Enter</small></button></div>';
      } else {
        h += '<div class="tr-act"><button class="tr-next" data-d="next">Tiếp ▶ <small>Enter</small></button></div>';
      }
      el.innerHTML = h;
      const inp = el.querySelector('.tr-type input'); if (inp && D.typed) { inp.value = D.typed; D.typed = ''; }
    }
    function matchSaid(alts) {
      const st = D.steps[D.i]; let best = -1, bs = 0;
      st.opts.forEach((o, k) => { if (D.wrong[k]) return; alts.forEach(a => { const v = R.similarity(a, fill(o.en)); if (v > bs) { bs = v; best = k; } }); });
      return bs >= 0.45 ? best : -1;
    }
    function mic(btn) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
      const rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 3;
      btn.textContent = '🎙️ Đang nghe…'; btn.disabled = true;
      rec.onresult = e => { const alts = [...e.results[0]].map(a => a.transcript); const k = matchSaid(alts); if (k >= 0) { opts.toast('Nghe được: “' + alts[0] + '”'); choose(k); } else { opts.toast('Mình nghe được: “' + (alts[0] || '…') + '”. Nói lại rõ hơn hoặc bấm chọn nhé.'); paint(); } };
      rec.onerror = () => { opts.toast('Chưa nghe được. Hãy cho phép dùng micro rồi thử lại.'); paint(); };
      rec.onend = () => { if (btn.isConnected && btn.disabled) { btn.textContent = '🎤 Nói'; btn.disabled = false; } };
      try { rec.start(); } catch (e) { paint(); }
    }
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-d]'); if (!b || !D || b.disabled) return; const d = b.dataset.d;
      if (d === 'next') next();
      else if (d === 'opt') choose(+b.dataset.k);
      else if (d === 'say' && D.line) R.speak(D.line.en, pitchOf());
      else if (d === 'saybetter' && D.better) R.speak(D.better, 1);
      else if (d === 'vi1' && D.line) b.outerHTML = '<div class="tr-vi">' + esc(D.line.vi) + '</div>';
      else if (d === 'hint') { D.hint = true; paint(); }
      else if (d === 'mic') mic(b);
      else if (d === 'quit') end(false);
    });
    el.addEventListener('submit', e => {
      e.preventDefault(); if (!D) return; const inp = el.querySelector('.tr-type input'); const v = inp && inp.value.trim(); if (!v) return;
      const k = matchSaid([v]); if (k >= 0) choose(k); else { D.typed = v; opts.toast('Câu của em chưa khớp lựa chọn nào. Thử viết sát hơn hoặc bấm chọn nhé.'); paint(); }
    });
    return {
      start, next, choose, active: () => !!D, phase: () => D && D.phase,
      key(e) {
        if (!D) return false;
        if (e.target && e.target.tagName === 'INPUT') return false;
        if ((e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') && D.phase !== 'choose') { e.preventDefault(); next(); return true; }
        if (D.phase === 'choose' && /^[1-9]$/.test(e.key)) { e.preventDefault(); choose(+e.key - 1); return true; }
        if (e.key === 'Escape') { end(false); return true; }
        return true;
      },
      repaint() { if (D) paint(); }
    };
  };
})();
