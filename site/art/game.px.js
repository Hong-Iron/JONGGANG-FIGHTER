// 종강 파이터 그림 원본 (pxl). 브라우저에서 OPT(꾸미기 선택)를 넣어 다시 그린다.
// 규칙: 둥근 모양 없음(원·타원·둥근 붓 금지), 면으로 나눈 명암, 빛은 왼쪽 위.
// 큰 스프라이트는 무대 좌표(180×236)에 그대로 그린다. 외곽선이 1px 늘리므로 게임은 (-1,-1)에 찍는다.
const O = typeof OPT !== "undefined" ? OPT : {}
const PO = O.prof || {}, ST = O.stu || {}

const SKIN = {
  pale: ["#a8796a", "#d8b3a0", "#f2d9cb", "#fff0e6"],        // 햇빛 못 본 지박령
  dry: ["#9a6a4a", "#c9946a", "#e4b98e", "#f6d8b4"],         // 카페인 중독 푸석함
  flush: ["#9a4a47", "#d27c6a", "#f2aa92", "#ffd2c0"],       // 숙취 홍조
  tan: ["#5e3524", "#8a5236", "#b4744c", "#d39a6c"],         // 야외 실습으로 탄 피부
}
const JACKET = {                                             // 과잠 몸통 [어두움, 기본, 밝음]
  navy: ["#1c2546", "#2c3a6b", "#41569a"], black: ["#141217", "#26232c", "#3d3946"],
  wine: ["#3e1424", "#6b2238", "#933352"], green: ["#13301f", "#21523a", "#347a57"], gray: ["#3a3c44", "#5c5f6b", "#82869a"],
}
const SLEEVE = { cream: ["#cdbf9b", "#efe4c6"], white: ["#c9c7cf", "#f4f3f7"], gray: ["#7d808c", "#a9acb8"], black: ["#1d1b22", "#36333d"] }
const HAIR = {                                               // 학생 머리 [기본, 빛, 번들거림]
  greasy: ["#2a1f2e", "#4d3d57", "#7d6c92"], buzz: ["#3a3036", "#5a4a52", "#7a6a72"], pudding: ["#b08a3e", "#e0c070", "#fff0a8"],
}
const OUTFIT = {                                             // 교수님 옷 [가장 어두움, 어두움, 기본, 밝음]
  tweed: ["#4a3024", "#69492f", "#8b6548", "#ad8460"],
  hiking: ["#5a1414", "#8e2a22", "#c0392b", "#e2604c"],
  turtle: ["#0f0d12", "#1b1820", "#2a2630", "#423c4a"],
  suit: ["#15161c", "#262833", "#3a3d4c", "#555a6e"],
  vest: ["#5b4a2e", "#8a7448", "#b49c6a", "#d6c391"],
  labcoat: ["#8c90a0", "#c0c4d2", "#eceef4", "#ffffff"],
  shortsleeve: ["#4f6f9e", "#7f9fca", "#a9c8ea", "#cfe0f5"],
  cardigan: ["#3a4220", "#56602e", "#737f3e", "#94a052"],
}
const PHCOL = { gray: ["#a29dae", "#dcd8e0"], salt: ["#5e5a66", "#a9a5b2"], black: ["#141018", "#3a3242"], brown: ["#4a3020", "#7a5236"] }
const PSKIN = { base: ["#9a5547", "#d58b66", "#f4bd92", "#ffe0c2"], pale: ["#9a7a72", "#d6b2a2", "#f4dccd", "#fff1e8"], red: ["#9a4040", "#d4705a", "#f2a084", "#ffcdb8"], tan: ["#5e3524", "#8f5638", "#bb7a50", "#dba070"] }
const sk = SKIN[ST.skin] || SKIN.dry, jk = JACKET[ST.jacket] || JACKET.navy, sl = SLEEVE[ST.sleeve] || SLEEVE.cream
const hr = HAIR[ST.hair] || HAIR.greasy, of = OUTFIT[PO.outfit] || OUTFIT.tweed
const ph = PHCOL[PO.hcolor || (PO.hair === "pomade" ? "black" : "gray")] || PHCOL.gray, psk = PSKIN[PO.skin] || PSKIN.base

pal({
  K: "#1d1622", k: "#2e2436", X: "#ffffff", F: "#fffbe6",
  a: "#cbc4b2", A: "#a89e8a", z: "#7d7466",                    // 벽
  g: "#22402f", G: "#2e5442", V: "#14271d", c: "#d8e6dc", C: "#7f9c8a",   // 칠판, 분필
  v: "#573620", w: "#7b5034", W: "#a46d45",                    // 나무
  d: psk[0], s: psk[1], S: psk[2], L: psk[3],                  // 교수님 피부
  E: ph[0], e: ph[1],                                          // 교수님 머리
  P: of[0], T: of[1], t: of[2], u: of[3],                      // 교수님 옷
  B: "#8eaed6", b: "#c5dcf2",                                  // 셔츠, 안경알
  r: "#85223a", R: "#c8353b", Q: "#f39aa0", 7: "#5a1020",      // 빨강
  m: "#26262e", M: "#45454f",                                  // 노트북, 서버
  i: jk[0], j: jk[1], J: jk[2],                                // 과잠 몸통
  Y: sl[0], y: sl[1], o: "#e8b84a",                            // 과잠 소매, 자수
  H: hr[0], h: hr[1], 1: hr[2],                                // 학생 머리
  9: sk[0], 0: sk[1], I: sk[2], f: sk[3],                      // 학생 피부 (어두움 → 밝음)
  q: "#3a3c48", x: "#e6e6ec", N: "#46d17f", n: "#1d6b3f", 6: "#b8ffd6",   // 키보드, 공대 초록
  p: "#f4efe1", l: "#d3dbe9", Z: "#4f9be0", O: "#e08a2c", 8: "#ff8a3d",   // 노트, 게이지
  U: "#ff3434", D: "#6b4a7a",                                  // 레이저, 다크서클
  2: "#3b4150", 3: "#5d6578", 4: "#22252e", 5: "#9aa2b5",      // 철판
  "!": "#d2d6e0", "@": "#8e94a6", "$": "#555b6d",              // 금속 (무기, 헤드폰, 서버 랙)
  "=": "#2f4a9a", "+": "#1b2a5e",                              // 책 표지, 만년필, 첼로 케이스
  "<": "#dcc479", ">": "#a68d3c", "?": "#6b4428",              // 대나무, 가죽 손잡이
  "^": "#ffe48a", "~": "#7fe6ff",                              // 달군 인두기 끝, 홀로그램
})
ramps("KdsSL", "KPTtu", "KEe", "KijJ", "KYy", "VgG", "KzAa", "KvwW", "KBb", "KHh1", "Kqx", "7rRQ", "4235", "K90If", "K$@!", "K+=", "?><")

// ================================================================ 강의실
sprite("room", { w: 180, h: 236 }, (c) => {
  c.rect(0, 30, 180, 206, "a")
  c.rect(0, 30, 180, 8, "A"); c.rect(18, 32, 54, 3, "F"); c.rect(108, 32, 54, 3, "F")
  c.rect(12, 38, 66, 6, "a"); c.dither(12, 38, 66, 6, "a", "F", 0.25); c.dither(102, 38, 66, 6, "a", "F", 0.25)   // 형광등 빛 띠
  c.rect(6, 42, 168, 88, "w"); c.hline(6, 42, 168, "W"); c.hline(6, 129, 168, "v")
  c.rect(9, 45, 162, 81, "G"); c.dither(9, 45, 162, 81, "G", "g", 0.25)
  c.dither(110, 98, 50, 18, "G", "C", 0.12)
  c.text(13, 50, "T(N)=", "c"); c.text(13, 58, "2T(N/2)", "c"); c.text(13, 66, "+N", "c")
  c.text(13, 80, "O(N LOG N)?", "c"); c.line(13, 87, 56, 87, "c")
  for (const [x, y] of [[148, 52], [140, 62], [156, 62]]) c.box(x - 3, y - 3, 7, 7, "c")
  c.line(146, 55, 141, 59, "c"); c.line(150, 55, 155, 59, "c")
  c.rect(6, 130, 168, 3, "W"); c.px(30, 129, "c"); c.px(31, 129, "c"); c.px(122, 129, "o")
  c.rect(0, 160, 180, 76, "A"); c.hline(0, 160, 180, "W")
})

