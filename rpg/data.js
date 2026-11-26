/* Du học Toronto – dữ liệu game: bản đồ, NPC, nhiệm vụ, lời thoại.
   Thêm chương mới: thêm một phần tử vào CHAPTERS (xem cấu trúc bên dưới). */
(function () {
  const R = window.TorontoRPG = window.TorontoRPG || {};

  /* ---------- ô bản đồ ----------
     ' ' trống (ngoài bản đồ)  '#' tường   'W' tường có cửa sổ   'D' cửa ra vào
     '.' sàn gỗ/sàn nhà        ',' sàn gạch  ':' đường phố VN    '~' tuyết
     '_' thảm lối đi máy bay   'R' thảm      '=' quầy             'S' ghế
     'T' bàn                   'P' cây       'B' sofa/ghế dài     'K' máy kiosk/thiết bị
     'L' băng chuyền/cân/vali  'Q' dây xếp hàng   'O' tháp CN mini
     (chương 5–9, mùa hè)  'a' đường nhựa  'e' đường nhựa có vạch  'z' vạch qua đường  'w' vỉa hè  'g' cỏ
     'k' mép sân ga (vàng)  'X' đường ray  'Z' mặt hồ  'F' kệ hàng / tủ lạnh  'J' cột đèn  'V' chặn vô hình (dưới xe, máy đọc thẻ) */
  R.SOLID = new Set(['#', 'W', '=', 'S', 'T', 'P', 'B', 'K', 'L', 'Q', 'O', ' ', 'X', 'Z', 'F', 'J', 'V']);
  R.FLOOR_T = '.,:~_Rawgezk';      // các ô sàn đi được
  R.OUT_T = ':~awgez';             // các ô sàn ngoài trời (không có trần)

  R.ITEMS = {
    loa: ['📄', 'Thư mời nhập học (LOA)', 'Letter of Acceptance – trường gửi khi em trúng tuyển.'],
    passport: ['🛂', 'Hộ chiếu', 'Passport – luôn mang theo khi xuất nhập cảnh.'],
    letter: ['✉️', 'Thư giới thiệu (POE letter)', 'Letter of Introduction – đưa cho hải quan Canada để nhận study permit.'],
    noodles: ['🍜', 'Mì tôm + chai nước mắm', 'Đồ ăn mang theo phải khai báo (declare) ở hải quan.'],
    suitcase: ['🧳', 'Vali 31 kg', 'Quá cân! Giới hạn hành lý ký gửi chỉ 23 kg.'],
    pass: ['🎫', 'Thẻ lên máy bay', 'Boarding pass – ghế 32A, cửa số 12.'],
    permit: ['🪪', 'Study permit', 'Giấy phép du học do hải quan Canada cấp.'],
    coffee: ['☕', 'Cà phê double-double', 'Double-double = 2 phần kem sữa + 2 phần đường.'],
    group_photo: ['📸', 'Ảnh nhóm ở Pearson', 'Tấm ảnh đầu tiên với hội bạn mới: Josh, Priya, Liam, Jenny, Daniel.'],
    walnut: ['🥮', 'Hộp bánh óc chó', 'Hodu-gwaja – bánh nhân đậu đỏ hình quả óc chó, mua ở tiệm bánh Hàn trên Yonge St.'],
    iced_capp: ['🧋', 'Iced Capp', 'Cà phê đá xay với kem – đồ uống mùa hè nổi tiếng của Tims.'],
    timbits: ['🍩', 'Hộp Timbits', 'Những viên donut tròn nhỏ của Tims – hộp 10 viên, trộn nhiều vị.'],
    presto: ['💳', 'Thẻ PRESTO', 'Thẻ đi TTC (subway, streetcar, bus), GO Transit và UP Express. Chạm thẻ (tap) vào máy đọc khi lên xe / qua cổng.']
  };

  /* ---------- ngoại hình NPC ---------- */
  R.LOOKS = {
    mom: { skin: '#f3c9a1', hair: '#2a211c', style: 'bun', shirt: '#e06c8e', pitch: 1.25, g: 'f' },
    dad: { skin: '#e8b98f', hair: '#2a211c', style: 'short', shirt: '#4a7bb7', glasses: 1, pitch: 0.8, g: 'm' },
    sis: { skin: '#f6d0ab', hair: '#3a2a20', style: 'pigtails', shirt: '#f5c542', small: 1, pitch: 1.5, g: 'f' },
    staff: { skin: '#e9bd94', hair: '#1f1a17', style: 'short', shirt: '#2f4a7a', lanyard: 1, pitch: 1.05, g: 'm' },
    photo: { skin: '#f0c49b', hair: '#6b3e26', style: 'long', shirt: '#16a085', lanyard: 1, pitch: 1.2, g: 'f' },
    guard: { skin: '#d9a47c', hair: '#1f1a17', style: 'cap', cap: '#2c3e50', shirt: '#34495e', pitch: 0.8, g: 'm' },
    agent: { skin: '#f1c59d', hair: '#4a2f1f', style: 'bun', shirt: '#c0392b', scarf: '#f4d03f', pitch: 1.2, g: 'f' },
    fa: { skin: '#e3ae84', hair: '#1f1a17', style: 'bun', shirt: '#1f7a7a', scarf: '#e67e22', pitch: 1.15, g: 'f' },
    officer: { skin: '#d9a47c', hair: '#5a3b26', style: 'cap', cap: '#1d2d4a', shirt: '#1d2d4a', beard: 1, badge: 1, pitch: 0.85, g: 'm' },
    officer2: { skin: '#f2c7a5', hair: '#a0522d', style: 'cap', cap: '#1d2d4a', shirt: '#1d2d4a', badge: 1, pitch: 1.15, g: 'f' },
    handler: { skin: '#8d5a3b', hair: '#1f1a17', style: 'cap', cap: '#1d2d4a', shirt: '#1d2d4a', dog: 1, badge: 1, pitch: 1.0, g: 'm' },
    buddy: { skin: '#f7d3b5', hair: '#e2b04a', style: 'ponytail', shirt: '#d63031', sign: 'WELCOME!', pitch: 1.2, g: 'f' },
    barista: { skin: '#c98d63', hair: '#2a1c12', style: 'beanie', beanie: '#ff7043', shirt: '#2e7d32', apron: 1, beard: 1, pitch: 0.95, g: 'm' },
    old: { skin: '#f1c9a5', hair: '#d5d5d5', style: 'short', shirt: '#8e7cc3', glasses: 1, pitch: 0.75, g: 'm' },
    kid: { skin: '#f6d0ab', hair: '#3a2a20', style: 'short', shirt: '#00b894', small: 1, pitch: 1.6, g: 'm' },
    man: { skin: '#e0ac69', hair: '#2d1e12', style: 'short', shirt: '#636e72', pitch: 0.9, g: 'm' },
    woman: { skin: '#c68642', hair: '#1b1b1b', style: 'long', shirt: '#fd79a8', pitch: 1.2, g: 'f' },
    tourist: { skin: '#ffdbac', hair: '#b5651d', style: 'cap', cap: '#e17055', shirt: '#0984e3', pitch: 1.0, g: 'm' },
    musician: { skin: '#a1665e', hair: '#111', style: 'beanie', beanie: '#6c5ce7', shirt: '#2d3436', guitar: 1, pitch: 0.9, g: 'm' },
    moose: { skin: '#8b5a2b', hair: '#5d3a1a', style: 'moose', shirt: '#8b5a2b', pitch: 0.7, g: 'm' },
    vendor: { skin: '#d9a066', hair: '#222', style: 'conical', shirt: '#f39c12', pitch: 1.1, g: 'f' },
    /* hội bạn ở Toronto (chương 5–9) */
    josh: { skin: '#c99668', hair: '#1b1b1b', style: 'cap', cap: '#6c2bd9', shirt: '#c0392b', num: '23', g: 'm', pitch: 1.0, rate: 1.0 },
    priya: { skin: '#b97a4f', hair: '#1a1110', style: 'long', shirt: '#6c5ce7', glasses: 1, tote: '#fdcb6e', g: 'f', pitch: 1.15, rate: 0.98 },
    liam: { skin: '#f6d5b8', hair: '#b5651d', style: 'beanie', beanie: '#c0392b', shirt: '#c0392b', plaid: 1, beard: 1, g: 'm', pitch: 0.88, rate: 0.95 },
    jenny: { skin: '#f3d2b3', hair: '#2b1d16', style: 'ponytail', shirt: '#ff7eb3', shades: 1, g: 'f', pitch: 1.25, rate: 1.08 },
    daniel: { skin: '#efc9a4', hair: '#141414', style: 'short', shirt: '#2d3436', glasses: 1, g: 'm', pitch: 0.95, rate: 0.97 },
    driver: { skin: '#a8714d', hair: '#1b1b1b', style: 'short', shirt: '#34495e', beard: 1, g: 'm', pitch: 0.82 },
    cashier: { skin: '#e0ac69', hair: '#3b2416', style: 'cap', cap: '#b3262c', shirt: '#b3262c', headset: 1, g: 'f', pitch: 1.2, rate: 1.05 },
    cashier2: { skin: '#8d5a3b', hair: '#111', style: 'cap', cap: '#b3262c', shirt: '#b3262c', g: 'm', pitch: 0.95 },
    baker: { skin: '#f2d0b0', hair: '#2a1c12', style: 'bun', shirt: '#f6e7d2', apron: 1, g: 'f', pitch: 1.2 },
    grocer: { skin: '#eec39a', hair: '#3a2a20', style: 'ponytail', shirt: '#27ae60', apron: 1, glasses: 1, g: 'f', pitch: 1.1 },
    pho: { skin: '#e8b98f', hair: '#2a211c', style: 'short', shirt: '#e67e22', apron: 1, g: 'm', pitch: 0.85 },
    ttc: { skin: '#c68642', hair: '#1b1b1b', style: 'cap', cap: '#1d3f8a', shirt: '#1d3f8a', badge: 1, g: 'm', pitch: 0.9 }
  };
  R.LOOKS.josh_sign = Object.assign({}, R.LOOKS.josh, { sign: 'WELCOME!' });

  /* ---------- công cụ dựng bản đồ ---------- */
  function grid(w, h) { return Array.from({ length: h }, () => Array(w).fill(' ')); }
  function fill(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = c; }
  function room(g, x, y, w, h, floor) { fill(g, x, y, w, h, '#'); fill(g, x + 1, y + 1, w - 2, h - 2, floor); }
  function put(g, x, y, c) { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; }
  const done = g => g.map(r => r.join(''));

  /* hội thoại: t:'s' NPC nói · t:'c' lựa chọn · t:'n' lời dẫn (tiếng Việt) · t:'i' nhận đồ
     lựa chọn: ok 1 = chuẩn, 0.5 = hài hước nhưng vẫn qua, 0 = chưa ổn (thử lại); r = [phản hồi EN, VI]; tip = mẹo sau khi chọn */
  const S = (en, vi, who, sound) => ({ t: 's', en, vi, who: who || undefined, sound });
  const N = (vi, sound) => ({ t: 'n', vi, sound });
  const I = (item, sound) => ({ t: 'i', item, sound });
  const C = (hint, opts) => ({ t: 'c', hint, opts });
  const O = (en, ok, r, tip, who, sound) => ({ en, ok, r, tip, who, sound });

  /* ======================= CHƯƠNG 1 ======================= */
  function map1() {
    const g = grid(36, 14);
    room(g, 0, 0, 13, 12, '.'); fill(g, 3, 0, 4, 1, 'W'); fill(g, 3, 4, 5, 3, 'R'); fill(g, 2, 9, 4, 1, 'B'); put(g, 9, 3, 'T'); put(g, 1, 1, 'P'); put(g, 11, 10, 'P'); put(g, 10, 9, 'L'); put(g, 12, 5, 'D');
    fill(g, 13, 2, 8, 10, ':'); put(g, 14, 2, 'P'); put(g, 14, 11, 'P'); put(g, 20, 11, 'P'); put(g, 18, 3, '='); put(g, 19, 3, '=');
    room(g, 21, 0, 15, 14, ','); fill(g, 24, 0, 8, 1, 'W'); put(g, 21, 6, 'D');
    fill(g, 24, 3, 6, 1, '='); fill(g, 31, 4, 3, 1, '='); put(g, 34, 3, 'K');
    fill(g, 24, 8, 3, 1, 'S'); fill(g, 28, 8, 3, 1, 'S'); fill(g, 24, 10, 3, 1, 'S'); fill(g, 28, 10, 3, 1, 'S'); put(g, 23, 11, 'K'); put(g, 34, 12, 'P');
    return done(g);
  }
  /* ======================= CHƯƠNG 2 ======================= */
  function map2() {
    const g = grid(40, 16);
    room(g, 0, 0, 12, 11, '.'); fill(g, 3, 0, 4, 1, 'W'); put(g, 8, 2, 'T'); fill(g, 2, 8, 3, 1, 'B'); put(g, 9, 8, 'L'); put(g, 1, 1, 'P'); fill(g, 3, 4, 4, 2, 'R'); put(g, 11, 5, 'D');
    fill(g, 12, 3, 4, 6, ':'); put(g, 13, 3, 'P');
    room(g, 16, 0, 24, 16, ','); fill(g, 18, 0, 20, 1, 'W'); put(g, 16, 6, 'D');
    fill(g, 28, 3, 8, 1, '='); put(g, 27, 4, 'L'); fill(g, 29, 6, 5, 1, 'Q'); fill(g, 19, 3, 3, 1, '=');
    fill(g, 19, 11, 5, 1, 'S'); fill(g, 26, 11, 5, 1, 'S'); put(g, 17, 14, 'P'); put(g, 38, 14, 'P'); fill(g, 33, 12, 3, 1, 'L');
    return done(g);
  }
  /* ======================= CHƯƠNG 3 ======================= */
  const seatX = n => 6 + (n - 25) * 2;
  function map3() {
    const g = grid(40, 7);
    fill(g, 0, 0, 40, 7, '#'); fill(g, 2, 0, 36, 1, 'W'); fill(g, 2, 6, 36, 1, 'W');
    fill(g, 1, 1, 4, 5, '.'); put(g, 1, 1, '='); put(g, 2, 1, '='); put(g, 1, 5, 'K');
    fill(g, 5, 1, 32, 5, '.'); fill(g, 5, 3, 33, 1, '_');
    for (let n = 25; n <= 40; n++) { const x = seatX(n); [1, 2, 4, 5].forEach(y => put(g, x, y, 'S')); }
    fill(g, 37, 1, 2, 5, '.'); put(g, 38, 1, '='); put(g, 38, 5, 'K');
    return done(g);
  }
  const seatLabels = [];
  for (let n = 25; n <= 40; n++) [['A', 1], ['B', 2], ['C', 4], ['D', 5]].forEach(([l, y]) => seatLabels.push({ x: seatX(n), y, text: n + l }));
  /* ======================= CHƯƠNG 4 ======================= */
  function map4() {
    const g = grid(32, 16);
    room(g, 0, 0, 32, 16, ','); fill(g, 8, 0, 16, 1, 'W');
    put(g, 4, 4, 'K'); put(g, 6, 4, 'K'); put(g, 8, 4, 'K');
    fill(g, 12, 7, 10, 1, 'Q'); fill(g, 12, 9, 10, 1, 'Q');
    fill(g, 24, 4, 3, 1, '='); fill(g, 24, 10, 3, 1, '=');
    fill(g, 3, 12, 7, 1, 'L'); put(g, 1, 14, 'P'); put(g, 30, 1, 'P'); put(g, 30, 14, 'P');
    return done(g);
  }
  /* ======================= CHƯƠNG 5 · Sảnh đến Pearson ======================= */
  function mapPearson() {
    const g = grid(34, 16);
    room(g, 0, 0, 34, 16, ','); fill(g, 4, 0, 26, 1, 'W');
    put(g, 0, 7, 'D'); put(g, 33, 8, 'D');
    fill(g, 3, 12, 9, 1, 'L');                      // băng chuyền hành lý
    fill(g, 15, 12, 5, 1, 'S'); fill(g, 22, 12, 5, 1, 'S');
    fill(g, 14, 3, 3, 1, '=');                      // quầy thông tin
    fill(g, 26, 3, 5, 1, '=');                      // quầy cà phê
    put(g, 1, 1, 'P'); put(g, 32, 1, 'P'); put(g, 1, 14, 'P'); put(g, 32, 14, 'P'); put(g, 21, 7, 'P');
    return done(g);
  }
  /* ======================= CHƯƠNG 6 · Uber & Yonge St ======================= */
  function mapYonge() {
    const g = grid(50, 16);
    // A: Pearson – điểm đón rideshare (x 0..15)
    fill(g, 0, 0, 16, 3, '#'); for (let x = 1; x < 15; x += 2) put(g, x, 2, 'W'); put(g, 3, 2, 'D');
    fill(g, 0, 3, 16, 5, 'w'); fill(g, 0, 8, 16, 2, 'a'); fill(g, 0, 10, 16, 1, 'e'); fill(g, 0, 11, 16, 2, 'a'); fill(g, 0, 13, 16, 3, 'g');
    put(g, 1, 4, 'B'); put(g, 2, 4, 'B'); put(g, 12, 4, 'B'); put(g, 13, 4, 'B'); put(g, 15, 7, 'J'); put(g, 0, 7, 'J');
    put(g, 4, 14, 'P'); put(g, 11, 14, 'P');
    fill(g, 16, 0, 1, 16, '#');                     // tường ngăn (đi qua bằng xe)
    // B: Yonge St – Koreatown North (x 17..49)
    fill(g, 17, 0, 33, 5, '#');
    [18, 22, 27, 32, 36].forEach(x => put(g, x, 4, 'W')); [20, 25, 30, 34].forEach(x => put(g, x, 4, 'D'));
    fill(g, 39, 1, 10, 3, ','); put(g, 43, 4, ','); put(g, 44, 4, ',');     // Seoul Mart (đi vào được)
    fill(g, 40, 1, 3, 1, 'F'); fill(g, 45, 1, 2, 1, 'F'); put(g, 48, 2, '='); put(g, 48, 3, '=');
    fill(g, 17, 5, 33, 4, 'w');
    [19, 27, 37].forEach(x => put(g, x, 8, 'P')); [23, 31, 42].forEach(x => put(g, x, 8, 'J'));
    fill(g, 45, 5, 5, 1, 'V');                                         // lối vào ga Finch (khối nhà + mái vòm cầu thang)
    fill(g, 17, 9, 33, 2, 'a'); fill(g, 17, 11, 33, 1, 'e'); fill(g, 17, 12, 33, 2, 'a'); fill(g, 33, 9, 2, 5, 'z');
    fill(g, 17, 14, 33, 1, 'w'); fill(g, 17, 15, 33, 1, 'g'); [21, 29, 39, 45].forEach(x => put(g, x, 15, 'P')); put(g, 25, 14, 'B'); put(g, 26, 14, 'B');
    return done(g);
  }
  /* ======================= CHƯƠNG 7 · Tims ======================= */
  function mapTims() {
    const g = grid(24, 16);
    room(g, 0, 0, 24, 16, ','); fill(g, 3, 15, 18, 1, 'W'); fill(g, 23, 7, 1, 5, 'W'); put(g, 23, 2, 'W');
    put(g, 0, 9, 'D');
    fill(g, 6, 3, 12, 1, '='); fill(g, 19, 3, 3, 1, '=');            // quầy gọi món + quầy drive-thru
    put(g, 2, 4, 'K'); put(g, 2, 6, 'K');                             // máy order tự phục vụ
    fill(g, 7, 6, 9, 1, 'Q');                                         // dây xếp hàng
    [5, 9, 13, 17].forEach(x => { put(g, x, 10, 'T'); put(g, x, 13, 'T'); });
    put(g, 1, 1, 'P'); put(g, 22, 14, 'P'); put(g, 1, 14, 'P');
    return done(g);
  }
  /* ======================= CHƯƠNG 8 · Căn hộ North York ======================= */
  function mapCondo() {
    const g = grid(22, 14);
    room(g, 0, 0, 22, 14, '.'); fill(g, 3, 0, 16, 1, 'W');
    put(g, 0, 10, 'D'); put(g, 21, 6, 'D');
    fill(g, 3, 6, 5, 2, 'R'); put(g, 5, 7, 'T'); fill(g, 3, 9, 4, 1, 'B');
    fill(g, 14, 2, 5, 1, '='); put(g, 19, 2, 'F'); put(g, 20, 2, 'F');
    put(g, 16, 10, 'T'); put(g, 19, 12, 'L'); put(g, 1, 1, 'P'); put(g, 20, 12, 'P'); put(g, 9, 12, 'P');
    return done(g);
  }
  /* ======================= CHƯƠNG 9 · Ga North York Centre → Downtown ======================= */
  function mapDowntown() {
    const g = grid(60, 18);
    // A: ga North York Centre (x 0..21)
    room(g, 0, 0, 22, 18, ',');
    put(g, 3, 1, 'K'); put(g, 5, 1, 'K'); fill(g, 15, 3, 4, 1, '=');
    fill(g, 1, 7, 20, 1, 'Q'); put(g, 10, 7, ','); put(g, 11, 7, ','); put(g, 12, 7, 'V');
    fill(g, 1, 13, 20, 1, 'k'); fill(g, 1, 14, 20, 3, 'X');
    put(g, 4, 10, 'B'); put(g, 5, 10, 'B'); put(g, 15, 10, 'B'); put(g, 16, 10, 'B'); put(g, 1, 8, 'P'); put(g, 20, 8, 'P');
    // B: Downtown (x 22..59)
    fill(g, 22, 0, 16, 3, '#'); for (let x = 23; x < 37; x += 2) put(g, x, 2, 'W'); put(g, 29, 2, 'D'); put(g, 30, 2, 'D');
    fill(g, 38, 0, 13, 1, '#'); fill(g, 51, 0, 9, 4, '#'); [52, 54, 57].forEach(x => put(g, x, 3, 'W')); put(g, 55, 3, 'D');
    fill(g, 22, 3, 16, 3, 'w'); fill(g, 38, 1, 13, 5, 'w'); fill(g, 51, 4, 9, 2, 'w');
    fill(g, 40, 2, 3, 1, '='); fill(g, 45, 2, 3, 1, '='); put(g, 49, 3, 'P'); put(g, 39, 4, 'P');
    fill(g, 22, 6, 38, 1, 'a'); fill(g, 22, 7, 38, 1, 'e'); fill(g, 22, 8, 38, 1, 'a'); fill(g, 29, 6, 2, 3, 'z'); fill(g, 45, 6, 2, 3, 'z'); fill(g, 52, 6, 4, 3, 'z');
    fill(g, 22, 9, 38, 1, 'w'); fill(g, 22, 10, 38, 4, 'g'); fill(g, 22, 14, 38, 1, '.'); fill(g, 22, 15, 38, 3, 'Z');
    fill(g, 31, 11, 2, 2, 'O'); [25, 38, 50, 57].forEach(x => put(g, x, 11, 'P')); [27, 35, 43, 53].forEach(x => put(g, x, 9, 'J'));
    put(g, 40, 13, 'B'); put(g, 41, 13, 'B'); put(g, 48, 13, 'B'); put(g, 49, 13, 'B');
    return done(g);
  }

  R.CHAPTERS = [
    {
      id: 'visa', icon: '🛂', title: 'Xin visa du học', theme: 'home', map: map1(), spawn: [9, 9],
      intro: 'Một buổi sáng ở Việt Nam. Em vừa nhận được email từ trường cao đẳng ở Toronto! Cả nhà quyết định chỉ nói tiếng Anh với em để em luyện trước khi đi.',
      signs: [{ x: 6, y: 0.1, text: 'NHÀ CỦA EM', small: 1 }, { x: 28, y: 0.1, text: 'VISA APPLICATION CENTRE' }, { x: 17, y: 1.6, text: 'Phố Hàng Bánh Mì', small: 1 }, { x: 32.5, y: 5.5, text: '📷 Biometrics', small: 1 }],
      zones: [{ x: 1, y: 1, w: 11, h: 10, name: 'Nhà em' }, { x: 13, y: 2, w: 8, h: 10, name: 'Đường phố' }, { x: 22, y: 1, w: 13, h: 12, name: 'Trung tâm visa' }],
      objectives: [
        { id: 'o1', text: 'Nói chuyện với Mẹ về email từ trường', target: 'mom' },
        { id: 'o2', text: 'Đi sang Trung tâm visa, nói chuyện với nhân viên lễ tân', target: 'staff' },
        { id: 'o3', text: 'Chụp ảnh & lấy vân tay ở quầy sinh trắc học', target: 'photo' }
      ],
      npcs: [
        { id: 'mom', name: 'Mom', look: 'mom', x: 7, y: 6, main: 1,
          talks: [{ obj: 'o1', steps: [
            S('{name}! There is an email for you. Is it from the college in Toronto?', '{name} ơi! Có email cho con này. Của trường ở Toronto à?'),
            C('Thư báo trúng tuyển = Letter of Acceptance. “I got accepted” = con đậu rồi.', [
              O('Yes! I got accepted! This is my Letter of Acceptance.', 1, ['Oh my goodness! I am so proud of you!', 'Trời ơi! Mẹ tự hào về con quá!'], '“get accepted” = được nhận vào trường.'),
              O('No, it is just spam.', 0, ['Spam? But it says “Congratulations”... Read it again!', 'Thư rác á? Nhưng nó ghi “Chúc mừng” mà... Đọc lại đi con!']),
              O('I am email.', 0, ['You are... an email? Are you okay, honey?', 'Con là... cái email á? Con có sao không đấy?'], 'Thiếu từ: “It is an email.” chứ không phải “I am email”.')]),
            I('loa'),
            S('So what is next? Do you need a visa?', 'Thế giờ làm gì tiếp? Con có cần visa không?'),
            C('Du học Canada cần study permit (giấy phép du học) và biometrics (sinh trắc học).', [
              O('Yes. I need to apply for a study permit and give my biometrics.', 1, ['Biometrics? Fingerprints and a photo? Go to the visa centre across the street!', 'Sinh trắc học? Lấy vân tay với chụp ảnh hả? Sang trung tâm visa bên kia đường đi con!'], '“apply for” + giấy tờ = nộp đơn xin.'),
              O('No, I will just swim to Canada.', 0, ['Swim?! It is thirteen thousand kilometres, darling!', 'Bơi á?! Những mười ba nghìn cây số đấy con!']),
              O('Visa is a credit card, Mom.', 0.5, ['Haha, very funny. I mean the travel document!', 'Haha, buồn cười ghê. Ý mẹ là giấy tờ đi nước ngoài cơ!'])]),
            I('passport')] }],
          before: ['Good morning, honey!', 'Chào buổi sáng con yêu!'], after: ['Go to the visa centre across the street! And do not forget your passport!', 'Sang trung tâm visa bên kia đường đi con! Nhớ mang hộ chiếu!'] },
        { id: 'staff', name: 'Receptionist', look: 'staff', x: 26, y: 2, main: 1, range: 2.3,
          talks: [{ obj: 'o2', steps: [
            S('Good morning! How can I help you today?', 'Chào buổi sáng! Hôm nay tôi giúp gì được cho bạn?'),
            C('Nói lý do em đến: có lịch hẹn lấy sinh trắc học (an appointment for my biometrics).', [
              O('Good morning. I have an appointment for my biometrics.', 1, ['Great, thank you.', 'Tốt quá, cảm ơn bạn.'], '“I have an appointment for…” = tôi có lịch hẹn để…'),
              O('Give me visa now.', 0, ['Hmm... shall we try that a little more politely?', 'Hừm... mình nói lịch sự hơn chút nhé?'], 'Câu mệnh lệnh nghe rất bất lịch sự. Dùng “I would like…” hoặc “I have an appointment…”.'),
              O('I am fine, thank you. And you?', 0, ['I am fine too, thanks! But... why are you here today?', 'Tôi cũng khoẻ, cảm ơn! Nhưng... hôm nay bạn đến đây làm gì?'], '“How can I help you?” hỏi em cần gì, không phải hỏi thăm sức khoẻ.')]),
            S('May I see your passport and your appointment letter, please?', 'Cho tôi xem hộ chiếu và giấy hẹn được không?'),
            C('Khi đưa đồ cho ai: “Here you are.” / “Sure, here they are.”', [
              O('Sure, here they are.', 1, ['Thank you. Please go to the biometrics counter on the right.', 'Cảm ơn. Mời bạn sang quầy sinh trắc học bên phải.'], 'Đưa nhiều thứ: “here THEY are”; một thứ: “here IT is”.'),
              O('No, you may not.', 0, ['Then... I cannot help you, I am afraid.', 'Vậy thì... tôi e là không giúp bạn được rồi.']),
              O('Passport? I thought this was a restaurant.', 0, ['A restaurant? No, this is the visa centre!', 'Nhà hàng á? Không, đây là trung tâm thị thực mà!'])])] }],
          before: ['Hello! Please take a number and wait for your turn.', 'Xin chào! Bạn lấy số và chờ đến lượt nhé.'], after: ['The biometrics counter is on the right.', 'Quầy sinh trắc học ở bên phải.'] },
        { id: 'photo', name: 'Biometrics officer', look: 'photo', x: 32, y: 3, main: 1, range: 2.3,
          talks: [{ obj: 'o3', steps: [
            S('Hi! Please sit down and look at the camera. And please... do not smile.', 'Chào bạn! Ngồi xuống và nhìn vào máy ảnh nhé. Và làm ơn... đừng cười.'),
            C('Đồng ý làm theo hướng dẫn: “Okay, no problem.”', [
              O('Okay, no problem.', 1, ['Perfect. Now put your fingers on the scanner, please.', 'Hoàn hảo. Giờ đặt các ngón tay lên máy quét nhé.']),
              O('But I look so much better when I smile!', 0.5, ['Ha! Rules are rules. Serious face, please... Now your fingers on the scanner.', 'Ha! Quy định là quy định. Mặt nghiêm túc nào... Giờ đặt ngón tay lên máy quét.'], 'Ảnh hồ sơ visa phải để mặt tự nhiên, không cười.')]),
            C('Hỏi lại để chắc chắn: “Like this?” = như thế này phải không?', [
              O('Like this?', 1, ['Yes, exactly. All done! You will get an email with the result.', 'Đúng rồi. Xong rồi! Bạn sẽ nhận kết quả qua email.'], 'Hỏi “Like this?” khi muốn chắc mình làm đúng.'),
              O('Can I use my toes?', 0, ['Your toes?! Fingers only, please.', 'Ngón chân á?! Chỉ ngón tay thôi nhé.'])]),
            N('Vài tuần sau... Ting! Email báo hồ sơ được duyệt. Em nhận được thư giới thiệu (Letter of Introduction) để đưa cho hải quan khi đến Canada.'),
            I('letter')] }],
          before: ['Please see the receptionist first.', 'Bạn gặp lễ tân trước nhé.'], after: ['Good luck with your studies!', 'Chúc bạn học tốt!'] },
        { id: 'vendor', name: 'Bánh mì seller', look: 'vendor', x: 19, y: 2, range: 2.1,
          talks: [{ steps: [S('Bánh mì! Hot bánh mì! Do you want one? Only twenty thousand dong!', 'Bánh mì nóng đây! Mua một cái không? Chỉ hai mươi nghìn!'),
            C('Từ chối lịch sự: “No, thank you.” / Đồng ý: “Yes, please.”', [
              O('Yes, please! One with everything.', 1, ['Coming right up! Good luck at the visa centre!', 'Có ngay! Chúc may mắn ở trung tâm visa nhé!'], '“with everything” = cho đủ mọi thứ.'),
              O('No, thank you. Maybe later.', 1, ['No problem! See you later!', 'Không sao! Hẹn gặp lại!'], '“Maybe later” = để lúc khác nhé, từ chối nhẹ nhàng.')])] }] },
        { id: 'neighbour', name: 'Neighbour', look: 'old', x: 16, y: 7, wander: 2,
          talks: [{ steps: [S('Good morning! You look happy today. Any good news?', 'Chào buổi sáng! Hôm nay trông cháu vui thế. Có tin gì vui à?'),
            C('Kể tin vui: “I am going to study in Canada!”', [
              O('Yes! I am going to study in Canada!', 1, ['Wow, congratulations! Bring warm clothes!', 'Ồ, chúc mừng cháu! Nhớ mang áo ấm nhé!'], '“be going to” dùng cho kế hoạch đã quyết định.'),
              O('Yes, I go Canada.', 0.5, ['Ah, you are going to Canada! How exciting!', 'À, cháu sắp đi Canada! Thích thế!'], 'Câu đúng: “I am going TO Canada.” Nhớ có “am going” và “to”.')])] }] },
        { id: 'guard', name: 'Security guard', look: 'guard', x: 23, y: 6,
          talks: [{ steps: [S('Hello! Please turn off your phone before you go in.', 'Xin chào! Vui lòng tắt điện thoại trước khi vào.'),
            C('Đồng ý: “Sure, no problem.”', [
              O('Sure, no problem.', 1, ['Thank you. Have a good day!', 'Cảm ơn. Chúc một ngày tốt lành!'], '“turn off” = tắt; “turn on” = bật.'),
              O('Can I play games first?', 0.5, ['Haha, no games here. Phone off, please!', 'Haha, ở đây không chơi game đâu. Tắt máy nhé!'])])] }] },
        { id: 'applicant', name: 'Another applicant', look: 'man', x: 27, y: 9,
          talks: [{ steps: [S('Excuse me, is this seat free?', 'Xin lỗi, ghế này có ai ngồi chưa?'),
            C('“Is this seat free/taken?” – trả lời “Yes, go ahead.”', [
              O('Yes, it is free. Go ahead.', 1, ['Thanks! Are you nervous too?', 'Cảm ơn! Bạn cũng hồi hộp à?'], '“Go ahead” = cứ tự nhiên.'),
              O('Sorry, it is taken.', 1, ['Oh, okay. No problem.', 'À, được. Không sao.'], '“taken” = đã có người ngồi.')])] }] }
      ]
    },
    {
      id: 'farewell', icon: '👨‍👩‍👧', title: 'Tạm biệt gia đình & check-in', theme: 'airport', map: map2(), spawn: [5, 6],
      intro: 'Ngày bay đã đến! Mẹ và em gái đang ở nhà xếp đồ cho em, bố đợi ở sân bay. Cả nhà vẫn kiên trì nói tiếng Anh với em.',
      signs: [{ x: 6, y: 0.1, text: 'NHÀ CỦA EM', small: 1 }, { x: 28, y: 0.1, text: 'TÂN SƠN NHẤT · DEPARTURES' }, { x: 32, y: 1.4, text: 'CHECK-IN · TORONTO YYZ', small: 1 }, { x: 20.5, y: 1.4, text: 'INFORMATION', small: 1 }],
      zones: [{ x: 1, y: 1, w: 10, h: 9, name: 'Nhà em' }, { x: 12, y: 3, w: 4, h: 6, name: 'Taxi' }, { x: 17, y: 1, w: 22, h: 14, name: 'Sân bay', music: 'music_airport' }],
      objectives: [
        { id: 'o1', text: 'Nói chuyện với Mẹ (mẹ đang xếp vali)', target: 'mom' },
        { id: 'o2', text: 'Nói chuyện với em gái', target: 'sis' },
        { id: 'o3', text: 'Ra sân bay, tạm biệt Bố', target: 'dad' },
        { id: 'o4', text: 'Làm thủ tục ở quầy check-in', target: 'agent' }
      ],
      npcs: [
        { id: 'mom', name: 'Mom', look: 'mom', x: 4, y: 3, main: 1,
          talks: [{ obj: 'o1', steps: [
            S('I put ten packs of instant noodles and a bottle of fish sauce in your suitcase.', 'Mẹ bỏ mười gói mì tôm với một chai nước mắm vào vali cho con rồi.'),
            C('Mang đồ ăn vào Canada thì phải khai báo (declare) ở hải quan.', [
              O('Thank you, Mom. I will remember to declare the food at customs.', 1, ['Good! Always be honest with the officers.', 'Tốt! Luôn trung thực với nhân viên hải quan nhé.'], '“declare” = khai báo. Nhớ từ này cho chương 4!'),
              O('Fish sauce? Everyone on the plane will hate me!', 0.5, ['Do not worry, I wrapped it in five plastic bags!', 'Đừng lo, mẹ bọc năm lớp túi ni lông rồi!']),
              O('Ten packs? I need one hundred.', 0.5, ['One hundred?! Your suitcase will explode!', 'Một trăm á?! Vali nổ tung mất!'])]),
            I('noodles'), I('suitcase')] }],
          before: ['', ''], after: ['Your sister wants to say something. And Dad is waiting at the airport!', 'Em gái muốn nói gì đó với con kìa. Bố đang đợi ở sân bay đấy!'] },
        { id: 'sis', name: 'Little sister', look: 'sis', x: 8, y: 6, main: 1,
          talks: [{ obj: 'o2', steps: [
            S('Bring me back a moose, okay? A real one!', 'Mang về cho em một con nai sừng tấm nhé! Con thật ấy!'),
            C('moose /muːs/ = nai sừng tấm; mouse /maʊs/ = con chuột. Đừng nhầm!', [
              O('Haha, a moose is too big! How about some maple syrup and a postcard?', 1, ['Deal! But a big bottle!', 'Chốt! Nhưng phải chai to nhé!'], '“How about…?” = Thế còn… thì sao? Dùng để gợi ý.'),
              O('Okay, I will bring you a mouse.', 0, ['A mouse?! No! A MOOSE! The big animal with antlers!', 'Con chuột á?! Không! NAI SỪNG TẤM cơ! Con to có sừng ấy!'], 'moose /muːs/ (nai sừng tấm) ≠ mouse /maʊs/ (chuột).')])] }],
          before: ['Mom wants to talk to you first!', 'Mẹ muốn nói chuyện với anh/chị trước kìa!'], after: ['Do not forget my maple syrup!', 'Đừng quên siro lá phong của em nhé!'] },
        { id: 'dad', name: 'Dad', look: 'dad', x: 19, y: 7, main: 1,
          talks: [{ obj: 'o3', steps: [
            S('Study hard, but do not forget to have fun. Call us when you land.', 'Học chăm vào, nhưng nhớ vui chơi nữa. Hạ cánh thì gọi cho bố mẹ.'),
            C('Hứa sẽ gọi: “I will call you as soon as I arrive.” Nói nhớ: “I will miss you.”', [
              O('I will. I will call you as soon as I arrive. I will miss you all!', 1, ['We will miss you too. Now go and check in!', 'Cả nhà cũng nhớ con. Giờ đi làm thủ tục đi!'], '“as soon as” = ngay khi.'),
              O('Okay, bye. See you never.', 0, ['Never?! That is a very sad goodbye!', 'Không bao giờ á?! Lời tạm biệt buồn quá!'], '“See you never” nghe như không bao giờ gặp lại. Nói “See you soon!”.'),
              O('I will call you every hour.', 0.5, ['Every hour? Maybe every week is enough!', 'Mỗi tiếng á? Chắc mỗi tuần là đủ rồi con!'])])] }],
          before: ['Did you say goodbye to Mom and your sister?', 'Con chào mẹ với em chưa?'], after: ['The check-in counter is over there. Go!', 'Quầy check-in ở đằng kia. Đi đi con!'] },
        { id: 'agent', name: 'Check-in agent', look: 'agent', x: 32, y: 2, main: 1, range: 2.3,
          talks: [{ obj: 'o4', steps: [
            S('Good evening. Where are you flying to today?', 'Chào buổi tối. Hôm nay bạn bay đi đâu?'),
            C('Bay đến đâu: “I am flying to + nơi đến.”', [
              O('I am flying to Toronto, Canada.', 1, ['Wonderful. Passport, please.', 'Tuyệt. Cho tôi xem hộ chiếu.']),
              O('Yes, I am flying.', 0, ['Great... but where to?', 'Tốt... nhưng bay đi đâu?'], '“Where…?” hỏi nơi chốn, cần trả lời tên địa điểm.'),
              O('To the moon, please.', 0, ['Sorry, we do not fly to the moon. Not yet!', 'Xin lỗi, chúng tôi chưa có chuyến lên mặt trăng!'])]),
            S('Please put your suitcase on the scale. Oh... it is thirty-one kilograms. The limit is twenty-three.', 'Bạn đặt vali lên cân nhé. Ôi... 31 ký. Giới hạn là 23 ký thôi.'),
            C('Xin lấy bớt đồ ra: “Can I take some things out?” Hành lý xách tay = carry-on.', [
              O('Oh no! Can I take some things out and put them in my carry-on?', 1, ['Of course. Take your time.', 'Tất nhiên rồi. Bạn cứ từ từ.'], '“overweight” = quá cân; “carry-on” = hành lý xách tay.'),
              O('It is not my fault. My mom packed it.', 0.5, ['Ha! Moms always pack a little too much.', 'Ha! Các mẹ lúc nào cũng xếp hơi nhiều.']),
              O('Okay, I will leave my suitcase here.', 0, ['You want to fly to Canada with... nothing?', 'Bạn muốn sang Canada mà... không mang gì á?'])]),
            S('Would you like a window seat or an aisle seat?', 'Bạn muốn ngồi cạnh cửa sổ hay cạnh lối đi?'),
            C('Câu hỏi “A or B?” thì phải chọn một: “A window seat, please.”', [
              O('A window seat, please.', 1, ['Here is your boarding pass. Seat 32A, gate twelve. Have a nice flight!', 'Thẻ lên máy bay của bạn đây. Ghế 32A, cửa số 12. Chúc chuyến bay vui vẻ!'], 'window seat = ghế cạnh cửa sổ; aisle seat = ghế cạnh lối đi.'),
              O('Yes, please.', 0, ['Yes... which one? Window or aisle?', 'Có... nhưng chỗ nào? Cửa sổ hay lối đi?'], 'Câu hỏi lựa chọn “A or B?” không trả lời “Yes”.')]),
            I('pass')] }],
          before: ['Hello! Please say goodbye to your family first, then come back.', 'Xin chào! Bạn chào gia đình trước rồi quay lại nhé.'], after: ['Gate twelve. Have a nice flight!', 'Cửa số 12. Chúc chuyến bay vui vẻ!'] },
        { id: 'info', name: 'Information desk', look: 'staff', x: 20, y: 2, range: 2.3,
          talks: [{ steps: [S('Hello! Can I help you?', 'Xin chào! Tôi giúp gì được cho bạn?'),
            C('Hỏi đường: “Where is the check-in counter for…?”', [
              O('Where is the check-in counter for Toronto, please?', 1, ['It is on the right, counter C. Just follow the signs.', 'Ở bên phải, quầy C. Cứ đi theo biển chỉ dẫn.'], '“follow the signs” = đi theo biển chỉ dẫn.'),
              O('Where is the toilet?', 0.5, ['Down the hall, on the left!', 'Cuối sảnh, bên trái!'], 'Lịch sự hơn: “Excuse me, where is the restroom?”')])] }] },
        { id: 'traveler', name: 'Traveler', look: 'tourist', x: 24, y: 9, wander: 2,
          talks: [{ steps: [S('Excuse me, is this the line for the flight to Toronto?', 'Xin lỗi, đây có phải hàng cho chuyến bay đi Toronto không?'),
            C('Trả lời có/không và chỉ chỗ.', [
              O('Yes, it is. The counter is over there.', 1, ['Thanks! Are you going to Toronto too?', 'Cảm ơn! Bạn cũng đi Toronto à?'], '“over there” = ở đằng kia.'),
              O('I do not know, sorry. Maybe ask the information desk.', 1, ['Good idea, thanks!', 'Ý hay, cảm ơn nhé!'], 'Không biết thì nói “I do not know, sorry” rồi gợi ý chỗ hỏi.')])] }] },
        { id: 'cleaner', name: 'Cleaner', look: 'man', x: 35, y: 13, wander: 2,
          talks: [{ steps: [S('Careful! The floor is wet.', 'Cẩn thận! Sàn đang ướt.'),
            C('Cảm ơn khi được nhắc: “Thanks for the warning!”', [
              O('Thanks for the warning!', 1, ['You are welcome. Have a safe trip!', 'Không có gì. Chúc bạn đi an toàn!'], '“warning” = lời cảnh báo.'),
              O('I can swim.', 0.5, ['Haha! It is not that wet!', 'Haha! Đâu có ướt đến mức đó!'])])] }] }
      ]
    },
    {
      id: 'flight', icon: '✈️', title: 'Trên máy bay', theme: 'plane', map: map3(), spawn: [1, 3],
      intro: 'Em lên máy bay. Hành trình hơn 20 tiếng, có một lần quá cảnh. Hãy tìm đúng ghế của mình nhé!',
      labels: seatLabels,
      signs: [{ x: 2.5, y: 0.2, text: 'GALLEY', small: 1 }],
      zones: [{ x: 1, y: 1, w: 4, h: 5, name: 'Khu tiếp viên' }, { x: 5, y: 1, w: 32, h: 5, name: 'Khoang hành khách' }],
      objectives: [
        { id: 'o1', text: 'Nhờ tiếp viên chỉ chỗ ngồi', target: 'fa' },
        { id: 'o2', text: 'Tìm ghế 32A và ngồi xuống (bấm vào ghế)', target: 'seat' },
        { id: 'o3', text: 'Gọi bữa ăn với tiếp viên', target: 'fa', auto: 1, move: { id: 'fa', x: seatX(32), y: 3 } },
        { id: 'o4', text: 'Nghe thông báo chuẩn bị hạ cánh', target: 'fa', auto: 1 }
      ],
      npcs: [
        { id: 'fa', name: 'Flight attendant', look: 'fa', x: 4, y: 2, main: 1,
          talks: [
            { obj: 'o1', steps: [S('Hello! Welcome on board. Can I help you find your seat?', 'Xin chào! Chào mừng lên máy bay. Tôi giúp bạn tìm chỗ nhé?'),
              C('Đọc số ghế: “My seat is 32A.”', [
                O('Yes, please. My seat is thirty-two A.', 1, ['Row thirty-two is in the middle. A is the window seat on the left side. Look at the numbers on the seats!', 'Hàng 32 ở giữa khoang. A là ghế cửa sổ phía trên. Nhìn số trên ghế nhé!'], '“row” = hàng ghế; A/D thường là ghế cửa sổ.'),
                O('No thanks, I will sit in business class.', 0, ['Nice try! Your ticket says economy, row thirty-two.', 'Thử hay đấy! Vé của bạn là hạng phổ thông, hàng 32.'])])] },
            { obj: 'o3', steps: [S('Would you like chicken with rice or beef with pasta?', 'Bạn muốn gà với cơm hay bò với mì Ý?'),
              C('Gọi món lịch sự: “…, please.”', [
                O('Chicken with rice, please.', 1, ['Here you go. Enjoy your meal!', 'Của bạn đây. Chúc ngon miệng!']),
                O('Yes.', 0, ['Yes... chicken or beef?', 'Có... gà hay bò?'], 'Câu hỏi lựa chọn “A or B?” → chọn một món.'),
                O('Do you have any fish sauce?', 0.5, ['Sorry, no fish sauce on this flight!', 'Xin lỗi, chuyến bay này không có nước mắm!'])]),
              S('Anything to drink? We have water, juice, tea and coffee.', 'Bạn uống gì không? Có nước, nước ép, trà và cà phê.'),
              C('Xin đồ uống: “Could I have some…, please?”', [
                O('Could I have some orange juice, please?', 1, ['Of course! Here you are.', 'Tất nhiên! Của bạn đây.'], '“Could I have…?” lịch sự hơn “I want…”.'),
                O('Give me everything.', 0, ['Everything? Let us start with one drink, okay?', 'Tất cả á? Mình bắt đầu với một món thôi nhé?'])]),
              N('Vài bộ phim, hai bữa ăn và một giấc ngủ dài sau...')] },
            { obj: 'o4', steps: [S('We are about to land in Toronto. Please fasten your seatbelt and put your seat in the upright position.', 'Chúng ta sắp hạ cánh xuống Toronto. Vui lòng thắt dây an toàn và dựng thẳng lưng ghế.'),
              C('Đồng ý rồi hỏi thêm: “How cold is it in Toronto?”', [
                O('Okay, thank you. How cold is it in Toronto right now?', 1, ['It is minus eight degrees. Welcome to the Canadian winter!', 'Âm 8 độ. Chào mừng đến mùa đông Canada!'], '“fasten your seatbelt” = thắt dây an toàn.'),
                O('No, I am sleeping.', 0, ['Sorry, it is for your safety. Seatbelt, please!', 'Xin lỗi, vì an toàn của bạn. Thắt dây vào nhé!'])]),
              N('Máy bay hạ cánh xuống sân bay Toronto Pearson. Ngoài cửa sổ toàn tuyết trắng!')] }],
          before: ['Please take your seat.', 'Bạn về chỗ ngồi nhé.'], after: ['Please stay in your seat, we are taking off soon.', 'Bạn ngồi yên nhé, máy bay sắp cất cánh.'] },
        { id: 'seat', name: 'Ghế 32A', look: null, x: seatX(32), y: 1, object: 1, kind: 'seat', label: 'Ghế 32A', range: 2.3, action: 'sit',
          talks: [{ obj: 'o2', steps: [N('Đúng ghế 32A rồi! Em cất hành lý xách tay lên khoang, ngồi xuống và thắt dây an toàn.')] }],
          before: ['', ''], after: ['', ''] },
        { id: 'snorer', name: 'Sleepy passenger', look: 'man', x: seatX(30), y: 2,
          talks: [{ steps: [S('Zzz... Huh? Is it dinner time already?', 'Khò khò... Hả? Đến giờ ăn tối rồi à?'),
            C('Trả lời nhẹ nhàng: “Not yet.” = chưa đâu.', [
              O('Not yet. Sorry to wake you up!', 1, ['No problem. Wake me up when the food comes!', 'Không sao. Có đồ ăn thì gọi tôi nhé!'], '“wake (someone) up” = đánh thức ai đó.'),
              O('Yes, you missed it.', 0.5, ['What?! Nooo... wait, you are joking, right?', 'Cái gì?! Khônggg... khoan, bạn đùa đúng không?'])])] }] },
        { id: 'swapper', name: 'Passenger', look: 'woman', x: seatX(28), y: 1,
          talks: [{ steps: [S('Excuse me, would you mind swapping seats with me? I want to sit next to my friend.', 'Xin lỗi, bạn có phiền đổi chỗ với tôi không? Tôi muốn ngồi cạnh bạn tôi.'),
            C('“Would you mind…?” – đồng ý: “No, not at all.” (không phiền gì) · từ chối lịch sự: “Sorry, I would prefer…”', [
              O('Sorry, I would prefer to keep my window seat.', 1, ['That is okay, I understand!', 'Không sao, tôi hiểu mà!'], 'Từ chối lịch sự: “Sorry, I would prefer to…”'),
              O('No, not at all. Let us swap!', 1, ['Thank you so much!', 'Cảm ơn bạn nhiều!'], 'Cẩn thận: trả lời “Would you mind…?” bằng “No” nghĩa là ĐỒNG Ý.'),
              O('Yes, I mind. Go away.', 0, ['Oh... okay. That was a bit rude.', 'Ồ... được thôi. Hơi bất lịch sự đấy.'])])] }] },
        { id: 'parent', name: 'Parent with baby', look: 'woman', x: seatX(35), y: 4,
          talks: [{ steps: [S('I am so sorry. My baby is crying a lot. It is her first flight.', 'Tôi xin lỗi nhé. Bé nhà tôi khóc nhiều quá. Lần đầu bé đi máy bay.'),
            C('Thông cảm: “Do not worry, it is okay.”', [
              O('Do not worry, it is okay. Long flights are hard for babies.', 1, ['Thank you for being so kind!', 'Cảm ơn bạn đã thông cảm!'], '“Do not worry” = đừng lo.'),
              O('Can she cry in English? I need practice.', 0.5, ['Haha! Maybe when she is older!', 'Haha! Chắc khi bé lớn hơn!'])])] }] }
      ]
    },
    {
      id: 'customs', icon: '🍁', title: 'Cửa hải quan Toronto', theme: 'customs', map: map4(), spawn: [2, 8], enterSound: 'music_landing', music: 'music_airport',
      intro: 'Chào mừng đến sân bay Toronto Pearson! Từ giờ, mọi người xung quanh đều nói tiếng Anh. Hãy khai báo ở máy kiosk rồi gặp sĩ quan biên giới (CBSA).',
      signs: [{ x: 16, y: 0.1, text: 'WELCOME TO CANADA · BIENVENUE AU CANADA' }, { x: 6, y: 2.6, text: 'DECLARATION KIOSKS', small: 1 }, { x: 25, y: 2.6, text: 'BOOTH 1', small: 1 }, { x: 25, y: 8.6, text: 'BOOTH 2 · CLOSED', small: 1 }, { x: 6, y: 13.6, text: 'BAGGAGE', small: 1 }],
      zones: [{ x: 1, y: 1, w: 30, h: 14, name: 'Khu nhập cảnh – Toronto Pearson' }],
      objectives: [
        { id: 'o1', text: 'Khai báo hải quan ở máy kiosk', target: 'kiosk' },
        { id: 'o2', text: 'Trả lời phỏng vấn của sĩ quan biên giới ở Booth 1', target: 'officer', onDone: 'customs_stamp' }
      ],
      npcs: [
        { id: 'kiosk', name: 'Declaration kiosk', look: null, x: 6, y: 4, object: 1, kind: 'kiosk', label: 'Máy kiosk khai báo', range: 1.8,
          talks: [{ obj: 'o1', steps: [
            S('Welcome to Canada. Question 3: Are you bringing any food, plants or animals into Canada?', 'Chào mừng đến Canada. Câu 3: Bạn có mang thực phẩm, cây hoặc động vật vào Canada không?'),
            C('Nhớ lời mẹ: em có mì tôm và nước mắm, phải khai thật!', [
              O('Yes.', 1, ['Thank you. Please show this receipt to the border officer.', 'Cảm ơn. Vui lòng đưa phiếu này cho sĩ quan biên giới.'], 'Khai báo trung thực giúp em tránh bị phạt.'),
              O('No.', 0, ['Are you sure? Food that is not declared can lead to a fine.', 'Bạn chắc không? Thực phẩm không khai báo có thể bị phạt.'], 'Không khai báo đồ ăn có thể bị phạt tiền. Hãy khai thật!')])] }],
          before: ['', ''], after: ['Declaration complete. Please go to Booth 1.', 'Đã khai báo xong. Mời đến Booth 1.'] },
        { id: 'officer', name: 'Border officer (CBSA)', look: 'officer', x: 25, y: 3, main: 1, range: 2.3,
          talks: [{ obj: 'o2', steps: [
            S('Next, please! Good afternoon. Passport, please.', 'Người tiếp theo! Chào buổi chiều. Cho xem hộ chiếu.'),
            C('Chào lại và đưa hộ chiếu: “Good afternoon. Here you are.”', [
              O('Good afternoon. Here you are.', 1, ['Thank you.', 'Cảm ơn.']),
              O('Why?', 0, ['Because I am a border officer, and this is the border.', 'Vì tôi là nhân viên biên giới, và đây là biên giới.'], 'Đừng hỏi lại “Why?”: chỉ cần đưa giấy tờ và nói “Here you are”.'),
              O('Do you want my selfie too?', 0.5, ['Just the passport, thanks.', 'Hộ chiếu thôi, cảm ơn.'])]),
            S('What is the purpose of your visit to Canada?', 'Bạn đến Canada với mục đích gì?'),
            C('purpose = mục đích. Em sang để học: “I am here to study.”', [
              O('I am here to study. I am starting a two-year program at a college in Toronto.', 1, ['I see. Congratulations.', 'Tôi hiểu rồi. Chúc mừng bạn.'], '“purpose of your visit” – trả lời bằng “I am here to + động từ”.'),
              O('Holiday! Party!', 0, ['A holiday? Then why do you have a study permit letter?', 'Đi chơi à? Thế sao bạn có thư cấp phép du học?']),
              O('Purpose? I do not know.', 0, ['You do not know why you are here? That is... worrying.', 'Bạn không biết vì sao mình ở đây? Đáng lo đấy...'])]),
            S('May I see your letter of introduction and your Letter of Acceptance?', 'Cho tôi xem thư giới thiệu và thư mời nhập học của bạn.'),
            C('Đưa đúng 2 loại giấy tờ được hỏi (xem trong túi đồ 🎒).', [
              O('Sure. Here is my letter of introduction and my Letter of Acceptance.', 1, ['Thank you.', 'Cảm ơn.']),
              O('I think I left them on the plane.', 0, ['Uh-oh. Please check your bag again, very carefully.', 'Ôi. Bạn kiểm tra lại túi thật kỹ nhé.'])]),
            S('Where will you be staying?', 'Bạn sẽ ở đâu?'),
            C('Chỗ ở: “I will be staying in/at…” Ký túc xá = student residence.', [
              O('I will be staying in a student residence near my campus.', 1, ['Okay.', 'Được.'], 'student residence = ký túc xá; homestay = ở cùng gia đình bản xứ.'),
              O('In your house?', 0, ['In MY house? I do not think so.', 'Ở nhà TÔI á? Không đâu.'])]),
            S('Do you have enough money to support yourself?', 'Bạn có đủ tiền để tự chi trả cuộc sống không?'),
            C('Đưa giấy chứng minh tài chính: bank statement = sao kê ngân hàng.', [
              O('Yes. Here is my bank statement.', 1, ['That looks fine.', 'Ổn rồi.'], '“proof of funds” = chứng minh tài chính.'),
              O('I have ten packs of instant noodles.', 0.5, ['Noodles are not money, unfortunately.', 'Tiếc là mì tôm không phải tiền.'])]),
            S('Are you bringing any food, plants or animals into Canada?', 'Bạn có mang thực phẩm, cây cối hay động vật vào Canada không?'),
            C('Phải khai thật đồ ăn! Né tránh sẽ bị kiểm tra.', [
              O('Yes. I have some instant noodles and a bottle of fish sauce.', 1, ['Thank you for being honest. Those are fine.', 'Cảm ơn bạn đã khai trung thực. Mấy thứ đó được phép.'], 'Trung thực với hải quan luôn là lựa chọn đúng.'),
              O('No, nothing.', 0, ['Hmm... then what is that smell coming from your bag?', 'Hừm... thế mùi gì từ túi bạn vậy?'], 'Nói dối hải quan có thể bị phạt hoặc bị từ chối nhập cảnh.'),
              O('Only the moose for my sister.', 0, ['A MOOSE?! ...Oh, you are joking. Please answer seriously.', 'NAI SỪNG TẤM?! ...À, bạn đùa. Trả lời nghiêm túc nhé.'])]),
            I('permit'),
            S('Alright. Here is your study permit. Please check that the information is correct. Welcome to Canada!', 'Được rồi. Study permit của bạn đây. Kiểm tra lại thông tin nhé. Chào mừng đến Canada!'),
            C('Cảm ơn và chúc một ngày tốt lành.', [
              O('Thank you very much! Have a nice day.', 1, ['You too. Good luck with your studies!', 'Bạn cũng vậy. Chúc học tốt!']),
              O('Merci beaucoup!', 1, ['Ah, you speak French too! Bienvenue au Canada!', 'À, bạn nói cả tiếng Pháp! Chào mừng đến Canada!'], 'Canada có 2 ngôn ngữ chính thức: tiếng Anh và tiếng Pháp.')])] }],
          before: ['Please complete your declaration at the kiosk first.', 'Bạn khai báo ở máy kiosk trước nhé.'], after: ['Welcome to Canada!', 'Chào mừng đến Canada!'] },
        { id: 'officer2', name: 'Officer at Booth 2', look: 'officer2', x: 25, y: 9, range: 2.3,
          talks: [{ steps: [S('Sorry, this booth is closed. Please go to Booth 1.', 'Xin lỗi, quầy này đóng rồi. Mời bạn sang Booth 1.'),
            C('Cảm ơn và đi: “Oh, sorry. Thank you!”', [
              O('Oh, sorry. Thank you!', 1, ['No problem!', 'Không sao!'], '“closed” = đóng cửa; “open” = mở.'),
              O('But I like this booth.', 0.5, ['Haha, it is still closed!', 'Haha, vẫn đóng thôi!'])])] }] },
        { id: 'handler', name: 'Dog handler', look: 'handler', x: 10, y: 11, wander: 2,
          talks: [{ steps: [S('Hello! This is Maple, our detector dog. She is sniffing your bag... Hmm, is that fish sauce?', 'Xin chào! Đây là Maple, chó nghiệp vụ. Nó đang ngửi túi bạn... Hừm, nước mắm à?'),
            C('Trả lời thật: “Yes, I declared it.”', [
              O('Yes, it is fish sauce. I declared it.', 1, ['Great, thank you for declaring it! Good dog, Maple!', 'Tốt, cảm ơn bạn đã khai báo! Giỏi lắm Maple!'], 'detector dog = chó nghiệp vụ.'),
              O('No, it is perfume.', 0, ['Perfume? Maple does not think so...', 'Nước hoa á? Maple không nghĩ vậy đâu...'], 'Đừng đùa với hải quan. Nói thật nhé!')])] }] },
        { id: 'tourist', name: 'Traveler', look: 'tourist', x: 15, y: 5, wander: 2,
          talks: [{ steps: [S('Is this your first time in Canada?', 'Đây là lần đầu bạn đến Canada à?'),
            C('Trả lời và hỏi lại: “Yes, it is. How about you?”', [
              O('Yes, it is! How about you?', 1, ['I live here. You will love it!', 'Tôi sống ở đây. Bạn sẽ thích nơi này!'], '“How about you?” = Còn bạn thì sao? Hỏi lại để giữ cuộc trò chuyện.'),
              O('Yes. It is cold!', 1, ['Ha! This is nothing. Wait until January!', 'Ha! Chưa là gì đâu. Đợi đến tháng Một đi!'])])] }] }
      ]
    },
    /* ============ CHƯƠNG 5 · Sảnh đến Pearson: nhóm bạn ra đón ============ */
    {
      id: 'toronto', icon: '👋', title: 'Sảnh đến Pearson: nhóm bạn ra đón', theme: 'pearson', map: mapPearson(), spawn: [2, 7], enterSound: 'welcome_jingle', music: 'music_airport',
      intro: 'Tháng 8, Toronto đang giữa mùa hè: nắng, nóng ẩm, 8 giờ tối trời vẫn sáng. Em vừa qua cửa hải quan ở sân bay Pearson. Ngoài sảnh đến có 5 người bạn đang chờ, ai cũng muốn làm quen với em!',
      signs: [{ x: 6, y: 0.1, text: 'ARRIVALS · ARRIVÉES' }, { x: 19, y: 0.1, text: 'WELCOME TO TORONTO 🍁' }, { x: 14.5, y: 2.4, text: 'ℹ️ Information', small: 1 }, { x: 28, y: 0.1, text: '☕ CAFÉ', small: 1 }, { x: 31, y: 7.4, text: 'Rideshare · Taxi →', small: 1 }, { x: 7, y: 11.4, text: '🧳 Baggage 7', small: 1 }],
      zones: [{ x: 1, y: 1, w: 32, h: 14, name: 'Sảnh đến · Toronto Pearson', music: 'music_airport' }],
      objectives: [
        { id: 'o1', text: 'Gặp Josh – người cầm bảng WELCOME', target: 'josh' },
        { id: 'o2', text: 'Làm quen với Priya', target: 'priya' },
        { id: 'o3', text: 'Làm quen với Liam', target: 'liam' },
        { id: 'o4', text: 'Làm quen với Jenny', target: 'jenny' },
        { id: 'o5', text: 'Làm quen với Daniel – bạn cũng ở North York', target: 'daniel' },
        { id: 'o6', text: 'Chụp ảnh nhóm với cả hội (nói với Josh)', target: 'josh', onDone: 'item_get' }
      ],
      npcs: [
        { id: 'josh', name: 'Josh', look: 'josh_sign', x: 6, y: 7, main: 1,
          talks: [{ obj: 'o1', steps: [
            S("Ayyy, there they are! You're {name}, right? Welcome to Canada! I'm Josh.", "Ayyy, tới rồi kìa! Bạn là {name} đúng không? Chào mừng tới Canada! Mình là Josh."),
            C("Chào lại và tự giới thiệu ngắn: “Hi! Yeah, I'm…”", [
              O("Hi Josh! Yeah, I'm {name}. Thanks for coming to pick me up!", 1, ["Of course! We wouldn't miss it. So, how was the flight?", "Tất nhiên rồi! Bọn mình đâu có bỏ lỡ. Vậy, chuyến bay thế nào?"], "“pick someone up” = ra đón ai đó. Câu cảm ơn này rất tự nhiên."),
              O("Yes. I am {name}. I am student. I come from Vietnam.", 0.5, ["Haha, okay, very formal! Relax, you're with friends now. How was the flight?", "Haha, trang trọng ghê! Thả lỏng đi, giờ toàn bạn bè mà. Bay thế nào?"], "Nói tự nhiên hơn: “I'm a student from Vietnam.” Nhớ có “a” trước student."),
              O("Who are you? Where is my mom?", 0, ["Uh… your mom's in Vietnam, bro. I'm the welcome committee!", "Ờ… mẹ bạn ở Việt Nam mà. Mình là đội chào đón nè!"], "Người lạ ra đón thì cứ chào: “Hi! You must be Josh.”")]),
            C("Kể về chuyến bay: dài, mệt, không ngủ được…", [
              O("Honestly, it was so long. Like, twenty hours. I'm kinda dead.", 1, ["Twenty hours?! Yeah, you're gonna have jet lag for days.", "Hai mươi tiếng?! Rồi, bạn sẽ bị lệch múi giờ mấy ngày cho xem."], "“honestly”, “like”, “kinda” (= kind of) là từ đệm người bản xứ hay dùng. “I'm dead” (đùa) = mệt rã rời."),
              O("It was okay. The food was… interesting.", 1, ["“Interesting.” That's the nicest way to say airplane food is bad, eh?", "“Thú vị.” Đó là cách lịch sự nhất để chê đồ ăn máy bay đấy, eh?"], "“interesting” đôi khi là cách nói tránh, nghĩa là “không ngon lắm”."),
              O("Flight is good weather.", 0, ["Wait, what? The flight… is good weather?", "Khoan, gì cơ? Chuyến bay… là thời tiết đẹp?"], "Thử: “The flight was okay, but it was really long.”")]),
            S("Okay, lemme introduce you to the crew. That's Priya over there. She's the smart one. Go say hi!", "Rồi, để mình giới thiệu băng nhóm. Kia là Priya, đứa thông minh nhất hội. Ra chào đi!")] },
            { obj: 'o6', steps: [
              S("Okay, squad! Group photo! Everybody squeeze in. {name}, you're in the middle. You're the main character today.", "Rồi cả hội! Chụp ảnh nhóm nào! Mọi người chen vào. {name} đứng giữa nhé, hôm nay bạn là nhân vật chính."),
              C("Khi chụp ảnh: “Say cheese!”, hoặc kiểu Canada: “Say maple syrup!”", [
                O("Okay! Everybody say “maple syrup”!", 1, ["MAPLE SYRUP! Haha, perfect. That one's going in the group chat.", "MAPLE SYRUP! Haha, đỉnh. Tấm này lên nhóm chat liền."], "“group chat” = nhóm chat. Người trẻ Canada hay gọi tắt là “the GC”."),
                O("Wait, wait! My hair looks bad. Okay, now!", 1, ["You look great! Three, two, one… nailed it!", "Đẹp mà! Ba, hai, một… chuẩn luôn!"], "“Nailed it!” = làm chuẩn luôn!")]),
              I('group_photo'),
              S("Okay, this pic is giving “first day in Canada”. I love it.", "Tấm này toát ra vibe “ngày đầu ở Canada” luôn. Mê ghê.", 'jenny'),
              C("Jenny dùng tiếng lóng “it's giving…”. Đáp lại cho vui.", [
                O("Yes! The vibe is perfect. Slay!", 1, ["Look at you using slang already! Okay, let's go find that Uber.", "Nhìn kìa, dùng tiếng lóng rồi đấy! Rồi, đi tìm Uber thôi."], "“It's giving + …” = toát ra vẻ… · “vibe” = không khí, cảm giác · “Slay!” = đỉnh, xuất sắc."),
                O("It's giving… what? A present?", 0.5, ["Haha, no! “It's giving…” means it has that vibe. Like, “this outfit is giving summer”.", "Haha, không phải! “It's giving…” nghĩa là toát ra vẻ đó. Kiểu “bộ đồ này toát ra mùa hè”."], "“It's giving + danh từ/tính từ” = trông như…, mang vibe…")])] }],
          before: ['', ''], after: ["I'm holding the sign, so I'm basically famous now.", "Mình đang cầm bảng, nên giờ mình gần như là người nổi tiếng rồi."] },
        { id: 'priya', name: 'Priya', look: 'priya', x: 9, y: 5, main: 1,
          talks: [{ obj: 'o2', steps: [
            S("Hi! I'm Priya. Oh my god, you made it! How are you feeling?", "Chào! Mình là Priya. Trời ơi, bạn tới rồi! Thấy sao rồi?"),
            C("Chưa nghe rõ tên? Hỏi lại: “Sorry, how do you say your name?”", [
              O("Hi! Sorry, how do you say your name again?", 1, ["It's Pree-ya. Don't worry, people get it wrong all the time.", "Là Pri-a. Đừng lo, nhiều người đọc sai lắm."], "Hỏi lại tên là lịch sự. Người Canada thích bạn hỏi để gọi cho đúng."),
              O("Hi, Pizza! Nice to meet you!", 0.5, ["Pizza?! Okay, that's a new one. It's Priya. But I do love pizza, so… fair.", "Pizza á?! Mới nghe đấy. Là Priya nhé. Mà mình cũng mê pizza thật, nên… cũng được."], "Không chắc tên thì đừng đoán, hãy hỏi: “Sorry, how do you say your name?”"),
              O("What is your name? Tell me again. Again.", 0, ["Uh, okay… it's Priya. You don't have to sound like a cop, haha.", "Ờ… là Priya. Không cần hỏi như cảnh sát đâu, haha."], "Thêm “Sorry” ở đầu và “again” ở cuối: “Sorry, what was your name again?”")]),
            S("So, I'm in Computer Science at your college. Where are you staying?", "Mình học ngành Khoa học máy tính ở trường bạn đó. Bạn ở đâu?"),
            C("Nói nơi ở: North York, gần ga North York Centre.", [
              O("I'm staying in North York, near North York Centre station.", 1, ["Nice! North York is chill. How much is your rent? Actually, no, don't tell me. I'll cry.", "Hay đó! North York yên bình lắm. Tiền nhà bao nhiêu? À thôi, đừng nói. Mình khóc mất."], "“I'm staying in…” dùng cho chỗ ở mới đến, ở tạm."),
              O("I share a place with three roommates. It's cheap… kind of.", 1, ["Three roommates? Welcome to Toronto. That's literally the only way to survive the rent.", "Ba người ở chung? Chào mừng tới Toronto. Đó đúng là cách duy nhất để sống sót với tiền nhà."], "“share a place” = ở chung nhà. “literally” = đúng nghĩa đen (người trẻ dùng để nhấn mạnh).")]),
            S("Real talk, though: rent here is insane. My tiny room costs more than my phone, my food and my sanity combined.", "Nói thật nhé: tiền thuê nhà ở đây điên rồ lắm. Cái phòng bé tí của mình còn đắt hơn cả điện thoại, tiền ăn và sự tỉnh táo của mình cộng lại."),
            C("Đáp lại kiểu đùa, đồng cảm.", [
              O("Wow, that's rough. I guess I'm eating instant noodles every day.", 1, ["Same! Welcome to student life. Oh, Liam's coming. Brace yourself. He's very Canadian.", "Y chang! Chào mừng tới cuộc đời sinh viên. Ơ, Liam tới kìa. Chuẩn bị tinh thần nha, cậu ấy Canada lắm."], "“That's rough” = thế thì khổ thật. Dùng để đồng cảm."),
              O("Rent is a small problem. I am rich.", 0.5, ["Oh, you're rich? Cool, then you can pay my rent, haha.", "Ồ, giàu à? Hay quá, vậy trả tiền nhà giúp mình nhé, haha."], "Đùa được, nhưng để đồng cảm thì nói: “That's rough.”")])] }],
          before: ['', ''], after: ["Go meet Liam! He's the one in the toque. In August. Don't ask.", "Ra gặp Liam đi! Cái người đội mũ len đó. Vào tháng Tám. Đừng hỏi."] },
        { id: 'liam', name: 'Liam', look: 'liam', x: 10, y: 9, main: 1,
          talks: [{ obj: 'o3', steps: [
            S("Oh, sorry! Sorry, was that your bag? My bad. Sorry! Hi, I'm Liam. Welcome to Canada, eh!", "Ôi, xin lỗi! Xin lỗi, túi của bạn hả? Lỗi mình. Xin lỗi! Chào, mình là Liam. Chào mừng tới Canada, eh!"),
            C("Liam xin lỗi liên tục. Đáp: “No worries!” / “You're good!”", [
              O("No worries! Hi Liam, nice to meet you.", 1, ["Nice to meet you too! Sorry, I say sorry a lot. It's a Canadian thing.", "Rất vui được gặp! Xin lỗi, mình hay nói sorry lắm. Đặc sản Canada đó."], "Người Canada nói “sorry” rất nhiều, kể cả khi người khác va vào họ. Đáp: “No worries!” hoặc “You're good!”"),
              O("Sorry! No, I'm sorry! Sorry!", 0.5, ["Haha! Look at you, already apologizing like a local. You're gonna fit right in.", "Haha! Nhìn kìa, đã xin lỗi y như dân bản địa rồi. Bạn sẽ hoà nhập nhanh thôi."], "Cuộc thi nói “sorry” là chuyện thường ngày ở Canada 😄"),
              O("You hit my bag. You must pay.", 0, ["Uh… I said sorry like five times, buddy.", "Ờ… mình xin lỗi năm lần rồi đó, bạn."], "Thân thiện hơn: “You're good, no worries.”")]),
            S("So, how's the weather treating you? Pretty hot today, eh? It feels like thirty-five with the humidity.", "Thời tiết thế nào với bạn? Nay nóng ghê ha? Tính cả độ ẩm thì cảm giác như 35 độ."),
            C("Small talk về thời tiết: “I know, right?”, “I thought Canada was cold!”", [
              O("I know, right? I thought Canada was always cold!", 1, ["Haha, everybody thinks that. Enjoy summer while it lasts, eh. Winter is long. Like, really long.", "Haha, ai cũng nghĩ thế. Tận hưởng mùa hè khi còn có thể nhé. Mùa đông dài lắm. Rất rất dài."], "“I know, right?” = Đúng thế nhỉ! · “eh” /eɪ/ cuối câu là đặc sản Canada, giống “nhỉ?”, “ha?”."),
              O("It's hot, but Vietnam is hotter. This is nothing!", 1, ["Okay, tough guy! Come back and say that in January when it's minus twenty.", "Được rồi, người cứng! Tháng Một âm 20 độ quay lại nói câu đó nhé."], "“tough guy” (đùa) = người cứng rắn."),
              O("Weather is degrees.", 0, ["Weather is… degrees? I mean, technically, yeah?", "Thời tiết là… độ? Ờ thì, về mặt kỹ thuật, đúng?"], "Thử: “It's really hot and humid today.”")]),
            S("Anyway, after this we gotta grab a double-double at Tims. You haven't lived until you've had Timbits.", "Mà xong vụ này phải đi làm ly double-double ở Tims nha. Chưa ăn Timbits là chưa sống đâu."),
            C("Không hiểu từ mới? Hỏi: “Sorry, what's a…?”", [
              O("Sorry, what's a Timbit?", 1, ["Little donut balls! Bite-sized. Dangerous. You'll see, bud.", "Những viên donut tròn nhỏ! Vừa một miếng. Nguy hiểm lắm. Rồi bạn sẽ thấy."], "“bud” / “buddy” = bạn ơi, cách gọi thân mật kiểu Canada."),
              O("Okay! I love Tim. Who is Tim?", 0.5, ["Haha, Tim Horton was a hockey player! The coffee place is named after him.", "Haha, Tim Horton là một cầu thủ khúc côn cầu! Chuỗi cà phê đặt theo tên ông ấy."], "Tim Hortons mang tên cầu thủ hockey Tim Horton, một trong những người sáng lập.")])] }],
          before: ['', ''], after: ["Jenny's over there. She talks fast, so just, like, hold on tight.", "Jenny ở đằng kia. Cô ấy nói nhanh lắm, nên bám chắc vào nhé."] },
        { id: 'jenny', name: 'Jenny', look: 'jenny', x: 13, y: 7, main: 1,
          talks: [{ obj: 'o4', steps: [
            S("Heyyy, I'm Jenny! I talk super fast, so just stop me if I lose you, okay? I'm from Markham, which is basically Toronto, but with better bubble tea and worse parking.", "Heyyy, mình là Jenny! Mình nói nhanh lắm, thấy không theo kịp thì cứ ngắt lời nhé? Mình ở Markham, kiểu như Toronto nhưng trà sữa ngon hơn và chỗ đỗ xe tệ hơn."),
            C("Nhờ nói chậm lại: “Could you slow down a little?”", [
              O("Nice to meet you, Jenny! Could you slow down a little? My brain is still on the plane.", 1, ["Haha, totally fair. Okay. Slow. Mode. On. Better?", "Haha, hoàn toàn hợp lý. Rồi. Chế. Độ. Chậm. Bật. Ổn hơn chưa?"], "“Could you slow down a little?” = Bạn nói chậm lại chút được không? Rất lịch sự."),
              O("What? What? What?", 0.5, ["Okay, okay! Slower. Got it. You look like you're buffering, haha.", "Rồi rồi! Chậm thôi. Hiểu rồi. Nhìn bạn như video đang tải, haha."], "“buffering” = đang tải (như video mạng chậm), cách đùa khi ai đó chưa hiểu kịp."),
              O("You talk too much.", 0, ["Wow. Okay. Rude, but… honestly not wrong.", "Ghê. Thôi được. Hơi thô, nhưng… nói thật thì cũng không sai."], "Dùng câu nhờ vả lịch sự: “Sorry, could you say that again more slowly?”")]),
            S("So, what do you wanna do first? Sleep? Eat? Cry about your jet lag?", "Vậy bạn muốn làm gì trước? Ngủ? Ăn? Hay khóc vì lệch múi giờ?"),
            C("Nói mình muốn gì: “I wanna…”, “I'm starving.”", [
              O("Honestly, I wanna eat something. I'm starving.", 1, ["Bet. Daniel knows all the good food spots in North York. He's like a walking Google Maps.", "Chốt. Daniel biết hết quán ngon ở North York. Kiểu Google Maps biết đi ấy."], "“Bet.” (lóng) = Chốt! / OK luôn. · “starving” = đói meo. · “wanna” = want to."),
              O("Cry about my jet lag, please.", 0.5, ["Haha! Valid. We'll cry together over some fried chicken.", "Haha! Hợp lý. Cả hội sẽ cùng khóc bên đĩa gà rán."], "“Valid.” (lóng) = Hợp lý, chính đáng.")])] }],
          before: ['', ''], after: ["Daniel's the guy in the black tee. He's lowkey the best tour guide in the city.", "Daniel là anh chàng áo phông đen. Kiểu ngầm ngầm là hướng dẫn viên xịn nhất thành phố."] },
        { id: 'daniel', name: 'Daniel', look: 'daniel', x: 17, y: 8, main: 1,
          talks: [{ obj: 'o5', steps: [
            S("Hey, I'm Daniel. I heard you're in North York too? I live like ten minutes from Finch station.", "Chào, mình là Daniel. Nghe nói bạn cũng ở North York à? Nhà mình cách ga Finch cỡ mười phút."),
            C("Ngạc nhiên vui vì ở gần nhau: “No way!”", [
              O("No way! I'm near North York Centre. We're basically neighbours!", 1, ["Nice! That's literally one stop away. I'll show you Koreatown North. It's right on Yonge Street.", "Tuyệt! Chỉ cách đúng một ga. Mình sẽ dẫn bạn đi Koreatown North, ngay trên phố Yonge."], "“No way!” = Thật á! (ngạc nhiên vui). Canada viết kiểu Anh: neighbour, colour, favourite."),
              O("Yes. North York. Good.", 0.5, ["Haha, okay, man of few words. I respect that.", "Haha, được, người ít nói. Tôn trọng."], "Thêm chi tiết để câu chuyện kéo dài: “I'm near North York Centre station.”")]),
            S("So, how do we get there? We could take the UP Express and then the subway, but with all your bags… I say we just get an Uber.", "Vậy đi về kiểu gì? Có thể đi UP Express rồi chuyển tàu điện ngầm, nhưng với đống vali của bạn… mình nghĩ gọi Uber cho lẹ."),
            C("Đồng ý và hỏi về giá: “…, though?”", [
              O("Sounds good. Is it expensive, though?", 1, ["If we split it five ways, it's not bad. Splitting is a Toronto student survival skill.", "Chia 5 thì không đắt lắm. Chia tiền là kỹ năng sinh tồn của sinh viên Toronto."], "“split it” = chia tiền. “though” ở cuối câu = …nhưng mà?"),
              O("Let's walk! How far is it?", 0.5, ["Like twenty-five kilometres. With a suitcase. On the highway. So… no.", "Khoảng 25 cây số. Kéo vali. Trên đường cao tốc. Nên… thôi nhé."], "Từ Pearson về North York khoảng 25 km.")]),
            S("Wait, before we go, Josh wants a group photo. He does this with everyone. Classic Josh.", "Khoan, trước khi đi Josh muốn chụp ảnh nhóm. Cậu ấy làm thế với tất cả mọi người. Đúng kiểu Josh.")] }],
          before: ['', ''], after: ["Josh is setting up the group photo. Go!", "Josh đang chuẩn bị chụp ảnh nhóm kìa. Đi!"] },
        { id: 'info', name: 'Information desk', look: 'staff', x: 15, y: 2, range: 2.3,
          talks: [{ steps: [S("Welcome to Toronto Pearson! Can I help you with anything?", "Chào mừng đến Toronto Pearson! Tôi giúp gì được cho bạn?"),
            C("Hỏi nhà vệ sinh kiểu Canada: “washroom”.", [
              O("Hi! Where's the washroom, please?", 1, ["Right behind you, next to the baggage carousel.", "Ngay sau lưng bạn, cạnh băng chuyền hành lý."], "Ở Canada nói “washroom” (Mỹ: restroom, Anh: toilet). Nói “toilet” nghe hơi thẳng."),
              O("Is there free Wi-Fi here?", 1, ["Yes! Just connect to the airport network. It's free.", "Có! Cứ kết nối vào mạng của sân bay. Miễn phí."], "“connect to…” = kết nối vào…")])] }] },
        { id: 'cafe', name: 'Café staff', look: 'barista', x: 28, y: 2, range: 2.3,
          talks: [{ steps: [S("Hey! Wanna grab a water? It's like four bucks. Airport prices, sorry!", "Chào! Lấy chai nước không? Cỡ bốn đô. Giá sân bay mà, xin lỗi nha!"),
            C("“bucks” = đô la (khẩu ngữ).", [
              O("Four bucks? For water? Okay… I'll take one.", 1, ["I know, it's highway robbery. Here you go!", "Biết mà, cắt cổ thật. Của bạn đây!"], "“bucks” = dollars. “highway robbery” (đùa) = đắt cắt cổ."),
              O("No thanks, I'll survive.", 1, ["Fair enough! Welcome to Toronto!", "Cũng phải! Chào mừng tới Toronto!"], "“Fair enough” = cũng hợp lý.")])] }] },
        { id: 'traveler', name: 'Traveler', look: 'woman', x: 24, y: 9, wander: 2,
          talks: [{ steps: [S("Excuse me, do you know where the rideshare pickup is?", "Xin lỗi, bạn có biết điểm đón xe công nghệ ở đâu không?"),
            C("Chưa chắc? Nói thật và chỉ biển hiệu.", [
              O("Sorry, I'm new here too. But I think it's outside. Just follow the “Rideshare” signs.", 1, ["Oh, I see it! Thanks so much!", "À, thấy rồi! Cảm ơn nhiều nha!"], "“follow the signs” = đi theo biển chỉ dẫn."),
              O("Rideshare? Is that a ship?", 0, ["Haha, no, it's like Uber or Lyft!", "Haha, không, kiểu như Uber hay Lyft đó!"], "“rideshare” = xe công nghệ (Uber, Lyft…).")])] }] }
      ]
    },
    /* ============ CHƯƠNG 6 · Gọi Uber về North York, ghé phố Hàn trên Yonge St ============ */
    {
      id: 'uber', icon: '🚗', title: 'Gọi Uber về North York & phố Hàn', theme: 'street', map: mapYonge(), spawn: [4, 4], tall: 4, music: 'music_airport',
      intro: '6 giờ chiều mà trời vẫn sáng trưng. Cả nhóm ra điểm đón xe công nghệ (rideshare) của sân bay để gọi Uber về North York. Sau đó Daniel sẽ dẫn em đi dạo Koreatown North trên phố Yonge, đoạn giữa Sheppard và Finch.',
      signs: [{ x: 7, y: 2.1, text: 'RIDESHARE PICK-UP · ZONE C', bg: '#2d3436' }, { x: 2.5, y: 2.1, text: 'Terminal 1', small: 1 },
        { x: 19, y: 4.1, text: '치킨 · KOREAN FRIED CHICKEN', bg: '#e67e22' }, { x: 24.5, y: 4.1, text: '노래방 · KARAOKE 🎤', bg: '#8e44ad' }, { x: 29.5, y: 4.1, text: '빵집 · BAKERY 🥐', bg: '#a0522d' },
        { x: 34.5, y: 4.1, text: 'PHỞ SÀI GÒN · Vietnamese Noodles', bg: '#c0392b', h: 0.42 }, { x: 43.5, y: 4.1, text: '서울 마트 · SEOUL MART', bg: '#27ae60' },
        { x: 21, y: 8.2, text: 'Yonge St', small: 1, bg: '#1d6b3a', color: '#ffffff', border: '#ffffff' }, { x: 44.5, y: 8.2, text: 'Finch Ave →', small: 1 }, { x: 36.5, y: 8.2, text: '🚏 TTC · 39 Finch East', small: 1, bg: '#d7262e', color: '#ffffff', border: '#ffffff' }, { x: 17.6, y: 8.2, text: '← Sheppard Ave', small: 1 }],
      zones: [{ x: 0, y: 3, w: 16, h: 13, name: 'Điểm đón rideshare · Pearson', music: 'music_airport' }, { x: 17, y: 5, w: 33, h: 11, name: 'Yonge St · Koreatown North', music: 'music_koreatown' }, { x: 39, y: 1, w: 10, h: 4, name: 'Seoul Mart', music: 'music_koreatown' }],
      objectives: [
        { id: 'o1', text: 'Ra điểm đón rideshare, hỏi Daniel xem xe tới chưa', target: 'daniel', onDone: 'uber_arrive' },
        { id: 'o2', text: 'Xe tới rồi! Kiểm tra biển số và chào tài xế', target: 'driver', move: [{ id: 'uber', x: 7, y: 8 }], show: ['driver'], onDone: 'car_door' },
        { id: 'o3', text: 'Trên xe: trò chuyện với tài xế', target: 'driver', auto: 1 },
        { id: 'o4', text: 'Tới Yonge St! Đi dạo Koreatown North cùng Daniel', target: 'daniel', warp: { x: 21, y: 7, face: 'daniel', sound: 'car_door', text: '🚗 Xe dừng ở Yonge St, gần Finch' },
          move: [{ id: 'daniel', x: 25, y: 6 }, { id: 'uber', x: 20, y: 9 }, { id: 'josh', x: 18, y: 6 }, { id: 'priya', x: 37, y: 7 }, { id: 'liam', x: 32, y: 6 }, { id: 'jenny', x: 43, y: 7 }], hide: ['driver'] },
        { id: 'o5', text: 'Ghé tiệm bánh Hàn, mua một hộp bánh óc chó', target: 'baker' },
        { id: 'o6', text: 'Vào Seoul Mart hỏi chỗ để mì cay', target: 'grocer' },
        { id: 'o7', text: 'Cả nhóm bàn xem đi đâu tiếp (nói với Jenny)', target: 'jenny' }
      ],
      npcs: [
        { id: 'daniel', name: 'Daniel', look: 'daniel', x: 6, y: 5, main: 1,
          talks: [{ obj: 'o1', steps: [
            S("Okay, I ordered an Uber XL, so we all fit. The app says the driver is three minutes away. It's a grey Toyota, plate C-K-R-T 4-8-2.", "Rồi, mình gọi Uber XL để đủ chỗ cho cả hội. App báo tài xế còn 3 phút nữa. Xe Toyota màu xám, biển số CKRT 482."),
            C("Hỏi cách nhận ra xe: “How do we know it's the right car?”", [
              O("Cool. How do we know it's the right car?", 1, ["Always check the plate and ask the driver who it's for. Never just jump into a random car.", "Luôn kiểm tra biển số và hỏi tài xế đón ai. Đừng bao giờ nhảy đại lên xe lạ."], "An toàn khi đi xe công nghệ: kiểm tra biển số (licence plate) và hỏi “Who are you here for?”"),
              O("Grey car? Okay, I'll get in the first grey car I see.", 0, ["Please don't! Half the cars in Toronto are grey, haha. Check the plate!", "Đừng nha! Nửa số xe ở Toronto là màu xám đó, haha. Kiểm tra biển số!"], "Luôn khớp biển số với app trước khi lên xe.")]),
            S("Also, it's like six PM and still super bright out. In August the sun doesn't set till like eight-thirty.", "Mà giờ 6 giờ chiều rồi mà trời vẫn sáng trưng. Tháng Tám mặt trời phải tới 8 rưỡi mới lặn."),
            C("Small talk về trời sáng lâu.", [
              O("That's crazy! In Vietnam it gets dark around six.", 1, ["Right? Summer days here are amazing. Winter days… not so much. Oh, there's the car!", "Đúng không? Ngày hè ở đây tuyệt lắm. Ngày đông thì… không hẳn. Ơ, xe tới kìa!"], "“it gets dark” = trời tối."),
              O("So when do people sleep?", 0.5, ["Haha, with blackout curtains! Oh, there's the car!", "Haha, với rèm chắn sáng! Ơ, xe tới kìa!"], "“blackout curtains” = rèm cản sáng.")]),
            N('📱 Ting ting! App báo: “Your driver has arrived.”')] },
            { obj: 'o4', steps: [
              S("Welcome to Koreatown North! This part of Yonge, between Sheppard and Finch, is like the heart of Willowdale.", "Chào mừng tới Koreatown North! Đoạn này của Yonge, giữa Sheppard và Finch, giống như trái tim của khu Willowdale."),
              C("Hỏi về biển hiệu hai thứ tiếng.", [
                O("Why are the signs in Korean and English?", 1, ["Tons of Korean families moved here since like the nineties. So you get Korean signs, Korean food, karaoke… it's the best.", "Rất nhiều gia đình Hàn chuyển tới đây từ khoảng thập niên 90. Nên có biển tiếng Hàn, đồ ăn Hàn, karaoke… đỉnh lắm."], "“Tons of…” (khẩu ngữ) = rất nhiều. Toronto là thành phố đa văn hoá: rất nhiều cộng đồng giữ ngôn ngữ của mình."),
                O("Wait, am I in Seoul now?", 0.5, ["Haha, kinda feels like it, right? But no, still North York.", "Haha, cảm giác giống thật nhỉ? Nhưng không, vẫn là North York."], "")]),
              S("Okay, my top three: fried chicken, karaoke, and the bakery with the walnut cakes. Which one first?", "Rồi, top 3 của mình: gà rán, karaoke và tiệm bánh có bánh óc chó. Đi cái nào trước?"),
              C("Chọn và nói lý do: “Let's start with…, because…”", [
                O("Let's start with the bakery. I need something sweet.", 1, ["Good call! Their walnut cakes are lowkey addictive. It's right over there.", "Chuẩn! Bánh óc chó ở đó gây nghiện ngầm luôn. Ngay đằng kia."], "“Good call!” = Chọn hay đó! · “lowkey” (lóng) = ngầm ngầm, kiểu không ồn ào nhưng thật."),
                O("Karaoke! I will sing Celine Dion. Very Canadian.", 0.5, ["Haha, respect. But let's eat first, then you can destroy “My Heart Will Go On”.", "Haha, nể. Nhưng ăn trước đã, rồi bạn tha hồ “phá nát” My Heart Will Go On."], "Celine Dion là ca sĩ người Canada (Québec).")])] }],
          before: ['', ''], after: ["The bakery's right there. Trust me on the walnut cakes.", "Tiệm bánh ngay kia. Tin mình vụ bánh óc chó đi."] },
        { id: 'uber', name: 'Uber · CKRT 482', look: null, x: 13, y: 12, object: 1, kind: 'car', color: 0x7f8c8d, plate: 'CKRT 482', roof: 'UBER', label: 'Xe Uber', labelY: 1.9, box: [1.3, 0.7], range: 2.2 },
        { id: 'driver', name: 'Raj (driver)', look: 'driver', x: 9, y: 7, main: 1, hidden: 1, range: 2.0,
          talks: [{ obj: 'o2', steps: [
            S("Hi! Uber? Who's it for?", "Chào! Đi Uber hả? Đặt cho ai vậy?"),
            C("Xác nhận tên & biển số trước khi lên xe.", [
              O("Hi! It's for Daniel. Are you Raj? Plate CKRT 482?", 1, ["That's me! Five of you? No problem, it's an XL. Bags go in the trunk.", "Đúng tôi! Năm người hả? Không sao, xe XL mà. Vali để vào cốp nhé."], "Hỏi tên tài xế + biển số là cách kiểm tra an toàn chuẩn."),
              O("Hello! Can you take me anywhere?", 0, ["Uh, I only take the person who booked. Who's it for?", "Ờ, tôi chỉ chở người đã đặt xe. Đặt cho ai vậy?"], "Nói tên người đặt: “It's for Daniel.”")]),
            S("Here, let me help you with that suitcase. Whoa, what's in here? Bricks?", "Đây, để tôi giúp cái vali. Ồ, trong này có gì vậy? Gạch à?"),
            C("Đáp lại vui vẻ (vali toàn đồ ăn mang từ Việt Nam).", [
              O("Haha, it's mostly food from my mom. Thanks for helping!", 1, ["Ha, every mom is the same! Okay, hop in.", "Ha, bà mẹ nào cũng vậy! Rồi, lên xe đi."], "“hop in” = lên xe đi (khẩu ngữ)."),
              O("Yes. Bricks. For building a house. Rent is expensive.", 0.5, ["Haha! Smart. Honestly, that might be cheaper. Hop in!", "Haha! Thông minh. Nói thật, khéo còn rẻ hơn. Lên xe đi!"], "Đùa về giá nhà là kiểu đùa rất “Toronto”.")])] },
            { obj: 'o3', steps: [
              N('🚗 Cả nhóm chen nhau lên xe. Xe lăn bánh ra khỏi sân bay…', 'car_door'),
              S("Seatbelts on, please, everybody. Even in the back.", "Mọi người thắt dây an toàn nhé. Ngồi sau cũng vậy."),
              C("Luật Ontario: ngồi ghế sau cũng phải thắt dây an toàn.", [
                O("Of course. Click! Done.", 1, ["Thank you! Safety first.", "Cảm ơn! An toàn là trên hết."], "Ở Ontario, mọi hành khách đều phải thắt dây an toàn, phạt khá nặng nếu không thắt."),
                O("Do I have to? I'm sitting in the back.", 0.5, ["Yep! It's the law in Ontario, front or back. And the fine is not cheap!", "Có! Luật Ontario, ghế trước hay sau đều vậy. Mà phạt không rẻ đâu!"], "“the fine” = tiền phạt.")]),
              N('🚦 Mười phút sau… xe đứng im trên đường cao tốc 401.'),
              S("Ugh, look at this. The 401. Every day, same story.", "Haizz, nhìn kìa. Đường 401. Ngày nào cũng y như vậy."),
              C("Hỏi về kẹt xe: “Is the traffic always this bad?”", [
                O("Is the traffic always this bad?", 1, ["Only on days that end in “y”. So… every day, my friend.", "Chỉ những ngày có tên kết thúc bằng chữ “y” thôi. Nghĩa là… ngày nào cũng vậy, bạn ạ."], "Câu đùa: Monday, Tuesday… ngày nào trong tiếng Anh cũng kết thúc bằng “y” = ngày nào cũng kẹt. Đường 401 là một trong những cao tốc đông nhất Bắc Mỹ."),
                O("Can we fly over the cars?", 0.5, ["Ha! If I could, I'd charge you double.", "Ha! Nếu bay được tôi tính gấp đôi tiền."], "")]),
              S("So, where are you from? First time in Toronto?", "Vậy bạn từ đâu tới? Lần đầu tới Toronto à?"),
              C("Kể ngắn về bản thân với tài xế.", [
                O("Yeah, first time! I'm from Vietnam. I'm here to study.", 1, ["Welcome! My neighbour is Vietnamese. Best pho I've ever had. You're gonna like Toronto.", "Chào mừng! Hàng xóm tôi là người Việt. Phở ngon nhất tôi từng ăn. Bạn sẽ thích Toronto thôi."], ""),
                O("I'm from the airport.", 0, ["Haha, well, yeah, I picked you up there. But originally?", "Haha, ừ thì tôi đón bạn ở đó. Nhưng quê gốc ở đâu?"], "“Where are you from?” hỏi quê/nước. Trả lời: “I'm from Vietnam.”")]),
              S("Okay, here we are, Yonge and Finch. Have a good one, guys!", "Rồi, tới nơi, ngã Yonge với Finch. Chúc cả nhà một ngày vui nhé!"),
              C("Chào tài xế: “Have a good one!” là câu chào rất phổ biến.", [
                O("Thank you so much, Raj! You too, have a good one!", 1, ["Take care! Five stars, please!", "Bảo trọng! Nhớ cho 5 sao nha!"], "Tiền xe và tip cho tài xế trả ngay trong app. Có thể chấm sao (rating) cho tài xế."),
                O("Bye. Money?", 0, ["It's all in the app, don't worry!", "Trả trong app hết rồi, đừng lo!"], "Lịch sự hơn: “Thanks! Have a good one!”. Thanh toán và tip làm trong app.")])] }],
          before: ['', ''], after: ["Five stars, please!", "Nhớ cho 5 sao nha!"] },
        { id: 'josh', name: 'Josh', look: 'josh', x: 11, y: 5,
          talks: [{ steps: [S("Bro, did you see the Raptors banner at the airport? Basketball is life here. We won the championship in 2019, and I still haven't recovered.", "Ê, thấy băng rôn Raptors ở sân bay không? Bóng rổ là cả cuộc đời ở đây. Bọn mình vô địch năm 2019, tới giờ mình vẫn chưa hết phê."),
            C("Hỏi thêm cho vui: “Wanna watch a game together?”", [
              O("No way! We should watch a game together sometime.", 1, ["Bet! I'll get the snacks. You bring the energy.", "Chốt! Mình lo đồ ăn vặt. Bạn lo năng lượng."], "Toronto Raptors (NBA) vô địch năm 2019. “sometime” = một lúc nào đó."),
              O("What is a Raptor? A dinosaur?", 0.5, ["Haha, technically, yes! But it's also the best basketball team in the world. No cap.", "Haha, về mặt kỹ thuật thì đúng! Nhưng cũng là đội bóng rổ hay nhất thế giới. Không xạo đâu."], "“No cap” (lóng) = nói thật, không xạo.")])] }] },
        { id: 'priya', name: 'Priya', look: 'priya', x: 3, y: 6,
          talks: [{ steps: [S("Fun fact: an Uber from the airport costs more than my groceries for a week. Splitting it five ways is the only reason I'm here.", "Sự thật thú vị: một chuyến Uber từ sân bay đắt hơn tiền đi chợ cả tuần của mình. Chia 5 là lý do duy nhất mình có mặt ở đây."),
            C("Đáp lại kiểu đùa.", [
              O("Haha, so you're here for the discount, not for me?", 1, ["Both! But mostly the discount. Kidding!", "Cả hai! Nhưng chủ yếu là được giảm giá. Đùa thôi!"], "“Kidding!” = Đùa thôi!"),
              O("Groceries are very expensive here?", 1, ["Yeah, food prices went way up. Pro tip: No Frills and FreshCo are cheaper.", "Ừ, giá đồ ăn tăng nhiều lắm. Mẹo: No Frills và FreshCo rẻ hơn."], "Nói tự nhiên hơn: “Are groceries really expensive here?” · “Pro tip” = mẹo hay.")])] }] },
        { id: 'liam', name: 'Liam', look: 'liam', x: 13, y: 6,
          talks: [{ steps: [S("You wanna know a Canadian secret? Say “sorry” when someone bumps into you. Trust me, it works.", "Muốn biết bí mật của người Canada không? Ai va vào bạn thì bạn nói “sorry”. Tin mình đi, hiệu quả lắm."),
            C("Hỏi lại cho chắc: “Wait, even if it's not my fault?”", [
              O("Wait, even if it's not my fault?", 1, ["Especially if it's not your fault! That's how you know you're Canadian, eh.", "Nhất là khi không phải lỗi của bạn! Đó mới là người Canada chính hiệu, eh."], "Ở Canada, “sorry” nhiều khi chỉ là phép lịch sự, giống “ồ, xin lỗi nhé”."),
              O("Okay. Sorry for being here.", 0.5, ["Haha, okay, that's a bit too much sorry.", "Haha, rồi, cái đó hơi bị xin lỗi quá đà."], "")])] }] },
        { id: 'jenny', name: 'Jenny', look: 'jenny', x: 9, y: 4, main: 1,
          talks: [{ obj: 'o7', steps: [
            S("Okay, team meeting. Option one: karaoke. Option two: fried chicken. Option three: Tims, because Liam won't shut up about Tims.", "Rồi, họp nhóm. Lựa chọn một: karaoke. Lựa chọn hai: gà rán. Lựa chọn ba: Tims, vì Liam cứ nói mãi về Tims."),
            S("I'm not apologizing. Tims is a national treasure, eh.", "Mình không xin lỗi đâu. Tims là báu vật quốc gia mà, eh.", 'liam'),
            C("Đưa ra ý kiến: “I vote for…” / “Why don't we…?”", [
              O("I vote for Tims! I need to try an Iced Capp.", 1, ["Ugh, fine. The Canadian wins again. Let's go, it's right around the corner.", "Hừ, thôi được. Người Canada lại thắng. Đi thôi, ngay góc đường kia."], "“I vote for…” = Mình bỏ phiếu cho… · “around the corner” = ngay gần đây."),
              O("Why don't we do all three? Tims first, then chicken, then karaoke.", 1, ["Ooh, a person with a plan. I like you. Okay, Tims first!", "Ồ, người có kế hoạch. Thích bạn rồi đó. Rồi, Tims trước!"], "“Why don't we…?” = Sao mình không… nhỉ? (gợi ý rất tự nhiên)"),
              O("I want sleep.", 0.5, ["Same, honestly. But caffeine first. Tims it is!", "Nói thật, mình cũng vậy. Nhưng nạp cafein trước. Vậy đi Tims!"], "Nói đầy đủ: “I really want to sleep.”")]),
            N('🍁 Cả nhóm kéo nhau tới quán Tims ở góc đường…')] },
            { steps: [S("Fun fact: Markham people call this “downtown”. Toronto people call it “the suburbs”. Everybody's mad.", "Sự thật thú vị: dân Markham gọi chỗ này là “trung tâm”. Dân Toronto gọi là “ngoại ô”. Ai cũng cay."),
              C("Đáp lại cho vui.", [
                O("Haha, so where is the real downtown?", 1, ["Down south, by the lake. Union Station, CN Tower, all that. We'll take you there!", "Ở phía nam, sát hồ. Ga Union, tháp CN, mấy chỗ đó. Bọn mình sẽ dẫn bạn đi!"], ""),
                O("I don't care, I'm hungry.", 0.5, ["Honestly? Mood.", "Nói thật? Đồng cảm."], "“Mood.” (lóng) = Y chang tâm trạng mình.")])] }],
          before: ['', ''], after: ["Tims, then chicken, then karaoke. That's the plan!", "Tims, rồi gà rán, rồi karaoke. Kế hoạch là vậy!"] },
        { id: 'baker', name: 'Bakery owner', look: 'baker', x: 29, y: 6, main: 1,
          talks: [{ obj: 'o5', steps: [
            S("Hi, welcome! Everything's fresh. The walnut cakes just came out of the oven.", "Chào, mời vào! Bánh nào cũng mới. Bánh óc chó vừa ra lò đó."),
            C("Gọi món: “Can I get a box of…, please?”", [
              O("Hi! Can I get a box of walnut cakes, please?", 1, ["Of course. Small box or large box?", "Được chứ. Hộp nhỏ hay hộp lớn?"], "“Can I get…, please?” là cách gọi món phổ biến nhất ở Canada."),
              O("Give me walnut.", 0, ["Uh… one walnut? Do you mean the walnut cakes?", "Ờ… một hạt óc chó? Ý bạn là bánh óc chó à?"], "Lịch sự hơn: “Can I get some walnut cakes, please?”")]),
            C("Chọn cỡ hộp và hỏi giá: “How much is it?”", [
              O("A small box, please. How much is it?", 1, ["It's on the sign, plus tax. Cash or card?", "Giá ghi trên bảng, cộng thuế nhé. Tiền mặt hay thẻ?"], "Ở Canada giá niêm yết thường CHƯA có thuế. Ontario cộng thuế HST khi thanh toán."),
              O("The large one. I'm sharing with my friends. Probably.", 1, ["Haha, “probably”. I like your honesty. Cash or card?", "Haha, “chắc là vậy”. Thích sự thật thà của bạn. Tiền mặt hay thẻ?"], "")]),
            C("Trả bằng thẻ: “Card, please. Can I tap?”", [
              O("Card, please. Can I tap?", 1, ["Yep, tap right here. Enjoy!", "Được, chạm vào đây. Ăn ngon nhé!"], "“tap” = chạm thẻ (thanh toán không tiếp xúc), cực phổ biến ở Canada."),
              O("Can I pay with my smile?", 0.5, ["Haha, I wish! Card or cash only.", "Haha, ước gì được! Chỉ thẻ hoặc tiền mặt thôi."], "")]),
            I('walnut')] }],
          before: ['', ''], after: ["Come back anytime!", "Lúc nào cũng mời quay lại nhé!"] },
        { id: 'grocer', name: 'Seoul Mart staff', look: 'grocer', x: 43, y: 3, main: 1,
          talks: [{ obj: 'o6', steps: [
            S("Hello! Looking for something?", "Xin chào! Bạn tìm gì à?"),
            C("Hỏi chỗ để đồ: “Excuse me, where can I find…?”", [
              O("Hi! Excuse me, where can I find the instant noodles?", 1, ["Aisle two, on your left. We have like fifty kinds.", "Dãy số hai, bên tay trái. Có tầm năm mươi loại đó."], "“Where can I find…?” = …ở đâu ạ? · “aisle” /aɪl/ = dãy kệ trong siêu thị (chữ s câm)."),
              O("Noodles. Where?", 0.5, ["Haha, aisle two. You must be really hungry.", "Haha, dãy hai. Chắc bạn đói lắm."], "Đầy đủ hơn: “Excuse me, where are the noodles?”")]),
            C("Hỏi về độ cay: “Is this one spicy?”", [
              O("Is this one spicy? I like spicy, but not too spicy.", 1, ["That one? Very spicy. Like, crying-in-the-shower spicy. Try the orange one first.", "Gói đó hả? Cay lắm. Kiểu cay tới mức khóc trong nhà tắm. Thử gói màu cam trước đi."], "“not too spicy” = không cay quá. “Try … first” = thử… trước."),
              O("I am Vietnamese. Nothing is spicy for me.", 0.5, ["Ooh, confident! The black one, then. Good luck. Bring milk.", "Ồ, tự tin ghê! Vậy gói màu đen. Chúc may mắn. Mang theo sữa nhé."], "Sữa giúp đỡ cay hơn nước.")]),
            S("Oh, and we have kimchi in the fridge at the back. Homemade.", "À, có kim chi trong tủ lạnh phía sau nữa. Nhà làm."),
            C("Cảm ơn và kết thúc.", [
              O("Awesome, thank you so much!", 1, ["You're welcome! Come again!", "Không có gì! Lần sau lại ghé nhé!"], "“Awesome” = tuyệt vời (khẩu ngữ rất phổ biến)."),
              O("Thanks! Do you have a student discount?", 1, ["Haha, no, sorry. But the noodles are on sale this week!", "Haha, không có, xin lỗi nhé. Nhưng tuần này mì đang giảm giá!"], "“on sale” = đang giảm giá. Nhiều cửa hàng ở Toronto có giảm giá sinh viên, cứ hỏi!")])] }],
          before: ['', ''], after: ["Aisle two! Enjoy!", "Dãy số hai nhé! Chúc ngon miệng!"] },
        { id: 'chicken', name: 'Chicken shop staff', look: 'man', x: 19, y: 6,
          talks: [{ steps: [S("Hey! Wanna try a free sample? Soy garlic or spicy?", "Này! Thử miễn phí một miếng không? Xì dầu tỏi hay cay?"),
            C("Chọn vị: “I'll try the…”", [
              O("Ooh, I'll try the soy garlic, please. Thanks!", 1, ["Here you go! Ten out of ten, right?", "Đây! Mười điểm đúng không?"], "“I'll try…” = Cho mình thử…"),
              O("Both, please. For science.", 0.5, ["Haha! For science. Fair.", "Haha! Vì khoa học. Hợp lý."], "")])] }] },
        { id: 'karaoke', name: 'Karaoke staff', look: 'woman', x: 24, y: 6,
          talks: [{ steps: [S("Hi! We have rooms by the hour. Students get a discount before seven on weekdays.", "Chào! Bên mình cho thuê phòng theo giờ. Sinh viên được giảm giá trước 7 giờ tối các ngày trong tuần."),
            C("Hỏi giờ mở cửa: “What time do you close?”", [
              O("Cool! What time do you close tonight?", 1, ["Two a.m. So you have no excuse!", "Hai giờ sáng. Nên không có lý do gì để không tới nhé!"], "“What time do you close?” = Mấy giờ đóng cửa?"),
              O("Do you have Vietnamese songs?", 1, ["We do! Lots of K-pop, V-pop, everything.", "Có chứ! Rất nhiều K-pop, V-pop, đủ cả."], "")])] }] },
        { id: 'pho', name: 'Chú Tư (phở)', look: 'pho', x: 35, y: 6,
          talks: [{ steps: [S("Hey! You're Vietnamese? I can tell. Welcome to North York! Come by for pho anytime. I give students extra meat.", "Ê! Con là người Việt hả? Nhìn là biết. Chào mừng tới North York! Lúc nào ghé ăn phở nhé. Sinh viên chú cho thêm thịt."),
            C("Chú nói tiếng Anh với em để em luyện. Đáp lại bằng tiếng Anh.", [
              O("Thank you so much! I'll come by this weekend for sure.", 1, ["Good! Study hard, eat well, call your mom.", "Tốt! Học chăm, ăn no, nhớ gọi cho mẹ."], "“come by” = ghé qua. “for sure” = chắc chắn."),
              O("Extra meat? You are my hero!", 1, ["Haha, I know, I know.", "Haha, biết rồi, biết rồi."], "")])] }] },
        { id: 'finchstn', name: 'Finch Station', look: null, x: 47, y: 5, object: 1, kind: 'station', station: 'Finch', label: 'Ga Finch (Line 1)', labelY: 3.2, range: 2.2,
          talks: [{ steps: [N('🚇 Lối vào ga Finch – ga cuối phía bắc của Line 1. Biển đen viền vàng có biểu tượng tàu điện ngầm và xe buýt: ở đây đổi được sang rất nhiều tuyến bus.'),
            S("Finch station! End of Line 1, for now. They're building the subway further north, all the way to Richmond Hill.", "Ga Finch! Ga cuối của Line 1, ít nhất là bây giờ. Người ta đang xây tiếp tàu điện ngầm lên phía bắc, tới tận Richmond Hill.", 'daniel'),
            C("Hỏi đường về nhà: “How many stops to…?”", [
              O("How many stops to North York Centre from here?", 1, ["Just one! Take any southbound train. Or honestly, you could walk it in fifteen minutes.", "Có một ga thôi! Lên tàu hướng nam nào cũng được. Hoặc nói thật, đi bộ 15 phút là tới."], "“How many stops to…?” = Tới … mấy ga? · “southbound” = hướng nam.", 'daniel'),
              O("Why is the sign black and yellow?", 1, ["That's the TTC style! Black sign, yellow line, station name. You'll see it everywhere.", "Đó là phong cách của TTC! Biển đen, viền vàng, tên ga. Đi đâu bạn cũng sẽ thấy."], "Nhận diện lối vào ga TTC: biển đen có tên ga và biểu tượng tàu/bus.", 'daniel')])] }] },
        { id: 'bus', name: 'TTC Bus 39 · Finch East', look: null, x: 39, y: 9, object: 1, kind: 'bus', route: '39 FINCH EAST', label: 'Xe buýt TTC', labelY: 2.5, box: [2.35, 0.7], range: 2.6, voice: 'driver',
          talks: [{ steps: [N('🚌 Một chiếc xe buýt TTC đỏ trắng dừng ở trạm gần ga Finch. Ga Finch là bến xe buýt rất lớn: từ đây có bus đi khắp North York và Scarborough.'),
            S("Hi there! This is the 39 Finch East. Tap your card on the reader when you get on.", "Chào bạn! Đây là xe 39 Finch East. Lên xe thì chạm thẻ vào máy đọc nhé."),
            C("Hỏi tài xế cho chắc: “Does this bus go…?”", [
              O("Hi! Does this bus go east along Finch?", 1, ["Yep, all the way east along Finch, into Scarborough. Tap and grab a seat!", "Đúng rồi, chạy thẳng về phía đông dọc đường Finch, vào tới Scarborough. Chạm thẻ rồi tìm chỗ ngồi đi!"], "“Does this bus go to / along…?” = Xe này có đi … không? Xe buýt TTC: lên bằng cửa trước, chạm thẻ PRESTO (hoặc thẻ tín dụng / điện thoại)."),
              O("Is the bus free?", 0, ["Ha, I wish! Tap your PRESTO card, credit card or phone. Transfers within two hours are free, though.", "Ha, ước gì được vậy! Chạm thẻ PRESTO, thẻ tín dụng hoặc điện thoại nhé. Nhưng đổi tuyến trong vòng 2 tiếng thì miễn phí."], "Đi bus vẫn phải trả vé như subway. Giá vé: kiểm tra trên trang TTC.")]),
            C("Muốn xuống ở trạm sắp tới thì làm gì?", [
              O("I'll pull the cord before my stop. Thank you!", 1, ["Perfect. Or press one of the red buttons. Have a good one!", "Chuẩn. Hoặc bấm một trong mấy nút đỏ. Chúc một ngày vui!"], "“pull the cord” = kéo dây báo xuống. Màn hình sẽ hiện “Stop requested”. Khi xuống, nhiều người ở Toronto nói “Thank you!” với tài xế."),
              O("I'll shout “STOP!” really loud.", 0.5, ["Haha, please don't! Just pull the cord or press the red button.", "Haha, đừng nha! Cứ kéo dây hoặc bấm nút đỏ thôi."], "Báo xuống bằng cách kéo dây (pull the cord) hoặc bấm nút “STOP”.")])] }] },
        { id: 'passerby', name: 'Passerby', look: 'tourist', x: 40, y: 7, wander: 3,
          talks: [{ steps: [S("Sorry, is Finch station this way?", "Xin lỗi, ga Finch đi lối này phải không?"),
            C("Chỉ đường đơn giản: “Yeah, just keep going straight.”", [
              O("Yeah, I think so. Just keep going north on Yonge.", 1, ["Thanks! Have a good one!", "Cảm ơn! Chúc một ngày vui!"], "“keep going straight / north” = cứ đi thẳng / đi tiếp về hướng bắc."),
              O("Sorry, I'm new here. Maybe check Google Maps?", 1, ["Ha, fair enough. Thanks anyway!", "Ha, cũng phải. Dù sao cũng cảm ơn!"], "“Thanks anyway” = dù sao cũng cảm ơn.")])] }] }
      ]
    },
    /* ============ CHƯƠNG 7 · Tim Hortons (“Tims”) ============ */
    {
      id: 'tims', icon: '☕', title: 'Tim Hortons (“Tims”)', theme: 'tims', map: mapTims(), spawn: [1, 9], enterSound: 'door_chime', music: 'music_tims',
      intro: 'Ding! Cửa quán Tims mở ra. Hàng người xếp dài, màn hình gọi số nhấp nháy, mùi cà phê và donut thơm lừng. Hôm nay em sẽ tự gọi một ly Iced Capp và một hộp Timbits!',
      signs: [{ x: 4, y: 0.1, text: 'Tims ☕', bg: '#b3262c', h: 0.6, z: 2.15 },
        { x: 7.5, y: 0.1, text: 'ICED CAPP 🧋', bg: '#2b2b2b', z: 2.3, h: 0.36 }, { x: 7.5, y: 0.1, text: 'Small · Medium · Large', bg: '#2b2b2b', color: '#f6e58d', z: 1.92, h: 0.24 },
        { x: 11, y: 0.1, text: 'DOUBLE-DOUBLE ☕', bg: '#2b2b2b', z: 2.3, h: 0.36 }, { x: 11, y: 0.1, text: '2 cream + 2 sugar', bg: '#2b2b2b', color: '#f6e58d', z: 1.92, h: 0.24 },
        { x: 14.5, y: 0.1, text: 'TIMBITS 🍩 10 · 20 · 40', bg: '#2b2b2b', z: 2.3, h: 0.36 }, { x: 14.5, y: 0.1, text: 'Choc Glazed · Birthday Cake · Honey Dip', bg: '#2b2b2b', color: '#f6e58d', z: 1.92, h: 0.24 },
        { x: 18, y: 0.1, text: 'BAGELS · BREAKFAST SANDWICH 🥯', bg: '#2b2b2b', z: 2.3, h: 0.36 },
        { x: 21, y: 0.1, text: 'NOW SERVING #247', bg: '#111111', color: '#7bed9f', z: 1.95, h: 0.34 },
        { x: 2, y: 3.4, text: 'Order here 👆', small: 1 }, { x: 20, y: 2.4, text: 'DRIVE-THRU 🚗', small: 1 }, { x: 15, y: 3.4, text: 'Pick up here', small: 1 }],
      zones: [{ x: 1, y: 1, w: 22, h: 14, name: 'Quán Tims · Yonge & Finch', music: 'music_tims' }],
      objectives: [
        { id: 'o1', text: 'Nghe các bạn giới thiệu về Tims (nói với Liam)', target: 'liam' },
        { id: 'o2', text: 'Xếp hàng, gọi Iced Capp + hộp Timbits ở quầy', target: 'cashier' },
        { id: 'o3', text: 'Màn hình gọi số #247! Lấy đồ ở quầy pick-up', target: 'pickup', startSound: 'tims_order_ding' },
        { id: 'o4', text: 'Ngồi cùng cả nhóm, thưởng thức & tám chuyện (Priya)', target: 'priya' },
        { id: 'o5', text: 'Trả lời câu đố vui của Jenny về Tims', target: 'jenny' }
      ],
      npcs: [
        { id: 'liam', name: 'Liam', look: 'liam', x: 4, y: 8, main: 1,
          talks: [{ obj: 'o1', steps: [
            S("Welcome to Tims! Officially, it's Tim Hortons, but nobody calls it that. It's just “Tims”.", "Chào mừng tới Tims! Tên chính thức là Tim Hortons, nhưng chẳng ai gọi vậy. Cứ gọi là “Tims”."),
            S("Little history lesson: the first one opened in 1964 in Hamilton, Ontario. Super Canadian.", "Bài học lịch sử nhỏ nhé: quán đầu tiên mở năm 1964 ở Hamilton, Ontario. Canada cực kỳ.", 'priya'),
            S("Okay, but plot twist: from 1995 to 2006 it was owned by Wendy's. An American company. And since 2014, it's part of Restaurant Brands International, same family as Burger King.", "Ừ, nhưng có cú twist nè: từ 1995 đến 2006 nó thuộc về Wendy's, một công ty Mỹ. Và từ 2014, nó thuộc tập đoàn Restaurant Brands International, chung nhà với Burger King.", 'jenny'),
            C("Liam có vẻ “đau lòng”. Đáp lại vui vẻ.", [
              O("Wait, so Tims isn't totally Canadian anymore?", 1, ["Shh! Don't say that too loud. It's still Canadian in our hearts, eh.", "Suỵt! Đừng nói to thế. Trong tim bọn mình nó vẫn là Canada, eh."], "“plot twist” = cú bẻ lái bất ngờ. “not … anymore” = không còn… nữa."),
              O("So it's like the McDonald's of Canada?", 1, ["Exactly! Cheap, everywhere, and every broke student's best friend.", "Chuẩn luôn! Rẻ, ở khắp nơi, và là bạn thân của mọi sinh viên nghèo."], "“broke” (khẩu ngữ) = cháy túi, hết tiền."),
              O("I prefer Vietnamese coffee.", 0.5, ["Okay, fair, Vietnamese coffee is elite. But you still have to try an Iced Capp. It's the law.", "Ừ, công nhận cà phê Việt đỉnh thật. Nhưng vẫn phải thử Iced Capp. Luật đấy."], "“elite” (lóng) = đẳng cấp, xịn.")]),
            S("Okay, the line's moving. Go order! Iced Capp and a box of Timbits. You got this.", "Rồi, hàng đang chạy kìa. Đi gọi món đi! Một Iced Capp và một hộp Timbits. Bạn làm được mà.")] }],
          before: ['', ''], after: ["Go order! I believe in you, bud.", "Đi gọi món đi! Mình tin bạn, bạn ơi."] },
        { id: 'cashier', name: 'Cashier', look: 'cashier', x: 8, y: 2, main: 1, range: 2.3,
          talks: [{ obj: 'o2', steps: [
            S("Hi there! What can I get started for you?", "Chào bạn! Bạn muốn gọi gì nào?"),
            C("Gọi Iced Capp, nhớ nói size: “Can I get a medium Iced Capp, please?”", [
              O("Hi! Can I get a medium Iced Capp, please?", 1, ["Sure! Didyawannaaddwhippedcreamtothat?", "Được! Bạncómuốnthêmkemtươikhông?"], "Nhớ nói size: small / medium / large."),
              O("One Iced Capp. Big. Very big.", 0.5, ["A large, you mean? Sure! Didyawannaaddwhippedcream?", "Ý bạn là size lớn hả? Được! Thêmkemtươikhông?"], "Dùng size: “a large Iced Capp, please”.")]),
            C("Nhân viên nói quá nhanh. Nhờ nhắc lại lịch sự.", [
              O("Sorry, could you say that again, please?", 1, ["Oh, sorry! Do you want to add whipped cream?", "Ồ, xin lỗi! Bạn có muốn thêm kem tươi không?"], "“Sorry, could you say that again?” – câu cứu cánh số 1 khi nghe không kịp."),
              O("Yes! …Wait, yes to what?", 0.5, ["Haha! Whipped cream. Do you want whipped cream on top?", "Haha! Kem tươi. Bạn có muốn kem tươi bên trên không?"], "Đừng đồng ý khi chưa hiểu. Hãy hỏi lại."),
              O("No English. Only coffee.", 0, ["Oh, no worries! I'll slow down. Whipped cream, yes or no?", "Ồ, không sao! Tôi nói chậm lại nhé. Kem tươi, có hay không?"], "Đừng ngại! Thử: “Sorry, could you speak a bit slower?”")]),
            C("Trả lời về kem tươi.", [
              O("No, thanks. Just regular is fine.", 1, ["Perfect. Anything else?", "Ok luôn. Còn gì nữa không?"], "“Just regular is fine” = cứ loại bình thường là được."),
              O("Yes, please! Extra whipped cream. I deserve it.", 1, ["You do! Anything else?", "Bạn xứng đáng mà! Còn gì nữa không?"], "")]),
            C("Gọi thêm Timbits: “Can I also get…?”", [
              O("Can I also get a ten-pack of Timbits?", 1, ["You got it! What flavours?", "Có ngay! Vị gì nào?"], "“Can I also get…?” = Cho mình gọi thêm… · Timbits bán theo hộp 10, 20, 40 viên."),
              O("And ten Tims, please.", 0.5, ["Ten… Timbits? Haha, I hope so. Ten Tims would be a lot of people.", "Mười… Timbits hả? Haha, mong là vậy. Mười ông Tim thì đông người lắm."], "Nói rõ: “a ten-pack of Timbits”.")]),
            C("Chọn vị (flavours) Timbits.", [
              O("Can I get a mix? Some chocolate glazed and some birthday cake?", 1, ["Great choice. Mix it is!", "Chọn chuẩn. Vậy làm hộp mix nhé!"], "“a mix” = trộn nhiều vị. “… it is!” = vậy chốt…!"),
              O("Surprise me!", 1, ["Ooh, I love that. I'll give you my favourites.", "Ồ, thích thế. Tôi chọn mấy vị tôi thích nhất cho bạn."], "“Surprise me!” = Chọn giúp tôi bất ngờ đi!")]),
            S("Okay, that's one medium Iced Capp and a ten-pack of Timbits. Debit or credit?", "Rồi, một Iced Capp size vừa và một hộp 10 viên Timbits. Thẻ ghi nợ hay thẻ tín dụng?"),
            C("“Debit or credit?” Chọn loại thẻ và trả bằng cách chạm thẻ.", [
              O("Debit, please. Can I just tap?", 1, ["Yep, go ahead and tap when you're ready.", "Được, sẵn sàng thì chạm thẻ nhé."], "“debit” = thẻ ghi nợ (trừ tiền thẳng từ tài khoản), “credit” = thẻ tín dụng."),
              O("Credit. Credit card. Card. Here.", 0.5, ["Haha, got it. Tap whenever you're ready.", "Haha, hiểu rồi. Bạn chạm thẻ lúc nào cũng được."], "Ngắn gọn: “Credit, please.”")]),
            N('💳 Máy POS hiện: “Add a tip?  10%  ·  15%  ·  20%  ·  Custom  ·  No tip”', 'presto_tap'),
            C("Máy POS hỏi tip. Em chọn gì? (Gọi món ở quầy thì tip là tuỳ ý.)", [
              O("I'll go with no tip this time. Thank you!", 1, ["No problem at all! Thanks!", "Không sao hết! Cảm ơn bạn!"], "Văn hoá tip ở Canada: ở nhà hàng có người phục vụ bàn thường tip 15–20%. Gọi ở quầy (cà phê, đồ mang đi) thì tip là tuỳ ý, không tip cũng không bất lịch sự."),
              O("Fifteen percent. You were super nice to me.", 1, ["Aww, thank you so much! That's really sweet.", "Ôi, cảm ơn bạn nhiều! Bạn dễ thương ghê."], "Tip là cách cảm ơn khi được phục vụ tốt. Ở nhà hàng sit-down: 15–20% là bình thường."),
              O("What is a tip? Is it a small sugar?", 0, ["Haha, no! A tip is extra money for the staff. It's optional here.", "Haha, không phải! Tip là tiền boa thêm cho nhân viên. Ở đây là tuỳ ý."], "“tip” = tiền boa. Đọc trên máy: “Add a tip?” = Thêm tiền boa không?")]),
            S("You're all set! Your order number is two-forty-seven. We'll call it on the screen. Have a great day!", "Xong rồi! Số order của bạn là 247. Màn hình sẽ gọi số nhé. Chúc một ngày tuyệt vời!"),
            C("Kết thúc lịch sự.", [
              O("Thanks, you too!", 1, ["Enjoy!", "Chúc ngon miệng!"], "“You too!” = Bạn cũng vậy nhé! Cẩn thận: khi nhân viên nói “Enjoy your coffee”, đừng nói “You too” (vì họ không uống cà phê của bạn 😄)."),
              O("Thanks! Enjoy your coffee!", 0.5, ["Haha… I will? Thanks!", "Haha… chắc là vậy? Cảm ơn nhé!"], "Lỗi “You too” kinh điển: người bán không uống cà phê của bạn mà 😄")])] }],
          before: ['', ''], after: ["Number 247! It'll pop up on the screen.", "Số 247 nhé! Sẽ hiện trên màn hình."] },
        { id: 'pickup', name: 'Pick-up counter', look: 'cashier2', x: 15, y: 2, main: 1, range: 2.3,
          talks: [{ obj: 'o3', steps: [
            S("Two-forty-seven? One medium Iced Capp and a ten-pack!", "Số 247? Một Iced Capp size vừa và một hộp 10 viên!", null, 'tims_order_ding'),
            C("Nhận đồ: “That's me!”, “That's mine!”", [
              O("That's me! Thank you!", 1, ["Here you go. Straw's right there. Have a good one!", "Của bạn đây. Ống hút ở ngay kia. Chúc vui nhé!"], "“That's me!” / “That's mine!” = Của tôi đó!"),
              O("Two-four-seven! Yes! I win!", 0.5, ["Haha, congrats, you won… an Iced Capp!", "Haha, chúc mừng, bạn đã thắng… một ly Iced Capp!"], "")]),
            I('iced_capp', 'iced_capp_sip'),
            I('timbits', 'timbits_open'),
            N('🍁 Em cầm khay đồ tới bàn của cả nhóm.')] }],
          before: ['', ''], after: ["Have a good one!", "Chúc vui nhé!"] },
        { id: 'priya', name: 'Priya', look: 'priya', x: 14, y: 11, main: 1,
          talks: [{ obj: 'o4', steps: [
            N('🧋 Em hút một ngụm Iced Capp thật dài…', 'iced_capp_sip'),
            S("So? First Iced Capp? Be honest.", "Sao? Ly Iced Capp đầu tiên đó. Nói thật đi."),
            C("Nhận xét đồ uống: “It's so…”, “It tastes like…”", [
              O("Honestly? It's so good. It's like a coffee milkshake.", 1, ["Right? It's basically dessert pretending to be coffee.", "Đúng không? Về cơ bản là món tráng miệng giả làm cà phê."], "“It's like…” = Nó giống như…"),
              O("It's okay, but Vietnamese iced coffee is stronger.", 1, ["Fair. Vietnamese coffee could beat this up, honestly.", "Công nhận. Cà phê Việt chắc đánh bại cái này luôn."], "“stronger” = đậm hơn.")]),
            N('🍩 Tách! Em mở hộp Timbits. Cả nhóm thò tay vào cùng lúc.', 'timbits_open'),
            S("Okay, nobody touch the birthday cake ones. Those are mine. No cap.", "Rồi, không ai được đụng mấy viên birthday cake. Của mình hết. Nói thật đó.", 'josh'),
            C("Josh dùng “No cap” (= nói thật đấy). Chọc lại Josh.", [
              O("Too late, I already ate one. No cap.", 1, ["Nooo! Okay, that's a crime, but I respect it.", "Khônggg! Rồi, tội ác đấy, nhưng mình nể."], "“No cap” = không xạo đâu. Ngược lại: “That's cap!” = Xạo!", 'josh'),
              O("Sharing is caring, Josh.", 1, ["Ugh, fine. You're right. Mans is hungry, though.", "Hừ, thôi được. Bạn nói đúng. Nhưng mà “mans” đói thật đó."], "“Mans” (lóng Toronto) = tôi / anh ấy. Toronto slang hay gặp: “mans”, “ahlie” (= đúng không?), “bare” (= rất nhiều), “styll” (= thật đấy), “the 6ix” (= Toronto).", 'josh')]),
            S("Okay, serious question. Did you see the tip screen? Some places ask for tips even for a bottle of water now.", "Rồi, câu hỏi nghiêm túc nè. Thấy màn hình tip chưa? Giờ có chỗ mua chai nước cũng đòi tip."),
            C("Hỏi về văn hoá tip: “When should I tip?”", [
              O("Yeah! So, when should I tip?", 1, ["Sit-down restaurants: fifteen to twenty percent. Haircuts, taxis, delivery: tip. Counter coffee? Up to you. Don't let the screen guilt-trip you.", "Nhà hàng có phục vụ bàn: 15–20%. Cắt tóc, taxi, giao đồ: nên tip. Cà phê mua ở quầy? Tuỳ bạn. Đừng để cái màn hình làm bạn áy náy."], "“guilt-trip someone” = làm ai thấy có lỗi để ép họ làm gì đó."),
              O("I pressed twenty percent. Was that wrong?", 0.5, ["Not wrong, just generous! That's a sit-down restaurant number.", "Không sai, chỉ là hào phóng thôi! Mức đó là cho nhà hàng có phục vụ bàn."], "")]),
            S("Also, job hunting tip: every part-time posting says “entry level, three years of experience”. Like, how?", "Mẹo săn việc nữa: tin tuyển part-time nào cũng ghi “cho người mới, yêu cầu 3 năm kinh nghiệm”. Kiểu, làm sao mà có được?"),
            C("Đáp lại câu châm biếm của Priya.", [
              O("Haha, that makes no sense! Where should I look for part-time jobs?", 1, ["Campus jobs first. Then cafés, retail… even Tims is hiring. Lowkey, it's a good first job.", "Việc trong trường trước. Rồi quán cà phê, bán lẻ… ngay cả Tims cũng đang tuyển. Nói thật, đây là công việc đầu tiên khá ổn."], "“campus jobs” = việc làm trong trường. Lưu ý giới hạn số giờ làm thêm theo study permit, kiểm tra trên trang chính phủ Canada."),
              O("Easy. I will lie. I have fifty years of experience.", 0.5, ["Haha, you literally just landed! But I love the confidence.", "Haha, bạn vừa mới hạ cánh mà! Nhưng mình mê sự tự tin đó."], "Đừng nói dối trong CV nhé 😄")])] }],
          before: ['', ''], after: ["Okay, Jenny has a quiz for you. She's been waiting all day.", "Rồi, Jenny có câu đố cho bạn đó. Cô ấy chờ cả ngày rồi."] },
        { id: 'jenny', name: 'Jenny', look: 'jenny', x: 10, y: 14, main: 1,
          talks: [{ obj: 'o5', steps: [
            S("Pop quiz! Question one: where did the very first Tims open?", "Đố vui nè! Câu một: quán Tims đầu tiên mở ở đâu?"),
            C("Nhớ lại lời Priya kể.", [
              O("In Hamilton, Ontario, in 1964!", 1, ["Correct! Ten points to the new kid.", "Chính xác! Mười điểm cho bạn mới."], ""),
              O("In New York?", 0, ["Nope! Liam is crying right now.", "Sai! Liam đang khóc kìa."], "Gợi ý: một thành phố ở Ontario, năm 1964.")]),
            S("Question two: which American company owned Tims from 1995 to 2006?", "Câu hai: công ty Mỹ nào sở hữu Tims từ 1995 đến 2006?"),
            C("Một chuỗi đồ ăn nhanh của Mỹ…", [
              O("Wendy's!", 1, ["Yes! And today it's part of…?", "Đúng! Và hôm nay nó thuộc về…?"], ""),
              O("Starbucks?", 0, ["Haha, no way. That would be chaos.", "Haha, làm gì có. Thế thì loạn mất."], "Gợi ý: một chuỗi burger của Mỹ, tên là tên một cô bé.")]),
            C("Từ 2014, Tims thuộc tập đoàn nào?", [
              O("Restaurant Brands International, with Burger King!", 1, ["Slay! You're officially smarter than Josh.", "Đỉnh! Chính thức thông minh hơn Josh rồi đó."], "“Slay!” (lóng) = đỉnh, xuất sắc."),
              O("The Canadian government?", 0, ["Haha, it feels like it, but no.", "Haha, cảm giác là vậy, nhưng không."], "Gợi ý: “Restaurant Brands International” – chung nhà với Burger King.")]),
            S("I'm right here, you know.", "Mình đang ngồi ngay đây đó nha.", 'josh'),
            S("Okay, final question. What's a double-double?", "Rồi, câu cuối. Double-double là gì?"),
            C("Đặc sản ngôn ngữ của Tims.", [
              O("Coffee with two creams and two sugars.", 1, ["Perfect score! You're basically Canadian now, eh.", "Điểm tuyệt đối! Giờ bạn gần như là người Canada rồi đó, eh."], "“double-double” = cà phê 2 phần kem sữa + 2 phần đường. Từ này có trong từ điển tiếng Anh Canada!"),
              O("Two coffees, two times.", 0, ["Haha, that's four coffees. Your heart would explode.", "Haha, vậy là bốn ly. Tim bạn nổ tung mất."], "Gợi ý: 2 cream + 2 sugar.")]),
            S("Okay, tomorrow we're showing you the map, so you actually know where you live. Get some sleep!", "Rồi, mai bọn mình chỉ bạn xem bản đồ để bạn biết mình sống ở đâu. Đi ngủ đi!")] }],
          before: ['', ''], after: ["Get some sleep! Tomorrow: the map!", "Đi ngủ đi! Mai xem bản đồ!"] },
        { id: 'josh', name: 'Josh', look: 'josh', x: 10, y: 11,
          talks: [{ steps: [S("Toronto slang lesson, free of charge. “The 6ix” means Toronto. Like, “Welcome to the 6ix.”", "Bài học tiếng lóng Toronto, miễn phí. “The 6ix” nghĩa là Toronto. Kiểu: “Chào mừng tới the 6ix.”"),
            C("Thử dùng tiếng lóng: “bare” (= rất nhiều).", [
              O("So I can say: “There are bare people in the 6ix”?", 1, ["Yesss! You're a natural, fam.", "Đúng rồiii! Bạn có năng khiếu đó, “fam”."], "“the 6ix” = Toronto (đọc là “the six”) · “bare” = rất nhiều · “fam” = bạn thân (từ “family”)."),
              O("Why six? Toronto has six people?", 0.5, ["Haha, no! The old six cities of Toronto, and the 416 area code. Long story.", "Haha, không! Là sáu thành phố cũ của Toronto, và mã vùng 416. Chuyện dài lắm."], "Biệt danh “the 6ix” được cho là đến từ mã vùng 416/647 và 6 đô thị cũ hợp thành Toronto.")])] }] },
        { id: 'daniel', name: 'Daniel', look: 'daniel', x: 14, y: 14,
          talks: [{ steps: [S("Fun fact: people here say “washroom”, not “toilet”. And a winter hat is a “toque”. Like the thing Liam's wearing. In August.", "Sự thật thú vị: ở đây người ta nói “washroom” chứ không nói “toilet”. Còn mũ len mùa đông gọi là “toque”. Như cái Liam đang đội. Vào tháng Tám."),
            C("Hỏi thêm từ vựng Canada.", [
              O("What other Canadian words should I know?", 1, ["A one-dollar coin is a “loonie”, a two-dollar coin is a “toonie”. And “about” sounds a bit like “a-boat” for some people.", "Đồng xu 1 đô gọi là “loonie”, đồng 2 đô là “toonie”. Và với một số người, “about” nghe hơi giống “a-boat”."], "Giọng Canada gần giọng Mỹ, không nặng. Khác biệt nhỏ: “eh”, “sorry”, cách đọc “about”, và từ vựng như washroom, toque, loonie, toonie, double-double."),
              O("Liam, aren't you hot?", 0.5, ["He says it's “part of his personality”.", "Cậu ấy bảo đó là “một phần tính cách”."], "")])] }] },
        { id: 'kiosk', name: 'Self-order kiosk', look: null, x: 2, y: 5, object: 1, kind: 'kiosk', label: 'Máy order tự phục vụ', range: 1.6, voice: 'staff',
          talks: [{ steps: [N('🖥️ Màn hình: “Touch to start · Appuyez pour commencer”'),
            S("Dine in or take out?", "Ăn tại chỗ hay mang đi?"),
            C("“Dine in” = ăn tại quán · “Take out / to go” = mang đi.", [
              O("Dine in.", 1, ["Please choose your items.", "Mời bạn chọn món."], "Ở Canada nói “take out” hoặc “to go”. Biển song ngữ Anh – Pháp vì tiếng Pháp cũng là ngôn ngữ chính thức."),
              O("Take out.", 1, ["Please choose your items.", "Mời bạn chọn món."], "")]),
            N('Em đã gọi ở quầy rồi, nên bấm “Cancel order”. Biết dùng máy để lần sau gọi nhanh!')] }] },
        { id: 'sorryguy', name: 'Guy in line', look: 'man', x: 12, y: 5,
          talks: [{ steps: [S("Oh! Sorry, sorry, was I in your way?", "Ôi! Xin lỗi, xin lỗi, tôi chắn đường bạn hả?"),
            C("Trận chiến “sorry” kiểu Canada!", [
              O("No, no, sorry! You're good!", 1, ["No, I'm sorry! Okay, have a good one!", "Không, tôi xin lỗi mới đúng! Rồi, chúc một ngày vui!"], "Hai người Canada có thể xin lỗi nhau 5 lần liền. Rất bình thường 😄"),
              O("Yes, you were. Please move.", 0, ["Oh… okay. Sorry.", "Ồ… được thôi. Xin lỗi."], "Nghe hơi gắt. Mềm hơn: “You're good, no worries!”")])] }] },
        { id: 'regular', name: 'Construction worker', look: 'tourist', x: 14, y: 5,
          talks: [{ steps: [S("Large double-double, every morning, for twenty years. They know my order before I open my mouth.", "Double-double cỡ lớn, sáng nào cũng vậy, suốt hai mươi năm. Tôi chưa mở miệng họ đã biết tôi gọi gì."),
            C("Khen kiểu Canada.", [
              O("Wow, that's a true Canadian. Respect!", 1, ["Ha! Thanks, kid. Welcome to Canada.", "Ha! Cảm ơn nhóc. Chào mừng tới Canada."], "“Respect!” = Nể!"),
              O("Twenty years? Is that healthy?", 0.5, ["Probably not! But it's tradition.", "Chắc là không! Nhưng truyền thống mà."], "")])] }] },
        { id: 'dt', name: 'Drive-thru staff', look: 'cashier', x: 20, y: 2, range: 2.3,
          talks: [{ steps: [S("Welcome to Tims, what can I get for you? …Oh, sorry, I was talking to my headset! The drive-thru line is around the block today.", "Chào mừng tới Tims, bạn muốn gọi gì? …Ôi, xin lỗi, tôi đang nói với tai nghe! Hôm nay hàng drive-thru dài vòng quanh khu phố luôn."),
            C("“drive-thru” = mua đồ ngay trên xe.", [
              O("Haha, no worries! Is the drive-thru always this busy?", 1, ["In the morning? Always. Canadians and their coffee, eh.", "Buổi sáng hả? Lúc nào cũng vậy. Người Canada mê cà phê lắm, eh."], "“drive-thru” (= drive-through) – mua đồ không cần xuống xe."),
              O("Can I order from the drive-thru on foot?", 0.5, ["Haha, technically no. But I admire the idea.", "Haha, về lý thì không. Nhưng ý tưởng hay đấy."], "")])] }] }
      ]
    },
    /* ============ CHƯƠNG 8 · Bản đồ Toronto & nhà mình ở North York ============ */
    {
      id: 'map', icon: '🗺️', title: 'Bản đồ Toronto & nhà mình', theme: 'condo', map: mapCondo(), spawn: [2, 10], music: 'music_map',
      intro: 'Sáng hôm sau, cả nhóm ghé căn hộ của em ở North York, gần ga North York Centre. Trên tường có một tấm bản đồ Toronto to đùng. Daniel sẽ chỉ cho em: mình sống ở đâu, Toronto có những khu nào và đi lại bằng gì.',
      signs: [{ x: 15.5, y: 0.1, text: '🏠 North York · Yonge St', small: 1 }],
      zones: [{ x: 1, y: 1, w: 20, h: 12, name: 'Căn hộ của em · North York', music: 'music_map' }],
      objectives: [
        { id: 'o1', text: 'Nói chuyện với Daniel về khu nhà mình', target: 'daniel' },
        { id: 'o2', text: 'Mở bản đồ trên tường, bấm vào khu North York', target: 'mapboard', map: { zone: 'northyork' } },
        { id: 'o3', text: 'Tìm ga gần nhà nhất: bấm vào ga North York Centre', target: 'mapboard', map: { station: 'nyc' } },
        { id: 'o4', text: 'Dùng “Từ A đến B” tìm đường North York Centre → Union', target: 'mapboard', map: { route: ['nyc', 'union'] } },
        { id: 'o5', text: 'Mở bản đồ TTC chính thức của Thành phố Toronto', target: 'mapboard', map: { official: 1 } },
        { id: 'o6', text: 'Bàn kế hoạch xuống Downtown với Priya', target: 'priya', onDone: 'item_get' }
      ],
      npcs: [
        { id: 'daniel', name: 'Daniel', look: 'daniel', x: 9, y: 4, main: 1,
          talks: [{ obj: 'o1', steps: [
            S("Okay, geography class. Toronto used to be six separate cities: Old Toronto, North York, Scarborough, Etobicoke, York, and East York. In 1998 they all merged into one big city.", "Rồi, giờ học địa lý. Toronto từng là sáu thành phố riêng: Old Toronto, North York, Scarborough, Etobicoke, York và East York. Năm 1998 tất cả nhập lại thành một thành phố lớn."),
            C("Hỏi lại cho chắc: “So … is part of Toronto now?”", [
              O("Oh, so North York is part of Toronto now?", 1, ["Exactly. But people still say “I live in North York” or “I'm from Scarborough”. It's like a hometown thing.", "Chuẩn. Nhưng người ta vẫn nói “mình sống ở North York” hay “mình dân Scarborough”. Kiểu niềm tự hào quê nhà."], "“merge into” = nhập lại thành."),
              O("Six cities? So I need six visas?", 0.5, ["Haha, no! One city, one visa. Relax.", "Haha, không! Một thành phố, một visa thôi. Bình tĩnh."], "")]),
            S("You live right on Line 1, the yellow line. North York Centre station. Super convenient. Let's look at the map on the wall.", "Bạn ở ngay trên Line 1, tuyến màu vàng. Ga North York Centre. Siêu tiện. Mình cùng xem bản đồ trên tường nhé."),
            C("Đồng ý: “Show me!”", [
              O("Cool, show me!", 1, ["Tap the map. Start with North York, our hood.", "Bấm vào bản đồ đi. Bắt đầu với North York, khu của tụi mình."], "“hood” (khẩu ngữ, từ neighbourhood) = khu nhà mình."),
              O("Is Line 1 yellow because it's banana-shaped?", 0.5, ["Haha, it's U-shaped, actually! Go look.", "Haha, thật ra nó hình chữ U! Ra xem đi."], "Line 1 Yonge–University có hình chữ U.")])] }],
          before: ['', ''], after: ["The map's on the wall. Go check it out!", "Bản đồ trên tường đó. Ra xem đi!"] },
        { id: 'mapboard', name: 'Bản đồ Toronto', look: null, x: 11, y: 1, object: 1, kind: 'map', label: '🗺️ Bản đồ Toronto', range: 1.9, labelY: 2.25 },
        { id: 'priya', name: 'Priya', look: 'priya', x: 15, y: 5, main: 1,
          talks: [{ obj: 'o6', steps: [
            S("So, tomorrow, before school starts, we're taking you downtown. Union Station, CN Tower, the lake, Kensington Market, Eaton Centre. The full tourist package.", "Vậy mai, trước ngày nhập học, bọn mình đưa bạn xuống downtown. Ga Union, tháp CN, bờ hồ, chợ Kensington, Eaton Centre. Trọn gói du lịch luôn."),
            C("Hỏi cách đi: “How are we getting there?”", [
              O("Awesome! How are we getting there? Subway?", 1, ["Yep, Line 1 straight down. No transfers. It takes like forty minutes… if the TTC behaves.", "Đúng, Line 1 đi thẳng xuống. Không cần đổi tuyến. Mất khoảng 40 phút… nếu TTC ngoan."], "“straight down” = đi thẳng xuống (phía nam). “transfer” = đổi tuyến."),
              O("Can we take a helicopter?", 0.5, ["Sure, if you're paying. Otherwise, Line 1.", "Được thôi, nếu bạn trả tiền. Không thì đi Line 1."], "")]),
            S("“If the TTC behaves”?", "“Nếu TTC ngoan” là sao?", 'jenny'),
            S("Delays, signal problems, weekend closures for maintenance… You'll learn to love it. Or at least accept it.", "Trễ tàu, lỗi tín hiệu, đóng cửa cuối tuần để bảo trì… Rồi bạn sẽ học cách yêu nó. Hoặc ít nhất là chấp nhận nó."),
            C("Đáp lại câu châm biếm.", [
              O("Haha, okay. So I should always check before I leave?", 1, ["Exactly. Check the TTC website or app. Pro tip: leave ten minutes early. Always.", "Chuẩn. Kiểm tra trang web hoặc app của TTC. Mẹo: luôn đi sớm 10 phút. Luôn luôn."], "“check before you leave” = kiểm tra trước khi đi. Trang chính thức: ttc.ca"),
              O("In Vietnam we have motorbikes. No delays!", 0.5, ["Haha, just traffic jams the size of a city, right?", "Haha, chỉ có kẹt xe to bằng cả thành phố thôi đúng không?"], "")]),
            S("Okay, it's a plan. Meet at North York Centre station tomorrow at ten. Don't be late!", "Rồi, chốt kế hoạch. Mai 10 giờ gặp ở ga North York Centre. Đừng trễ nhé!"),
            C("Chốt hẹn: “See you there!”", [
              O("See you at ten! I'll be there.", 1, ["Perfect. And bring your appetite. Kensington has the best food.", "Hoàn hảo. Và nhớ mang theo cái bụng đói nhé. Kensington đồ ăn ngon nhất."], "“See you there!” = Hẹn gặp ở đó!"),
              O("Ten in the morning? That's so early!", 0.5, ["Haha, you're still on Vietnam time, aren't you?", "Haha, bạn vẫn đang theo giờ Việt Nam đúng không?"], "Lệch múi giờ: Toronto chậm hơn Việt Nam 11 tiếng vào mùa hè.")])] }],
          before: ['', ''], after: ["Ten a.m., North York Centre. Don't be late!", "10 giờ sáng, ga North York Centre. Đừng trễ nhé!"] },
        { id: 'jenny', name: 'Jenny', look: 'jenny', x: 5, y: 11,
          talks: [{ steps: [S("Your place is cute! Small, but cute. Honestly, in Toronto, “small but cute” is the best you can get.", "Nhà bạn xinh ghê! Nhỏ, nhưng xinh. Nói thật, ở Toronto, “nhỏ nhưng xinh” là ngon nhất rồi."),
            C("Đáp lời khen.", [
              O("Thanks! It's tiny, but the location is great.", 1, ["Location, location, location. You're right on the subway. That's a flex.", "Vị trí là tất cả. Bạn ở ngay trên tuyến tàu điện ngầm. Đáng khoe đó."], "“a flex” (lóng) = thứ đáng để khoe."),
              O("Small? It's a palace!", 0.5, ["Haha, compared to my place, it is.", "Haha, so với chỗ mình thì đúng là cung điện."], "")])] }] },
        { id: 'josh', name: 'Josh', look: 'josh', x: 3, y: 7,
          talks: [{ steps: [S("Did you know you can see the CN Tower from the top floors around here? Toronto's skyline is a whole vibe.", "Biết không, từ mấy tầng cao quanh đây nhìn thấy được tháp CN đó. Đường chân trời Toronto đẹp hết nấc."),
            C("Hỏi thêm về tháp CN.", [
              O("How tall is the CN Tower?", 1, ["Over five hundred metres. It used to be the tallest free-standing structure in the world.", "Hơn 500 mét. Từng là công trình đứng tự do cao nhất thế giới."], "Tháp CN cao khoảng 553 m."),
              O("Can we climb it tomorrow?", 1, ["You can take the elevator. Or do the EdgeWalk if you're brave. I'm not.", "Đi thang máy được. Hoặc thử EdgeWalk nếu bạn gan. Mình thì không."], "EdgeWalk = đi bộ ngoài rìa tháp CN, có dây an toàn.")])] }] },
        { id: 'liam', name: 'Liam', look: 'liam', x: 12, y: 10,
          talks: [{ steps: [S("Pro tip: get a PRESTO card. You tap it on the subway, streetcar, bus, even GO trains. Way easier than cash.", "Mẹo nè: làm thẻ PRESTO đi. Chạm thẻ để đi tàu điện ngầm, xe điện, xe buýt, cả tàu GO luôn. Dễ hơn tiền mặt nhiều."),
            C("Hỏi chỗ mua thẻ.", [
              O("Where can I get a PRESTO card?", 1, ["At the machines in the subway station. We'll get you one tomorrow, eh.", "Ở máy bán vé trong ga tàu điện ngầm. Mai bọn mình làm cho bạn một cái, eh."], "Giá vé và phí thẻ thay đổi theo thời gian, hãy kiểm tra trên trang TTC / PRESTO."),
              O("Can I tap my phone instead?", 1, ["Yep, you can tap a credit card or your phone too. But students get discounts with PRESTO.", "Được, chạm thẻ tín dụng hoặc điện thoại cũng được. Nhưng sinh viên dùng PRESTO có thể được giảm giá."], "Có thể trả vé bằng cách chạm thẻ tín dụng/điện thoại. Ưu đãi cho sinh viên: kiểm tra điều kiện trên trang TTC.")])] }] }
      ]
    },
    /* ============ CHƯƠNG 9 · Đi chơi Downtown & học cách đi lại ============ */
    {
      id: 'downtown', icon: '🏙️', title: 'Đi chơi Downtown & học đi lại', theme: 'downtown', map: mapDowntown(), spawn: [8, 4], tall: 6, music: 'music_map',
      intro: 'Hôm nay là ngày cuối trước khi nhập học. Cả nhóm hẹn nhau ở ga North York Centre để đi Line 1 xuống downtown. Em sẽ học cách đi TTC: thẻ PRESTO, chạm thẻ qua cổng, hỏi đường, nghe thông báo trên tàu… rồi đi chơi Union Station, tháp CN, Harbourfront, Kensington Market và Eaton Centre!',
      signs: [{ x: 10, y: 0.1, text: 'North York Centre   🚇', bg: '#1c1c1c', stripe: '#f4c20d' }, { x: 4, y: 0.1, text: 'PRESTO · Fares', small: 1 }, { x: 17, y: 0.1, text: 'ℹ️ Customer Service', small: 1 },
        { x: 10.5, y: 6.3, text: 'Tap PRESTO here ⬇', small: 1 }, { x: 10, y: 11.6, text: '⬅ Line 1 Southbound · to Union / Vaughan', bg: '#f4c20d', color: '#222222', h: 0.4 },
        { x: 29.5, y: 2.1, text: 'UNION STATION', bg: '#5d4037', h: 0.6 }, { x: 44, y: 0.1, text: 'KENSINGTON MARKET', bg: '#16a085' }, { x: 55, y: 3.1, text: 'EATON CENTRE 🛍️', bg: '#34495e' },
        { x: 53.5, y: 3.1, text: '🎬 NOW PLAYING · BIG MOVIE', bg: '#111111', color: '#ffd32a', z: 3.35, h: 0.5 }, { x: 56.5, y: 3.1, text: '📱 SUMMER SALE −50%', bg: '#e84393', z: 4.3, h: 0.7 },
        { x: 54, y: 3.1, text: '🍁 WELCOME TO THE 6IX', bg: '#0a3d62', color: '#7bed9f', z: 5.4, h: 0.7 }, { x: 57, y: 3.1, text: '🍔 BURGER O’CLOCK', bg: '#d63031', z: 6.5, h: 0.62 }, { x: 54.5, y: 3.1, text: '🎧 NEW ALBUM OUT NOW', bg: '#6c5ce7', z: 7.5, h: 0.55 },
        { x: 53.5, y: 4.4, text: 'SANKOFA SQUARE', small: 1, bg: '#111111', color: '#ffffff', border: '#f4c20d' }, { x: 57.5, y: 5.3, text: '🚇 TMU Station · Line 1', small: 1, bg: '#1c1c1c', color: '#ffffff', border: '#f4c20d' },
        { x: 26, y: 5.4, text: 'Front St W', small: 1, bg: '#1d6b3a', color: '#ffffff', border: '#ffffff' }, { x: 40.5, y: 9.2, text: '🚋 509 Harbourfront', small: 1 }, { x: 31.5, y: 10.2, text: 'CN Tower', small: 1 },
        { x: 44.5, y: 13.4, text: 'Lake Ontario · Toronto Islands ⛴️', small: 1 }],
      zones: [{ x: 1, y: 1, w: 20, h: 7, name: 'Ga North York Centre · sảnh bán vé', music: 'music_map' }, { x: 1, y: 8, w: 20, h: 6, name: 'Sân ga Line 1 · Southbound', music: 'music_map' },
        { x: 22, y: 3, w: 16, h: 6, name: 'Union Station · Front St', music: 'music_downtown' }, { x: 38, y: 1, w: 13, h: 5, name: 'Kensington Market', music: 'music_downtown' },
        { x: 51, y: 4, w: 9, h: 5, name: 'Sankofa Square · Eaton Centre', music: 'music_downtown' }, { x: 22, y: 9, w: 38, h: 6, name: 'Tháp CN & Harbourfront', music: 'music_downtown' }],
      objectives: [
        { id: 'o1', text: 'Ở ga North York Centre: hỏi Jenny cách đi xuống Downtown', target: 'jenny' },
        { id: 'o2', text: 'Mua & nạp tiền thẻ PRESTO ở máy bán vé', target: 'machine' },
        { id: 'o3', text: 'Chạm thẻ PRESTO ở cổng soát vé', target: 'gate' },
        { id: 'o4', text: 'Hỏi nhân viên TTC đường xuống tàu đi Union', target: 'collector', onDone: 'train_arrive' },
        { id: 'o5', text: 'Tàu tới! Lên tàu và nghe thông báo', target: 'train', show: ['train'] },
        { id: 'o6', text: 'Tới Union Station! Đi cùng Josh ra phố', target: 'josh', warp: { x: 28, y: 4, face: 'josh', sound: 'train_announce', text: '🚇 Union Station · Line 1' },
          move: [{ id: 'josh', x: 31, y: 4 }, { id: 'liam', x: 42, y: 13 }, { id: 'priya', x: 43, y: 4 }, { id: 'daniel', x: 55, y: 5 }, { id: 'jenny', x: 34, y: 4 }], hide: ['train'] },
        { id: 'o7', text: 'Ra Harbourfront ngắm hồ cùng Liam', target: 'liam' },
        { id: 'o8', text: 'Khám phá Kensington Market cùng Priya', target: 'priya' },
        { id: 'o9', text: 'Tới Sankofa Square & Eaton Centre, quyết định về nhà bằng gì (Daniel)', target: 'daniel' }
      ],
      npcs: [
        { id: 'jenny', name: 'Jenny', look: 'jenny', x: 7, y: 4, main: 1,
          talks: [{ obj: 'o1', steps: [
            S("Morning! Okay, quick TTC lesson. TTC means Toronto Transit Commission. Subway, streetcar, bus. That's how most people get around.", "Chào buổi sáng! Rồi, học nhanh về TTC nhé. TTC là Toronto Transit Commission (Uỷ ban Giao thông Toronto). Tàu điện ngầm, xe điện mặt đất, xe buýt. Đa số mọi người đi lại bằng mấy cái này."),
            C("Hỏi về các cách đi khác.", [
              O("What about Uber? Or other apps?", 1, ["You've got Uber, Lyft, and Hopp too. Great at night or with luggage. But for every day? TTC is way cheaper.", "Có Uber, Lyft, và cả Hopp nữa. Tiện khi đi đêm hay mang hành lý. Nhưng đi hằng ngày? TTC rẻ hơn nhiều."], "Hopp, Uber, Lyft là các app gọi xe ở Toronto. Đi hằng ngày thì TTC tiết kiệm nhất."),
              O("Can I just walk everywhere?", 0.5, ["Toronto is huge! From here to downtown is like fifteen kilometres. Your legs would file a complaint.", "Toronto rộng lắm! Từ đây xuống downtown khoảng 15 cây số. Chân bạn sẽ khiếu nại đấy."], "“file a complaint” = nộp đơn khiếu nại (đùa).")]),
            S("Today we're taking Line 1 straight down to Union. First, you need a PRESTO card. The machine's over there.", "Hôm nay mình đi Line 1 thẳng xuống Union. Trước tiên bạn cần một thẻ PRESTO. Máy ở đằng kia."),
            C("Đồng ý: “Got it!”", [
              O("Got it. Let me get a card first.", 1, ["Go for it! I'll wait here.", "Đi đi! Mình chờ ở đây."], "“Got it” = Hiểu rồi."),
              O("Can I just jump over the gate?", 0, ["Uh, no. That's fare evasion and the fine is huge. Get the card!", "Ờ, không. Đó là trốn vé, bị phạt nặng lắm. Đi làm thẻ đi!"], "“fare evasion” = trốn vé. Đừng bao giờ làm vậy nhé!")])] }],
          before: ['', ''], after: ["Machine's right there. Then tap at the gate!", "Máy ngay kia. Rồi chạm thẻ ở cổng nhé!"] },
        { id: 'machine', name: 'PRESTO machine', look: null, x: 4, y: 2, object: 1, kind: 'kiosk', label: 'Máy bán vé PRESTO', range: 1.8, voice: 'fa',
          talks: [{ obj: 'o2', steps: [
            N('🖥️ Màn hình: “Welcome · Bienvenue. Select a language.”'),
            C("Chọn ngôn ngữ trên máy.", [
              O("English", 1, ["Welcome. What would you like to do?", "Xin chào. Bạn muốn làm gì?"], "Máy ở Canada thường có tiếng Anh và tiếng Pháp."),
              O("Français", 0.5, ["Bienvenue! …Oops, maybe English is easier today.", "Chào mừng! …Ối, chắc hôm nay dùng tiếng Anh dễ hơn."], "")]),
            C("Chọn thao tác: mua thẻ mới và nạp tiền.", [
              O("Buy a new PRESTO card", 1, ["How much would you like to load?", "Bạn muốn nạp bao nhiêu tiền?"], "“load” = nạp tiền vào thẻ. “top up” cũng dùng được."),
              O("Check balance", 0, ["You don't have a card yet. Please buy a new card first.", "Bạn chưa có thẻ. Hãy mua thẻ mới trước."], "“balance” = số dư. Chưa có thẻ thì phải mua thẻ trước.")]),
            C("Chọn số tiền nạp (tuỳ em, không phải giá vé).", [
              O("$20", 1, ["Please tap or insert your payment card.", "Vui lòng chạm hoặc đút thẻ thanh toán."], "Giá vé & phí thẻ thay đổi theo thời gian: giá tham khảo, hãy kiểm tra trên trang TTC / PRESTO."),
              O("$50", 1, ["Please tap or insert your payment card.", "Vui lòng chạm hoặc đút thẻ thanh toán."], "Nạp nhiều một lần thì đỡ phải nạp lại thường xuyên.")]),
            N('💳 Bíp! Thanh toán thành công.', 'presto_tap'),
            S("Transaction approved. Please take your card.", "Giao dịch thành công. Vui lòng lấy thẻ."),
            I('presto')] }],
          before: ['', ''], after: ['', ''] },
        { id: 'gate', name: 'Fare gate', look: null, x: 12, y: 7, object: 1, kind: 'presto', label: 'Cổng soát vé – chạm thẻ PRESTO', range: 1.8, sound: 'presto_tap', voice: 'staff',
          talks: [{ obj: 'o3', steps: [
            N('Em giơ thẻ PRESTO lên máy đọc… Bíp! Màn hình xanh: ✅ “Fare paid”. Cổng mở.'),
            S("Wait, how much did that cost?", "Khoan, vừa rồi tốn bao nhiêu tiền vậy?", 'jenny'),
            C("Hỏi về giá vé & đổi tuyến.", [
              O("How much is one ride? And can I transfer for free?", 1, ["Prices change, so check the TTC website. But with PRESTO, transfers within two hours are free. Tap once, ride all you want for two hours.", "Giá thay đổi nên xem trên trang TTC. Nhưng với PRESTO, đổi tuyến trong vòng 2 giờ là miễn phí. Chạm một lần, đi thoải mái trong 2 tiếng."], "“transfer” = đổi tuyến. Giá tham khảo, kiểm tra trên trang TTC.", 'jenny'),
              O("Do I tap again when I get off?", 1, ["Nope! On the TTC you only tap when you get on. GO trains are different, though: tap on AND tap off.", "Không! Đi TTC chỉ chạm thẻ khi lên. Nhưng tàu GO thì khác: chạm khi lên VÀ khi xuống."], "TTC: chạm thẻ một lần khi vào. GO Transit: tap on và tap off.", 'jenny')])] }],
          before: ['', ''], after: ['', ''] },
        { id: 'collector', name: 'TTC staff', look: 'ttc', x: 17, y: 2, main: 1, range: 2.3,
          talks: [{ obj: 'o4', steps: [
            S("Morning! Need some help?", "Chào buổi sáng! Cần giúp gì không?"),
            C("Hỏi đường: “Which way to …?”", [
              O("Hi! Which platform for Union Station, please?", 1, ["Take the southbound train, downstairs. Any southbound train goes to Union. No transfers.", "Đi tàu hướng nam (southbound), ở tầng dưới. Tàu hướng nam nào cũng tới Union. Không cần đổi tuyến."], "“southbound” = hướng nam, “northbound” = hướng bắc. Bảng trên sân ga ghi hướng và ga cuối."),
              O("Where is the train to downtown? The big city part?", 0.5, ["Haha, the big city part! Southbound, downstairs. Get off at Union.", "Haha, “phần thành phố to”! Hướng nam, tầng dưới. Xuống ở Union."], "Nói gọn hơn: “Which way to Union Station?”")]),
            C("Hỏi thời gian đi: “How long does it take?”", [
              O("How long does it take to get there?", 1, ["About half an hour, if there are no delays. Oh, hear that? There's one coming now!", "Khoảng nửa tiếng, nếu không trễ. Ơ, nghe thấy không? Có một chuyến đang tới đó!"], "“How long does it take?” = Mất bao lâu?"),
              O("Is the train fast like a rocket?", 0.5, ["Ha! Some days. Other days it's more like a turtle. Oh, there's one coming!", "Ha! Có hôm thế. Có hôm như rùa bò. Ơ, có chuyến đang tới kìa!"], "")])] }],
          before: ['', ''], after: ["Southbound, downstairs!", "Hướng nam, tầng dưới!"] },
        { id: 'train', name: 'Line 1 · Southbound', look: null, x: 10, y: 15, object: 1, kind: 'train', len: 18, label: '🚇 Lên tàu Line 1', range: 2.6, hidden: 1, labelY: 3.0, voice: 'fa',
          talks: [{ obj: 'o5', steps: [
            N('🚇 Tàu vào ga. Cửa mở, cả nhóm bước lên.', 'train_arrive'),
            S("Please stand clear of the doors.", "Xin đứng xa cửa.", null, 'train_announce'),
            S("The next station is Sheppard-Yonge. Change for Line 4.", "Ga tiếp theo là Sheppard-Yonge. Đổi sang Line 4 tại đây.", null, 'train_announce'),
            C("Nghe thông báo: “Change for Line 4” nghĩa là gì?", [
              O("You can transfer to Line 4 at the next station.", 1, ["Exactly. Line 4 goes east to Don Mills.", "Chuẩn. Line 4 đi về phía đông tới Don Mills."], "“Change for…” = Đổi tuyến sang… tại ga này.", 'daniel'),
              O("Line 4 is changing its clothes.", 0, ["Haha, no! It means you can switch to Line 4 there.", "Haha, không! Nghĩa là có thể đổi sang Line 4 ở đó."], "“change” ở đây = đổi tàu.", 'daniel')]),
            N('🚇 Tàu chạy qua York Mills, Lawrence, Eglinton… rồi đột nhiên dừng lại giữa đường hầm.'),
            S("Attention, customers: we are experiencing a delay southbound due to a signal problem. We apologize for the inconvenience.", "Thông báo tới hành khách: chiều đi hướng nam đang bị chậm do sự cố tín hiệu. Xin lỗi vì sự bất tiện này.", null, 'train_announce'),
            S("Classic. Signal problems: the official soundtrack of Toronto.", "Kinh điển. Sự cố tín hiệu: bản nhạc nền chính thức của Toronto.", 'jenny'),
            C("Bị delay. Chờ tàu hay xuống gọi xe (Hopp / Uber / Lyft)?", [
              O("Let's just wait a few minutes. A rideshare downtown would cost way more, and the traffic is bad anyway.", 1, ["Smart. Usually it's only a few minutes. Patience is a TTC skill.", "Khôn đấy. Thường chỉ vài phút thôi. Kiên nhẫn là kỹ năng đi TTC."], "“delay” = chậm trễ. Bị delay ngắn thì chờ là hợp lý. Bị lâu thì xem app TTC để biết có xe buýt thay thế (shuttle bus) không.", 'daniel'),
              O("Let's get off and call an Uber!", 0.5, ["We're in a tunnel, bro. Also, downtown traffic at noon? Good luck.", "Đang ở trong đường hầm mà bạn. Với lại, kẹt xe downtown buổi trưa? Chúc may mắn."], "Gọi xe tiện khi mang đồ hoặc đi đêm, nhưng giờ cao điểm downtown thường kẹt và đắt.", 'josh'),
              O("I will cry now.", 0.5, ["Haha, we've all been there. It'll move soon.", "Haha, ai cũng từng như vậy. Sắp chạy lại rồi."], "", 'liam')]),
            S("Thank you for your patience. We are now moving.", "Cảm ơn quý khách đã kiên nhẫn. Tàu bắt đầu chạy lại.", null, 'train_announce'),
            S("The next station is Union. Union Station. Change for GO Transit and UP Express.", "Ga tiếp theo là Union. Ga Union. Đổi sang GO Transit và UP Express tại đây.", null, 'train_announce')] }],
          before: ['', ''], after: ['', ''] },
        { id: 'josh', name: 'Josh', look: 'josh', x: 9, y: 5, main: 1,
          talks: [{ obj: 'o6', steps: [
            S("Welcome to downtown, baby! This is Union Station, the busiest transit hub in the country. Subway, GO trains, UP Express to the airport, all here.", "Chào mừng tới downtown! Đây là ga Union, đầu mối giao thông đông nhất cả nước. Tàu điện ngầm, tàu GO, UP Express ra sân bay, tất cả đều ở đây."),
            C("Cảm thán và hỏi về tháp CN.", [
              O("Wow, it's huge! Is that the CN Tower right there?", 1, ["Yup! You can literally see it from everywhere. If you get lost downtown, just look up.", "Đúng! Đứng đâu cũng thấy nó. Lạc ở downtown thì cứ ngước lên."], "“If you get lost, just look up.” Mẹo định hướng ở downtown: tháp CN ở phía nam, sát hồ."),
              O("This station is bigger than my hometown!", 0.5, ["Haha, honestly, it might be. It's a whole vibe.", "Haha, nói thật, có khi đúng đấy. Cả một vibe luôn."], "")]),
            S("Okay, split up time! Liam's at the lake, Priya's at Kensington, Daniel's at the Eaton Centre. We'll meet up later!", "Rồi, chia nhau ra! Liam ở bờ hồ, Priya ở Kensington, Daniel ở Eaton Centre. Lát gặp lại nhé!")] },
            { steps: [S("Did you know the PATH under downtown is a huge underground walkway? Like thirty kilometres of shops and tunnels. Perfect for winter.", "Biết không, PATH dưới downtown là đường đi bộ ngầm khổng lồ. Cỡ 30 km cửa hàng và đường hầm. Hoàn hảo cho mùa đông."),
              C("Bình luận vui.", [
                O("So in winter, people live underground like moles?", 1, ["Basically, yeah. Office workers can go weeks without seeing the sky.", "Về cơ bản là vậy. Dân văn phòng có thể mấy tuần không thấy bầu trời."], "PATH là hệ thống đi bộ ngầm nối các toà nhà ở downtown Toronto."),
                O("Cool, can we go now?", 1, ["Later! It's summer. Sun first, tunnels in January.", "Để sau! Giờ là mùa hè. Tắm nắng trước, đường hầm để tháng Một."], "")])] }],
          before: ['', ''], after: ["Lake, Kensington, Eaton Centre. Go explore!", "Bờ hồ, Kensington, Eaton Centre. Đi khám phá đi!"] },
        { id: 'liam', name: 'Liam', look: 'liam', x: 14, y: 4, main: 1,
          talks: [{ obj: 'o7', steps: [
            S("This is Harbourfront. That's Lake Ontario. People think it's the ocean the first time they see it.", "Đây là Harbourfront. Kia là hồ Ontario. Lần đầu thấy ai cũng tưởng là biển."),
            C("Phản ứng tự nhiên khi thấy hồ.", [
              O("Wait, that's a lake? It looks like the ocean!", 1, ["Right? It's one of the Great Lakes. Those islands over there are the Toronto Islands. You take a ferry.", "Đúng không? Đây là một trong Ngũ Đại Hồ. Mấy hòn đảo đằng kia là Toronto Islands. Đi phà ra đó."], "Lake Ontario là một trong 5 hồ lớn (the Great Lakes) giữa Canada và Mỹ."),
              O("Can I swim to the islands?", 0.5, ["Please don't. Take the ferry, bud.", "Làm ơn đừng. Đi phà đi, bạn ơi."], "“ferry” = phà.")]),
            S("And there's a tiny airport on the island, Billy Bishop. You can fly to Montréal from basically downtown.", "Và trên đảo có một sân bay nhỏ, Billy Bishop. Bay đi Montréal mà gần như từ ngay downtown."),
            C("Small talk mùa hè: “The weather is perfect today!”", [
              O("The weather is perfect today. I love summer here!", 1, ["Enjoy it while it lasts, eh. In four months this lake is gonna look like a freezer.", "Tận hưởng khi còn có thể nhé. Bốn tháng nữa cái hồ này trông như tủ đông."], "Câu cửa miệng của người Toronto: “Enjoy summer while it lasts!”"),
              O("It's so hot. Can winter come faster?", 0.5, ["Whoa, careful what you wish for! You'll take that back in January.", "Ồ, cẩn thận với điều ước! Tháng Một bạn sẽ rút lại câu đó."], "“Careful what you wish for” = cẩn thận với điều mình ước.")])] }],
          before: ['', ''], after: ["Enjoy the lake! Priya's at Kensington.", "Ngắm hồ đi! Priya đang ở Kensington."] },
        { id: 'priya', name: 'Priya', look: 'priya', x: 15, y: 9, main: 1,
          talks: [{ obj: 'o8', steps: [
            S("Welcome to Kensington Market! Vintage shops, cheap eats, street art. It's like the coolest neighbourhood for broke students.", "Chào mừng tới chợ Kensington! Đồ si, đồ ăn rẻ, tranh tường. Kiểu khu phố chất nhất cho sinh viên nghèo."),
            C("Hỏi ý kiến: “What do you recommend?”", [
              O("Love it! What do you recommend here?", 1, ["Empanadas, churros, and the vintage shop with the crazy jackets. There are bare good spots.", "Bánh empanada, churros, với tiệm đồ si có mấy cái áo khoác điên rồ. Có “bare” chỗ ngon lắm."], "“What do you recommend?” = Bạn gợi ý gì? · “bare” (lóng Toronto) = rất nhiều."),
              O("Is everything here really cheap?", 1, ["Cheaper than downtown, for sure. Still Toronto prices, though. Nothing is truly cheap here.", "Rẻ hơn khu trung tâm, chắc chắn rồi. Nhưng vẫn là giá Toronto. Ở đây chẳng có gì thật sự rẻ."], "“for sure” = chắc chắn.")]),
            S("This jacket is giving 1995, and I'm obsessed. Should I buy it?", "Cái áo khoác này toát ra vibe năm 1995, mà mình mê nó luôn. Có nên mua không?"),
            C("Khuyên bạn một cách tự nhiên.", [
              O("Honestly, it suits you. You should totally get it!", 1, ["Okay, you've convinced me. My bank account is crying, but my heart is happy.", "Rồi, bạn thuyết phục được mình rồi. Tài khoản ngân hàng đang khóc, nhưng trái tim thì vui."], "“It suits you” = hợp với bạn đó. “totally” = hoàn toàn (nhấn mạnh)."),
              O("Remember your rent, Priya.", 1, ["Ugh, why are you right? Okay, I'll just take a picture of it.", "Hừ, sao bạn nói đúng thế? Thôi, mình chỉ chụp ảnh nó thôi."], "Đùa kiểu bạn bè thân, nhắc về tiền nhà 😄")])] }],
          before: ['', ''], after: ["Daniel's waiting at the Eaton Centre. Go!", "Daniel đang chờ ở Eaton Centre. Đi đi!"] },
        { id: 'daniel', name: 'Daniel', look: 'daniel', x: 16, y: 5, main: 1,
          talks: [{ obj: 'o9', steps: [
            S("Welcome to Sankofa Square! It used to be called Yonge-Dundas Square. The city renamed it in 2024. Giant screens everywhere, like a mini Times Square.", "Chào mừng tới Sankofa Square! Trước đây nó tên là Yonge-Dundas Square. Thành phố đổi tên năm 2024. Màn hình khổng lồ khắp nơi, như một Times Square thu nhỏ."),
            C("Hỏi về việc đổi tên.", [
              O("Why did they change the name?", 1, ["Henry Dundas, the guy it was named after, delayed the end of the slave trade. So the city picked a new name. “Sankofa” is a Ghanaian idea about learning from the past.", "Henry Dundas, người được đặt tên trước đây, đã trì hoãn việc bãi bỏ buôn bán nô lệ. Nên thành phố chọn tên mới. “Sankofa” là một khái niệm của Ghana về việc học hỏi từ quá khứ."], "Ga tàu ở đây cũng đổi tên: Dundas → TMU (cuối năm 2025). Nhiều người vẫn quen gọi tên cũ, nên nghe cả hai tên là bình thường."),
              O("Wow, the screens are so bright!", 1, ["Wait till you see it at night. It's a whole vibe. Lowkey my favourite spot downtown.", "Đợi xem buổi tối đi. Đúng chất luôn. Nói nhỏ, đây là chỗ mình thích nhất ở downtown."], "")]),
            S("And right behind us is the Eaton Centre, the big mall. Shopping, food court, and air conditioning. The holy trinity.", "Còn ngay sau lưng là Eaton Centre, trung tâm mua sắm lớn. Mua sắm, khu ăn uống và điều hoà. Bộ ba thần thánh."),
            C("Hỏi đường về nhà từ đây.", [
              O("So how do I get home from here?", 1, ["Easy. Queen station is right under the mall. Take Line 1 northbound, towards Finch, and get off at North York Centre.", "Dễ. Ga Queen nằm ngay dưới trung tâm thương mại. Lên Line 1 hướng bắc, về phía Finch, rồi xuống ở North York Centre."], "“northbound towards Finch” = hướng bắc, về phía ga cuối Finch."),
              O("Can I live in the mall?", 0.5, ["Haha, rent is cheaper than some condos, probably. But no.", "Haha, chắc còn rẻ hơn thuê vài căn hộ. Nhưng không được đâu."], "")]),
            S("But it's late, and we're all tired. Do we take the subway or split an Uber?", "Nhưng muộn rồi, ai cũng mệt. Mình đi tàu hay chia tiền gọi Uber?"),
            C("Chọn cách về và giải thích (TTC vs. Hopp / Uber / Lyft).", [
              O("Let's take the subway. It's cheaper, and it goes right to my place.", 1, ["Smart. Line 1 straight home, no traffic. Okay, you officially know how to get around Toronto!", "Khôn. Line 1 về thẳng nhà, không kẹt xe. Rồi, bạn chính thức biết cách đi lại ở Toronto!"], "Đi hằng ngày: TTC. Đi đêm muộn, mang nhiều đồ hoặc chỗ không có tàu: Hopp / Uber / Lyft."),
              O("Let's split an Uber. I'm too tired to stand.", 1, ["Fair! It's late and there are five of us, so splitting isn't bad. Okay, you officially know how to get around Toronto!", "Hợp lý! Muộn rồi lại có năm người, chia ra cũng không đắt. Rồi, bạn chính thức biết cách đi lại ở Toronto!"], "Chia tiền (split) giúp rideshare rẻ hơn khi đi nhóm, nhất là buổi tối."),
              O("Let's walk home. It's only fifteen kilometres.", 0, ["Haha, nope. Your legs already filed a complaint today.", "Haha, thôi. Chân bạn đã khiếu nại một lần hôm nay rồi."], "Về North York từ downtown ~15 km: đi tàu hoặc gọi xe nhé!")]),
            S("Seriously though, welcome to Toronto, {name}. Tomorrow school starts. You got this.", "Nói thật nhé, chào mừng tới Toronto, {name}. Mai nhập học rồi. Bạn làm được mà."),
            C("Cảm ơn cả nhóm.", [
              O("Thank you, guys. Seriously, best first week ever.", 1, ["Group hug! Okay, okay, that's enough. Sorry. Okay, one more.", "Ôm tập thể nào! Rồi rồi, đủ rồi. Xin lỗi. Thôi, ôm thêm cái nữa."], "“Seriously” = nói thật đấy. Kết thúc rất tự nhiên!", 'liam'),
              O("Thanks! Same time next week? Karaoke?", 1, ["Bet! Karaoke next weekend. Jenny's already picking songs.", "Chốt! Karaoke cuối tuần sau. Jenny đang chọn bài rồi kìa."], "“Same time next week?” = Tuần sau giờ này nhé?", 'josh')]),
            N('🎉 Chúc mừng! Em đã có hội bạn ở Toronto, biết gọi xe, gọi món ở Tims, đọc bản đồ và tự đi TTC. Sẵn sàng cho ngày nhập học!')] }],
          before: ['', ''], after: ["Line 1 northbound, towards Finch. See you!", "Line 1 hướng bắc, về phía Finch. Hẹn gặp lại!"] },
        { id: 'tourist', name: 'Tourist', look: 'tourist', x: 34, y: 9, wander: 2,
          talks: [{ steps: [S("Excuse me! Which way to the CN Tower?", "Xin lỗi! Tháp CN đi lối nào ạ?"),
            C("Tháp CN đứng ngay trước mặt… Trả lời lịch sự (hoặc đùa nhẹ).", [
              O("It's right behind you! Just walk that way, you can't miss it.", 1, ["Oh my gosh, it's huge! How did I not see it? Thanks!", "Trời ơi, to thế! Sao tôi không thấy nhỉ? Cảm ơn!"], "“You can't miss it” = Bạn không thể nào bỏ lỡ được đâu (rất dễ thấy)."),
              O("Look up!", 0.5, ["…Oh. Oh wow. Okay, I feel silly. Thanks!", "…Ồ. Ồ trời. Rồi, tôi thấy mình hơi ngốc. Cảm ơn!"], "")])] }] },
        { id: 'busker', name: 'Street musician', look: 'musician', x: 37, y: 12,
          talks: [{ steps: [S("Hey! Any song requests? I take requests and loonies.", "Chào! Có muốn nghe bài gì không? Tôi nhận yêu cầu bài hát và cả đồng loonie."),
            C("“loonie” = đồng xu 1 đô Canada.", [
              O("Here's a loonie! Can you play something summery?", 1, ["Thanks, friend! One summer song, coming up!", "Cảm ơn bạn! Một bài mùa hè, có ngay!"], "loonie = đồng 1 đô (có hình chim loon), toonie = đồng 2 đô."),
              O("What's a loonie? A crazy person?", 0.5, ["Haha, it's the one-dollar coin! There's a loon bird on it.", "Haha, là đồng xu 1 đô! Trên đó có hình chim loon."], "")])] }] },
        { id: 'vendor', name: 'Fruit vendor', look: 'vendor', x: 41, y: 1, range: 2.2,
          talks: [{ steps: [S("Fresh Ontario peaches! Super sweet this time of year. Want to try one?", "Đào Ontario tươi đây! Mùa này ngọt lắm. Thử một quả không?"),
            C("Mua hàng ở chợ: hỏi giá theo đơn vị.", [
              O("Sure! How much for a basket?", 1, ["It's on the sign. Cash or card, both are fine!", "Giá ghi trên bảng nhé. Tiền mặt hay thẻ đều được!"], "“How much for…?” = …giá bao nhiêu? Ở chợ hay bán theo “basket” (rổ) hoặc “pound” (pao)."),
              O("No thanks, I'm full of Timbits.", 1, ["Haha, a true Canadian already!", "Haha, đúng là người Canada rồi!"], "")])] }] }
      ]
    }
  ];

  /* ---------- id ổn định cho từng câu thoại (dùng để gắn file giọng thật: key 'voice:<id>') ----------
     dạng <chương>.<nhân vật>.<lượt thoại>.<bước>  ·  phản hồi của lựa chọn: …<bước>.r<số lựa chọn>  ·  câu chờ: <chương>.<nhân vật>.before / .after
     Muốn cố định id dù sửa thứ tự câu: tự ghi thêm id: '...' vào bước thoại trong data.js. */
  R.CHAPTERS.forEach(ch => ch.npcs.forEach(n => {
    (n.talks || []).forEach((tk, ti) => tk.steps.forEach((st, si) => {
      const base = st.id || (ch.id + '.' + n.id + '.' + ti + '.' + si); st.id = base;
      if (st.t === 'c') st.opts.forEach((o, k) => { if (o.r && !o.rid) o.rid = base + '.r' + k; });
    }));
  }));
  /* danh sách mọi câu nhân vật nói (cho trang "Âm thanh game" của giáo viên) */
  R.allLines = function () {
    const out = [];
    R.CHAPTERS.forEach((ch, ci) => ch.npcs.forEach(n => {
      const who = id => { const x = id && ch.npcs.find(m => m.id === id); return x || n; };
      (n.talks || []).forEach(tk => tk.steps.forEach(st => {
        if (st.t === 's') out.push({ id: st.id, ch: ch.id, chIdx: ci, chTitle: ch.title, npc: who(st.who).id, name: who(st.who).name, en: st.en, vi: st.vi });
        if (st.t === 'c') st.opts.forEach(o => { if (o.r) out.push({ id: o.rid, ch: ch.id, chIdx: ci, chTitle: ch.title, npc: who(o.who).id, name: who(o.who).name, en: o.r[0], vi: o.r[1], reply: o.en }); });
      }));
      ['before', 'after'].forEach(k => { const l = n[k]; if (l && l[0]) out.push({ id: ch.id + '.' + n.id + '.' + k, ch: ch.id, chIdx: ci, chTitle: ch.title, npc: n.id, name: n.name, en: l[0], vi: l[1] }); });
    }));
    return out;
  };
})();
