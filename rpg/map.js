/* Du học Toronto – bản đồ Toronto TỰ VẼ (SVG), phong cách đơn giản vui.
   Dựa trên bố cục bản đồ chính thức "City of Toronto – Existing and Future Rapid Transit Network" (City Planning, cập nhật 17/03/2026).
   Không tải hay chép ảnh gốc vào dự án: nút "Xem bản đồ TTC chính thức" mở thẳng ảnh trên toronto.ca.
   R.TorontoMap.open({ parent, task, say(text, friendId), sfx(key), canGo(chId), onGo(chId), onEvent(ev), onClose() })
   ev: { type: 'zone', id } | { type: 'station', id } | { type: 'route', from, to } | { type: 'official' } */
(function () {
  const R = window.TorontoRPG = window.TorontoRPG || {};
  const OFFICIAL = 'https://www.toronto.ca/wp-content/uploads/2026/04/8dc0-WallMapTransitTTCPrint2026-03-17-scaled.png';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* hội bạn dẫn đường (giọng đọc dùng lại hồ sơ giọng trong voice.js) */
  const FRIENDS = { josh: { id: 'josh', name: 'Josh', look: 'josh' }, priya: { id: 'priya', name: 'Priya', look: 'priya' }, liam: { id: 'liam', name: 'Liam', look: 'liam' }, jenny: { id: 'jenny', name: 'Jenny', look: 'jenny' }, daniel: { id: 'daniel', name: 'Daniel', look: 'daniel' } };
  R.TOR_FRIENDS = FRIENDS;

  /* ---------- 6 khu (thành phố cũ trước khi sáp nhập năm 1998) ---------- */
  const ZONES = [
    { id: 'etobicoke', name: 'Etobicoke', fill: '#dff0d8', d: 'M60,120 L330,120 L345,260 L330,360 L350,470 L330,560 L300,640 L60,640 Z', lx: 190, ly: 420,
      who: 'liam', en: "Etobicoke! Fun fact: the second K is silent, so it's “eh-TOE-bi-coe”. It's close to the airport, with lots of parks and the lake.", vi: 'Etobicoke! Mẹo: chữ K thứ hai câm, đọc là “ê-TÔ-bi-cô”. Gần sân bay, nhiều công viên và có bờ hồ.' },
    { id: 'york', name: 'York', fill: '#fbe3d0', d: 'M330,360 L455,360 L470,430 L445,500 L350,500 L350,470 Z', lx: 400, ly: 440,
      who: 'jenny', en: "York is small but it's got character. Tons of Caribbean and Latin American food around Eglinton West.", vi: 'York nhỏ nhưng rất có chất. Quanh Eglinton West có rất nhiều đồ ăn Caribbean và Mỹ Latinh.' },
    { id: 'northyork', name: 'North York', fill: '#fff3c4', d: 'M330,120 L700,120 L700,290 L690,350 L560,350 L455,360 L330,360 L345,260 Z', lx: 470, ly: 290,
      who: 'daniel', en: 'North York, our hood! Yonge Street, Koreatown North, Mel Lastman Square. Line 1 is the fastest way downtown.', vi: 'North York, khu của tụi mình! Phố Yonge, Koreatown North, quảng trường Mel Lastman. Line 1 là đường nhanh nhất xuống downtown.' },
    { id: 'eastyork', name: 'East York', fill: '#e3dcf5', d: 'M560,350 L690,350 L700,440 L660,510 L600,510 L585,440 Z', lx: 635, ly: 440,
      who: 'liam', en: "East York is chill and family-friendly. The Greek restaurants on the Danforth are right next door. Line 2 is your friend, eh.", vi: 'East York yên bình, hợp gia đình. Các nhà hàng Hy Lạp trên phố Danforth ở ngay sát bên. Line 2 là bạn của bạn đó, eh.' },
    { id: 'scarborough', name: 'Scarborough', fill: '#d6ecf5', d: 'M700,120 L960,120 L960,520 L860,570 L740,600 L700,440 L690,350 L700,290 Z', lx: 830, ly: 330,
      who: 'priya', en: 'Scarborough has the best food in the city. No debate. Take Line 2 east to Kennedy, and go see the Bluffs by the lake.', vi: 'Scarborough có đồ ăn ngon nhất thành phố. Khỏi cãi. Đi Line 2 về phía đông tới Kennedy, rồi ra ngắm vách đá Bluffs bên hồ.' },
    { id: 'oldtoronto', name: 'Old Toronto · Downtown', fill: '#f9d9dc', d: 'M350,500 L445,500 L470,430 L455,360 L560,350 L585,440 L600,510 L660,510 L700,440 L740,600 L640,640 L540,655 L420,650 L330,560 L350,470 Z', lx: 640, ly: 585,
      who: 'josh', en: "This is Old Toronto, the original city. Downtown, the CN Tower, the lake, and way too many condos. It's a whole vibe.", vi: 'Đây là Old Toronto, thành phố gốc. Downtown, tháp CN, bờ hồ và… quá nhiều chung cư. Đúng chất luôn.' }
  ];

  /* ---------- ga & điểm đến ---------- */
  const ST = {
    vmc: ['Vaughan Metropolitan Centre', 372, 78], yorku: ['York University', 392, 138], finchw: ['Finch West', 415, 178], shepw: ['Sheppard West', 438, 232],
    cedarvale: ['Cedarvale', 468, 372], stclairw: ['St Clair West', 486, 428], stgeorge: ['St George', 505, 500], queenspark: ["Queen's Park", 512, 565], standrew: ['St Andrew', 518, 612],
    union: ['Union', 537, 634], king: ['King', 553, 617], queen: ['Queen', 556, 598], tmu: ['TMU', 557, 580], college: ['College', 558, 558], bloor: ['Bloor-Yonge', 560, 500],
    stclair: ['St Clair', 560, 428], eglinton: ['Eglinton', 560, 372], lawrence: ['Lawrence', 560, 312], yorkmills: ['York Mills', 560, 268], shepyonge: ['Sheppard-Yonge', 560, 222], nyc: ['North York Centre', 560, 186], finch: ['Finch', 560, 150],
    kipling: ['Kipling', 150, 505], islington: ['Islington', 195, 505], jane: ['Jane', 300, 505], keele: ['Keele', 380, 505], spadina: ['Spadina', 488, 500], bay: ['Bay', 532, 500],
    broadview: ['Broadview', 615, 505], pape: ['Pape', 640, 505], main: ['Main Street', 705, 505], victoriapark: ['Victoria Park', 735, 500], warden: ['Warden', 770, 490], kennedy: ['Kennedy', 800, 470],
    bayview: ['Bayview', 595, 222], bessarion: ['Bessarion', 622, 222], leslie: ['Leslie', 648, 222], donmills: ['Don Mills', 680, 222],
    mountdennis: ['Mount Dennis', 380, 380], laird: ['Laird', 605, 375], sciencecentre: ['Science Centre', 665, 385],
    humbercollege: ['Humber College', 215, 175],
    longbranch: ['Long Branch', 110, 628], humberloop: ['Humber Loop', 300, 612], roncesvalles: ['Roncesvalles', 420, 600], leslieville: ['Leslieville', 650, 590], nevillepark: ['Neville Park', 770, 572],
    queensquay: ['Queens Quay', 522, 650], exhibition: ['Exhibition', 430, 642],
    bloorgo: ['Bloor (UP)', 440, 515], weston: ['Weston', 330, 330], pearson: ['Pearson Airport ✈️', 70, 255]
  };
  const LINES = [
    { id: '1', name: 'Line 1 Yonge–University', color: '#f4c20d', w: 7, stops: ['vmc', 'yorku', 'finchw', 'shepw', 'cedarvale', 'stclairw', 'stgeorge', 'queenspark', 'standrew', 'union', 'king', 'queen', 'tmu', 'college', 'bloor', 'stclair', 'eglinton', 'lawrence', 'yorkmills', 'shepyonge', 'nyc', 'finch'] },
    { id: '2', name: 'Line 2 Bloor–Danforth', color: '#2e9e48', w: 7, stops: ['kipling', 'islington', 'jane', 'keele', 'spadina', 'stgeorge', 'bay', 'bloor', 'broadview', 'pape', 'main', 'victoriapark', 'warden', 'kennedy'] },
    { id: '4', name: 'Line 4 Sheppard', color: '#a1479c', w: 7, stops: ['shepyonge', 'bayview', 'bessarion', 'leslie', 'donmills'] },
    { id: '5', name: 'Line 5 Eglinton', color: '#f58220', w: 6, stops: ['mountdennis', 'cedarvale', 'eglinton', 'laird', 'sciencecentre', 'kennedy'] },
    { id: '6', name: 'Line 6 Finch West', color: '#8b8d8e', w: 6, stops: ['humbercollege', 'finchw'] },
    { id: '501', name: 'Streetcar 501 Queen', color: '#2b7bd6', w: 4, stops: ['longbranch', 'humberloop', 'roncesvalles', 'queen', 'leslieville', 'nevillepark'] },
    { id: '509', name: 'Streetcar 509 Harbourfront', color: '#2b7bd6', w: 4, stops: ['union', 'queensquay', 'exhibition'] },
    { id: 'up', name: 'UP Express', color: '#1f6f8b', w: 4, stops: ['union', 'bloorgo', 'weston', 'pearson'] }
  ];
  /* GO Transit (vẽ minh hoạ, không dùng để tìm đường) */
  const GO = [[[20, 655], [300, 625], [537, 634], [760, 595], [1000, 560]], [[537, 634], [470, 520], [420, 330], [395, 60]], [[537, 634], [600, 420], [612, 150], [620, 40]], [[537, 634], [700, 520], [860, 300], [900, 40]]];
  /* tuyến đang xây (nét đứt) */
  const BUILD = [
    { name: 'Ontario Line (đang xây)', color: '#e5007e', pts: [[430, 642], [520, 608], [556, 598], [600, 560], [640, 505], [652, 450], [665, 385]] },
    { name: 'Yonge North Subway Extension (đang xây)', color: '#f4c20d', pts: [[560, 150], [562, 118], [568, 60]], stops: [['Steeles', 562, 118], ['Richmond Hill Centre', 568, 60]] },
    { name: 'Scarborough Subway Extension (đang xây)', color: '#2e9e48', pts: [[800, 470], [840, 400], [865, 300]], stops: [['Scarborough Centre', 840, 400], ['Sheppard-McCowan', 865, 300]] },
    { name: 'Eglinton Crosstown West Extension (đang xây)', color: '#f58220', pts: [[380, 380], [270, 350], [150, 330]], stops: [['Renforth', 150, 330]] }
  ];
  /* điểm đến đặc biệt (gắn với chương trong game) và thắng cảnh */
  const PLACES = [
    { id: 'home', icon: '🏠', name: 'Nhà mình – North York', x: 585, y: 192, ch: 'map', st: 'nyc', who: 'daniel', en: "Home sweet home! You're right next to North York Centre station. Two minutes to the subway. That's a flex.", vi: 'Nhà của bạn! Ngay cạnh ga North York Centre. Hai phút ra tàu. Đáng để khoe đó.' },
    { id: 'ktown', icon: '🍗', name: 'Koreatown North (Yonge St)', x: 590, y: 165, ch: 'uber', st: 'finch', who: 'daniel', en: 'Koreatown North: Yonge Street between Sheppard and Finch. Fried chicken, karaoke, bakeries. My second home.', vi: 'Koreatown North: phố Yonge đoạn giữa Sheppard và Finch. Gà rán, karaoke, tiệm bánh. Nhà thứ hai của mình.' },
    { id: 'tims', icon: '☕', name: 'Tims · Yonge & Finch', x: 532, y: 160, ch: 'tims', st: 'finch', who: 'liam', en: "Our Tims! The one where you had your first Iced Capp. A historic location, eh.", vi: 'Quán Tims của tụi mình! Nơi bạn uống ly Iced Capp đầu tiên. Địa điểm lịch sử đấy, eh.' },
    { id: 'yyz', icon: '✈️', name: 'Toronto Pearson (YYZ)', x: 45, y: 228, ch: 'toronto', st: 'pearson', who: 'josh', en: "Pearson, where it all started! Take the UP Express to Union. It's about twenty-five minutes.", vi: 'Pearson, nơi mọi chuyện bắt đầu! Đi UP Express về Union mất khoảng 25 phút.' },
    { id: 'downtown', icon: '🏙️', name: 'Union Station & Downtown', x: 505, y: 648, ch: 'downtown', st: 'union', who: 'josh', en: "Union Station: the busiest transit hub in Canada. Subway, GO trains, UP Express. Downtown starts here.", vi: 'Ga Union: đầu mối giao thông đông nhất Canada. Tàu điện ngầm, tàu GO, UP Express. Downtown bắt đầu từ đây.' },
    { id: 'cn', icon: '🗼', name: 'CN Tower', x: 512, y: 640, who: 'josh', en: "The CN Tower. If you get lost downtown, just look up!", vi: 'Tháp CN. Lạc ở downtown thì cứ ngước lên!' },
    { id: 'sankofa', icon: '📺', name: 'Sankofa Square (Yonge–Dundas cũ)', x: 585, y: 578, st: 'tmu', who: 'jenny', en: "Sankofa Square! It used to be called Yonge-Dundas Square. Giant screens, street performers, total chaos at night. I love it.", vi: 'Sankofa Square! Trước đây tên là Yonge-Dundas Square. Màn hình khổng lồ, nghệ sĩ đường phố, tối thì náo nhiệt kinh khủng. Mê lắm.' },
    { id: 'kensington', icon: '🛍️', name: 'Kensington Market', x: 482, y: 588, st: 'stgeorge', who: 'priya', en: 'Kensington Market: vintage shops, cheap eats, street art. Broke-student heaven.', vi: 'Chợ Kensington: đồ si, đồ ăn rẻ, tranh tường. Thiên đường của sinh viên nghèo.' },
    { id: 'islands', icon: '⛴️', name: 'Toronto Islands', x: 545, y: 705, who: 'liam', en: 'Take the ferry to the Islands. Beaches, bikes, and the best view of the skyline. Perfect summer day, eh.', vi: 'Đi phà ra quần đảo Toronto. Bãi biển, xe đạp và góc nhìn đẹp nhất ra thành phố. Ngày hè hoàn hảo, eh.' },
    { id: 'ytz', icon: '🛩️', name: 'Billy Bishop Airport', x: 462, y: 690, who: 'liam', en: "Billy Bishop is the tiny airport on the island. You can fly to Montréal from basically downtown.", vi: 'Billy Bishop là sân bay nhỏ trên đảo. Bay đi Montréal gần như từ ngay downtown.' },
    { id: 'bluffs', icon: '🌊', name: 'Scarborough Bluffs', x: 880, y: 548, who: 'priya', en: 'The Bluffs: huge white cliffs over the lake. Bring snacks. Lots of snacks.', vi: 'Bluffs: vách đá trắng khổng lồ bên hồ. Mang đồ ăn vặt theo. Thật nhiều vào.' },
    { id: 'highpark', icon: '🌳', name: 'High Park', x: 400, y: 575, who: 'jenny', en: 'High Park. Cherry blossoms in spring, picnics in summer. Very aesthetic.', vi: 'High Park. Mùa xuân có hoa anh đào, mùa hè đi picnic. Rất “aesthetic”.' }
  ];
  /* lời giới thiệu của bạn bè cho một số ga */
  const ST_TALK = {
    finch: ['daniel', 'Finch is the end of Line 1, for now. They are building the subway further north to Richmond Hill.', 'Finch là ga cuối Line 1, ít nhất là bây giờ. Người ta đang xây tiếp tàu điện ngầm lên phía bắc tới Richmond Hill.'],
    nyc: ['daniel', "North York Centre: your station! Mel Lastman Square and the library are right there.", 'North York Centre: ga của bạn! Quảng trường Mel Lastman và thư viện ở ngay đó.'],
    shepyonge: ['daniel', 'Sheppard-Yonge: change here for Line 4, the purple line, going east.', 'Sheppard-Yonge: đổi sang Line 4 (tuyến tím) đi về phía đông ở đây.'],
    eglinton: ['jenny', 'Eglinton: Midtown. Change here for Line 5, the orange line.', 'Eglinton: khu Midtown. Đổi sang Line 5 (tuyến cam) ở đây.'],
    cedarvale: ['jenny', "Cedarvale used to be called Eglinton West. New name, same station. Change for Line 5.", 'Cedarvale trước đây tên là Eglinton West. Tên mới, vẫn là ga cũ. Đổi sang Line 5 ở đây.'],
    bloor: ['liam', 'Bloor-Yonge: the busiest transfer station. Line 1 meets Line 2. Hold on to your bag, eh.', 'Bloor-Yonge: ga đổi tuyến đông nhất. Line 1 gặp Line 2. Giữ chặt túi nhé, eh.'],
    stgeorge: ['priya', 'St George: University of Toronto is right here. Also a transfer between Line 1 and Line 2.', 'St George: Đại học Toronto ở ngay đây. Cũng là ga đổi giữa Line 1 và Line 2.'],
    union: ['josh', 'Union! GO trains, UP Express to the airport, and the subway. The CN Tower is a five-minute walk.', 'Union! Tàu GO, UP Express ra sân bay và tàu điện ngầm. Đi bộ 5 phút là tới tháp CN.'],
    tmu: ['jenny', 'This one used to be Dundas station. Now it’s TMU station, right under Sankofa Square.', 'Ga này trước đây tên là Dundas. Giờ là ga TMU, ngay dưới Sankofa Square.'],
    queen: ['priya', 'Queen: the Eaton Centre is right on top. Also the 501 streetcar.', 'Queen: Eaton Centre nằm ngay phía trên. Có cả xe điện 501.'],
    kennedy: ['priya', 'Kennedy: end of Line 2, and the start of the best food in Scarborough.', 'Kennedy: ga cuối Line 2, và là cửa ngõ vào đồ ăn ngon nhất Scarborough.'],
    kipling: ['liam', 'Kipling: the west end of Line 2, in Etobicoke.', 'Kipling: đầu phía tây của Line 2, ở Etobicoke.'],
    pearson: ['josh', 'Pearson Airport. UP Express to Union in about twenty-five minutes. Way better than the 401, trust me.', 'Sân bay Pearson. UP Express về Union khoảng 25 phút. Hơn hẳn đường 401, tin mình đi.'],
    vmc: ['daniel', "Vaughan Metropolitan Centre is technically outside Toronto, in Vaughan. Line 1 goes all the way up there.", 'Vaughan Metropolitan Centre thật ra nằm ngoài Toronto, ở Vaughan. Line 1 chạy lên tận đó.'],
    donmills: ['daniel', 'Don Mills: end of Line 4. Fairview Mall is right here.', 'Don Mills: ga cuối Line 4. Trung tâm Fairview Mall ở ngay đây.'],
    finchw: ['josh', 'Finch West: change here for Line 6, the new grey line along Finch Avenue.', 'Finch West: đổi sang Line 6 (tuyến xám mới) chạy dọc đại lộ Finch ở đây.']
  };
  const linesAt = id => LINES.filter(l => l.stops.includes(id));

  /* ---------- tìm đường (Dijkstra: +1 mỗi ga, +4 mỗi lần đổi tuyến) ---------- */
  function route(from, to) {
    if (!ST[from] || !ST[to] || from === to) return null;
    const key = (s, l) => s + '|' + l, dist = {}, prev = {}, Q = [];
    linesAt(from).forEach(l => { dist[key(from, l.id)] = 0; Q.push([0, from, l.id]); });
    let end = null;
    while (Q.length) {
      Q.sort((a, b) => a[0] - b[0]); const [d, s, lid] = Q.shift();
      if (d > dist[key(s, lid)]) continue;
      if (s === to) { end = key(s, lid); break; }
      const L = LINES.find(l => l.id === lid), i = L.stops.indexOf(s);
      [i - 1, i + 1].forEach(j => { if (j < 0 || j >= L.stops.length) return; const k = key(L.stops[j], lid), nd = d + 1; if (dist[k] == null || nd < dist[k]) { dist[k] = nd; prev[k] = key(s, lid); Q.push([nd, L.stops[j], lid]); } });
      linesAt(s).forEach(l2 => { if (l2.id === lid) return; const k = key(s, l2.id), nd = d + 4; if (dist[k] == null || nd < dist[k]) { dist[k] = nd; prev[k] = key(s, lid); Q.push([nd, s, l2.id]); } });
    }
    if (!end) return null;
    const path = []; let k = end; while (k) { const [s, l] = k.split('|'); path.unshift([s, l]); k = prev[k]; }
    const segs = [];
    path.forEach(([s, l]) => { const g = segs[segs.length - 1]; if (g && g.line === l) g.stops.push(s); else segs.push({ line: l, stops: [s] }); });
    const out = segs.filter(g => g.stops.length > 1).map(g => { const L = LINES.find(l => l.id === g.line), a = L.stops.indexOf(g.stops[0]), b = L.stops.indexOf(g.stops[g.stops.length - 1]); const p0 = ST[g.stops[0]], p1 = ST[g.stops[1]], dx = p1[1] - p0[1], dy = p1[2] - p0[2]; const dir = Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 'southbound' : 'northbound') : (dx > 0 ? 'eastbound' : 'westbound'); return { L, stops: g.stops, dir, toward: ST[b > a ? L.stops[L.stops.length - 1] : L.stops[0]][0] }; });
    return out;
  }
  R.torontoRoute = route;

  /* ---------- ảnh đại diện bạn bè (vẽ bằng hàm vẽ người có sẵn) ---------- */
  const avCache = {};
  function avatar(fid) {
    if (avCache[fid]) return avCache[fid];
    try { const c = document.createElement('canvas'); c.width = 96; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#fff3e8'; x.beginPath(); x.arc(48, 48, 48, 0, 7); x.fill(); x.save(); x.beginPath(); x.arc(48, 48, 46, 0, 7); x.clip(); x.translate(48, 150); x.scale(2.2, 2.2); R.drawPerson(x, R.LOOKS[FRIENDS[fid].look], 0, 0, 0, false, 0); x.restore(); avCache[fid] = c.toDataURL(); } catch (e) { avCache[fid] = ''; }
    return avCache[fid];
  }

  /* ---------- SVG ---------- */
  const poly = pts => pts.map(p => p.join(',')).join(' ');
  function svgMarkup() {
    let h = '<svg class="tm-svg" viewBox="0 0 1000 760" xmlns="http://www.w3.org/2000/svg">';
    h += '<rect x="-2000" y="-2000" width="5000" height="5000" fill="#eef5e6"/>';
    h += '<g class="tm-zones">' + ZONES.map(z => '<path d="' + z.d + '" fill="' + z.fill + '" stroke="#9a8f7a" stroke-width="2" stroke-dasharray="6 4" data-zone="' + z.id + '"/>').join('') + '</g>';
    h += '<path d="M-2000,640 L300,640 L420,650 L540,655 L640,640 L740,600 L860,570 L960,520 L3000,505 L3000,3000 L-2000,3000 Z" fill="#9fd3f5"/>';
    h += '<path d="M470,686 C500,676 560,676 600,690 C585,706 520,712 470,700 Z" fill="#b8dc9b" stroke="#7fb36a" stroke-width="2" data-place="islands"/>';
    h += '<text x="760" y="690" class="tm-lake">Lake Ontario</text>';
    h += '<line x1="-2000" y1="120" x2="3000" y2="120" stroke="#b8ad98" stroke-width="2" stroke-dasharray="2 5"/><text x="975" y="114" class="tm-small" text-anchor="end">Steeles Ave · ranh giới phía bắc Toronto</text>';
    h += '<g class="tm-znames">' + ZONES.map(z => '<text x="' + z.lx + '" y="' + z.ly + '" class="tm-zname">' + esc(z.name) + '</text>').join('') + '</g>';
    h += '<g class="tm-go">' + GO.map(p => '<polyline points="' + poly(p) + '" fill="none" stroke="#8cc63f" stroke-width="3" stroke-opacity=".75"/>').join('') + '</g>';
    h += '<g class="tm-build">' + BUILD.map(b => '<polyline points="' + poly(b.pts) + '" fill="none" stroke="' + b.color + '" stroke-width="6" stroke-dasharray="10 7" stroke-linecap="round"/>' + (b.stops || []).map(s => '<circle cx="' + s[1] + '" cy="' + s[2] + '" r="5" fill="#fff" stroke="' + b.color + '" stroke-width="3" stroke-dasharray="3 2"/><text x="' + (s[1] + 9) + '" y="' + (s[2] + 4) + '" class="tm-stn tm-fut">' + esc(s[0]) + '</text>').join('')).join('') + '</g>';
    h += '<g class="tm-route"></g>';
    h += '<g class="tm-lines">' + LINES.map(L => '<polyline points="' + poly(L.stops.map(s => [ST[s][1], ST[s][2]])) + '" fill="none" stroke="' + L.color + '" stroke-width="' + L.w + '" stroke-linecap="round" stroke-linejoin="round"' + (L.id === 'up' ? ' stroke-dasharray="1 0"' : '') + '/>').join('') + '</g>';
    const big = new Set(['finch', 'nyc', 'shepyonge', 'eglinton', 'bloor', 'stgeorge', 'union', 'kipling', 'kennedy', 'donmills', 'vmc', 'pearson', 'cedarvale', 'finchw', 'mountdennis', 'sciencecentre', 'humbercollege']);
    h += '<g class="tm-stns">' + Object.keys(ST).map(id => {
      const [n, x, y] = ST[id], ls = linesAt(id), xfer = ls.length > 1, dt = id === 'tmu' || id === 'queen' || id === 'king' || id === 'college' || id === 'union';
      const lx = dt ? x + 10 : x + 9, anchor = 'start';
      return '<g data-st="' + id + '" class="tm-st"><circle cx="' + x + '" cy="' + y + '" r="' + (xfer ? 7.5 : 5.5) + '" fill="#fff" stroke="#222" stroke-width="' + (xfer ? 3 : 2) + '"/><circle cx="' + x + '" cy="' + y + '" r="14" fill="transparent"/>' +
        '<text x="' + lx + '" y="' + (y + 4) + '" text-anchor="' + anchor + '" class="tm-stn' + (big.has(id) ? ' big' : '') + '">' + esc(n) + '</text></g>';
    }).join('') + '</g>';
    h += '<g class="tm-places">' + PLACES.map(p => '<g data-place="' + p.id + '" class="tm-pl"><circle cx="' + p.x + '" cy="' + p.y + '" r="13" fill="#fff" stroke="#d63031" stroke-width="2.5"/><text x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle" class="tm-pi">' + p.icon + '</text></g>').join('') + '</g>';
    h += '<g class="tm-hl"></g></svg>';
    return h;
  }

  /* ---------- mở bản đồ ---------- */
  R.TorontoMap = {
    data: { ZONES, ST, LINES, PLACES, BUILD, OFFICIAL },
    open(cfg) {
      const parent = cfg.parent || document.body;
      const el = document.createElement('div'); el.className = 'tm-wrap';
      el.innerHTML = '<div class="tm-top"><b class="tm-title">🗺️ Bản đồ Toronto</b><span class="tm-task"></span><span class="grow"></span>' +
        '<button class="tm-b" data-m="route">🧭 Từ A đến B</button><button class="tm-b tm-off-b" data-m="official">🗺️ Xem bản đồ TTC chính thức</button><button class="tm-b tm-x" data-m="close" title="Đóng bản đồ">✕</button></div>' +
        '<div class="tm-body">' + svgMarkup() + '<div class="tm-zoom"><button data-m="zin">＋</button><button data-m="zout">－</button><button data-m="zreset" title="Về toàn cảnh">⟲</button></div>' +
        '<div class="tm-legend"><button class="tm-lgh" data-m="legend">Chú thích ▾</button><div class="tm-lgb">' +
        LINES.filter(l => l.id !== '509').map(l => '<div><i style="background:' + l.color + '"></i>' + esc(l.id === '501' ? 'Streetcar 501 & 509' : l.name) + '</div>').join('') +
        '<div><i style="background:#8cc63f"></i>GO Transit</div><div><i class="dash" style="border-color:#e5007e"></i>Đang xây: Ontario Line, Yonge North, Scarborough, Eglinton West</div>' +
        '<label><input type="checkbox" data-layer="zones" checked> 6 khu</label><label><input type="checkbox" data-layer="build" checked> Tuyến đang xây</label><label><input type="checkbox" data-layer="go" checked> GO Transit</label>' +
        '<div class="tm-credit">Tự vẽ lại, đơn giản hoá theo bố cục bản đồ “Existing and Future Rapid Transit Network” – City of Toronto, City Planning (17/03/2026). Không dùng để đi lại thật.</div></div></div>' +
        '<div class="tm-bubble" hidden></div><div class="tm-routep" hidden></div></div>' +
        '<div class="tm-off" hidden></div>';
      parent.appendChild(el);
      const $ = s => el.querySelector(s), svg = $('.tm-svg'), bubble = $('.tm-bubble'), rp = $('.tm-routep');
      let task = cfg.task || null, A = null, B = null, closed = false;
      const fire = ev => { if (cfg.onEvent) cfg.onEvent(ev); };
      function paintTask(done) {
        const t = $('.tm-task');
        t.className = 'tm-task' + (task ? ' on' : done ? ' done' : '');
        t.textContent = task ? '🎯 ' + task.text : done ? '✅ ' + done : '';
      }
      paintTask();

      /* --- pan / zoom bằng viewBox --- */
      const V0 = { x: 0, y: 0, w: 1000, h: 760 }; let V = Object.assign({}, V0);
      const fit = () => { const r = svg.getBoundingClientRect(); if (!r.width) return; const ar = r.width / r.height; V = { x: 0, y: 0, w: 1000, h: 760 }; if (ar > V.w / V.h) { const w = V.h * ar; V.x = (1000 - w) / 2; V.w = w; } else { const h = V.w / ar; V.y = (760 - h) / 2; V.h = h; } apply(); };
      const apply = () => svg.setAttribute('viewBox', V.x + ' ' + V.y + ' ' + V.w + ' ' + V.h);
      const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return [V.x + (cx - r.left) / r.width * V.w, V.y + (cy - r.top) / r.height * V.h]; };
      function zoom(f, cx, cy) {
        const r = svg.getBoundingClientRect(); if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
        const [px, py] = toSvg(cx, cy); const nw = Math.max(120, Math.min(1600, V.w * f)), k = nw / V.w;
        V = { x: px - (px - V.x) * k, y: py - (py - V.y) * k, w: nw, h: V.h * k }; apply();
      }
      function center(x, y, w) { const ar = V.w / V.h, nw = w || Math.min(V.w, 420); V = { x: x - nw / 2, y: y - nw / ar / 2, w: nw, h: nw / ar }; apply(); }
      svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
      const ptrs = new Map(); let drag = null, pinch = null;
      svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; drag = null; } });
      svg.addEventListener('pointermove', e => {
        if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d > 0) zoom(pinch.d / d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch.d = d; return; }
        if (!drag) return; const r = svg.getBoundingClientRect(), dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
        if (drag.moved) { V.x -= dx / r.width * V.w; V.y -= dy / r.height * V.h; apply(); }
      });
      const up = e => {
        ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
        if (drag && !drag.moved && ptrs.size === 0) { const t = document.elementFromPoint(e.clientX, e.clientY); tap(t && t.closest ? t : null); }
        if (ptrs.size === 0) drag = null;
      };
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pinch = null; });

      /* --- bấm vào khu / ga / điểm đến --- */
      function hl(html) { $('.tm-hl').innerHTML = html || ''; }
      function say(who, en, vi, extra) {
        const f = FRIENDS[who] || FRIENDS.daniel;
        bubble.innerHTML = '<img class="tm-av" src="' + avatar(f.id) + '" alt=""><div class="tm-bt"><div class="tm-bh"><b>' + esc(f.name) + '</b><button class="tm-x2" data-m="bx" title="Đóng">✕</button></div>' + (extra && extra.title ? '<div class="tm-bti">' + extra.title + '</div>' : '') +
          '<div class="tm-en">' + esc(en) + ' <button class="tm-sp" data-m="say" title="Nghe">🔊</button></div><div class="tm-vi">' + esc(vi) + '</div>' + (extra && extra.acts ? '<div class="tm-acts">' + extra.acts + '</div>' : '') + '</div>';
        bubble.hidden = false; bubble._say = [en, who];
        if (cfg.say) cfg.say(en, who);
      }
      function tap(t) {
        if (!t) return;
        const st = t.closest('[data-st]'), pl = t.closest('[data-place]'), zn = t.closest('[data-zone]');
        if (pl) return showPlace(pl.dataset.place);
        if (st) return showStation(st.dataset.st);
        if (zn) return showZone(zn.dataset.zone);
        bubble.hidden = true; hl('');
      }
      function showZone(id) {
        const z = ZONES.find(x => x.id === id); if (!z) return;
        hl('<path d="' + z.d + '" fill="none" stroke="#d63031" stroke-width="5"/>');
        say(z.who, z.en, z.vi, { title: '📍 ' + esc(z.name) });
        if (cfg.sfx) cfg.sfx('footstep');
        fire({ type: 'zone', id });
      }
      function stActs(id) { return '<button class="tm-b sm" data-m="setA" data-id="' + id + '">Đặt làm A (đi từ)</button><button class="tm-b sm" data-m="setB" data-id="' + id + '">Đặt làm B (đến)</button>'; }
      function goBtn(p) { const ok = p.ch && cfg.canGo && cfg.canGo(p.ch) >= 0; return p.ch ? (ok ? '<button class="tm-b sm pri" data-m="go" data-ch="' + p.ch + '">🚶 Đi tới đây</button>' : '<span class="tm-lock">🔒 Mở khi tới chương này</span>') : ''; }
      function showStation(id) {
        const s = ST[id]; if (!s) return; const ls = linesAt(id);
        hl('<circle cx="' + s[1] + '" cy="' + s[2] + '" r="16" fill="none" stroke="#d63031" stroke-width="4"><animate attributeName="r" values="12;20;12" dur="1.4s" repeatCount="indefinite"/></circle>');
        const tk = ST_TALK[id], lines = ls.map(l => '<span class="tm-chip" style="background:' + l.color + '">' + esc(l.id === 'up' ? 'UP' : l.id.length > 1 ? l.id : 'Line ' + l.id) + '</span>').join(' ');
        const pl = PLACES.find(p => p.st === id && p.ch);
        const who = tk ? tk[0] : 'daniel', en = tk ? tk[1] : s[0] + ' station. ' + (ls.length > 1 ? 'You can transfer here.' : 'Stop on ' + ls[0].name + '.'), vi = tk ? tk[2] : 'Ga ' + s[0] + '. ' + (ls.length > 1 ? 'Có thể đổi tuyến ở đây.' : 'Một ga trên ' + ls[0].name + '.');
        say(who, en, vi, { title: '🚉 ' + esc(s[0]) + ' ' + lines, acts: stActs(id) + (pl ? goBtn(pl) : '') });
        fire({ type: 'station', id });
      }
      function showPlace(id) {
        const p = PLACES.find(x => x.id === id); if (!p) return;
        hl('<circle cx="' + p.x + '" cy="' + p.y + '" r="18" fill="none" stroke="#d63031" stroke-width="4"><animate attributeName="r" values="14;22;14" dur="1.4s" repeatCount="indefinite"/></circle>');
        say(p.who, p.en, p.vi, { title: p.icon + ' ' + esc(p.name), acts: (p.st ? stActs(p.st) : '') + goBtn(p) });
        if (p.st) fire({ type: 'station', id: p.st });
      }

      /* --- từ A đến B --- */
      const opts = sel => '<option value="">— chọn ga —</option>' + Object.keys(ST).sort((a, b) => ST[a][0].localeCompare(ST[b][0])).map(id => '<option value="' + id + '"' + (id === sel ? ' selected' : '') + '>' + esc(ST[id][0]) + '</option>').join('');
      function routePanel(res) {
        rp.innerHTML = '<div class="tm-rh"><b>🧭 Từ A đến B</b><button class="tm-x2" data-m="rx">✕</button></div>' +
          '<div class="tm-rf"><label>A <select data-r="A">' + opts(A) + '</select></label><button class="tm-b sm" data-m="swap" title="Đổi chiều">⇅</button><label>B <select data-r="B">' + opts(B) + '</select></label><button class="tm-b sm pri" data-m="find">Tìm đường</button></div>' +
          '<div class="tm-small">Mẹo: bấm vào một ga trên bản đồ rồi chọn “Đặt làm A / B”.</div>' + (res || '');
        rp.hidden = false;
      }
      function findRoute() {
        if (!A || !B) { routePanel('<div class="tm-rres warn">Chọn cả điểm A và điểm B nhé.</div>'); return; }
        const r = route(A, B);
        if (!r) { routePanel('<div class="tm-rres warn">' + (A === B ? 'A và B là cùng một ga 😄' : 'Không tìm được đường bằng tàu/xe điện trên bản đồ này.') + '</div>'); return; }
        const pts = []; r.forEach(g => g.stops.forEach(s => pts.push([ST[s][1], ST[s][2]])));
        $('.tm-route').innerHTML = '<polyline points="' + poly(pts) + '" fill="none" stroke="#d63031" stroke-width="17" stroke-opacity=".35" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle cx="' + ST[A][1] + '" cy="' + ST[A][2] + '" r="11" fill="#2e7d32"/><text x="' + ST[A][1] + '" y="' + (ST[A][2] + 4) + '" text-anchor="middle" class="tm-ab">A</text>' +
          '<circle cx="' + ST[B][1] + '" cy="' + ST[B][2] + '" r="11" fill="#d63031"/><text x="' + ST[B][1] + '" y="' + (ST[B][2] + 4) + '" text-anchor="middle" class="tm-ab">B</text>';
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const w = Math.max(260, (Math.max(...xs) - Math.min(...xs)) * 1.5, (Math.max(...ys) - Math.min(...ys)) * 1.5 * V.w / V.h);
        center((Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, w);
        const steps = r.map((g, i) => '<li><span class="tm-chip" style="background:' + g.L.color + '">' + esc(g.L.name) + '</span> ' + (i ? 'Đổi tuyến ở <b>' + esc(ST[g.stops[0]][0]) + '</b>, đi ' : 'Lên tàu ở <b>' + esc(ST[g.stops[0]][0]) + '</b>, đi ') + '<b>' + g.dir + '</b>, về phía ga cuối <b>' + esc(g.toward) + '</b> · ' + (g.stops.length - 1) + ' ga → xuống ở <b>' + esc(ST[g.stops[g.stops.length - 1]][0]) + '</b></li>').join('');
        const nStops = r.reduce((a, g) => a + g.stops.length - 1, 0);
        routePanel('<ol class="tm-steps">' + steps + '</ol><div class="tm-small">Tổng ' + nStops + ' ga' + (r.length > 1 ? ', đổi tuyến ' + (r.length - 1) + ' lần' : ', không cần đổi tuyến') + '. Giá vé: giá tham khảo, kiểm tra trên trang TTC (ttc.ca).</div>');
        if (A === 'nyc' && B === 'union') say('daniel', "See? Line 1 southbound, straight down to Union. No transfers. Easy.", 'Thấy chưa? Line 1 đi về phía nam, thẳng xuống Union. Không cần đổi tuyến. Dễ ợt.');
        fire({ type: 'route', from: A, to: B });
      }

      /* --- bản đồ chính thức (ảnh gốc trên toronto.ca, không lưu vào dự án) --- */
      function official() {
        const o = $('.tm-off'); let s = 1, tx = 0, ty = 0;
        o.innerHTML = '<div class="tm-offbar"><div><b>Existing and Future Rapid Transit Network</b><div class="tm-small">Nguồn: City of Toronto – City Planning · cập nhật 17/03/2026 · ảnh hiển thị trực tiếp từ toronto.ca</div></div><span class="grow"></span>' +
          '<button class="tm-b sm" data-o="in">＋</button><button class="tm-b sm" data-o="out">－</button><a class="tm-b sm" href="' + OFFICIAL + '" target="_blank" rel="noopener">Mở tab mới ↗</a><button class="tm-b sm" data-o="x">✕ Đóng</button></div>' +
          '<div class="tm-offv"><img alt="Bản đồ mạng lưới giao thông nhanh của Thành phố Toronto" draggable="false" referrerpolicy="no-referrer"><div class="tm-offmsg">Đang tải bản đồ từ toronto.ca…</div></div>';
        o.hidden = false;
        const img = o.querySelector('img'), v = o.querySelector('.tm-offv'), msg = o.querySelector('.tm-offmsg');
        const ap = () => { img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')'; };
        img.onload = () => { msg.remove(); };
        img.onerror = () => { img.style.display = 'none'; msg.innerHTML = 'Không hiện được ảnh ở đây (trang toronto.ca có thể chặn).<br><a class="tm-b pri" href="' + OFFICIAL + '" target="_blank" rel="noopener">Mở bản đồ chính thức trong tab mới ↗</a>'; try { window.open(OFFICIAL, '_blank', 'noopener'); } catch (e) { } };
        img.src = OFFICIAL;
        o.onclick = e => { const b = e.target.closest('[data-o]'); if (!b) return; const k = b.dataset.o; if (k === 'x') { o.hidden = true; o.innerHTML = ''; } if (k === 'in') { s = Math.min(8, s * 1.4); ap(); } if (k === 'out') { s = Math.max(0.3, s / 1.4); ap(); } };
        v.addEventListener('wheel', e => { e.preventDefault(); s = Math.max(0.3, Math.min(8, s * (e.deltaY > 0 ? 1 / 1.15 : 1.15))); ap(); }, { passive: false });
        let d = null, pp = new Map(), pd = 0;
        v.addEventListener('pointerdown', e => { v.setPointerCapture(e.pointerId); pp.set(e.pointerId, [e.clientX, e.clientY]); d = [e.clientX, e.clientY]; if (pp.size === 2) { const [a, b] = [...pp.values()]; pd = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
        v.addEventListener('pointermove', e => { if (!pp.has(e.pointerId)) return; pp.set(e.pointerId, [e.clientX, e.clientY]); if (pp.size === 2) { const [a, b] = [...pp.values()], nd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pd) { s = Math.max(0.3, Math.min(8, s * nd / pd)); ap(); } pd = nd; return; } if (!d) return; tx += e.clientX - d[0]; ty += e.clientY - d[1]; d = [e.clientX, e.clientY]; ap(); });
        const end = e => { pp.delete(e.pointerId); if (!pp.size) d = null; pd = 0; };
        v.addEventListener('pointerup', end); v.addEventListener('pointercancel', end);
        fire({ type: 'official' });
      }

      /* --- nút --- */
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-m]'); if (!b) return; const m = b.dataset.m;
        if (m === 'close') return api.close();
        if (m === 'zin') return zoom(1 / 1.35); if (m === 'zout') return zoom(1.35); if (m === 'zreset') return fit();
        if (m === 'legend') return el.querySelector('.tm-legend').classList.toggle('open');
        if (m === 'bx') { bubble.hidden = true; hl(''); return; }
        if (m === 'say' && bubble._say) { if (cfg.say) cfg.say(bubble._say[0], bubble._say[1]); return; }
        if (m === 'route') { rp.hidden ? routePanel() : (rp.hidden = true); return; }
        if (m === 'rx') { rp.hidden = true; $('.tm-route').innerHTML = ''; return; }
        if (m === 'setA' || m === 'setB') { if (m === 'setA') A = b.dataset.id; else B = b.dataset.id; routePanel(); if (A && B) findRoute(); return; }
        if (m === 'swap') { const t = A; A = B; B = t; routePanel(); return; }
        if (m === 'find') return findRoute();
        if (m === 'official') return official();
        if (m === 'go' && cfg.onGo) return cfg.onGo(b.dataset.ch);
      });
      el.addEventListener('change', e => {
        const r = e.target.dataset.r; if (r) { if (r === 'A') A = e.target.value || null; else B = e.target.value || null; return; }
        const ly = e.target.dataset.layer; if (ly) el.querySelector('.tm-' + (ly === 'zones' ? 'zones' : ly === 'build' ? 'build' : 'go')).style.display = e.target.checked ? '' : 'none';
        if (ly === 'zones') el.querySelector('.tm-znames').style.display = e.target.checked ? '' : 'none';
      });
      const onRs = () => { if (!closed) fit(); }; window.addEventListener('resize', onRs);
      requestAnimationFrame(() => { fit(); if (task && task.map && task.map.station) { /* gợi ý: phóng to vùng North York */ center(560, 200, 520); } });
      const tk0 = task; if (tk0) setTimeout(() => { if (!closed && task === tk0) say('daniel', task.map && task.map.official ? 'Last one: open the official TTC map from the City of Toronto. The button is at the top.' : task.map && task.map.route ? 'Now find the way from North York Centre to Union. Use the “A to B” button.' : task.map && task.map.station ? 'Now find the station closest to home. It’s on the yellow line.' : 'Tap on North York. That’s where we live!',
        task.map && task.map.official ? 'Cuối cùng: mở bản đồ TTC chính thức của Thành phố Toronto. Nút ở phía trên.' : task.map && task.map.route ? 'Giờ tìm đường từ North York Centre đến Union. Dùng nút “Từ A đến B”.' : task.map && task.map.station ? 'Giờ tìm ga gần nhà nhất. Nó nằm trên tuyến màu vàng.' : 'Bấm vào khu North York. Đó là nơi tụi mình sống!'); }, 300);
      const api = {
        el,
        setTask(t, nextText) {
          const had = !!task; task = t || null;
          if (had && cfg.sfx) cfg.sfx('correct');
          paintTask(task ? null : nextText ? 'Xong phần bản đồ! Đóng bản đồ (✕) rồi: ' + nextText : 'Xong!');
          const t0 = task; if (t0) setTimeout(() => { if (closed || task !== t0) return; const m = t0.map || {}; say('daniel', m.official ? 'Nice! Last one: open the official TTC map. The button is at the top.' : m.route ? 'Nice! Now use “A to B” to find the way from North York Centre to Union.' : m.station ? 'Nice! Now tap the station closest to home. It’s on the yellow line.' : 'Nice!', m.official ? 'Giỏi! Cuối cùng: mở bản đồ TTC chính thức. Nút ở phía trên.' : m.route ? 'Giỏi! Giờ dùng “Từ A đến B” để tìm đường từ North York Centre đến Union.' : m.station ? 'Giỏi! Giờ bấm vào ga gần nhà nhất. Nó nằm trên tuyến màu vàng.' : 'Giỏi!'); }, 1600);
        },
        close() { if (closed) return; closed = true; window.removeEventListener('resize', onRs); el.remove(); if (cfg.onClose) cfg.onClose(); }
      };
      return api;
    }
  };
})();