// ================================================================ 교수님 (정면, 교탁 뒤 상반신)
// st: "idle" | "p2"(학회 마감 D-1 모드) | "ko". 꾸미기 선택은 PO (parts.js의 PROF_GROUPS)
const PF = {
  college: PO.college || "eng", body: PO.body || "normal", face: PO.face || "smirk", beard: PO.beard || "none", hair: PO.hair || "bald",
  glasses: PO.glasses || "half", hat: PO.hat || "none", outfit: PO.outfit || "tweed", neck: PO.neck || "auto", pocket: PO.pocket || "pens",
  hand: PO.hand || "laser", desk: PO.desk || "thinkpad", gender: PO.gender || "m", age: PO.age || "middle", eyes: PO.eyes || "normal",
}
const AUTO_NECK = { tweed: "redtie", suit: "bluetie", vest: "bluetie", labcoat: "redtie", hiking: "none", turtle: "none", shortsleeve: "none", cardigan: "none" }
function drawProf(c, st) {
  const p2 = st === "p2", ko = st === "ko", o = PF.outfit
  const W0 = PF.body === "thin" ? -8 : PF.body === "big" ? 7 : 0          // 어깨 폭
  const HY0 = PF.body === "thin" ? 3 : 0                                  // 거북목: 머리가 조금 내려온다
  // ---- 몸통
  c.poly([48 - W0, 108, 68 - W0 / 2, 99, 82, 98, 90, 108, 98, 98, 112 + W0 / 2, 99, 132 + W0, 108, 134 + W0, 152, 46 - W0, 152], "t")
  if (PF.body === "big") c.poly([60, 128, 120, 128, 128, 152, 52, 152], "t")
  const open = o === "tweed" || o === "suit" || o === "labcoat" || o === "cardigan"
  if (open || o === "vest" || o === "shortsleeve") c.poly([82, 98, 98, 98, 90, 132], o === "labcoat" ? "B" : "b")   // 셔츠
  if (open) {
    c.poly([80, 99, 86, 108, 85, 126, 77, 110], "u"); c.poly([100, 99, 94, 108, 95, 126, 103, 110], "T")             // 옷깃
    if (o === "suit") { c.px(78, 108, "t"); c.px(102, 108, "t") }
    if (o === "cardigan") for (const y of [114, 122, 130, 138]) c.rect(92, y, 2, 2, "P")                           // 단추
    if (o === "labcoat") { c.rect(56, 130, 14, 10, "T"); c.hline(56, 130, 14, "P"); c.rect(110, 130, 14, 10, "T") } // 아래 주머니
  } else if (o === "hiking") {
    c.poly([80, 94, 100, 94, 102, 104, 90, 108, 78, 104], "u"); c.poly([80, 94, 90, 108, 78, 104], "T")
    c.vline(90, 108, 44, "e"); c.vline(91, 108, 44, "E"); c.rect(100, 116, 9, 4, "e"); c.px(101, 117, "N")
  } else if (o === "turtle") {
    c.poly([80, 90, 100, 90, 101, 104, 79, 104], "t"); for (const y of [93, 96, 99, 102]) c.hline(80, y, 21, "T")
  } else if (o === "vest") {
    c.poly([76, 99, 90, 124, 104, 99, 100, 99, 90, 116, 80, 99], "T")                                               // V넥 테두리
    for (let k = 0; k < 3; k++) { const y = 124 + k * 9; c.poly([70, y + 4, 74, y, 78, y + 4, 74, y + 8], "u"); c.poly([102, y + 4, 106, y, 110, y + 4, 106, y + 8], "u") }   // 다이아몬드 무늬
  } else if (o === "shortsleeve") {
    c.poly([80, 98, 88, 98, 86, 104, 78, 102], "u"); c.poly([100, 98, 92, 98, 94, 104, 102, 102], "u"); c.vline(90, 106, 46, "T")
  }
  c.shade([104, 99, 112 + W0 / 2, 99, 132 + W0, 108, 134 + W0, 152, 108, 152, 100, 128])
  c.shade([46 - W0, 142, 134 + W0, 142, 134 + W0, 152, 46 - W0, 152])
  if (o !== "turtle") { c.poly([83, 92, 97, 92, 98, 102, 82, 102], "S"); c.shade([90, 92, 97, 92, 98, 102, 90, 102]) }
  // ---- 목: 넥타이·나비넥타이·스카프·네임택
  const neck = PF.neck === "auto" ? AUTO_NECK[o] || "none" : PF.neck
  const collarOk = open || o === "vest" || o === "shortsleeve"
  if ((neck === "redtie" || neck === "bluetie") && collarOk) { const col = neck === "redtie" ? "R" : "="; c.poly([88, 104, 92, 104, 93, 127, 90, 131, 87, 127], col); c.rect(88, 101, 4, 3, neck === "redtie" ? "r" : "+") }
  if (neck === "bowtie" && collarOk) { c.poly([82, 100, 89, 103, 82, 107], "R"); c.poly([98, 100, 91, 103, 98, 107], "R"); c.rect(88, 102, 4, 3, "r") }
  if (neck === "scarf") { c.poly([78, 95, 102, 95, 104, 103, 76, 103], "R"); c.shade([92, 95, 102, 95, 104, 103, 94, 103]); c.poly([92, 101, 99, 101, 101, 130, 94, 132], "R"); c.shade([97, 101, 99, 101, 101, 130, 97, 131]); for (const y of [124, 127]) c.hline(94, y, 7, "o") }
  if (neck === "nametag") { c.line(84, 100, 80, 120, "Z"); c.line(96, 100, 100, 120, "Z"); c.rect(78, 120, 24, 13, "X"); c.rect(78, 120, 24, 3, "Z"); c.text(80, 125, "PROF", "K") }
  // ---- 가슴주머니
  if (o !== "hiking" && o !== "turtle" && neck !== "nametag") {
    c.hline(101, 118, 11, "T")
    if (PF.pocket === "pens") { c.vline(104, 113, 5, "R"); c.vline(106, 112, 6, "B"); c.vline(108, 113, 5, "K") }
    if (PF.pocket === "card") { c.rect(103, 113, 7, 5, "X"); c.hline(104, 115, 4, "@") }
  }
  // ---- 머리
  const HY = (ko ? 4 : 0) + HY0, HX = ko ? 3 : 0
  const hp = (pts) => pts.map((v, i) => v + (i % 2 ? HY : HX))
  const L = (x0, y0, x1, y1, col) => c.line(x0 + HX, y0 + HY, x1 + HX, y1 + HY, col)
  const R = (x, y, w, h, col) => c.rect(x + HX, y + HY, w, h, col)
  c.poly(hp([74, 46, 106, 46, 114, 56, 116, 72, 110, 87, 99, 96, 81, 96, 70, 87, 64, 72, 66, 56]), "S")
  c.shade(hp([96, 46, 106, 46, 114, 56, 116, 72, 110, 87, 99, 96, 92, 96, 97, 84, 99, 70]))
  c.shade(hp([81, 96, 99, 96, 104, 92, 76, 92]))
  c.poly(hp([60, 69, 65, 66, 66, 80, 62, 82, 59, 76]), "S"); c.poly(hp([120, 69, 115, 66, 114, 80, 118, 82, 121, 76]), "s")
  const up = p2 ? -5 : 0                                                   // 2페이즈: 정전기로 곤두선 머리
  const hair = PF.hair
  if (hair === "bald" || hair === "shaved") {
    c.poly(hp([76, 46, 94, 46, 90, 51, 79, 51]), "L"); c.poly(hp([79, 47, 86, 47, 84, 49, 80, 49]), "X")
    if (hair === "shaved") { c.px(92 + HX, 48 + HY, "X"); c.poly(hp([100, 50, 106, 50, 104, 54]), "L") }
    else {
      c.poly(hp([60, 56, 64, 49 + up, 69, 53, 72, 50 + up, 72, 62, 68, 64, 66, 74, 62, 72, 59, 64]), "e")
      c.poly(hp([120, 56, 116, 49 + up, 111, 53, 108, 50 + up, 108, 62, 112, 64, 114, 74, 118, 72, 121, 64]), "E")
      c.poly(hp([60, 62, 66, 60, 66, 74, 62, 72]), "E"); L(61, 57, 64, 51, "X")
    }
  } else if (hair === "pomade") {
    c.poly(hp([64, 64, 66, 52, 74, 44, 106, 44, 114, 52, 116, 64, 112, 58, 104, 52, 84, 52, 72, 56, 68, 64]), "E")
    c.poly(hp([74, 44, 90, 44, 84, 52, 72, 56]), "e"); L(78, 46, 86, 46, "X"); L(96, 47, 104, 50, "e"); L(84, 52, 88, 45, "K")
  } else if (hair === "white") {
    c.poly(hp([60, 70, 60, 54, 66, 44 + up * 1.2, 72, 48, 78, 38 + up, 86, 45, 94, 37 + up, 100, 45, 108, 40 + up, 112, 48, 120, 46 + up, 120, 70, 114, 58, 104, 52, 76, 52, 66, 58]), "e")
    c.shade(hp([100, 45, 108, 40 + up, 112, 48, 120, 46 + up, 120, 70, 114, 58, 104, 52]))
  } else if (hair === "side") {                                          // 단정한 가르마: 이마 위를 덮는다
    c.poly(hp([63, 66, 64, 52, 72, 43, 108, 43, 116, 52, 117, 66, 112, 56, 96, 51, 80, 54, 70, 58]), "E")
    c.poly(hp([72, 43, 86, 43, 80, 54, 70, 58, 64, 60, 66, 50]), "e"); L(86, 43, 80, 54, "K"); L(100, 46, 108, 50, "e")
  } else if (hair === "back") {                                          // 올백: 뒤로 넘긴 결
    c.poly(hp([64, 62, 66, 50, 74, 40, 106, 40, 114, 50, 116, 62, 110, 52, 70, 52]), "E")
    for (const x of [76, 84, 92, 100]) L(x, 41, x + 2, 51, "e")
    L(74, 42, 104, 42, "e")
  } else if (hair === "perm") {                                          // 곱슬 파마: 작은 네모 덩어리
    for (let y = 36; y < 56; y += 4) for (let x = 62; x < 120; x += 5) if (!(y > 46 && x > 68 && x < 112)) { R(x + ((y / 4) % 2) * 2, y + up * (y < 44 ? 1 : 0), 5, 4, (x + y) % 3 ? "E" : "e") }
    for (let y = 56; y < 76; y += 4) { R(58, y, 6, 4, "E"); R(116, y, 6, 4, "E") }
  } else if (hair === "long") {                                          // 장발: 어깨까지, 뒤로 묶음
    c.poly(hp([60, 98, 58, 56, 66, 42, 114, 42, 122, 56, 120, 98, 114, 98, 114, 60, 104, 50, 76, 50, 66, 60, 66, 98]), "E")
    c.poly(hp([66, 42, 90, 42, 76, 50, 66, 60, 60, 60]), "e"); L(90, 42, 90, 50, "K")
  }
  else if (hair === "bob") {                                             // 단발: 턱선에서 일자로 자른다
    c.poly(hp([58, 92, 58, 56, 66, 42, 114, 42, 122, 56, 122, 92, 114, 92, 114, 62, 66, 62, 66, 92]), "E")
    c.poly(hp([58, 92, 58, 56, 66, 42, 84, 42, 70, 52, 66, 62, 66, 92]), "e")
    c.poly(hp([66, 62, 68, 50, 78, 45, 104, 45, 112, 50, 114, 62, 106, 58, 92, 60, 78, 58]), "E"); L(78, 47, 88, 47, "e")
  } else if (hair === "short") {                                         // 숏컷: 옆으로 쓸어 넘긴 앞머리
    c.poly(hp([62, 74, 62, 52, 70, 42, 110, 42, 118, 52, 118, 74, 114, 62, 108, 54, 88, 52, 72, 56, 66, 62]), "E")
    c.poly(hp([70, 42, 96, 42, 82, 56, 68, 62, 64, 58]), "e"); L(96, 42, 82, 56, "K")
  } else if (hair === "updo") {                                          // 올림머리: 정수리에 묶은 덩어리와 비녀
    c.poly(hp([64, 62, 66, 50, 74, 44, 106, 44, 114, 50, 116, 62, 110, 54, 70, 54]), "E"); c.poly(hp([66, 50, 74, 44, 88, 44, 72, 54, 64, 62]), "e")
    c.poly(hp([80, 45, 82, 33, 98, 33, 100, 45]), "E"); c.poly(hp([82, 33, 90, 33, 86, 45, 80, 45]), "e"); L(74, 38, 106, 41, "@"); L(65, 62, 64, 72, "E"); L(115, 62, 116, 72, "E")
  } else if (hair === "straight") {                                      // 긴 생머리: 가운데 가르마, 어깨 아래까지
    c.poly(hp([58, 112, 58, 56, 66, 42, 114, 42, 122, 56, 122, 112, 114, 112, 114, 62, 104, 50, 92, 46, 88, 46, 76, 50, 66, 62, 66, 112]), "E")
    c.poly(hp([58, 112, 58, 56, 66, 42, 88, 42, 88, 46, 76, 50, 66, 62, 66, 112]), "e"); L(90, 42, 90, 47, "K"); L(62, 70, 62, 108, "E"); L(118, 70, 118, 108, "e")
  } else if (hair === "ponytail") {                                      // 포니테일: 옆으로 보이는 꼬리
    c.poly(hp([116, 54, 124, 50, 129, 60, 127, 82, 121, 92, 119, 72]), "E"); c.poly(hp([124, 50, 129, 60, 127, 82, 125, 70]), "e")
    c.poly(hp([64, 62, 66, 50, 74, 43, 106, 43, 114, 50, 116, 62, 110, 54, 70, 54]), "E"); c.poly(hp([66, 50, 74, 43, 90, 43, 72, 54, 64, 62]), "e"); R(114, 51, 4, 4, "R")
  }
  if (p2 && hair !== "white" && hair !== "bald" && hair !== "shaved") { L(70, 44, 64, 34, "e"); L(90, 42, 92, 30, "e"); L(110, 44, 118, 34, "e") }
  // ---- 모자
  if (PF.hat === "beret") { c.poly(hp([66, 50, 72, 38, 104, 34, 118, 42, 116, 50]), "r"); c.poly(hp([72, 38, 92, 35, 86, 44, 70, 46]), "R"); R(96, 31, 3, 4, "r") }
  if (PF.hat === "cap") { c.poly(hp([66, 52, 70, 38, 110, 38, 114, 52]), "="); c.poly(hp([60, 52, 120, 52, 116, 57, 64, 57]), "+"); R(87, 40, 6, 4, "o") }
  if (PF.hat === "grad") { c.poly(hp([68, 50, 112, 50, 110, 42, 70, 42]), "K"); c.poly(hp([56, 40, 90, 32, 124, 40, 90, 48]), "m"); L(90, 40, 118, 44, "o"); L(118, 44, 118, 54, "o"); R(117, 54, 3, 4, "o") }
  const coversBrow = ["side", "bob", "short"].includes(hair)
  if (PF.age !== "young" && PF.hat === "none" && !coversBrow) { L(83, 55, 96, 55, "s"); L(85, 58, 94, 58, "s"); if (PF.age === "senior") L(80, 52, 99, 52, "s") }
  // ---- 눈썹(표정)과 눈매
  const face = p2 ? "angry" : PF.face, fem = PF.gender === "f"
  const raise = face === "smirk" ? 2 : 0                                 // 한쪽 눈썹을 치켜뜨면 그쪽 눈도 커진다
  function eye(side, y0) {                                               // side -1: 화면 왼쪽 눈, +1: 오른쪽 눈. i는 코 쪽(0)에서 바깥쪽(6)으로
    const X = (i) => (side < 0 ? 82 - i : 97 + i), kind = PF.eyes
    if (kind === "narrow") { for (let i = 0; i < 7; i++) R(X(i), y0 + (i === 0 || i === 6 ? 1 : 0), 1, 1, "K"); if (fem) R(X(7), y0, 1, 1, "K"); return }
    const big = kind === "big", tilt = kind === "sharp" ? -1 : kind === "droopy" ? 1 : 0
    let top = big ? y0 - 1 : y0, h = big ? 4 : 2
    if (face === "tired") { top += 1; h = Math.max(1, h - 1) }
    const off = (i) => tilt * Math.floor(i / 3)
    for (let i = 0; i < 7; i++) {
      const hh = kind === "sharp" && i >= 4 ? Math.max(1, h - 1) : h, t = top + off(i) + (kind === "sharp" && i >= 4 ? 1 : 0) - (kind === "sharp" && i >= 4 ? 1 : 0)
      R(X(i), t, 1, hh, "X"); R(X(i), t - 1 + (face === "angry" && i < 2 ? 1 : 0), 1, 1, "K")
      if (big) R(X(i), t + hh, 1, 1, "s")
    }
    R(X(-1), top + off(0) - 1, 1, 1, "K")
    if (kind === "sharp") { R(X(7), top + off(6) - 2, 1, 1, "K"); R(X(7), top + off(6) - 1, 1, 1, "K") }
    if (kind === "droopy") { R(X(7), top + off(6), 1, 1, "K"); R(X(8), top + off(6) + 1, 1, 1, "K") }
    const pw = big ? 3 : 2, ph = big ? 3 : Math.min(2, h)
    for (let k = 0; k < pw; k++) { const i = 2 + k; R(X(i), top + off(i) + h - ph, 1, ph, "K") }
    if (big) R(X(2), top + off(2) + h - ph, 1, 1, "X")
    if (face === "angry") R(X(3), top + off(3) + h - 1, 1, 1, "U")
    if (fem) { R(X(7), top + off(6) - 2, 1, 1, "K"); R(X(6), top + off(6) - 2, 1, 1, "K") }       // 속눈썹
    if (face === "tired") L(X(1) < X(5) ? X(1) : X(5), top + off(3) + h + 2, X(1) < X(5) ? X(5) : X(1), top + off(3) + h + 2, "D")
    if (PF.age === "senior") { R(X(8), top + off(6) + 1, 1, 1, "s"); R(X(9), top + off(6) + 2, 1, 1, "s"); R(X(8), top + off(6) + 3, 1, 1, "s") }   // 눈가 주름
  }
  const drawEyes = () => {
    if (ko) { for (const [x, y] of [[78, 70], [100, 70]]) { L(x - 3, y - 2, x + 3, y + 2, "K"); L(x - 3, y + 2, x + 3, y - 2, "K") }; return }
    if (face === "kind") { L(75, 71, 79, 68, "K"); L(79, 68, 83, 71, "K"); L(96, 71, 100, 68, "K"); L(100, 68, 104, 71, "K"); if (fem) { R(74, 70, 1, 1, "K"); R(105, 70, 1, 1, "K") }; return }   // 웃는 눈 (^ ^)
    eye(-1, 70); eye(1, 70 - raise)
  }
  if (!ko && fem) {                                                      // 여자 교수님: 가는 눈썹
    const BR = { kind: [[70, 63, 84, 61], [95, 61, 109, 63]], stone: [[70, 65, 85, 65], [95, 65, 110, 65]], tired: [[70, 66, 85, 63], [95, 63, 110, 66]],
      angry: [[70, 61, 85, 68], [96, 69, 110, 61]], smirk: [[70, 64, 85, 67], [95, 66, 102, 60], [102, 60, 110, 62]] }[face] || []
    for (const [x0, y0, x1, y1] of BR) { L(x0, y0, x1, y1, "E"); L(x0 + 1, y0 + 1, x1 - 2, y1 + 1, "E") }
  } else if (!ko) {
    if (face === "kind") { c.poly(hp([70, 63, 84, 61, 85, 63, 71, 65]), "E"); c.poly(hp([95, 61, 109, 63, 109, 65, 95, 63]), "E") }
    else if (face === "stone") { c.poly(hp([70, 65, 85, 65, 85, 67, 70, 67]), "E"); c.poly(hp([95, 65, 110, 65, 110, 67, 95, 67]), "E") }
    else if (face === "tired") { c.poly(hp([70, 66, 85, 63, 85, 65, 70, 68]), "E"); c.poly(hp([95, 63, 110, 66, 110, 68, 95, 65]), "E") }
    else {
      const bd = face === "angry" ? 2 : 0
      c.poly(hp([70, 63 - bd, 85, 67 + bd, 85, 69 + bd, 71, 66 - bd]), "E")
      c.poly(hp(face === "angry" ? [95, 68, 103, 66, 110, 61, 110, 63, 103, 68, 96, 70] : [95, 66, 102, 59, 110, 62, 110, 64, 102, 61, 96, 68]), "E")
      c.px(84 + HX, 70 + HY, "s"); c.px(85 + HX, 69 + HY, "s")
    }
  }
  drawEyes()
  // ---- 안경
  const lens = p2 ? "N" : "b", gl = PF.glasses
  if (gl === "half" || gl === "chain") {
    const gy = ko ? 4 : 0, gx = ko ? 5 : 0
    c.rect(71 + gx + HX, 78 + gy + HY, 15, 5, lens); c.rect(94 + gx + HX, 78 + gy + HY + (ko ? 2 : 0), 15, 5, lens)
    L(70 + gx, 77 + gy, 86 + gx, 77 + gy, "K"); L(93 + gx, 77 + gy + (ko ? 2 : 0), 109 + gx, 77 + gy + (ko ? 2 : 0), "K"); L(86 + gx, 78 + gy, 93 + gx, 78 + gy + (ko ? 2 : 0), "K")
    L(70 + gx, 77 + gy, 66 + gx, 72 + gy, "K"); L(109 + gx, 77 + gy, 114 + gx, 72 + gy, "K")
    L(73 + gx, 79 + gy, 75 + gx, 81 + gy, "X"); L(96 + gx, 79 + gy, 98 + gx, 81 + gy, "X")
    if (gl === "chain") { L(66, 73, 70, 100, "o"); L(114, 73, 110, 100, "o"); L(70, 100, 90, 104, "o"); L(110, 100, 90, 104, "o") }
  } else if (gl === "forehead") {
    R(72, 50, 15, 6, "b"); R(93, 50, 15, 6, "b"); c.box(71 + HX, 49 + HY, 17, 8, "K"); c.box(92 + HX, 49 + HY, 17, 8, "K"); L(88, 52, 92, 52, "K"); L(74, 51, 76, 53, "X")
  } else if (gl !== "none" && !ko) {
    const tint = gl === "tint", metal = gl === "metal"
    R(70, 66, 16, 8, tint ? (p2 ? "N" : "v") : lens); R(94, 65, 16, 8, tint ? (p2 ? "N" : "v") : lens)
    if (!tint) drawEyes()
    c.box(69 + HX, 65 + HY, 18, 10, metal ? "e" : "K"); c.box(93 + HX, 64 + HY, 18, 10, metal ? "e" : "K"); L(87, 68, 93, 68, metal ? "e" : "K")
    if (gl === "horn") { L(70, 66, 85, 66, "K"); L(94, 65, 109, 65, "K") }
    L(72, 67, 75, 70, "X"); L(96, 66, 99, 69, "X")
    L(69, 66, 65, 69, metal ? "e" : "K"); L(111, 65, 115, 68, metal ? "e" : "K")
  }
  // ---- 코, 입, 수염
  c.poly(hp([90, 71, 92, 71, 94, 84, 90, 86, 87, 84]), "s"); c.vline(90 + HX, 72 + HY, 11, "L"); c.poly(hp([87, 84, 94, 84, 91, 87]), "d")
  if (PF.age !== "young") { L(82, 81, 80, 88, "s"); L(99, 81, 101, 88, "s") }
  if (PF.age === "senior") { L(76, 90, 79, 95, "s"); L(104, 90, 101, 95, "s"); c.rect(106 + HX, 58 + HY, 2, 2, "s") }
  const mc = fem ? "r" : "d"
  if (ko) { R(85, 88, 8, 4, "K"); L(86, 91, 91, 91, "7") }
  else if (face === "angry") { L(83, 90, 94, 90, "K"); L(84, 91, 93, 91, "X"); L(83, 92, 94, 92, "K") }
  else if (face === "kind") { L(83, 88, 85, 90, mc); L(85, 90, 93, 90, mc); L(93, 90, 95, 88, mc) }
  else if (face === "stone") L(84, 90, 94, 90, mc)
  else if (face === "tired") { R(86, 89, 6, 2, mc); L(86, 91, 91, 91, "s") }
  else { L(84, 90, 92, 90, mc); c.px(93 + HX, 89 + HY, mc); c.px(94 + HX, 88 + HY, mc); c.px(95 + HX, 88 + HY, mc); L(86, 91, 91, 91, "s") }
  if (fem && !ko && face !== "angry") c.px(89 + HX, 91 + HY, "Q")
  const bc = "E"
  if (PF.beard === "mustache") c.poly(hp([82, 86, 98, 86, 99, 89, 91, 88, 89, 88, 81, 89]), bc)
  if (PF.beard === "goatee") { c.poly(hp([86, 92, 95, 92, 94, 99, 90, 101, 87, 99]), bc); c.poly(hp([84, 86, 96, 86, 96, 88, 84, 88]), bc) }
  if (PF.beard === "full") { c.poly(hp([66, 74, 70, 86, 80, 96, 100, 96, 110, 86, 114, 74, 112, 88, 100, 100, 80, 100, 68, 88]), bc); c.poly(hp([82, 86, 98, 86, 99, 89, 81, 89]), bc); L(82, 92, 98, 92, "e") }
  if (PF.beard === "stubble") for (let k = 0; k < 30; k++) { const x = 72 + (k * 13) % 38, y = 84 + (k * 7) % 12; if (!(y < 92 && x > 82 && x < 98)) c.px(x + HX, y + HY, "E") }
  if (p2) { c.rect(112 + HX, 60 + HY, 2, 3, "b"); c.px(112 + HX, 63 + HY, "B") }
  // ---- 오른팔(화면 왼쪽)과 손에 든 것
  const armCol = o === "vest" ? "b" : "t"
  const ax = -W0
  c.poly([49 + ax, 108, 61 + ax, 113, 48 + ax, 139, 37 + ax, 135], armCol)
  if (o === "shortsleeve") { c.poly([49 + ax, 108, 61 + ax, 113, 56 + ax, 124, 44 + ax, 119], "t"); c.poly([44 + ax, 119, 56 + ax, 124, 48 + ax, 139, 37 + ax, 135], "S") }
  c.poly([37 + ax, 135, 48 + ax, 139, 55, 126, 46, 120], o === "shortsleeve" ? "S" : armCol); c.shade([37 + ax, 135, 48 + ax, 139, 55, 126, 50, 124])
  if (o !== "shortsleeve") c.poly([45, 119, 54, 125, 56, 122, 47, 116], o === "tweed" || o === "suit" || o === "labcoat" ? "b" : armCol === "b" ? "B" : "T")
  c.poly([43, 112, 51, 111, 56, 117, 54, 123, 47, 124, 42, 119], "S"); c.shade([51, 111, 56, 117, 54, 123, 50, 123])
  const hi = PF.hand
  if (hi === "laser") { c.line(45, 123, 35, 139, "E"); c.line(46, 123, 36, 139, "E"); c.px(34, 140, "U") }
  if (hi === "stick") { c.line(45, 123, 22, 158, "!"); c.line(46, 123, 23, 158, "@"); for (const k of [0.3, 0.6]) c.rect(Math.round(45 - 23 * k), Math.round(123 + 35 * k), 2, 2, "$"); c.rect(21, 157, 3, 3, "U") }
  if (hi === "chalk") { c.poly([34, 128, 44, 118, 48, 122, 38, 132], "X"); c.poly([34, 128, 38, 124, 40, 126, 36, 130], "c"); c.dither(28, 132, 8, 6, "c", "c", 0.3) }
  if (hi === "espresso") { c.rect(41, 110, 14, 2, "X"); c.rect(43, 103, 9, 7, "X"); c.rect(44, 103, 7, 2, "v"); c.rect(52, 105, 2, 3, "X"); c.shade([48, 103, 52, 103, 52, 110, 48, 110]); c.px(45, 99, "l"); c.px(48, 97, "l"); c.px(46, 95, "l") }
  if (hi === "mic") { c.poly([42, 96, 50, 96, 50, 105, 42, 105], "@"); c.rect(43, 97, 6, 7, "$"); c.rect(44, 105, 4, 9, "K"); c.rect(43, 105, 6, 2, "U"); c.line(45, 124, 40, 140, "K") }
  if (hi === "pad") { c.rect(30, 110, 18, 24, "m"); c.rect(32, 114, 14, 18, "p"); c.rect(35, 108, 8, 4, "!"); for (const y of [118, 122, 126]) c.hline(34, y, 10, "@") }
  // ---- 왼팔(화면 오른쪽): 교탁에 기댄다
  const bx = W0
  c.poly([121 + bx, 108, 133 + bx, 110, 147 + bx, 134, 138 + bx, 141], o === "shortsleeve" ? "S" : armCol)
  if (o === "shortsleeve") c.poly([121 + bx, 108, 133 + bx, 110, 138 + bx, 122, 126 + bx, 120], "t")
  c.poly([138 + bx, 141, 147 + bx, 134, 129, 152, 120, 149], o === "shortsleeve" ? "S" : armCol); c.shade([121 + bx, 108, 133 + bx, 110, 147 + bx, 134, 141 + bx, 136])
  if (o === "tweed") c.poly([137 + bx, 131, 143 + bx, 130, 147 + bx, 135, 144 + bx, 141, 138 + bx, 141, 135 + bx, 136], "P")
}
for (const st of ["idle", "p2", "ko"]) sprite("prof_" + st, { w: 180, h: 236, outline: "K" }, (c) => drawProf(c, st))

