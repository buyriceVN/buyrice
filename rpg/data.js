/* Du học Toronto – dữ liệu game: bản đồ, NPC, nhiệm vụ, lời thoại.
   Thêm chương mới: thêm một phần tử vào CHAPTERS (xem cấu trúc bên dưới). */
(function () {
  const R = window.TorontoRPG = window.TorontoRPG || {};

  /* ---------- ô bản đồ ----------
     ' ' trống (ngoài bản đồ)  '#' tường   'W' tường có cửa sổ   'D' cửa ra vào
     '.' sàn gỗ/sàn nhà        ',' sàn gạch  ':' đường phố VN    '~' tuyết
     '_' thảm lối đi máy bay   'R' thảm      '=' quầy             'S' ghế
     'T' bàn                   'P' cây       'B' sofa/ghế dài     'K' máy kiosk/thiết bị
     'L' băng chuyền/cân/vali  'Q' dây xếp hàng   'O' tháp CN mini   */
  R.SOLID = new Set(['#', 'W', '=', 'S', 'T', 'P', 'B', 'K', 'L', 'Q', 'O', ' ']);

  R.ITEMS = {
    loa: ['📄', 'Thư mời nhập học (LOA)', 'Letter of Acceptance – trường gửi khi em trúng tuyển.'],
    passport: ['🛂', 'Hộ chiếu', 'Passport – luôn mang theo khi xuất nhập cảnh.'],
    letter: ['✉️', 'Thư giới thiệu (POE letter)', 'Letter of Introduction – đưa cho hải quan Canada để nhận study permit.'],
    noodles: ['🍜', 'Mì tôm + chai nước mắm', 'Đồ ăn mang theo phải khai báo (declare) ở hải quan.'],
    suitcase: ['🧳', 'Vali 31 kg', 'Quá cân! Giới hạn hành lý ký gửi chỉ 23 kg.'],
    pass: ['🎫', 'Thẻ lên máy bay', 'Boarding pass – ghế 32A, cửa số 12.'],
    permit: ['🪪', 'Study permit', 'Giấy phép du học do hải quan Canada cấp.'],
    coffee: ['☕', 'Cà phê double-double', 'Double-double = 2 phần kem sữa + 2 phần đường.']
  };

  /* ---------- ngoại hình NPC ---------- */
  R.LOOKS = {
    mom: { skin: '#f3c9a1', hair: '#2a211c', style: 'bun', shirt: '#e06c8e', pitch: 1.25 },
    dad: { skin: '#e8b98f', hair: '#2a211c', style: 'short', shirt: '#4a7bb7', glasses: 1, pitch: 0.8 },
    sis: { skin: '#f6d0ab', hair: '#3a2a20', style: 'pigtails', shirt: '#f5c542', small: 1, pitch: 1.5 },
    staff: { skin: '#e9bd94', hair: '#1f1a17', style: 'short', shirt: '#2f4a7a', lanyard: 1, pitch: 1.05 },
    photo: { skin: '#f0c49b', hair: '#6b3e26', style: 'long', shirt: '#16a085', lanyard: 1, pitch: 1.2 },
    guard: { skin: '#d9a47c', hair: '#1f1a17', style: 'cap', cap: '#2c3e50', shirt: '#34495e', pitch: 0.8 },
    agent: { skin: '#f1c59d', hair: '#4a2f1f', style: 'bun', shirt: '#c0392b', scarf: '#f4d03f', pitch: 1.2 },
    fa: { skin: '#e3ae84', hair: '#1f1a17', style: 'bun', shirt: '#1f7a7a', scarf: '#e67e22', pitch: 1.15 },
    officer: { skin: '#d9a47c', hair: '#5a3b26', style: 'cap', cap: '#1d2d4a', shirt: '#1d2d4a', beard: 1, badge: 1, pitch: 0.85 },
    officer2: { skin: '#f2c7a5', hair: '#a0522d', style: 'cap', cap: '#1d2d4a', shirt: '#1d2d4a', badge: 1, pitch: 1.15 },
    handler: { skin: '#8d5a3b', hair: '#1f1a17', style: 'cap', cap: '#1d2d4a', shirt: '#1d2d4a', dog: 1, badge: 1, pitch: 1.0 },
    buddy: { skin: '#f7d3b5', hair: '#e2b04a', style: 'ponytail', shirt: '#d63031', sign: 'WELCOME!', pitch: 1.2 },
    barista: { skin: '#c98d63', hair: '#2a1c12', style: 'beanie', beanie: '#ff7043', shirt: '#2e7d32', apron: 1, beard: 1, pitch: 0.95 },
    old: { skin: '#f1c9a5', hair: '#d5d5d5', style: 'short', shirt: '#8e7cc3', glasses: 1, pitch: 0.75 },
    kid: { skin: '#f6d0ab', hair: '#3a2a20', style: 'short', shirt: '#00b894', small: 1, pitch: 1.6 },
    man: { skin: '#e0ac69', hair: '#2d1e12', style: 'short', shirt: '#636e72', pitch: 0.9 },
    woman: { skin: '#c68642', hair: '#1b1b1b', style: 'long', shirt: '#fd79a8', pitch: 1.2 },
    tourist: { skin: '#ffdbac', hair: '#b5651d', style: 'cap', cap: '#e17055', shirt: '#0984e3', pitch: 1.0 },
    musician: { skin: '#a1665e', hair: '#111', style: 'beanie', beanie: '#6c5ce7', shirt: '#2d3436', guitar: 1, pitch: 0.9 },
    moose: { skin: '#8b5a2b', hair: '#5d3a1a', style: 'moose', shirt: '#8b5a2b', pitch: 0.7 },
    vendor: { skin: '#d9a066', hair: '#222', style: 'conical', shirt: '#f39c12', pitch: 1.1 }
  };

  /* ---------- công cụ dựng bản đồ ---------- */
  function grid(w, h) { return Array.from({ length: h }, () => Array(w).fill(' ')); }
  function fill(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = c; }
  function room(g, x, y, w, h, floor) { fill(g, x, y, w, h, '#'); fill(g, x + 1, y + 1, w - 2, h - 2, floor); }
  function put(g, x, y, c) { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; }
  const done = g => g.map(r => r.join(''));

  /* hội thoại: t:'s' NPC nói · t:'c' lựa chọn · t:'n' lời dẫn (tiếng Việt) · t:'i' nhận đồ
     lựa chọn: ok 1 = chuẩn, 0.5 = hài hước nhưng vẫn qua, 0 = chưa ổn (thử lại); r = [phản hồi EN, VI]; tip = mẹo sau khi chọn */
  const S = (en, vi, who) => ({ t: 's', en, vi, who });
  const N = vi => ({ t: 'n', vi });
  const I = item => ({ t: 'i', item });
  const C = (hint, opts) => ({ t: 'c', hint, opts });
  const O = (en, ok, r, tip) => ({ en, ok, r, tip });

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
  /* ======================= CHƯƠNG 5 ======================= */
  function map5() {
    const g = grid(40, 16);
    room(g, 0, 0, 13, 16, ','); fill(g, 3, 0, 7, 1, 'W'); fill(g, 2, 12, 4, 1, 'S'); fill(g, 7, 12, 4, 1, 'S'); put(g, 1, 1, 'P'); put(g, 12, 8, 'D');
    fill(g, 13, 0, 13, 16, '~'); put(g, 14, 1, 'P'); put(g, 24, 1, 'P'); put(g, 14, 14, 'P'); put(g, 24, 14, 'P'); fill(g, 20, 2, 2, 2, 'O'); fill(g, 16, 12, 3, 1, 'B');
    room(g, 26, 0, 14, 16, '.'); fill(g, 29, 0, 8, 1, 'W'); put(g, 26, 8, 'D'); fill(g, 29, 3, 7, 1, '=');
    put(g, 29, 9, 'T'); put(g, 33, 9, 'T'); put(g, 29, 12, 'T'); put(g, 33, 12, 'T'); put(g, 37, 11, 'T'); put(g, 38, 1, 'P'); put(g, 38, 14, 'P');
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
      zones: [{ x: 1, y: 1, w: 10, h: 9, name: 'Nhà em' }, { x: 12, y: 3, w: 4, h: 6, name: 'Taxi' }, { x: 17, y: 1, w: 22, h: 14, name: 'Sân bay' }],
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
      id: 'customs', icon: '🍁', title: 'Cửa hải quan Toronto', theme: 'customs', map: map4(), spawn: [2, 8],
      intro: 'Chào mừng đến sân bay Toronto Pearson! Từ giờ, mọi người xung quanh đều nói tiếng Anh. Hãy khai báo ở máy kiosk rồi gặp sĩ quan biên giới (CBSA).',
      signs: [{ x: 16, y: 0.1, text: 'WELCOME TO CANADA · BIENVENUE AU CANADA' }, { x: 6, y: 2.6, text: 'DECLARATION KIOSKS', small: 1 }, { x: 25, y: 2.6, text: 'BOOTH 1', small: 1 }, { x: 25, y: 8.6, text: 'BOOTH 2 · CLOSED', small: 1 }, { x: 6, y: 13.6, text: 'BAGGAGE', small: 1 }],
      zones: [{ x: 1, y: 1, w: 30, h: 14, name: 'Khu nhập cảnh – Toronto Pearson' }],
      objectives: [
        { id: 'o1', text: 'Khai báo hải quan ở máy kiosk', target: 'kiosk' },
        { id: 'o2', text: 'Trả lời phỏng vấn của sĩ quan biên giới ở Booth 1', target: 'officer' }
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
    {
      id: 'toronto', icon: '🏙️', title: 'Xin chào Toronto', theme: 'toronto', map: map5(), spawn: [4, 8],
      intro: 'Em bước ra sảnh đến. Ngoài trời tuyết rơi trắng xoá! Tìm người đón, ghé quán cà phê và gọi video báo tin cho mẹ.',
      signs: [{ x: 6.5, y: 0.1, text: 'ARRIVALS' }, { x: 33, y: 0.1, text: '🍁 MAPLE COFFEE' }, { x: 21, y: 4.4, text: 'mini CN Tower', small: 1 }, { x: 19.5, y: 0.6, text: 'Toronto', small: 1 }],
      zones: [{ x: 1, y: 1, w: 11, h: 14, name: 'Sảnh đến' }, { x: 13, y: 0, w: 13, h: 16, name: 'Phố Toronto' }, { x: 27, y: 1, w: 12, h: 14, name: 'Quán Maple Coffee' }],
      objectives: [
        { id: 'o1', text: 'Gặp Emma ở đội đón sinh viên', target: 'buddy' },
        { id: 'o2', text: 'Sang quán Maple Coffee gọi một ly cà phê', target: 'barista' },
        { id: 'o3', text: 'Ngồi bàn trong góc quán, gọi video báo tin cho Mẹ', target: 'phone' }
      ],
      npcs: [
        { id: 'buddy', name: 'Emma (welcome team)', look: 'buddy', x: 7, y: 6, main: 1,
          talks: [{ obj: 'o1', steps: [
            S('Hi there! Are you an international student? I am Emma from the student welcome team.', 'Chào bạn! Bạn là du học sinh hả? Mình là Emma, đội đón tân sinh viên.'),
            C('Giới thiệu tên: “I am… Nice to meet you.”', [
              O('Yes, I am! I am {name}. Nice to meet you, Emma.', 1, ['Nice to meet you too! Welcome to Toronto!', 'Rất vui được gặp bạn! Chào mừng đến Toronto!'], '“Nice to meet you” dùng khi gặp lần đầu.'),
              O('No. Who are you?', 0, ['Oh, sorry! But your hoodie says “International Student”...', 'Ồ, xin lỗi! Nhưng áo của bạn ghi “Du học sinh” mà...'])]),
            S('You look cold! There is a nice coffee shop across the street. Go and get a hot drink!', 'Trông bạn lạnh quá! Bên kia đường có quán cà phê xinh lắm. Qua đó uống gì nóng đi!'),
            C('Đồng ý lời rủ: “Sounds great!” / “Good idea!”', [
              O('Sounds great! I am freezing.', 1, ['Haha, you will get used to it!', 'Haha, rồi bạn sẽ quen thôi!'], '“freezing” = lạnh cóng.'),
              O('No, I will drink snow.', 0.5, ['Please do not drink the snow!', 'Làm ơn đừng uống tuyết!'])])] }],
          before: ['', ''], after: ['The coffee shop is across the street. See you later!', 'Quán cà phê ở bên kia đường. Gặp lại sau nhé!'] },
        { id: 'barista', name: 'Barista', look: 'barista', x: 32, y: 2, main: 1, range: 2.3,
          talks: [{ obj: 'o2', steps: [
            S('Hi! What can I get for you?', 'Chào bạn! Bạn muốn dùng gì?'),
            C('Gọi đồ uống: “Can I get a medium coffee, please?”', [
              O('Hi! Can I get a medium coffee, please?', 1, ['Sure!', 'Được thôi!'], '“Can I get…, please?” là cách gọi món rất tự nhiên ở Canada.'),
              O('Coffee. Now.', 0, ['Wow, somebody had a long flight! How about a “please”?', 'Chà, có người vừa bay xa về! Thêm chữ “please” nhé?'])]),
            S('Double-double?', '“Double-double” không?'),
            C('Không hiểu thì hỏi lại lịch sự: “Sorry, could you say that again?” / “What does … mean?”', [
              O('Sorry, could you say that again? What does “double-double” mean?', 1, ['Of course! It means two creams and two sugars. Very Canadian!', 'Tất nhiên! Nghĩa là hai phần kem sữa và hai phần đường. Rất Canada!'], 'Hỏi lại khi chưa hiểu là kỹ năng giao tiếp rất tốt.'),
              O('Double-double? I only have one mouth!', 0.5, ['Haha! It means two creams and two sugars.', 'Haha! Nghĩa là hai phần kem sữa và hai phần đường.']),
              O('Yes, four coffees.', 0, ['Four coffees? No, no! Double-double is two creams and two sugars.', 'Bốn ly á? Không không! Double-double là hai kem hai đường.'], 'Đừng đoán bừa. Hỏi lại: “Sorry, what does that mean?”')]),
            S('So... double-double?', 'Vậy... double-double nhé?'),
            C('Chọn một câu trả lời lịch sự.', [
              O('Sounds good. I will try it!', 1, ['Great choice. That will be two dollars and forty cents. Cash or card?', 'Lựa chọn tuyệt vời. Của bạn 2 đô 40 xu. Tiền mặt hay thẻ?']),
              O('No, thanks. Just black, please.', 1, ['No problem. Two dollars and forty cents. Cash or card?', 'Không sao. 2 đô 40 xu. Tiền mặt hay thẻ?'], '“black coffee” = cà phê đen, không sữa không đường.')]),
            C('Trả bằng thẻ: “Card, please.”', [
              O('Card, please. Here you go.', 1, ['Thank you! Have a great first day in Canada!', 'Cảm ơn! Chúc ngày đầu ở Canada thật vui!']),
              O('Can I pay in Vietnamese dong?', 0, ['Sorry, Canadian dollars only!', 'Xin lỗi, chỉ nhận đô la Canada thôi!'])]),
            I('coffee')] }],
          before: ['Hi! Welcome to Maple Coffee. Take your time!', 'Chào bạn! Chào mừng đến Maple Coffee. Cứ từ từ chọn nhé!'], after: ['Enjoy your coffee! The corner table has good Wi-Fi.', 'Thưởng thức cà phê nhé! Bàn trong góc có Wi-Fi mạnh đấy.'] },
        { id: 'phone', name: 'Mom (video call)', look: null, x: 37, y: 11, object: 1, kind: 'phone', label: 'Gọi video về nhà', voice: 'mom', range: 1.8,
          talks: [{ obj: 'o3', steps: [
            S('{name}! You are there! Are you okay? Are you cold? Did you eat?', '{name}! Con đến nơi rồi! Con ổn không? Có lạnh không? Ăn gì chưa?'),
            C('Báo tin: “I made it!” = con tới nơi rồi!', [
              O('I am fine, Mom! I made it to Toronto. It is cold, but it is beautiful here!', 1, ['We are so proud of you. Study hard and enjoy your new life!', 'Cả nhà tự hào về con lắm. Học chăm và tận hưởng cuộc sống mới nhé!'], '“I made it!” = Tôi làm được rồi / tới nơi rồi!'),
              O('I had a double-double!', 0.5, ['A double WHAT? Is that food? Are you eating well?!', 'Double CÁI GÌ? Đồ ăn à? Con có ăn uống đàng hoàng không đấy?!'])]),
            N('🎉 Chúc mừng! Em đã hoàn thành hành trình từ Việt Nam đến Toronto bằng tiếng Anh.')] }],
          before: ['', ''], after: ['', ''] },
        { id: 'musician', name: 'Street musician', look: 'musician', x: 18, y: 8,
          talks: [{ steps: [S('Hey! Do you have a favourite song? I can play it for you!', 'Này! Bạn có bài hát yêu thích không? Tôi chơi cho bạn nghe!'),
            C('Khen ngợi: “You play really well!”', [
              O('You play really well! Can you play something happy?', 1, ['Sure! Welcome to Toronto!', 'Được thôi! Chào mừng đến Toronto!'], '“You … really well” = bạn … giỏi thật.'),
              O('Sorry, I have to go. Have a nice day!', 1, ['You too, friend!', 'Bạn cũng vậy nhé!'], '“I have to go” = tôi phải đi rồi.')])] }] },
        { id: 'passerby', name: 'Passerby', look: 'man', x: 15, y: 6, wander: 3,
          talks: [{ steps: [S('Excuse me, do you know where Union Station is?', 'Xin lỗi, bạn có biết ga Union ở đâu không?'),
            C('Không biết đường: “Sorry, I am new here.”', [
              O('Sorry, I am new here. Maybe you can check your phone?', 1, ['Ha, good idea. Welcome to the city!', 'Ha, ý hay. Chào mừng đến thành phố!'], '“I am new here” = tôi mới đến đây.'),
              O('Yes! It is in Vietnam.', 0, ['In Vietnam?! I do not think so...', 'Ở Việt Nam á?! Không phải đâu...'], 'Không biết thì nói thật: “Sorry, I do not know.”')])] }] },
        { id: 'moose', name: 'Person in a moose costume', look: 'moose', x: 22, y: 10, wander: 1,
          talks: [{ steps: [S('Hello! Do you want a photo with a moose? Only for today, it is free!', 'Xin chào! Chụp ảnh với nai sừng tấm không? Hôm nay miễn phí!'),
            C('Nhớ lời em gái: “a moose” chứ không phải “a mouse”!', [
              O('Yes, please! My little sister will love it.', 1, ['Say “maple syrup”! Click!', 'Nói “maple syrup” nào! Tách!'], 'Chụp ảnh ở Canada: “Say cheese!” hoặc vui hơn là “Say maple syrup!”'),
              O('Wow, a giant mouse!', 0, ['A MOUSE?! I am a MOOSE!', 'CHUỘT á?! Tôi là NAI SỪNG TẤM!'], 'moose /muːs/ ≠ mouse /maʊs/')])] }] },
        { id: 'customer', name: 'Coffee shop customer', look: 'woman', x: 33, y: 10,
          talks: [{ steps: [S('Hi! Is this your first winter in Canada? You look surprised by the snow.', 'Chào! Đây là mùa đông đầu tiên của bạn ở Canada à? Trông bạn ngạc nhiên vì tuyết quá.'),
            C('Trả lời và chia sẻ cảm xúc.', [
              O('Yes! I have never seen snow before. It is amazing!', 1, ['You will love it... until February!', 'Bạn sẽ thích nó... cho đến tháng Hai!'], '“I have never seen… before” = tôi chưa từng thấy… trước đây.'),
              O('Snow is just cold rain, right?', 0.5, ['Haha, kind of! But much more fun.', 'Haha, cũng gần đúng! Nhưng vui hơn nhiều.'])])] }] }
      ]
    }
  ];
})();