// 2페이즈 변신: 교수님 단과대마다 등 뒤에 펼쳐지는 것이 다르다
sprite("prof_arms", { w: 180, h: 236, outline: "K" }, (c) => {
  const col = PF.college
  if (col === "hum") {                                                   // 철학자 환영 셋: 각진 흰 흉상
    for (const [x, y] of [[8, 40], [130, 36], [70, 4]]) {
      c.poly([x + 8, y, x + 26, y, x + 32, y + 10, x + 30, y + 26, x + 24, y + 32, x + 36, y + 44, x - 2, y + 44, x + 10, y + 32, x + 4, y + 26, x + 2, y + 10], "l")
      c.poly([x + 4, y + 26, x + 30, y + 26, x + 26, y + 36, x + 8, y + 36], "x"); c.rect(x + 10, y + 14, 4, 2, "@"); c.rect(x + 20, y + 14, 4, 2, "@"); c.line(x + 12, y + 22, x + 22, y + 22, "@")
    }
    return
  }
  if (col === "soc") {                                                   // 속보 자막과 폭락 화살표
    for (const [y, w] of [[40, 70], [66, 60], [92, 76]]) { c.rect(4, y, w, 12, "U"); c.rect(4, y, 22, 12, "7"); c.text(6, y + 4, "NEWS", "X"); for (let k = 0; k < 5; k++) c.rect(30 + k * 8, y + 4, 5, 4, "X") }
    for (const [x, y] of [[132, 40], [150, 70], [128, 96]]) c.poly([x, y, x + 10, y, x + 10, y + 14, x + 16, y + 14, x + 5, y + 26, x - 6, y + 14, x, y + 14], "U")
    return
  }
  if (col === "sci") {                                                   // 자기장 폭주: 지그재그 번개와 원자 네모
    for (const pts of [[20, 30, 34, 50, 24, 60, 40, 84], [158, 28, 146, 52, 156, 62, 140, 88], [60, 10, 74, 24, 66, 32, 82, 44], [120, 10, 108, 26, 116, 32, 100, 46]])
      for (let i = 0; i + 3 < pts.length; i += 2) { c.line(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], "~"); c.line(pts[i] + 1, pts[i + 1], pts[i + 2] + 1, pts[i + 3], "Z") }
    for (const [x, y] of [[10, 96], [160, 100], [40, 20], [140, 18]]) { c.rect(x, y, 6, 6, "U"); c.box(x - 4, y - 4, 14, 14, "~") }
    return
  }
  if (col === "nur") {                                                   // 링거 폭주: 수액 거치대 둘과 심전도 모니터
    for (const [px, side] of [[18, 1], [158, -1]]) {
      c.rect(px, 20, 3, 120, "!"); c.rect(px - 10, 18, 24, 3, "@")
      for (const [bx, by] of [[px - 12, 22], [px + 6, 26]]) { c.rect(bx, by, 12, 18, "b"); c.rect(bx + 2, by + 3, 8, 10, "X"); c.rect(bx + 3, by + 6, 6, 2, "Z"); c.line(bx + 6, by + 18, 90 - side * 30, 100, "x") }
    }
    c.rect(60, 4, 60, 30, "m"); c.rect(62, 6, 56, 26, "V"); for (const [x0, y0, x1, y1] of [[64, 20, 76, 20], [76, 20, 80, 10], [80, 10, 84, 28], [84, 28, 88, 20], [88, 20, 116, 20]]) c.line(x0, y0, x1, y1, "N")
    c.text(98, 9, "HR", "N")
    return
  }
  if (col === "biz") {                                                   // 주가 전광판: 캔들 차트와 쏟아지는 지폐
    c.rect(14, 0, 152, 40, "m"); c.rect(16, 2, 148, 36, "V")
    for (let k = 0; k < 14; k++) { const up = (k * 7) % 3 !== 0, h = 6 + (k * 11) % 16, y0 = 30 - ((k * 5) % 14) - h; c.rect(20 + k * 10, y0, 5, h, up ? "N" : "U"); c.vline(22 + k * 10, y0 - 3, h + 6, up ? "N" : "U") }
    for (const [bx, by] of [[10, 60], [150, 64], [30, 100], [140, 104], [20, 130], [156, 128]]) { c.rect(bx, by, 14, 7, "n"); c.rect(bx + 1, by + 1, 12, 5, "N"); c.rect(bx + 5, by + 2, 4, 3, "n") }
    return
  }
  if (col === "phm") {                                                   // 약장 폭발: 양쪽 약장과 떠다니는 캡슐
    for (const px of [2, 146]) {
      c.rect(px, 10, 32, 130, "w"); c.rect(px + 2, 12, 28, 126, "v")
      for (let r = 0; r < 5; r++) { c.rect(px + 2, 36 + r * 24, 28, 2, "w"); for (let k = 0; k < 4; k++) c.rect(px + 4 + k * 7, 26 + r * 24, 5, 10, ["X", "b", "Q", "^"][(k + r) % 4]) }
    }
    for (const [cx, cy] of [[50, 20], [124, 26], [40, 70], [136, 80], [60, 2], [112, 0]]) { c.poly([cx, cy + 6, cx + 6, cy, cx + 12, cy + 4, cx + 6, cy + 10], "U"); c.poly([cx + 3, cy + 3, cx + 6, cy, cx + 12, cy + 4, cx + 9, cy + 7], "X") }
    return
  }
  if (col === "pe") {                                                    // 응원단 소환: 메가폰 둘, 응원 깃발, 각진 폼폼
    for (const [px, dir] of [[4, 1], [176, -1]]) { c.poly([px, 60, px + dir * 20, 50, px + dir * 20, 86, px, 76], "U"); c.rect(dir > 0 ? px - 4 : px, 62, 4, 12, "K") }
    c.rect(30, 4, 120, 22, "R"); c.rect(32, 6, 116, 18, "U"); c.text(60, 12, "FIGHTING", "X")
    for (const [cx, cy, col2] of [[26, 100, "^"], [150, 100, "Z"], [44, 36, "Z"], [132, 36, "^"]]) c.poly([cx, cy - 10, cx + 4, cy - 3, cx + 11, cy - 4, cx + 6, cy + 2, cx + 9, cy + 10, cx, cy + 5, cx - 9, cy + 10, cx - 6, cy + 2, cx - 11, cy - 4, cx - 4, cy - 3], col2)
    return
  }
  if (col === "law") {                                                   // 법정 소환: 대리석 기둥 둘과 머리 위의 큰 저울
    for (const px of [6, 150]) {
      c.rect(px - 3, 20, 30, 6, "x"); c.rect(px, 26, 24, 110, "l"); for (const fx of [5, 11, 17]) c.vline(px + fx, 28, 106, "@"); c.rect(px - 3, 136, 30, 6, "x")
    }
    c.rect(88, 2, 4, 34, "o"); c.rect(46, 6, 88, 3, "o"); c.rect(84, 0, 12, 4, ">")
    for (const px of [46, 128]) { c.line(px + 3, 9, px - 6, 26, "o"); c.line(px + 3, 9, px + 12, 26, "o"); c.poly([px - 8, 26, px + 14, 26, px + 10, 31, px - 4, 31], "o"); c.hline(px - 6, 27, 18, "^") }
    return
  }
  if (col === "edu") {                                                   // 칠판 증식: 떠 있는 작은 칠판들과 쏟아지는 분필
    for (const [bx, by, w, h] of [[4, 40, 38, 26], [138, 36, 38, 26], [20, 4, 40, 24], [120, 2, 42, 24], [70, -6, 40, 18]]) {
      c.rect(bx, by, w, h, "w"); c.rect(bx + 2, by + 2, w - 4, h - 4, "G"); for (let k = 0; k < 3; k++) c.hline(bx + 5, by + 6 + k * 5, 8 + ((bx + k * 7) % 14), "c"); c.rect(bx + w - 9, by + h - 6, 5, 2, "X")
    }
    for (const [px, py] of [[50, 70], [130, 76], [36, 96], [146, 100], [60, 32], [118, 30]]) { c.rect(px, py, 2, 6, "X"); c.px(px, py + 6, "c") }
    return
  }
  if (col === "med") {                                                   // 수술 로봇 팔: 각진 수술등과 메스·겸자를 든 팔 넷
    c.poly([56, 2, 124, 2, 132, 14, 48, 14], "!"); c.poly([60, 14, 120, 14, 114, 22, 66, 22], "^"); c.rect(86, 0, 8, 3, "@")
    for (const [sx, sy, ex, ey, tx, ty, tool] of [[56, 108, 30, 80, 14, 60, "s"], [124, 108, 150, 80, 166, 60, "f"], [62, 102, 44, 56, 30, 34, "f"], [118, 102, 136, 56, 150, 34, "s"]]) {
      c.poly([sx - 3, sy, sx + 3, sy, ex + 3, ey, ex - 3, ey], "x"); c.rect(ex - 3, ey - 3, 7, 7, "@")
      c.poly([ex - 2, ey, ex + 2, ey, tx + 2, ty, tx - 2, ty], "x"); c.rect(tx - 2, ty - 2, 5, 5, "$")
      if (tool === "s") c.poly([tx - 1, ty - 2, tx + 1, ty - 2, tx + 3, ty - 12, tx, ty - 9], "!")
      else { c.line(tx - 1, ty - 2, tx - 4, ty - 12, "!"); c.line(tx + 1, ty - 2, tx + 4, ty - 12, "!") }
    }
    return
  }
  if (col === "art") {                                                   // 추상화 그림자: 원색 기하 도형
    c.poly([4, 30, 50, 10, 40, 70], "U"); c.rect(130, 20, 40, 30, "Z"); c.poly([120, 70, 176, 60, 160, 110], "o"); c.rect(10, 80, 26, 26, "K"); c.poly([60, 0, 120, 0, 90, 30], "N")
    return
  }
  for (const [sx, sy, ex, ey, mx, my] of [[56, 108, 30, 86, 6, 64], [124, 108, 150, 86, 140, 64], [62, 102, 46, 64, 24, 36], [118, 102, 134, 64, 124, 36]]) {
    c.poly([sx - 2, sy, sx + 2, sy, ex + 2, ey, ex - 2, ey], "M"); c.rect(ex - 2, ey - 2, 5, 5, "m")
    c.poly([ex - 2, ey, ex + 2, ey, mx + 16, my + 14, mx + 12, my + 14], "M")
    c.rect(mx, my, 30, 20, "m"); c.rect(mx + 2, my + 2, 26, 16, "V")
    for (let k = 0; k < 4; k++) c.hline(mx + 4, my + 4 + k * 3, 6 + ((k * 7 + mx) % 14), "N")
    for (let k = 0; k < 5; k++) c.rect(mx + 4 + k * 4, my + 15, 3, 2, k % 2 ? "n" : "N")
  }
})

// ================================================================ 교탁 (위에 올린 물건은 꾸미기)
sprite("lectern", { w: 180, h: 236, outline: "K" }, (c) => {
  c.poly([52, 148, 128, 148, 133, 155, 47, 155], "W")
  c.poly([49, 155, 131, 155, 125, 236, 55, 236], "w")
  c.vline(62, 158, 78, "v"); c.vline(118, 158, 78, "v"); c.shade([104, 155, 30, 81])
  emblemFront(c)
  const d = PF.desk
  if (d === "thinkpad") { c.rect(58, 134, 28, 15, "m"); c.hline(58, 134, 28, "M"); c.px(80, 138, "U") }
  if (d === "ipad") { c.poly([60, 130, 82, 130, 84, 149, 58, 149], "!"); c.rect(62, 132, 20, 15, "V"); c.line(64, 144, 78, 134, "N"); c.line(86, 128, 90, 148, "x") }
  if (d === "thermos") { c.rect(64, 122, 12, 27, "$"); c.rect(64, 122, 12, 4, "R"); c.rect(66, 128, 3, 18, "@"); c.rect(78, 140, 8, 9, "X"); c.rect(79, 141, 6, 3, "v"); c.px(80, 136, "l"); c.px(82, 133, "l") }
  if (d === "molecule") { for (const [x, y, col] of [[60, 130, "U"], [74, 124, "Z"], [84, 134, "x"], [70, 140, "U"]]) c.rect(x, y, 6, 6, col); c.line(63, 133, 77, 127, "K"); c.line(77, 127, 87, 137, "K"); c.line(73, 143, 77, 127, "K"); c.rect(70, 146, 12, 3, "v") }
  if (d === "books") { c.rect(56, 140, 30, 9, "="); c.rect(58, 132, 26, 8, "R"); c.rect(60, 125, 22, 7, "N"); for (const [x, y, col] of [[62, 122, "^"], [70, 121, "o"], [78, 123, "U"], [84, 135, "^"]]) c.rect(x, y, 3, 4, col) }
  c.poly([115, 146, 126, 145, 130, 150, 128, 154, 116, 154], "S"); c.shade([124, 145, 130, 150, 128, 154, 123, 154])
})
// 교탁 앞면 마크: 교수님 단과대
function emblemFront(c) {
  const col = PF.college, x = 82, y = 182
  if (col === "eng" || !col) {
    c.poly([84, 182, 96, 182, 100, 188, 100, 196, 96, 202, 84, 202, 80, 196, 80, 188], "o")
    c.poly([86, 186, 94, 186, 96, 189, 96, 195, 94, 198, 86, 198, 84, 195, 84, 189], "w")
    c.rect(88, 190, 4, 4, "o")
    for (const [ex, ey] of [[88, 179], [88, 203], [77, 190], [101, 190]]) c.rect(ex, ey, 4, 2 + (ex === 77 || ex === 101 ? 2 : 0), "o")
  } else if (col === "hum") { c.poly([x, y + 2, x + 8, y + 4, x + 8, y + 20, x, y + 18], "o"); c.poly([x + 10, y + 4, x + 18, y + 2, x + 18, y + 18, x + 10, y + 20], "o"); c.vline(x + 9, y + 4, 17, "v") }
  else if (col === "soc") { c.vline(x + 9, y, 20, "o"); c.hline(x, y + 4, 19, "o"); c.poly([x - 2, y + 14, x + 2, y + 6, x + 6, y + 14], "o"); c.poly([x + 12, y + 14, x + 16, y + 6, x + 20, y + 14], "o"); c.hline(x + 4, y + 19, 11, "o") }
  else if (col === "sci") { c.rect(x + 6, y, 6, 8, "o"); c.poly([x + 6, y + 8, x + 12, y + 8, x + 19, y + 20, x - 1, y + 20], "o"); c.hline(x + 3, y + 14, 12, "v") }
  else if (col === "nur") { c.poly([x - 2, y + 14, x + 3, y + 9, x + 14, y + 9, x + 21, y + 4, x + 21, y + 9, x + 17, y + 18, x + 1, y + 18], "o"); c.poly([x + 6, y + 8, x + 8, y + 1, x + 10, y + 8], "^"); c.hline(x + 1, y + 20, 16, "o") }
  else if (col === "law") {                                               // 정의의 저울
    c.rect(x + 8, y - 2, 3, 22, "o"); c.rect(x - 2, y, 24, 2, "o"); c.rect(x + 3, y + 20, 13, 2, "o")
    for (const px of [x - 2, x + 14]) { c.line(px + 3, y + 2, px, y + 10, "o"); c.line(px + 3, y + 2, px + 6, y + 10, "o"); c.poly([px - 1, y + 10, px + 7, y + 10, px + 5, y + 13, px + 1, y + 13], "o") }
  }
  else if (col === "edu") {                                               // 수업 종
    c.rect(x + 7, y - 2, 5, 4, "o"); c.poly([x + 5, y + 2, x + 14, y + 2, x + 19, y + 17, x, y + 17], "o"); c.rect(x - 1, y + 17, 21, 2, "o"); c.rect(x + 8, y + 19, 3, 3, "o"); c.vline(x + 7, y + 5, 9, "v")
  }
  else if (col === "biz") {                                               // 오르는 막대그래프와 화살표
    c.rect(x, y + 12, 4, 8, "o"); c.rect(x + 6, y + 8, 4, 12, "o"); c.rect(x + 12, y + 3, 4, 17, "o"); c.rect(x - 2, y + 20, 22, 2, "o")
    c.line(x - 1, y + 9, x + 17, y - 2, "o"); c.line(x - 1, y + 10, x + 17, y - 1, "o"); c.poly([x + 14, y - 3, x + 20, y - 4, x + 18, y + 2], "o")
  }
  else if (col === "phm") {                                               // 비스듬한 캡슐
    c.poly([x - 1, y + 14, x + 10, y + 3, x + 19, y + 10, x + 8, y + 21], "o"); c.poly([x + 4, y + 9, x + 10, y + 3, x + 19, y + 10, x + 13, y + 16], "w"); c.line(x + 4, y + 9, x + 13, y + 16, "o")
  }
  else if (col === "pe") {                                                // 트로피
    c.poly([x + 2, y, x + 17, y, x + 15, y + 9, x + 11, y + 12, x + 8, y + 12, x + 4, y + 9], "o"); c.rect(x + 8, y + 12, 3, 4, "o"); c.rect(x + 4, y + 16, 11, 3, "o"); c.rect(x + 2, y + 19, 15, 2, "o")
    c.rect(x - 2, y + 1, 3, 6, "o"); c.rect(x + 18, y + 1, 3, 6, "o")
  }
  else if (col === "med") {                                               // 뱀 한 마리가 감긴 지팡이
    c.rect(x + 8, y - 2, 3, 24, "o")
    for (const [x0, y0, x1, y1] of [[x + 3, y + 3, x + 16, y + 8], [x + 16, y + 8, x + 3, y + 13], [x + 3, y + 13, x + 16, y + 18]]) { c.line(x0, y0, x1, y1, "o"); c.line(x0, y0 + 1, x1, y1 + 1, "o") }
    c.rect(x + 1, y + 1, 4, 3, "o")
  }
  else { c.poly([x, y + 4, x + 6, y, x + 16, y, x + 19, y + 8, x + 14, y + 12, x + 8, y + 20, x, y + 14], "o"); c.rect(x + 4, y + 4, 3, 3, "U"); c.rect(x + 10, y + 3, 3, 3, "N"); c.rect(x + 12, y + 8, 3, 3, "Z") }
}

// ================================================================ 학생 (뒷모습)
// 손에 든 물건은 모두 같은 축(손 → 끝)을 따라 그린다: kb(u, v)에서 u는 손에서 멀어지는 쪽, v는 옆쪽.
// 그래서 무기를 바꿔도 8가지 자세가 그대로 맞는다.
const kbAt = (o, d) => (u, v) => [o[0] + d[0] * u - d[1] * v, o[1] + d[1] * u + d[0] * v]
const STU = {
  top: ST.top || "jamba", hair: ST.hair || "greasy", hstate: ST.hstate || "none", head: ST.head || "none", neck: ST.neck || "none",
  wrist: ST.wrist || "none", back: ST.back || "none", weapon: ST.weapon || "keyboard", college: ST.college || "eng",
  gender: ST.gender || "m", eyeshape: ST.eyeshape || "normal",
}
function keyboard(c, o, d, len, half) {
  const kb = kbAt(o, d)
  c.poly([...kb(-2, -half), ...kb(len, -half), ...kb(len, half), ...kb(-2, half)].map(Math.round), "q")
  c.poly([...kb(-2, half - 2), ...kb(len, half - 2), ...kb(len, half + 1), ...kb(-2, half + 1)].map(Math.round), "K")
  for (let u = 2; u < len - 3; u += 4.4) for (let v = -half + 2.5; v < half - 3; v += 3.4) {
    const [x, y] = kb(u, v), col = u > len - 10 && v < -half + 6 ? "N" : u < 4 && v < -half + 6 ? "R" : "x"
    c.rect(Math.round(x), Math.round(y), 3, 2, col)
  }
}
// 무기 하나: 좌표는 [u, v, ...] (u 0 = 손). f는 원근으로 줄어드는 비율, hv는 옆 폭 비율
function weapon(c, o, d, f, hv, kind) {
  const kb = kbAt(o, d)
  const P = (pts, col) => { const out = []; for (let i = 0; i < pts.length; i += 2) out.push(...kb(pts[i] * f, pts[i + 1] * hv)); c.poly(out.map(Math.round), col) }
  const D = (u, v, col, w = 1, h = 1) => { const [x, y] = kb(u * f, v * hv); c.rect(Math.round(x), Math.round(y), w, h, col) }
  const bar = (u0, u1, hw, col) => P([u0, -hw, u1, -hw, u1, hw, u0, hw], col)
  switch (kind) {
    case "solder": bar(-2, 14, 3, "Z"); bar(14, 16, 2.4, "K"); bar(16, 40, 1, "!"); P([40, -1.4, 47, 0, 40, 1.4], "^"); D(46, 0, "X"); D(44, -3, "^"); D(48, 2, "8"); break
    case "wrench": bar(-2, 34, 3, "@"); bar(-2, 12, 3.2, "R"); P([34, -9, 50, -9, 50, -3, 42, -3, 42, 3, 50, 3, 50, 9, 34, 9], "!"); D(37, -6, "$", 2, 2); D(37, 5, "$", 2, 2); break
    case "gpu":
      bar(-2, 46, 9, "m"); P([-2, 6, 46, 6, 46, 9, -2, 9], "n"); P([8, 9, 38, 9, 38, 10.5, 8, 10.5], "o")
      for (const cu of [11, 31]) { P([cu - 7, -7, cu + 7, -7, cu + 7, 5, cu - 7, 5], "$"); P([cu - 5, -5, cu + 5, -5, cu + 5, 3, cu - 5, 3], "@"); P([cu - 1, -5, cu + 1, -5, cu + 1, 3, cu - 1, 3], "$"); P([cu - 5, -2, cu + 5, -2, cu + 5, 0, cu - 5, 0], "$") }
      D(44, -8, "U"); break
    case "dict": bar(2, 30, 11, "="); bar(2, 7, 11, "+"); bar(28, 30, 10, "p"); D(3, -6, "o", 2, 1); D(3, 0, "o", 2, 1); D(3, 6, "o", 2, 1); D(14, -3, "o", 6, 1); bar(-2, 3, 2, "I"); break
    case "pen": bar(-2, 10, 2, "K"); bar(10, 12, 2.2, "o"); bar(12, 30, 2, "+"); P([30, -2, 52, 0, 30, 2], "!"); P([34, -0.4, 50, 0, 34, 0.4], "K"); D(20, -1, "=", 4, 1); break
    case "law": bar(-2, 30, 2, "w"); bar(28, 46, 11, "R"); bar(28, 32, 11, "7"); bar(44, 46, 10, "p"); D(35, -5, "o", 4, 1); D(35, 4, "o", 4, 1); break
    case "gavel": bar(-2, 28, 2, "v"); bar(24, 40, 9, "W"); bar(24, 27, 9, "o"); bar(37, 40, 9, "o"); P([24, -9, 40, -9, 40, -6, 24, -6], "w"); break
    case "chart":
      bar(-2, 8, 2, "K"); bar(8, 10, 6, "o")
      P([10, -4, 20, -7, 26, -3, 34, -6, 42, 0, 50, 5, 56, 9, 54, 12, 48, 9, 40, 4, 33, -2, 26, 1, 20, -3, 10, 0], "U")
      for (const [u, v] of [[16, -3], [24, -1], [32, -1], [40, 2], [48, 6]]) D(u, v, "X")
      P([52, 8, 58, 11, 53, 13], "7"); break
    case "pipette":
      bar(-8, -2, 2, "x"); bar(-2, 22, 4, "!"); P([4, -3, 12, -3, 12, 0, 4, 0], "N"); bar(22, 30, 11, "@")
      for (let k = 0; k < 8; k++) { const v = -10 + k * 2.85; P([30, v - 0.6, 41, v - 0.3, 41, v + 0.3, 30, v + 0.6], "b") }
      break
    case "compass":
      bar(-2, 6, 3, "K"); P([6, -2, 48, -10, 48, -7, 6, 1], "W"); P([6, -1, 48, 7, 48, 10, 6, 2], "W")
      P([48, 7, 53, 8.5, 48, 10], "c"); P([48, -10, 53, -8.5, 48, -7], "!"); D(26, -1, "o", 2, 2); break
    case "geohammer":
      bar(-2, 32, 2, "?"); for (const u of [2, 6, 10]) bar(u, u + 1, 2.4, "K")
      P([29, -9, 36, -9, 36, 8, 29, 8], "$"); P([29, -9, 32.5, -15, 36, -9], "$"); P([30, 4, 35, 4, 35, 8, 30, 8], "!"); break
    case "ruler": bar(-2, 64, 2, "!"); bar(-2, 64, 0.4, "@"); for (let u = 2; u < 64; u += 4) D(u, -2, "K", 1, u % 16 === 2 ? 2 : 1); break
    case "stand": bar(-2, 48, 1, "K"); P([44, -12, 54, -12, 54, 12, 44, 12], "m"); P([45, -10, 52, -10, 52, 10, 45, 10], "p"); for (const v of [-6, -2, 2, 6]) bar(46, 51, 0.3, "K"); D(47, -4, "K", 2, 2); break
    case "shinai": bar(-2, 62, 2, "<"); bar(-2, 14, 2.2, "p"); bar(58, 62, 2.2, "p"); for (const u of [22, 38, 50]) bar(u, u + 1, 2, ">"); P([14, -2.4, 58, -2.4, 58, -2, 14, -2], "K"); break
    case "syringe":                                                     // 손잡이 날개, 눈금 있는 몸통, 바늘
      bar(-2, 2, 6, "$"); bar(2, 8, 1.4, "@"); bar(8, 34, 4.5, "x"); bar(12, 33, 3, "Z"); bar(8, 10, 5, "@")
      for (const u of [14, 20, 26]) D(u, -4, "K", 1, 2)
      bar(34, 37, 2, "@"); bar(37, 52, 0.5, "!"); D(51, 0, "X"); break
    case "ivpole":                                                      // 바퀴 달린 받침, 긴 기둥, 위에 매달린 수액 봉지
      bar(-4, -1, 7, "$"); D(-4, -7, "K", 2, 2); D(-4, 6, "K", 2, 2); bar(-1, 58, 1.2, "!"); bar(52, 58, 6, "@")
      P([44, 3, 56, 3, 56, 12, 44, 12], "b"); P([46, 5, 54, 5, 54, 10, 46, 10], "X"); D(48, 7, "Z", 4, 1); bar(40, 44, 0.4, "x"); break
    case "clipboard":                                                   // 갈색 판, 쇠 집게, 인계장 종이
      bar(-2, 3, 2, "I"); bar(3, 40, 11, "w"); bar(5, 38, 9, "p"); bar(34, 40, 4, "@"); bar(36, 38, 2, "!")
      for (const v of [-6, -2, 2, 6]) P([8, v, 30, v, 30, v + 0.6, 8, v + 0.6], "l")
      D(10, -6, "R", 3, 1); break
    case "scalpel":                                                     // 홈 파인 손잡이 + 비스듬한 날
      bar(-2, 26, 1.6, "!"); for (const u of [4, 8, 12, 16]) D(u, 0, "@"); bar(26, 28, 1.8, "$")
      P([28, -1.6, 38, -3.2, 44, 0, 28, 1.6], "x"); P([30, 1, 44, 0, 30, 1.6], "X"); break
    case "stetho":                                                      // 귀꽂이 Y자, 고무관, 끝의 판
      P([-2, -5, 4, -1, 4, 1, -2, -3], "$"); P([-2, 5, 4, 1, 4, -1, -2, 3], "$"); bar(4, 36, 1, "K"); bar(10, 12, 2, "$")
      P([36, -5, 46, -5, 46, 5, 36, 5], "!"); P([38, -3, 44, -3, 44, 3, 38, 3], "@"); D(40, -1, "X", 2, 2); break
    case "casebook":                                                    // 색이 다른 판례집 세 권을 끈으로 묶었다
      bar(-2, 3, 2, "I"); P([2, -12, 30, -12, 30, -4, 2, -4], "="); P([2, -4, 30, -4, 30, 4, 2, 4], "m"); P([2, 4, 30, 4, 30, 12, 2, 12], "7")
      bar(28, 30, 11, "p"); for (const v of [-8, 0, 8]) D(10, v, "o", 8, 1); bar(17, 18, 12, "?"); break
    case "seal":                                                        // 나무 손잡이와 빨간 도장 머리
      bar(-2, 22, 2.2, "w"); bar(16, 22, 2.8, "v"); bar(22, 34, 7, "7"); bar(22, 25, 7, "r"); bar(34, 36, 7, "R"); D(28, -2, "o", 3, 3); break
    case "scales":                                                      // 금빛 기둥, 가로대, 양쪽 접시
      bar(-2, 40, 1.2, "o"); P([40, -13, 42, -13, 42, 13, 40, 13], "o"); P([36, -2, 40, -2, 40, 2, 36, 2], ">")
      for (const v of [-13, 13]) { P([42, v - 0.4, 50, v - 4, 50, v + 4, 42, v + 0.4], "o"); P([48, v - 4, 51, v - 4, 51, v + 4, 48, v + 4], ">") }
      break
    case "eraser":                                                      // 나무 등판 + 펠트, 분필 가루
      bar(-2, 6, 2, "I"); bar(6, 26, 7, "?"); bar(6, 26, 3.5, "l"); for (const [u, v] of [[10, 5], [16, 6], [22, 4]]) D(u, v, "c", 2, 1); break
    case "rollbook":                                                    // 초록 표지 출석부, 흰 이름표
      bar(-2, 3, 2, "I"); bar(2, 32, 11, "n"); bar(2, 6, 11, "N"); bar(30, 32, 10, "p"); P([12, -4, 24, -4, 24, 4, 12, 4], "p"); D(14, -2, "K", 8, 1); D(14, 1, "K", 6, 1); break
    case "handbell":                                                    // 나무 손잡이, 금빛 종, 추
      bar(-2, 14, 1.8, "v"); P([14, -3, 14, 3, 28, 9, 28, -9], "o"); P([14, -3, 18, -4, 28, -9, 28, -6], "^"); bar(28, 30, 9.5, ">"); D(31, -1, "$", 2, 2); break
    case "calc":                                                        // 검은 재무 계산기: 초록 화면과 버튼
      bar(-2, 26, 6, "m"); bar(18, 25, 4.5, "V"); D(20, -2, "N", 3, 1); D(20, 1, "N", 4, 1)
      for (let u = 0; u < 16; u += 4) for (const v of [-4, -1, 2]) D(u, v, u === 12 && v === 2 ? "O" : "x", 2, 2)
      break
    case "laptop":                                                      // 엑셀이 켜진 노트북
      bar(-2, 30, 10, "@"); bar(2, 28, 8, "V"); for (let u = 4; u < 28; u += 4) bar(u, u + 0.5, 8, "n"); for (const v of [-4, 0, 4]) P([2, v, 28, v, 28, v + 0.4, 2, v + 0.4], "n"); D(6, -6, "N", 6, 2); break
    case "cards":                                                       // 명함 뭉치 + 날아가는 세 장
      bar(-2, 12, 4, "p"); bar(-2, 12, 0.5, "l")
      for (const v of [-7, 0, 7]) P([18, v - 2, 30, v - 2.6, 30, v + 2.6, 18, v + 2], "p"); for (const v of [-7, 0, 7]) D(22, v, "K", 4, 1)
      break
    case "mortar":                                                      // 하얀 막자: 끝이 굵다
      bar(-2, 28, 2, "x"); bar(28, 38, 4, "l"); bar(34, 38, 4.4, "x"); break
    case "pillbox":                                                     // 일곱 칸 약통, 칸마다 뚜껑 색
      bar(2, 34, 8, "p"); bar(-2, 3, 2, "I")
      for (let k = 0; k < 7; k++) { const u = 4 + k * 4.4; P([u, -7, u + 3.6, -7, u + 3.6, 7, u, 7], ["U", "O", "^", "N", "Z", "~", "Q"][k]) }
      break
    case "capsule":                                                     // 두 색 캡슐(각진 육각형)
      bar(-2, 4, 2, "I"); P([4, -5, 15, -5, 15, 5, 4, 5, 1, 0], "U"); P([15, -5, 24, -5, 27, 0, 24, 5, 15, 5], "X"); D(6, -3, "Q", 6, 1); break
    case "whistle":                                                     // 끈에 달린 금속 호루라기
      bar(-2, 12, 0.6, "R"); P([12, -3, 22, -3, 24, 1, 22, 5, 12, 5], "!"); bar(22, 28, 1.6, "!"); D(15, -1, "$", 3, 2); break
    case "medball":                                                     // 각진 가죽 공(팔각형), 이음선
      bar(-2, 10, 2, "I"); P([12, -6, 18, -11, 26, -11, 31, -6, 31, 6, 26, 11, 18, 11, 12, 6], "?"); P([12, -6, 18, -11, 22, -11, 15, 0], ">")
      P([21, -11, 22, -11, 22, 11, 21, 11], "K"); P([12, -0.5, 31, -0.5, 31, 0.5, 12, 0.5], "K"); break
    case "jumprope":                                                    // 빨간 손잡이 둘, 늘어진 줄
      bar(-2, 8, 2.2, "R"); bar(48, 56, 2.2, "R")
      for (let u = 8; u < 48; u += 4) { const v0 = 6 * Math.sin(((u - 8) / 40) * Math.PI), v1 = 6 * Math.sin(((u - 4) / 40) * Math.PI); P([u, v0 - 0.5, u + 4, v1 - 0.5, u + 4, v1 + 0.5, u, v0 + 0.5], "=") }
      break
    case "anatomy":                                                     // 빨간 표지 원서, 흰 해골 그림
      bar(2, 32, 12, "7"); bar(2, 7, 12, "r"); bar(30, 32, 11, "p"); D(3, -6, "o", 2, 1); D(3, 6, "o", 2, 1)
      P([14, -5, 22, -5, 22, 1, 20, 4, 16, 4, 14, 1], "X"); D(16, -2, "K", 2, 2); D(19, -2, "K", 2, 2); D(17, 2, "K", 3, 1); bar(-2, 3, 2, "I"); break
    default: return false
  }
  return true
}
function seg(c, a, b, wa, wb, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1
  let nx = -dy / L, ny = dx / L
  c.poly([a[0] + nx * wa, a[1] + ny * wa, b[0] + nx * wb, b[1] + ny * wb, b[0] - nx * wb, b[1] - ny * wb, a[0] - nx * wa, a[1] - ny * wa].map(Math.round), col)
  if (nx * 0.6 + ny * 0.8 < 0) { nx = -nx; ny = -ny }
  c.shade([a[0], a[1], b[0], b[1], b[0] + nx * wb, b[1] + ny * wb, a[0] + nx * wa, a[1] + ny * wa].map(Math.round))
}
const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
// 소매 색: 과잠·조끼 안 셔츠는 색 2, 후드티·플란넬은 색 1, 동아리 티는 반팔
const SLV = { jamba: "y", jamba_up: "y", hoodie: "j", hood_up: "j", flannel: "j", clubtee: "j", vest: "y" }
function sleeveArm(c, sh, el, hd, right) {
  const col = SLV[STU.top] || "y", tee = STU.top === "clubtee"
  if (tee) { seg(c, sh, mid(sh, el, 0.5), 5.8, 5.2, col); seg(c, mid(sh, el, 0.45), el, 4.2, 3.8, "I"); seg(c, el, hd, 3.8, 3.2, "I") }
  else {
    seg(c, sh, el, 5.5, 4.6, col); seg(c, el, hd, 4.6, 3.6, col)
    seg(c, mid(el, hd, 0.78), mid(el, hd, 0.94), 3.9, 3.9, col === "y" ? "Y" : "i")
    if (STU.top === "flannel") for (const t of [0.3, 0.6]) { seg(c, mid(sh, el, t), mid(sh, el, t + 0.05), 5, 5, "y"); seg(c, mid(el, hd, t), mid(el, hd, t + 0.06), 4, 4, "y") }
  }
  if (right) {                                                     // 오른손목 장신구
    const a = mid(el, hd, 0.56), b = mid(el, hd, 0.74)              // 손에 가리지 않게 팔뚝 쪽에
    if (STU.wrist === "pas") { seg(c, a, b, 4.4, 4.4, "x"); seg(c, mid(el, hd, 0.3), mid(el, hd, 0.42), 4.4, 4.4, "x") }
    if (STU.wrist === "brace") seg(c, mid(el, hd, 0.46), b, 4.7, 4.7, "m")
    if (STU.wrist === "watch") { seg(c, a, b, 4.2, 4.2, "K"); const [x, y] = mid(a, b, 0.5).map(Math.round); c.rect(x - 2, y - 2, 5, 5, "$"); c.px(x - 1, y - 1, "U"); c.px(x + 1, y - 1, "U"); c.px(x, y + 1, "U") }
    if (STU.wrist === "bands") { seg(c, mid(el, hd, 0.52), mid(el, hd, 0.56), 4.3, 4.3, "U"); seg(c, mid(el, hd, 0.6), mid(el, hd, 0.64), 4.3, 4.3, "N"); seg(c, mid(el, hd, 0.68), mid(el, hd, 0.72), 4.3, 4.3, "Z") }
  }
  const [x, y] = hd.map(Math.round)
  c.poly([x - 4, y - 1, x - 2, y - 4, x + 3, y - 4, x + 4, y, x + 2, y + 4, x - 3, y + 4], "I"); c.shade([x + 1, y - 4, x + 3, y - 4, x + 4, y, x + 2, y + 4, x, y + 4])
}
const nrm = (x, y) => { const l = Math.hypot(x, y); return [x / l, y / l] }
// 자세: R=오른팔(어깨, 팔꿈치, 손), L=왼팔(없으면 내린 팔), kb=[손 위치, 방향, 길이, 반폭], two=두 손으로 가운데를 잡음
const POSES = {
  idle: { R: [[78, 220], [102, 214], [89, 194]], kb: [[86, 194], [0.894, -0.447], 60, 9] },
  windup: { R: [[78, 219], [101, 203], [93, 184]], kb: [[92, 186], nrm(0.42, -0.91), 48, 8] },
  smash: { R: [[78, 219], [94, 198], [100, 178]], kb: [[88, 172], nrm(0.99, -0.12), 50, 6] },
  follow: { R: [[76, 218], [62, 206], [50, 200]], kb: [[54, 200], nrm(-0.93, 0.36), 44, 7] },
  sweepA: { R: [[78, 219], [104, 210], [118, 200]], kb: [[114, 201], nrm(0.96, -0.28), 46, 7] },
  sweepB: { R: [[76, 218], [66, 202], [56, 192]], kb: [[60, 192], nrm(-1, -0.05), 56, 6] },
  overUp: { L: [[22, 219], [26, 196], [38, 174]], R: [[78, 219], [74, 196], [62, 174]], kb: [[30, 170], [1, 0], 42, 7], two: true },
  overDown: { L: [[22, 219], [24, 202], [36, 187]], R: [[78, 219], [76, 202], [64, 187]], kb: [[30, 184], [1, 0], 42, 6], two: true },
}
// 무기 길이(u 최대). 두 손 자세에서 가운데를 맞추는 데 쓴다
const WLEN = { solder: 47, wrench: 50, gpu: 46, dict: 30, pen: 52, law: 46, gavel: 40, chart: 58, pipette: 41, compass: 53, geohammer: 36, ruler: 64, stand: 54, shinai: 62, syringe: 52, ivpole: 58, clipboard: 40, scalpel: 44, stetho: 46, anatomy: 32, casebook: 30, seal: 36, scales: 50, eraser: 26, rollbook: 32, handbell: 32, calc: 26, laptop: 30, cards: 30, mortar: 38, pillbox: 34, capsule: 26, whistle: 28, medball: 30, jumprope: 56 }
function heldItem(c, P) {
  const [o, d, len, half] = P.kb
  if (STU.weapon === "keyboard" || !WLEN[STU.weapon]) return keyboard(c, o, d, len, half)
  const f = len / 60, hv = half / 9
  let origin = o
  if (P.two) { const mid0 = o[0] + d[0] * len / 2, mid1 = o[1] + d[1] * len / 2; origin = [mid0 - d[0] * WLEN[STU.weapon] * f / 2, mid1 - d[1] * WLEN[STU.weapon] * f / 2] }
  weapon(c, origin, d, f, hv, STU.weapon)
}
// 등 뒤 물건: 몸보다 뒤에 그리는 큰 것(behind)과 몸 위에 메는 것(front)
function backItem(c, layer) {
  const b = STU.back
  if (layer === "behind") {
    if (b === "canvas") { c.rect(4, 150, 92, 86, "W"); c.rect(7, 153, 86, 80, "p"); c.line(7, 153, 93, 233, "l"); c.line(93, 153, 7, 233, "l"); c.rect(4, 150, 92, 3, "w") }
    if (b === "cello") { c.poly([58, 140, 70, 140, 72, 166, 84, 180, 86, 236, 44, 236, 46, 180, 56, 166], "+"); c.poly([58, 140, 64, 140, 62, 166, 50, 182, 50, 236, 44, 236, 46, 180, 56, 166], "="); c.rect(60, 146, 8, 4, "o") }
    if (b === "tube") { c.poly([12, 236, 18, 236, 82, 170, 76, 166], "m"); c.poly([76, 166, 82, 170, 86, 165, 80, 161], "R"); c.poly([12, 236, 18, 236, 22, 232, 16, 230], "R") }
    return
  }
  if (b === "tactical") {
    c.line(36, 214, 30, 236, "K"); c.line(64, 214, 70, 236, "K")
    c.poly([30, 212, 70, 212, 74, 236, 26, 236], "$"); c.poly([32, 212, 68, 212, 66, 220, 34, 220], "@")
    for (const y of [224, 229, 234]) c.hline(31, y, 39, "K")
    c.rect(44, 222, 12, 8, "@"); c.hline(44, 222, 12, "!")
  }
  if (b === "rack") {
    c.poly([32, 208, 68, 208, 70, 236, 30, 236], "m")
    for (let y = 211; y < 236; y += 6) { c.hline(33, y, 34, "M"); c.px(36, y + 2, "N"); c.px(39, y + 2, y % 12 ? "N" : "U") }
    c.rect(52, 214, 12, 12, "$"); c.line(52, 214, 63, 225, "@"); c.line(63, 214, 52, 225, "@")
  }
  if (b === "ecobag") { c.line(66, 214, 84, 226, "p"); c.poly([78, 222, 94, 222, 96, 236, 76, 236], "p"); c.rect(80, 218, 3, 6, "R"); c.rect(84, 217, 3, 7, "="); c.rect(88, 219, 3, 5, "N") }
}
// 등판: 마크 하나(9×9, 각진 도형) + 글씨(main.js가 갈무리 1배 픽셀로 찍어 OPT.stu.printRows로 넘긴다)
const PRINT = ST.print || "college", ROWS = Array.isArray(ST.printRows) ? ST.printRows : []
function emblem(c, x, y, kind, col) {
  if (kind === "eng") { c.poly([x + 2, y, x + 6, y, x + 8, y + 2, x + 8, y + 6, x + 6, y + 8, x + 2, y + 8, x, y + 6, x, y + 2], col); c.rect(x + 3, y + 3, 3, 3, "i"); c.rect(x + 3, y - 1, 3, 1, col); c.rect(x + 3, y + 9, 3, 1, col); c.rect(x - 1, y + 3, 1, 3, col); c.rect(x + 9, y + 3, 1, 3, col) }
  else if (kind === "hum") { c.poly([x, y + 1, x + 4, y + 2, x + 4, y + 8, x, y + 7], col); c.poly([x + 5, y + 2, x + 9, y + 1, x + 9, y + 7, x + 5, y + 8], col); c.vline(x + 4, y + 2, 7, "i") }
  else if (kind === "soc") { c.vline(x + 4, y, 9, col); c.hline(x, y + 2, 9, col); c.poly([x - 1, y + 6, x + 1, y + 3, x + 3, y + 6], col); c.poly([x + 5, y + 6, x + 7, y + 3, x + 9, y + 6], col); c.hline(x + 2, y + 8, 5, col) }
  else if (kind === "sci") { c.rect(x + 3, y, 3, 4, col); c.poly([x + 3, y + 4, x + 6, y + 4, x + 9, y + 9, x, y + 9], col); c.hline(x + 2, y + 6, 5, "i") }
  else if (kind === "art") { c.poly([x, y + 2, x + 3, y, x + 8, y, x + 9, y + 4, x + 7, y + 6, x + 4, y + 9, x, y + 7], col); for (const [dx, dy, k] of [[2, 2, "U"], [5, 2, "N"], [6, 4, "Z"]]) c.px(x + dx, y + dy, k) }
  else if (kind === "nur") { c.poly([x, y + 6, x + 2, y + 4, x + 7, y + 4, x + 9, y + 2, x + 9, y + 4, x + 8, y + 8, x + 1, y + 8], col); c.poly([x + 3, y + 3, x + 4, y, x + 5, y + 3], "^") }   // 나이팅게일 램프
  else if (kind === "law") { c.vline(x + 4, y, 9, col); c.hline(x, y + 1, 9, col); c.poly([x - 1, y + 5, x + 1, y + 2, x + 3, y + 5], col); c.poly([x + 5, y + 5, x + 7, y + 2, x + 9, y + 5], col); c.hline(x + 2, y + 9, 5, col) }   // 저울
  else if (kind === "edu") { c.rect(x + 3, y, 3, 2, col); c.poly([x + 2, y + 2, x + 7, y + 2, x + 9, y + 8, x, y + 8], col); c.rect(x + 4, y + 8, 2, 2, col); c.hline(x + 3, y + 4, 2, "i") }   // 수업 종
  else if (kind === "biz") { c.rect(x, y + 6, 2, 3, col); c.rect(x + 3, y + 4, 2, 5, col); c.rect(x + 6, y + 1, 2, 8, col); c.line(x, y + 4, x + 8, y - 1, col) }   // 오르는 막대그래프
  else if (kind === "phm") { c.poly([x, y + 6, x + 5, y + 1, x + 9, y + 5, x + 4, y + 9], col); c.poly([x + 2, y + 4, x + 5, y + 1, x + 9, y + 5, x + 6, y + 8], "X") }   // 캡슐
  else if (kind === "pe") { c.poly([x + 1, y, x + 8, y, x + 7, y + 4, x + 5, y + 5, x + 4, y + 5, x + 2, y + 4], col); c.rect(x + 4, y + 5, 2, 2, col); c.rect(x + 2, y + 7, 6, 2, col); c.px(x, y + 1, col); c.px(x + 9, y + 1, col) }   // 트로피
  else if (kind === "med") { c.vline(x + 4, y, 10, col); c.line(x + 1, y + 2, x + 8, y + 4, col); c.line(x + 8, y + 4, x + 1, y + 6, col); c.line(x + 1, y + 6, x + 8, y + 8, col); c.rect(x, y + 1, 2, 2, col) }        // 뱀 감긴 지팡이
  else { c.poly([x, y, x + 9, y, x + 9, y + 5, x + 4, y + 9, x, y + 5], col); c.rect(x + 3, y + 2, 3, 3, "i") }   // 대학 문장 (방패)
}
function backPrint(c, col) {
  if (PRINT === "none") return
  const hasRows = ROWS.length && ROWS[0].length
  const tw = hasRows ? ROWS[0].length : 0, th = ROWS.length
  if (PRINT === "jersey") { if (hasRows) { c.grid(50 - (tw >> 1), 217 + 1, ROWS.join("\n").replace(/o/g, "i")); c.grid(50 - (tw >> 1), 217, ROWS.join("\n").replace(/o/g, col)) } return }
  // 깃 아래 한 줄: [마크] 글씨. 후드티는 접힌 모자가 등을 덮어 글씨만 아래에
  const hoodie = STU.top === "hoodie", mark = PRINT === "crest" ? "crest" : STU.college
  const total = (hoodie ? 0 : 12) + tw, x0 = 50 - (total >> 1), y = hoodie ? 236 - th - 1 : 221 + Math.max(0, (11 - th) >> 1)
  if (!hoodie) emblem(c, x0 + 1, 221 + 1, mark, col)
  if (hasRows) { const x = x0 + (hoodie ? 0 : 12); c.grid(x, y + 1, ROWS.join("\n").replace(/o/g, "i")); c.grid(x, y, ROWS.join("\n").replace(/o/g, col)) }
}
function drawStudent(c, pose) {
  const P = POSES[pose] || POSES.idle
  backItem(c, "behind")
  heldItem(c, P)
  const top = STU.top
  // 몸통
  c.poly([12, 236, 16, 221, 34, 214, 66, 214, 84, 219, 92, 236], top === "flannel" || top === "hoodie" || top === "hood_up" || top === "clubtee" || top === "vest" ? "j" : "j")
  if (top === "flannel") {                                           // 체크무늬: 색 2의 굵은 줄 + 어두운 가는 줄
    c.clip([12, 236, 16, 221, 34, 214, 66, 214, 84, 219, 92, 236], () => {
      for (let x = 14; x < 92; x += 10) { c.rect(x, 214, 3, 22, "y"); c.vline(x + 6, 214, 22, "i") }
      for (let y = 218; y < 236; y += 9) { c.hline(10, y, 84, "y"); c.hline(10, y + 1, 84, "y"); c.hline(10, y + 5, 84, "i") }
    })
  }
  if (top === "vest") { for (let y = 219; y < 236; y += 5) c.line(16, y, 88, y + 1, "i"); c.line(50, 214, 50, 236, "!") }
  c.shade([12, 236, 16, 221, 26, 217, 30, 236]); c.light([36, 214, 64, 214, 60, 218, 40, 218])
  if (top !== "flannel") backPrint(c, top === "clubtee" || top === "hoodie" || top === "hood_up" ? "y" : "o")
  if (top === "hoodie") { c.poly([32, 214, 68, 214, 62, 228, 38, 228], "i"); c.poly([36, 214, 64, 214, 59, 224, 41, 224], "J"); c.line(44, 228, 43, 235, "y"); c.line(56, 228, 57, 235, "y") }
  backItem(c, "front")
  if (P.L) sleeveArm(c, ...P.L, false)
  else if (top === "clubtee") { c.poly([12, 228, 14, 222, 26, 216, 26, 226], "j"); c.poly([10, 236, 12, 228, 26, 226, 24, 236], "I") }
  else { c.poly([10, 236, 14, 222, 26, 216, 24, 236], SLV[top] || "y"); c.shade([10, 236, 14, 222, 18, 220, 16, 236]) }
  sleeveArm(c, ...P.R, true)
  const no = String(ST.no ?? "19").replace(/[^0-9]/g, "").slice(0, 2) || "19"
  if (!P.L && top.startsWith("jamba")) { const [tx, ty] = mid(P.R[0], P.R[1], 0.5).map(Math.round); c.text(tx - 4, ty - 3, no, "j") }
  // 목과 깃
  c.rect(44, 210, 12, 6, "0")
  if (top === "jamba") { c.rect(34, 214, 32, 4, "y"); c.hline(34, 216, 32, "j") }
  if (top === "jamba_up") { c.poly([34, 218, 36, 206, 64, 206, 66, 218], "y"); c.hline(35, 212, 30, "j"); c.hline(35, 215, 30, "j") }
  if (top === "flannel" || top === "vest") { c.poly([38, 214, 50, 220, 62, 214, 58, 210, 50, 214, 42, 210], top === "vest" ? "y" : "J") }
  if (top === "clubtee") c.poly([38, 213, 62, 213, 58, 218, 42, 218], "J")
  if (STU.neck === "lanyard") { c.line(40, 216, 45, 211, "U"); c.line(55, 211, 60, 216, "U"); c.hline(45, 211, 10, "U") }
  // 머리
  const hood = top === "hood_up"
  if (!hood) { c.poly([30, 198, 34, 196, 34, 208, 31, 207], "I"); c.poly([70, 198, 66, 196, 66, 208, 69, 207], "0") }
  const hair = STU.hair
  if (hood) {
    c.poly([30, 214, 28, 196, 34, 182, 50, 176, 66, 182, 72, 196, 70, 214], "j"); c.poly([34, 186, 50, 180, 66, 186, 64, 196, 50, 192, 36, 196], "J")
    c.line(50, 178, 50, 212, "i"); c.shade([50, 178, 66, 182, 72, 196, 70, 214, 50, 214])
  } else if (hair === "buzz") {
    c.poly([35, 204, 35, 190, 40, 184, 60, 184, 65, 190, 65, 204, 60, 211, 40, 211], "H")
    for (let k = 0; k < 14; k++) c.px(37 + (k * 7) % 27, 187 + (k * 5) % 20, "h")
    c.poly([40, 184, 52, 184, 38, 196, 35, 196, 35, 190], "h")
  } else if (hair === "twoblock") {                                   // 투블럭: 옆·뒤는 짧게 밀고 윗머리만 길다
    c.poly([35, 206, 35, 194, 65, 194, 65, 206, 60, 211, 40, 211], "h"); for (let k = 0; k < 12; k++) c.px(37 + (k * 7) % 27, 197 + (k * 5) % 12, "H")
    c.poly([33, 197, 34, 186, 40, 180, 60, 180, 66, 186, 67, 197, 60, 195, 40, 195], "H"); c.poly([40, 180, 50, 180, 38, 194, 34, 194, 34, 186], "h"); c.line(44, 186, 48, 182, "1")
  } else if (hair === "long") {                                       // 긴 생머리: 등까지 일자로
    c.poly([32, 206, 32, 189, 40, 180, 60, 180, 68, 189, 68, 206, 69, 219, 31, 219], "H")
    c.poly([40, 180, 48, 180, 38, 200, 36, 219, 31, 219, 32, 189], "h"); c.line(44, 190, 42, 218, "1"); c.line(56, 190, 58, 218, "h"); c.line(50, 184, 50, 218, "H")
  } else if (hair === "bob") {                                        // 단발: 목덜미에서 일자로
    c.poly([32, 206, 32, 189, 40, 181, 60, 181, 68, 189, 68, 214, 32, 214], "H")
    c.poly([40, 181, 48, 181, 38, 200, 37, 214, 32, 214, 32, 189], "h"); c.line(44, 192, 43, 213, "1"); c.line(57, 192, 58, 213, "h")
  } else if (hair === "ponytail" || hair === "clip") {                 // 묶은 머리: 깔끔한 뒤통수 + 꼬리 또는 집게핀
    c.poly([34, 204, 34, 189, 40, 182, 60, 182, 66, 189, 66, 204, 60, 213, 40, 213], "H")
    c.poly([40, 182, 50, 182, 38, 197, 34, 197, 34, 189], "h"); c.line(42, 186, 50, 192, "1"); c.line(58, 186, 50, 192, "h")
    if (hair === "ponytail") { c.poly([46, 194, 54, 194, 57, 207, 53, 222, 47, 222, 43, 207], "H"); c.poly([46, 194, 50, 194, 47, 207, 48, 222, 47, 222, 43, 207], "h"); c.rect(46, 191, 8, 3, "R") }
    else { c.poly([42, 188, 58, 188, 60, 200, 40, 200], "h"); c.line(44, 190, 56, 198, "H"); c.rect(39, 193, 22, 3, "$"); for (let x = 40; x < 61; x += 3) c.px(x, 196, "@"); c.px(40, 193, "!") }
  } else {
    c.poly([34, 204, 34, 189, 40, 182, 60, 182, 66, 189, 66, 204, 60, 213, 40, 213], "H")
    if (hair === "capmark") {                                       // 모자 자국: 납작한 정수리와 눌린 띠
      c.poly([36, 186, 40, 182, 60, 182, 64, 186], "h"); c.hline(34, 192, 33, "K"); c.hline(34, 193, 33, "1")
      c.poly([33, 196, 30, 192, 36, 194], "H"); c.poly([67, 196, 70, 192, 64, 194], "H")
    } else {
      c.poly([37, 185, 34, 179, 42, 183], "H"); c.poly([44, 183, 45, 176, 50, 182], "H")
      c.poly([53, 182, 58, 177, 59, 183], "H"); c.poly([62, 185, 68, 183, 65, 190], "H")
      c.line(56, 182, 60, 173, "h"); c.line(60, 173, 63, 172, "h")
      c.poly([40, 182, 50, 182, 38, 197, 34, 197, 34, 189], "h")
      c.line(38, 189, 44, 184, "1"); c.line(36, 193, 39, 190, "1"); c.line(45, 186, 48, 183, "1")
      c.line(42, 197, 47, 203, "H"); c.line(50, 190, 54, 199, "h"); c.line(58, 192, 62, 201, "h")
    }
    if (hair === "pudding") { c.poly([44, 182, 56, 182, 54, 192, 46, 192], "v"); c.line(50, 182, 50, 194, "K") }
    if (hair === "bun") { c.poly([42, 176, 46, 170, 54, 170, 58, 176, 56, 182, 44, 182], "H"); c.poly([44, 174, 48, 171, 52, 171, 50, 176], "h"); c.line(40, 168, 62, 182, "o"); c.px(40, 168, "R"); c.px(62, 182, "K") }
  }
  if (!hood && STU.hstate === "static") for (const [x0, y0, x1, y1] of [[36, 186, 28, 176], [44, 182, 40, 168], [52, 180, 54, 166], [60, 183, 68, 170], [65, 190, 74, 184]]) c.line(x0, y0, x1, y1, "h")
  if (!hood && STU.hstate === "gray") for (const [x0, y0, x1, y1] of [[40, 190, 44, 200], [52, 186, 55, 196], [58, 196, 60, 204], [46, 204, 48, 210]]) c.line(x0, y0, x1, y1, "!")
  if (!hood) { c.shade([60, 182, 66, 189, 66, 204, 60, 213, 54, 213, 60, 196]); c.shade([34, 207, 66, 207, 60, 213, 40, 213]) }
  // 머리에 쓰는 것
  if (STU.head === "phones") {
    for (const [x0, y0, x1, y1] of [[33, 200, 35, 186], [35, 186, 42, 179], [42, 179, 58, 179], [58, 179, 65, 186], [65, 186, 67, 200]]) { c.line(x0, y0, x1, y1, "$"); c.line(x0 + 1, y0, x1 + 1, y1, "$") }
    c.poly([27, 194, 34, 192, 35, 208, 28, 208], "@"); c.poly([73, 194, 66, 192, 65, 208, 72, 208], "@")
    c.rect(28, 195, 2, 12, "$"); c.rect(70, 195, 2, 12, "$"); c.px(30, 196, "!"); c.px(71, 196, "!")
  }
  if (STU.head === "bone") { c.line(32, 204, 50, 208, "@"); c.line(50, 208, 68, 204, "@"); c.rect(30, 198, 3, 5, "$"); c.rect(67, 198, 3, 5, "$") }
}
for (const pose of Object.keys(POSES)) sprite("stu_" + pose, { w: 180, h: 236, outline: "K" }, (c) => drawStudent(c, pose))

// ================================================================ 학생 얼굴 초상화 (34×34): 다크서클 1~5단계 × 표정
const FACE = { eyes: ST.eyes || "tired", red: ST.red === "yes", mouth: ST.mouth || "none" }
function drawPortrait(c, lv, mood) {
  c.rect(0, 0, 34, 34, "K"); c.rect(1, 1, 32, 32, mood === "hurt" ? "Q" : "b")
  const hood = STU.top === "hood_up"
  if (hood) c.poly([3, 33, 3, 12, 8, 4, 26, 4, 31, 12, 31, 33], "j")
  c.poly([8, 14, 12, 9, 22, 9, 26, 14, 27, 25, 22, 31, 12, 31, 7, 25], "I")
  if (!hood) { c.poly([4, 18, 7, 17, 7, 25, 5, 24], "I"); c.poly([30, 18, 27, 17, 27, 25, 29, 24], "0") }
  c.shade([23, 9, 26, 14, 27, 25, 22, 31, 20, 31, 24, 20])
  const hair = STU.hair
  if (hood) c.poly([8, 13, 9, 8, 25, 8, 26, 13, 21, 11, 13, 11], "H")
  else if (hair === "buzz") c.poly([7, 14, 8, 8, 13, 5, 21, 5, 26, 8, 27, 14, 23, 10, 11, 10], "H")
  else if (hair === "twoblock") { c.poly([7, 16, 7, 11, 9, 11, 9, 16], "h"); c.poly([25, 16, 25, 11, 27, 11, 27, 16], "h"); c.poly([6, 11, 8, 4, 26, 4, 28, 11, 22, 9, 15, 12, 12, 9], "H"); c.line(10, 5, 14, 9, "h") }
  else if (hair === "long" || hair === "bob") {
    const by = hair === "long" ? 33 : 27
    c.poly([4, by, 4, 10, 10, 4, 24, 4, 30, 10, 30, by, 27, by, 27, 14, 22, 10, 12, 10, 7, 14, 7, by], "H")
    if (hair === "bob") c.poly([7, 14, 9, 8, 25, 8, 27, 14, 22, 12, 17, 13, 12, 12], "H"); else c.line(17, 4, 17, 9, "K")
    c.line(5, 12, 5, by - 1, "h")
    if (STU.hstate === "gray") { c.px(12, 7, "!"); c.px(25, 10, "!") }
  } else if (hair === "ponytail" || hair === "clip") {
    if (hair === "ponytail") { c.poly([26, 8, 32, 10, 32, 24, 29, 22, 28, 12], "H"); c.px(27, 9, "R"); c.px(28, 9, "R") }
    c.poly([6, 15, 6, 9, 11, 5, 23, 5, 28, 9, 28, 15, 24, 11, 10, 11], "H"); c.line(10, 6, 15, 10, "h")
    if (hair === "clip") { c.rect(11, 2, 12, 3, "$"); c.px(12, 5, "@"); c.px(16, 5, "@"); c.px(20, 5, "@") }
    if (STU.hstate === "static") { c.line(6, 9, 2, 2, "h"); c.line(28, 9, 32, 2, "h") }
  }
  else {
    c.poly([6, 16, 6, 9, 11, 5, 23, 5, 28, 9, 28, 16, 25, 12, 20, 14, 15, 11, 10, 14], "H")
    if (hair === "capmark") { c.poly([7, 9, 11, 5, 23, 5, 27, 9], "h"); c.hline(6, 10, 23, "K") }
    else { c.poly([7, 10, 3, 4, 11, 6], "H"); c.poly([16, 6, 19, 1, 21, 6], "H"); c.poly([24, 7, 31, 3, 28, 11], "H") }
    if (hair === "pudding") c.poly([13, 5, 21, 5, 19, 8, 15, 8], "v")
    if (hair === "bun") { c.poly([13, 4, 15, 1, 20, 1, 22, 4], "H"); c.line(10, 1, 25, 5, "o") }
    if (STU.hstate === "static") { c.line(6, 9, 2, 2, "h"); c.line(28, 9, 32, 2, "h"); c.line(17, 5, 17, 0, "h") }
    if (STU.hstate === "gray") { c.px(12, 7, "!"); c.px(20, 6, "!"); c.px(25, 10, "!") }
  }
  if (STU.head === "phones") { c.hline(7, 4, 21, "$"); c.line(6, 5, 4, 14, "$"); c.line(28, 5, 30, 14, "$"); c.rect(2, 15, 4, 9, "@"); c.rect(28, 15, 4, 9, "@") }
  // 눈
  const eyeL = 10, eyeR = 20
  if (mood === "win") { c.line(10, 20, 12, 18, "K"); c.line(12, 18, 14, 20, "K"); c.line(20, 20, 22, 18, "K"); c.line(22, 18, 24, 20, "K") }
  else if (mood === "hurt") { c.line(10, 18, 14, 21, "K"); c.line(14, 18, 10, 21, "K"); c.line(20, 18, 24, 21, "K"); c.line(24, 18, 20, 21, "K") }
  else if (FACE.eyes === "dead") { for (const x of [eyeL, eyeR]) { c.rect(x, 18, 5, 3, "X"); c.px(x + (x === eyeL ? 0 : 4), 19, "K"); c.hline(x, 17, 5, "K") } }
  else if (FACE.eyes === "crazy") { for (const x of [eyeL, eyeR]) { c.rect(x, 17, 5, 4, "X"); c.rect(x + 2, 18, 2, 2, "U"); c.px(x + 2, 18, "K") } }
  else if (FACE.eyes === "calc") { for (const x of [eyeL, eyeR]) { c.rect(x, 17, 5, 4, "n"); c.text(x + 1, 16, x === eyeL ? "4" : "5", "N") } }
  else {
    const es = STU.eyeshape
    if (es === "sharp") { c.line(10, 18, 14, 19, "K"); c.line(20, 19, 24, 18, "K"); c.px(9, 17, "K"); c.px(25, 17, "K") }
    else if (es === "droopy") { c.line(10, 20, 14, 19, "K"); c.line(20, 19, 24, 20, "K"); c.px(9, 21, "K"); c.px(25, 21, "K") }
    else if (es === "big") { for (const x of [eyeL, eyeR]) { c.rect(x, 18, 5, 3, "X"); c.hline(x, 17, 5, "K"); c.rect(x + (x === eyeL ? 2 : 1), 19, 2, 2, "K"); c.px(x + (x === eyeL ? 2 : 1), 19, "X") } }
    else c.hline(10, 19, 5, "K"), c.hline(20, 19, 5, "K")
    if (lv >= 4 && es !== "big") { c.hline(10, 20, 5, "D"); c.hline(20, 20, 5, "D") }
  }
  if (STU.gender === "f" && mood !== "hurt") { c.px(9, 17, "K"); c.px(8, 16, "K"); c.px(25, 17, "K"); c.px(26, 16, "K") }
  if (FACE.eyes === "tears" && mood !== "win") { c.rect(9, 21, 2, 3, "Z"); c.rect(24, 21, 2, 4, "Z"); c.px(24, 25, "b") }
  if (FACE.red && mood === "idle" && FACE.eyes !== "calc") { c.px(eyeL, 18, "U"); c.px(eyeR + 4, 18, "U") }
  for (let k = 0; k < Math.min(lv, 5); k++) {                         // 다크서클: 단계마다 한 줄씩 아래로
    const y = 21 + k + (FACE.eyes === "crazy" ? 1 : 0), wv = Math.max(2, 5 - Math.floor(k / 2))
    c.hline(10, y, wv, "D"); c.hline(20, y, wv, "D")
  }
  // 입
  const m = FACE.mouth
  if (m === "mask" || m === "gasmask") {
    c.poly([7, 23, 27, 23, 26, 30, 21, 32, 13, 32, 8, 30], m === "gasmask" ? "$" : "m")
    if (m === "gasmask") { c.rect(9, 26, 5, 5, "@"); c.rect(20, 26, 5, 5, "@"); c.rect(14, 28, 6, 4, "m"); c.px(11, 28, "K"); c.px(22, 28, "K") }
    else { c.line(7, 23, 4, 20, "x"); c.line(27, 23, 30, 20, "x") }
  } else {
    if (mood === "win") { c.hline(14, 27, 6, "K"); c.hline(15, 28, 4, "7") }
    else if (mood === "hurt") c.rect(15, 26, 4, 3, "7")
    else c.rect(15, 27, 4, lv >= 4 ? 3 : 2, "d")
    if (m === "chinmask") { c.poly([9, 29, 25, 29, 23, 33, 11, 33], "x"); c.line(9, 29, 5, 24, "x"); c.line(25, 29, 29, 24, "x") }
    if (m === "patch") c.rect(19, 26, 3, 3, "p")
    if (m === "pen") { c.line(16, 28, 30, 25, "=") ; c.px(30, 25, "!") }
    if (m === "bar") { c.poly([14, 27, 22, 28, 28, 25, 26, 29, 15, 30], "O"); c.hline(20, 28, 5, "8") }
    if (m === "nose") { c.rect(17, 22, 3, 4, "x"); c.px(15, 25, "U"); c.px(15, 26, "U") }
  }
  if (lv >= 3 && FACE.eyes !== "tears") c.poly([28, 13, 29, 15, 28, 17, 27, 15], "b")
}
for (let lv = 1; lv <= 5; lv++) for (const mood of ["idle", "hurt", "win"]) sprite(`por_${lv}_${mood}`, { w: 34, h: 34 }, (c) => drawPortrait(c, lv, mood))

// ================================================================ 동료 (학생 옆에서 가끔 교수님을 친다): 2장씩 (가만히, 공격)
const PETS = {
  rc: (c, a) => { c.poly([2, 10, 4, 5, 16, 5, 20, 10], "U"); c.rect(3, 10, 18, 3, "7"); c.rect(3, 12, 4, 4, "K"); c.rect(16, 12, 4, 4, "K"); c.rect(8, 6, 6, 3, "b"); if (a) { c.line(21, 8, 25, 6, "^"); c.line(21, 11, 26, 11, "^") } },
  drone: (c, a) => { c.rect(6, 7, 12, 5, "$"); c.rect(9, 8, 6, 2, "N"); c.hline(0, 5, 8, "@"); c.hline(16, 5, 8, "@"); c.rect(3, 3, 3, 2, "!"); c.rect(18, 3, 3, 2, "!"); c.rect(10, 12, 4, 2, "K"); if (a) c.line(12, 14, 12, 19, "U") },
  penguin: (c, a) => { c.poly([7, 2, 15, 2, 18, 8, 18, 17, 4, 17, 4, 8], "~"); c.poly([8, 7, 14, 7, 15, 16, 7, 16], "X"); c.rect(8, 4, 2, 2, "K"); c.rect(12, 4, 2, 2, "K"); c.poly([10, 6, 13, 6, 11, 8], "O"); for (let y = 3; y < 17; y += 3) c.hline(4, y, 15, "b"); if (a) c.text(18, 1, "$", "~") },
  owl: (c, a) => { c.poly([4, 4, 8, 1, 12, 4, 16, 1, 20, 4, 20, 16, 12, 19, 4, 16], "p"); c.line(4, 4, 20, 16, "l"); c.line(20, 4, 4, 16, "l"); c.rect(7, 7, 3, 3, "K"); c.rect(14, 7, 3, 3, "K"); c.poly([11, 10, 13, 10, 12, 13], "O"); if (a) { c.line(20, 8, 24, 6, "p"); c.line(20, 10, 25, 10, "p") } },
  rat: (c, a) => { c.poly([4, 10, 7, 6, 15, 6, 19, 10, 15, 13, 5, 13], "X"); c.rect(16, 7, 2, 2, "U"); c.rect(14, 4, 3, 3, "Q"); c.line(4, 11, 0, 14, "Q"); c.line(0, 14, 0, 17, "Q"); c.text(1, 14, "19", "K"); if (a) { c.line(19, 10, 23, 8, "X"); c.line(19, 11, 23, 12, "X") } },
  bust: (c, a) => { c.poly([6, 2, 14, 2, 17, 7, 17, 13, 14, 16, 18, 20, 2, 20, 6, 16, 3, 13, 3, 7], "x"); c.shade([12, 2, 14, 2, 17, 7, 17, 13, 14, 16, 18, 20, 12, 20]); c.rect(6, 8, 2, 1, "K"); c.rect(12, 8, 2, 1, "K"); c.poly([9, 9, 11, 9, 10, 12], "@"); if (a) { c.line(7, 8, 24, 2, "U"); c.line(13, 8, 26, 4, "U") } },
}
for (const [k, fn] of Object.entries(PETS)) for (const a of [0, 1]) sprite(`pet_${k}_${a}`, { w: 28, h: 22, outline: "K" }, (c) => fn(c, a))

// ================================================================ 랩장 (소환수, 정면)
sprite("grad", { w: 60, h: 90, outline: "K" }, (c) => {
  c.poly([6, 90, 10, 46, 30, 40, 50, 46, 54, 90], "G"); c.shade([6, 90, 10, 46, 20, 44, 18, 90])          // 야전침대 망토
  c.poly([14, 90, 16, 50, 30, 46, 44, 50, 46, 90], "X"); c.poly([30, 46, 44, 50, 46, 90, 32, 90], "l")   // 실험 가운
  c.poly([26, 46, 34, 46, 30, 60], "M")
  for (const [x, y] of [[24, 56], [28, 60], [33, 58]]) c.rect(x, y, 3, 4, "o")                         // 연구실 열쇠 꾸러미
  c.line(22, 46, 26, 56, "@"); c.line(38, 46, 34, 58, "@")
  c.poly([18, 22, 22, 14, 38, 14, 42, 22, 42, 36, 36, 44, 24, 44, 18, 36], "C")                         // 핏기 없는 얼굴
  c.shade([34, 14, 38, 14, 42, 22, 42, 36, 36, 44, 32, 44, 37, 30])
  c.poly([16, 24, 16, 14, 22, 8, 40, 8, 44, 14, 44, 26, 40, 18, 32, 20, 24, 16, 20, 22], "H")
  c.poly([18, 10, 14, 4, 24, 8], "H"); c.poly([34, 8, 40, 2, 42, 10], "H")
  c.box(20, 25, 9, 6, "K"); c.box(31, 25, 9, 6, "K"); c.hline(29, 27, 2, "K"); c.line(22, 26, 27, 30, "X")   // 금 간 네모 안경
  c.hline(22, 28, 5, "K"); c.hline(33, 28, 5, "K")
  for (let k = 0; k < 4; k++) { c.hline(21, 32 + k, 7 - k, "D"); c.hline(32, 32 + k, 7 - k, "D") }          // 다크서클 5단계
  c.hline(27, 39, 6, "K")
  const gt = PO.grad || "shield"
  if (gt === "attack") {                                                  // 공격형: 빨간 펜과 감점표
    c.rect(2, 58, 14, 16, "p"); c.hline(3, 61, 12, "R"); c.text(4, 64, "-4", "R"); c.line(48, 70, 58, 52, "R"); c.line(49, 70, 59, 52, "r"); c.px(58, 51, "K")
  } else if (gt === "heal") {                                             // 회복형: 결재 도장과 결재 서류
    c.rect(4, 62, 10, 13, "p"); c.hline(5, 65, 8, "l"); c.hline(5, 68, 8, "l"); c.rect(6, 70, 5, 4, "R")
    c.rect(48, 52, 6, 10, "v"); c.rect(46, 62, 10, 5, "r"); c.rect(46, 66, 10, 2, "R")
  } else {
    c.rect(46, 60, 8, 10, "x"); c.rect(46, 60, 8, 2, "@"); c.rect(44, 64, 3, 4, "x"); c.px(49, 58, "l"); c.px(51, 56, "l")   // 커피
    c.rect(4, 62, 10, 13, "p"); c.hline(5, 65, 8, "l"); c.hline(5, 68, 8, "l"); c.hline(5, 71, 6, "l")              // 결재 서류
  }
})

// ================================================================ 작은 그림들
sprite("cap_c", { w: 9, h: 9, outline: "K" }, (c) => { c.rect(0, 0, 9, 9, "x"); c.rect(0, 7, 9, 2, "l"); c.text(3, 1, "C", "K") })
sprite("cap_v", { w: 9, h: 9, outline: "K" }, (c) => { c.rect(0, 0, 9, 9, "x"); c.rect(0, 7, 9, 2, "l"); c.text(3, 1, "V", "K") })
sprite("cap_ctrl", { w: 19, h: 9, outline: "K" }, (c) => { c.rect(0, 0, 19, 9, "x"); c.rect(0, 7, 19, 2, "l"); c.text(2, 1, "CTRL", "K") })
sprite("cap_blank", { w: 6, h: 6, outline: "K" }, (c) => { c.rect(0, 0, 6, 6, "x"); c.hline(0, 5, 6, "l") })
sprite("aplus_core", { w: 21, h: 14 }, (c) => {
  c.line(1, 13, 7, 1, "R"); c.line(2, 13, 8, 1, "R"); c.line(8, 1, 13, 13, "R"); c.line(9, 1, 14, 13, "R")
  c.line(3, 9, 12, 7, "R"); c.line(3, 10, 12, 8, "R")
  c.vline(17, 1, 8, "R"); c.vline(18, 1, 8, "R"); c.hline(14, 4, 8, "R"); c.hline(14, 5, 8, "R")
})
sprite("aplus_w", { base: "aplus_core", outline: "X" })
sprite("aplus", { base: "aplus_w", outline: "K" })

sprite("ic_wire", { w: 28, h: 28 }, (c) => {
  c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p")
  const PT = { R: [[5, 7], [10, 19], [15, 9], [20, 20], [24, 12]], N: [[5, 19], [11, 8], [15, 18], [21, 7], [24, 16]], Z: [[5, 13], [9, 10], [14, 16], [19, 11], [24, 22]] }
  for (const [col, pts] of Object.entries(PT)) for (let i = 0; i + 1 < pts.length; i++) c.line(...pts[i], ...pts[i + 1], col)
  for (const y of [6, 12, 18]) { c.rect(2, y, 3, 3, "m"); c.px(1, y + 1, "@") }
  c.rect(23, 21, 3, 3, "m"); c.box(8, 11, 9, 7, "K")
})
// 간호대·의대 스킬 아이콘
const ICO = (name, fn) => sprite(name, { w: 28, h: 28 }, (c) => { c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p"); fn(c) })
ICO("ic_bandage", (c) => { c.poly([4, 18, 16, 4, 24, 10, 12, 24], "X"); c.poly([4, 18, 16, 4, 18, 6, 6, 20], "l"); for (const [x, y] of [[11, 13], [14, 10], [14, 16], [17, 13]]) c.rect(x, y, 2, 2, "@") })
ICO("ic_nightshift", (c) => { c.poly([8, 4, 14, 4, 10, 10, 12, 18, 18, 22, 10, 24, 5, 18, 4, 10], "^"); c.rect(17, 6, 7, 7, "m"); c.rect(18, 7, 5, 5, "V"); c.text(18, 15, "3", "K"); c.px(20, 9, "N"); c.px(21, 9, "N") })
ICO("ic_codeblue", (c) => { c.rect(3, 5, 22, 16, "m"); c.rect(4, 6, 20, 14, "V"); for (const [x0, y0, x1, y1] of [[5, 14, 10, 14], [10, 14, 12, 8], [12, 8, 15, 19], [15, 19, 17, 14], [17, 14, 23, 14]]) c.line(x0, y0, x1, y1, "N"); c.rect(9, 22, 10, 3, "U") })
ICO("ic_anesthesia", (c) => { c.poly([4, 22, 6, 24, 20, 10, 18, 8], "x"); c.poly([7, 19, 9, 21, 17, 13, 15, 11], "Z"); c.line(19, 9, 24, 4, "!"); c.rect(2, 22, 4, 4, "$"); c.text(18, 16, "Z", "Z") })
ICO("ic_rounds", (c) => { c.poly([8, 4, 20, 4, 22, 24, 6, 24], "X"); c.poly([12, 4, 16, 4, 14, 10], "B"); c.line(14, 10, 14, 22, "@"); c.rect(17, 14, 4, 4, "R"); c.rect(7, 8, 3, 6, "x") })
ICO("ic_surgery", (c) => { c.poly([4, 4, 24, 4, 22, 9, 6, 9], "!"); c.poly([7, 9, 21, 9, 19, 11, 9, 11], "^"); c.line(6, 24, 20, 14, "@"); c.poly([18, 13, 24, 9, 22, 15], "x"); c.line(8, 18, 12, 22, "U"); c.line(12, 16, 16, 20, "U") })
ICO("ic_objection", (c) => { c.poly([4, 14, 14, 10, 22, 10, 22, 14, 14, 14, 16, 22, 10, 22, 6, 18], "S"); c.poly([14, 10, 22, 10, 22, 14, 14, 14], "L"); c.rect(23, 4, 2, 10, "U"); c.rect(23, 16, 2, 2, "U") })
ICO("ic_counsel", (c) => { c.rect(4, 9, 20, 14, "?"); c.rect(4, 9, 20, 3, ">"); c.rect(10, 5, 8, 4, "?"); c.rect(12, 7, 4, 2, "p"); c.rect(12, 14, 4, 3, "o") })
ICO("ic_verdict", (c) => { c.poly([6, 6, 16, 2, 20, 10, 10, 14], "w"); c.poly([6, 6, 16, 2, 17, 4, 7, 8], "W"); c.line(15, 12, 23, 22, "v"); c.line(16, 12, 24, 22, "v"); c.rect(3, 22, 16, 3, "?") })
ICO("ic_rollcall", (c) => { c.rect(5, 3, 18, 22, "n"); c.rect(8, 6, 13, 16, "p"); for (let k = 0; k < 4; k++) { c.hline(10, 9 + k * 4, 6, "K"); c.rect(18, 8 + k * 4, 2, 2, "R") } })
ICO("ic_sticker", (c) => { c.poly([14, 3, 17, 10, 25, 10, 19, 15, 21, 23, 14, 18, 7, 23, 9, 15, 3, 10, 11, 10], "^"); c.poly([14, 3, 17, 10, 14, 12, 11, 10], "o"); c.rect(12, 12, 4, 2, "R") })
ICO("ic_chalkstorm", (c) => { c.rect(1, 21, 26, 6, "G"); for (const [x, y] of [[3, 14], [10, 9], [17, 4], [7, 2], [19, 15]]) { c.poly([x, y + 6, x + 6, y, x + 8, y + 2, x + 2, y + 8], "X"); c.poly([x, y + 6, x + 2, y + 4, x + 4, y + 6, x + 2, y + 8], "c") } })
ICO("ic_meeting", (c) => { c.rect(4, 13, 20, 5, "w"); c.rect(6, 18, 2, 6, "v"); c.rect(20, 18, 2, 6, "v"); for (const x of [3, 11, 19]) c.rect(x, 6, 6, 6, "B"); c.rect(9, 3, 10, 3, "U") })
ICO("ic_compound", (c) => { c.rect(3, 22, 22, 2, "K"); for (let k = 0; k < 5; k++) c.rect(4 + k * 4, 21 - (k + 1) * (k + 1) / 1.6, 3, (k + 1) * (k + 1) / 1.6, "N"); c.rect(16, 3, 2, 2, "n"); c.line(16, 9, 22, 3, "n"); c.rect(21, 8, 2, 2, "n") })
ICO("ic_ipo", (c) => { c.rect(3, 3, 22, 22, "V"); c.line(5, 21, 11, 15, "N"); c.line(11, 15, 15, 17, "N"); c.line(15, 17, 23, 5, "N"); c.poly([19, 5, 24, 4, 23, 9], "N") })
ICO("ic_leaflet", (c) => { c.rect(6, 3, 16, 22, "X"); c.rect(6, 3, 16, 4, "U"); for (let y = 10; y < 23; y += 3) c.hline(8, y, 12 - (y % 4), "@") })
ICO("ic_vitamin", (c) => { c.rect(9, 3, 10, 4, "X"); c.rect(7, 7, 14, 18, "O"); c.rect(9, 11, 10, 8, "X"); c.text(11, 12, "C", "O") })
ICO("ic_pillrain", (c) => { for (const [x, y, col] of [[4, 4, "U"], [14, 8, "Z"], [8, 15, "^"], [18, 18, "N"]]) { c.poly([x, y + 4, x + 4, y, x + 8, y + 3, x + 4, y + 7], col); c.poly([x + 2, y + 2, x + 4, y, x + 8, y + 3, x + 6, y + 5], "X") } })
ICO("ic_yellow", (c) => { c.rect(8, 3, 13, 20, "K"); c.rect(9, 4, 11, 18, "^"); c.poly([4, 22, 10, 16, 14, 20, 10, 25], "S") })
ICO("ic_shake", (c) => { c.poly([8, 7, 20, 7, 18, 25, 10, 25], "x"); c.rect(9, 3, 10, 4, "Z"); c.poly([9, 14, 19, 14, 18, 25, 10, 25], "w") })
ICO("ic_relay", (c) => { c.poly([4, 20, 20, 6, 24, 10, 8, 24], "^"); c.poly([4, 20, 20, 6, 21, 7, 5, 21], "o"); c.line(3, 4, 9, 4, "@"); c.line(2, 8, 8, 8, "@") })

sprite("ic_can", { w: 28, h: 28 }, (c) => {
  c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p")
  c.poly([6, 9, 13, 5, 19, 17, 12, 21], "r"); c.poly([6, 9, 13, 5, 14, 7, 7, 11], "l")
  c.poly([8, 12, 14, 9, 16, 13, 10, 16], "X"); c.line(10, 18, 13, 16, "R")
  for (const [x, y] of [[4, 5], [6, 3], [3, 8]]) c.rect(x, y, 2, 2, "7")
  for (const x of [17, 21]) { c.line(x, 18, x + 3, 21, "O"); c.line(x + 3, 21, x, 24, "O") }
})
sprite("ic_push", { w: 28, h: 28 }, (c) => {
  c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p")
  c.rect(3, 6, 9, 18, "m"); for (let y = 8; y < 23; y += 4) { c.hline(4, y, 7, "M"); c.px(9, y + 1, "N") }
  c.poly([19, 3, 26, 11, 22, 11, 22, 23, 16, 23, 16, 11, 12, 11], "U")
  c.rect(18, 13, 2, 5, "X"); c.rect(18, 19, 2, 2, "X")
})

// 단과대별 스킬 아이콘 (28×28). 공대는 위의 점퍼선·원샷·강제 푸시
const ICON = (name, fn) => sprite(name, { w: 28, h: 28 }, (c) => { c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p"); fn(c) })
// 인문대
ICON("ic_postit", (c) => { c.rect(5, 7, 14, 14, "o"); c.rect(9, 4, 14, 14, "^"); c.rect(9, 4, 14, 3, "O"); for (const y of [9, 12, 15]) c.hline(11, y, 9, "R"); c.line(12, 9, 18, 16, "R") })
ICON("ic_pen3", (c) => { c.poly([8, 22, 18, 4, 22, 6, 12, 24], "!"); c.poly([18, 4, 20, 2, 23, 4, 22, 6], "K"); for (const [x, col] of [[9, "R"], [12, "="], [15, "K"]]) c.rect(x, 22 - (x - 9), 2, 2, col); c.poly([8, 22, 12, 24, 8, 26], "$"); c.hline(3, 25, 22, "R") })
ICON("ic_report", (c) => { for (let k = 0; k < 4; k++) { c.rect(5 + k * 2, 6 + k * 2, 14, 16, k === 3 ? "X" : "l"); c.rect(5 + k * 2, 6 + k * 2, 14, 1, "K") } c.text(14, 15, "30", "R"); for (const y of [22, 24]) c.hline(13, y, 8, "@") })
// 사회대
ICON("ic_recorder", (c) => { c.rect(8, 4, 12, 20, "$"); c.rect(10, 6, 8, 6, "@"); for (let y = 7; y < 12; y += 2) c.hline(11, y, 6, "$"); c.rect(10, 15, 8, 3, "N"); c.rect(12, 20, 4, 2, "U"); c.px(13, 16, "6") })
ICON("ic_factcheck", (c) => { c.rect(10, 4, 8, 8, "w"); c.rect(7, 12, 14, 5, "v"); c.rect(5, 17, 18, 4, "R"); c.line(9, 23, 12, 26, "R"); c.line(12, 26, 20, 22, "R"); c.line(10, 23, 12, 25, "R") })
ICON("ic_petition", (c) => { c.poly([4, 11, 10, 11, 20, 5, 20, 23, 10, 17, 4, 17], "U"); c.poly([4, 11, 10, 11, 10, 17, 4, 17], "7"); c.rect(6, 17, 3, 6, "7"); c.line(22, 8, 25, 6, "U"); c.line(22, 14, 26, 14, "U"); c.line(22, 20, 25, 22, "U") })
// 자연대
ICON("ic_lamp", (c) => { c.poly([7, 16, 21, 16, 23, 24, 5, 24], "b"); c.rect(5, 20, 18, 4, "Z"); c.rect(12, 12, 4, 4, "@"); c.poly([11, 12, 14, 3, 17, 12], "O"); c.poly([12, 12, 14, 6, 16, 12], "^") })
ICON("ic_nitrogen", (c) => { c.rect(9, 8, 10, 16, "!"); c.rect(9, 8, 3, 16, "@"); c.rect(11, 5, 6, 3, "$"); for (const [x, y] of [[8, 3], [13, 1], [18, 3], [6, 6], [21, 6]]) c.rect(x, y, 2, 2, "~"); c.text(10, 14, "N", "=") })
ICON("ic_centrifuge", (c) => { c.rect(4, 12, 20, 12, "@"); c.rect(4, 12, 20, 2, "!"); c.rect(7, 16, 14, 6, "$"); for (const [x, y] of [[9, 4], [16, 4], [12, 7]]) { c.rect(x, y, 3, 8, "x"); c.rect(x, y + 5, 3, 3, "Z") } c.line(4, 9, 8, 6, "K"); c.line(24, 9, 20, 6, "K") })
// 예대
ICON("ic_spray", (c) => { c.rect(9, 9, 10, 15, "U"); c.rect(9, 9, 3, 15, "7"); c.rect(11, 5, 6, 4, "!"); c.rect(13, 3, 2, 2, "K"); for (const [x, y, col] of [[18, 2, "Z"], [21, 4, "N"], [20, 7, "o"], [23, 2, "U"], [24, 6, "Z"]]) c.rect(x, y, 2, 2, col) })
ICON("ic_metronome", (c) => { c.poly([8, 24, 11, 4, 17, 4, 20, 24], "w"); c.poly([10, 24, 12, 8, 16, 8, 18, 24], "W"); c.line(14, 20, 20, 6, "K"); c.rect(17, 10, 3, 3, "o"); c.rect(7, 23, 14, 2, "v") })
ICON("ic_canvas", (c) => { c.rect(3, 4, 22, 18, "W"); c.rect(5, 6, 18, 14, "p"); c.rect(7, 9, 5, 4, "Z"); c.rect(13, 12, 6, 5, "U"); c.line(6, 18, 21, 8, "N"); c.line(9, 22, 6, 26, "w"); c.line(19, 22, 22, 26, "w") })

// 미리보기용 (pxl CLI): 기본 꾸미기로 한 장면
scene("preview", { w: 180, h: 236, bg: "k" },
  stamp("room", 0, 0), stamp("prof_arms", -1, -1), stamp("prof_p2", -1, -1), stamp("lectern", -1, -1),
  stamp("grad", 116, 150), stamp("stu_smash", -1, -1), stamp("pet_drone_1", 104, 196))
