// 종강 파이터: 전투 화면 연출 데모 (세로 180×320, 12fps, 5초 반복)
// 순서: 말풍선 공격 예고 → 반박 성공 → 키보드 타격(화면 흔들림·키캡·분필 가루·A+·논리적 비약)
//       → 체력 50% → 2페이즈 도장. 수면량은 내내 18%라 위험 경고가 깜빡인다.
include("mock.px.js")
include("txt.px.js")

// ---------------------------------------------------------------- 글자 스프라이트 (모두 1배 픽셀)
sprite("_aplus_core", { w: 21, h: 14 }, (c) => {                     // 빨간 펜으로 휘갈긴 A+ (2px 획, 둥근 붓 없이)
  c.line(1, 13, 7, 1, "R"); c.line(2, 13, 8, 1, "R"); c.line(8, 1, 13, 13, "R"); c.line(9, 1, 14, 13, "R")
  c.line(3, 9, 12, 7, "R"); c.line(3, 10, 12, 8, "R")
  c.vline(17, 1, 8, "R"); c.vline(18, 1, 8, "R"); c.hline(14, 4, 8, "R"); c.hline(14, 5, 8, "R")
})
sprite("_aplus_w", { base: "_aplus_core", outline: "X" })
sprite("_aplus", { base: "_aplus_w", outline: "K" })
sprite("_o_logic_w", { base: "_t_logic_pen", swap: { X: "R" }, outline: "X" })
sprite("_o_logic", { base: "_o_logic_w", outline: "K" })
sprite("_o_stamp_w", { base: "_t_phase2_stamp", swap: { X: "U" }, outline: "X" })
sprite("_o_stamp", { base: "_o_stamp_w", outline: "7" })
sprite("_o_angry", { base: "_t_angry", outline: "K" })
sprite("_o_parryok", { base: "_t_parryOk", swap: { X: "6" }, outline: "n" })
sprite("_o_parryok2", { base: "_o_parryok", outline: "K" })
sprite("_o_parry", { base: "_t_parry_b", outline: "7" })
sprite("_o_cd", { base: "_t_cd", outline: "K" })
sprite("_o_danger", { base: "_t_danger", outline: "7" })

// 학생 초상화: 기절 직전 (다크서클 5단계, 눈 더 감김)
sprite("_portrait_low", { base: "_portrait" }, (c) => {
  c.hline(10, 19, 5, "D"); c.hline(20, 19, 5, "D"); c.hline(10, 20, 5, "K"); c.hline(20, 20, 5, "K")
  c.hline(9, 23, 6, "D"); c.hline(19, 23, 6, "D"); c.hline(10, 24, 4, "D"); c.hline(20, 24, 4, "D")
  c.rect(15, 27, 4, 3, "7")
})

// 스킬 아이콘: 무슨 효과인지 그림만으로 보이게
sprite("_ic_wire", { w: 28, h: 28 }, (c) => {                         // 엉킨 점퍼선 = 묶기
  c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p")
  const P = { R: [[5, 7], [10, 19], [15, 9], [20, 20], [24, 12]], N: [[5, 19], [11, 8], [15, 18], [21, 7], [24, 16]], Z: [[5, 13], [9, 10], [14, 16], [19, 11], [24, 22]] }
  for (const [col, pts] of Object.entries(P)) for (let i = 0; i + 1 < pts.length; i++) c.line(...pts[i], ...pts[i + 1], col)
  for (const y of [6, 12, 18]) { c.rect(2, y, 3, 3, "m"); c.px(1, y + 1, "E") }   // 듀폰 커넥터와 핀
  c.rect(23, 21, 3, 3, "m")
  c.box(8, 11, 9, 7, "K")                                            // 묶인 매듭: 각진 고리
})
sprite("_ic_can", { w: 28, h: 28 }, (c) => {                          // 원샷 = 속도 상승
  c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p")
  c.poly([6, 9, 13, 5, 19, 17, 12, 21], "r"); c.poly([6, 9, 13, 5, 14, 7, 7, 11], "E")   // 기울인 캔
  c.poly([8, 12, 14, 9, 16, 13, 10, 16], "X"); c.line(10, 18, 13, 16, "R")
  for (const [x, y] of [[4, 5], [6, 3], [3, 8]]) c.rect(x, y, 2, 2, "7")   // 튀는 방울 (네모)
  for (const x of [17, 21]) { c.line(x, 18, x + 3, 21, "O"); c.line(x + 3, 21, x, 24, "O") }   // 속도 화살 >>
})
sprite("_ic_push", { w: 28, h: 28 }, (c) => {                         // 강제 푸시 = 큰 한 방
  c.rect(0, 0, 28, 28, "K"); c.rect(1, 1, 26, 26, "p")
  c.rect(3, 6, 9, 18, "m"); for (let y = 8; y < 23; y += 4) { c.hline(4, y, 7, "M"); c.px(9, y + 1, "N") }
  c.poly([19, 3, 26, 11, 22, 11, 22, 23, 16, 23, 16, 11, 12, 11], "U")   // 위로 밀어 올리는 화살표
  c.rect(18, 13, 2, 5, "X"); c.rect(18, 19, 2, 2, "X")                  // 느낌표
})

const KEYS = "XFaAgGcCvwWdsSLEePTtuBbrRQmMijJYyoHhqxNplZOUD123456789nVz"
const WHITE = Object.fromEntries([...KEYS].map((k) => [k, "X"]))
const SHAKE = { 20: [2, 1], 21: [-2, -1], 22: [1, 1], 23: [-1, 0], 34: [3, 2], 35: [-3, -1], 36: [2, 2], 37: [-2, -1], 38: [1, 0] }
const sh = (f) => SHAKE[f] || [0, 0]
const T0 = 8, PARRY = 15, HIT = 20, PH2 = 34

// 키캡 파편: 위치 = 시작점 + 속도×t + 중력
const CAPS = [["_cap_c", -2.4, -3.4], ["_cap_v", 2.6, -2.8], ["_cap_ctrl", 1.0, -4.2], [null, -1.2, -2.2], [null, 3.4, -1.6], [null, -3.2, -1.2]]
// 말풍선 크기 단계: 작게 → 넘치게 → 살짝 줄고 → 제자리 (통통 튀는 등장)
const POP = { 9: 0.35, 10: 0.8, 11: 1.18, 12: 0.94 }

anim("battle_demo", { w: 180, h: 320, frames: 60, fps: 12 },
  (c) => { const [x, y] = sh(c.frame); c.rect(0, 0, 180, 320, "k"); c.stamp("_room", x, y) },
  layer("prof_shadow", { shade: 2 }, (c) => { const [x, y] = sh(c.frame); c.stamp("_prof", x + 4, y + 3) }),   // 벽·칠판에 떨어지는 교수님 그림자
  (c) => {
    const f = c.frame, [x, y] = sh(f)
    c.stamp("_prof", x - 1, y - 1, f === HIT || f === HIT + 1 ? { swap: { ...WHITE, K: "K" } } : {})
    if (f >= PH2) c.recolor({ b: f % 4 < 2 ? "N" : "6" }, [70 + x, 78 + y, 40, 5])   // 2페이즈: 안경에 터미널 초록빛
    c.stamp("_lectern", x - 1, y - 1)
  },
  layer("lectern_shadow", { shade: 2 }, (c) => {                      // 교탁 위에 떨어지는 몸통·노트북 그림자
    const [x, y] = sh(c.frame)
    c.poly([62 + x, 149 + y, 130 + x, 149 + y, 131 + x, 152 + y, 66 + x, 156 + y], "K"); c.rect(86 + x, 150 + y, 5, 4, "K")
  }),
  layer("student_shadow", { shade: 2 }, (c) => { const [x, y] = sh(c.frame); c.stamp("_student", x + 5, y + 2) }),
  (c) => { const [x, y] = sh(c.frame); c.stamp("_student", x - 1, y - 1) },
  layer("dim", { shade: 1 }, (c) => { if (c.frame >= PH2 && c.frame < PH2 + 12) c.rect(0, 30, 180, 206, "K") }),
  (c) => {
    const f = c.frame, [ox, oy] = sh(f)
    // 공격 예고: 레이저 점선이 흘러가고 조준 꺾쇠가 조여든다
    if (f >= T0 && f < PARRY) {
      for (let i = 0; i < 24; i++) if ((i + f) % 3 !== 0) { const t = i / 24; c.px(Math.round(34 + 10 * t) + ox, Math.round(140 + 46 * t) + oy, "U") }
      const d = Math.max(5, 10 - (f - T0)), col = f >= PARRY - 2 && f % 2 ? "X" : "U"
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        c.hline(dx < 0 ? 44 - d : 44 + d - 2, 189 + dy * d, 3, col); c.vline(44 + dx * d, dy < 0 ? 189 - d : 189 + d - 2, 3, col)
      }
    }
    // 말풍선 등장
    if (f >= 9 && f <= PARRY) {
      const s = POP[f] ?? 1, w = Math.round(66 * s), h = Math.max(4, Math.round(19 * s)), x0 = 145 - Math.floor(w / 2), y0 = 51 - Math.floor(h / 2)
      c.rect(x0, y0, w, h, "X"); c.box(x0 - 1, y0 - 1, w + 2, h + 2, "K")
      if (s >= 1) {
        c.poly([124, 60, 117, 67, 132, 60], "X"); c.line(124, 61, 118, 66, "K"); c.line(118, 66, 131, 61, "K")
        c.stamp("_t_ask", 115, 45, { swap: { X: "K" } })
      }
    }
    // 반박 성공: 말풍선이 각진 조각으로 깨진다
    if (f > PARRY && f <= PARRY + 5) {
      const t = f - PARRY
      for (const [vx, vy, w] of [[-3, -2, 6], [2, -3, 5], [4, 1, 7], [-2, 3, 5], [0, -4, 4], [-4, 1, 6]]) {
        const x = 148 + vx * t, y = 51 + vy * t + t * t * 0.4
        c.poly([x, y, x + w, y + 1, x + 2, y + w - 1], "X"); c.px(Math.round(x), Math.round(y), "K")
      }
    }
    if (f > PARRY && f < PARRY + 9) c.stamp("_o_parryok2", 118, 40 - (f - PARRY))
    // 타격: 하얀 섬광 줄기, 키캡, 분필 가루
    if (f === HIT || f === HIT + 1) for (const [dx, dy] of [[1, 0], [0.7, -0.7], [0, -1], [-0.7, -0.7], [-1, 0], [0.7, 0.7], [-0.7, 0.7]]) {
      const l = f === HIT ? 12 : 7
      c.line(104 + Math.round(dx * 3), 118 + Math.round(dy * 3), 104 + Math.round(dx * l), 118 + Math.round(dy * l), f === HIT ? "X" : "8")
    }
    if (f >= HIT && f < HIT + 12) {
      const t = f - HIT
      for (const [s, vx, vy] of CAPS) {
        const x = Math.round(104 + vx * t), y = Math.round(118 + vy * t + 0.38 * t * t)
        if (s) c.stamp(s, x, y); else { c.rect(x, y, 5, 5, "x"); c.box(x - 1, y - 1, 7, 7, "K"); c.hline(x, y + 4, 5, "E") }
      }
      for (let k = 0; k < 12; k++) { const x = 12 + k * 13 + (k % 3), y = 128 + t + (k % 4) * 2 + Math.floor(t * t * 0.1); if (y < 236) c.rect(x, y, k % 2 + 1, k % 2 + 1, "c") }
    }
    // A+ 도장처럼 쾅, 논리적 비약은 펜으로 써 내려간다
    if (f >= HIT && f < HIT + 14 && !(f >= HIT + 12 && f % 2)) c.stamp("_aplus", 126, f === HIT ? 66 : 70)
    if (f >= HIT + 2 && f < HIT + 14) {
      const reveal = Math.min(1, (f - HIT - 1) / 4)
      c.clip([100, 98, Math.round(76 * reveal), 20], () => c.stamp("_o_logic", 100, 100))
    }
    // 2페이즈: 도장이 위에서 떨어져 박힌다
    if (f >= PH2 && f < PH2 + 12) {
      const y = f === PH2 ? 82 : 94
      if (f === PH2 + 1) { c.box(48, 90, 86, 40, "X"); c.box(46, 88, 90, 44, "X") }
      c.stamp("_o_stamp", 56, y)
      if (f >= PH2 + 2) c.stamp("_o_angry", 46, 132, { swap: { X: f % 2 ? "X" : "6" } })
    }
  },
  // ---------------------------------------------------------------- HUD
  (c) => {
    const f = c.frame
    // 위쪽: 볼트 박힌 철판
    c.rect(0, 0, 180, 32, "2"); c.hline(0, 0, 180, "3"); c.hline(0, 1, 180, "3"); c.hline(0, 31, 180, "4"); c.hline(0, 30, 180, "4")
    for (const [x, y] of [[2, 3], [176, 3], [2, 27], [176, 27]]) { c.rect(x, y, 2, 2, "5"); c.px(x + 1, y + 1, "4") }
    c.stamp("_t_boss", 7, 4, { swap: { X: "4" } }); c.stamp("_t_boss", 6, 3)
    if (f < HIT) c.stamp("_t_phaseHud", 100, 5, { swap: { X: "Q" } })
    else c.stamp("_t_phaseNow", 100, 5, { swap: { X: f % 4 < 2 ? "U" : "Q" } })
    const hp = f < HIT ? 0.64 : 0.5, trail = f < HIT ? 0.64 : Math.max(0.5, 0.64 - (f - HIT) * 0.02)
    c.rect(5, 16, 146, 11, "4"); c.rect(6, 17, 144, 9, "K"); c.rect(7, 18, 142, 7, "m")
    c.rect(7, 18, Math.round(142 * trail), 7, "Q"); c.rect(7, 18, Math.round(142 * hp), 7, "R"); c.hline(7, 18, Math.round(142 * hp), "Q"); c.hline(7, 24, Math.round(142 * hp), "r")
    c.vline(78, 15, 13, "X"); c.px(77, 14, "X"); c.px(79, 14, "X")    // 50% 눈금: 넘으면 2페이즈
    c.rect(155, 4, 21, 24, "p"); c.box(154, 3, 23, 26, "K"); c.text(157, 13, "2:41", "K")
    // 아래쪽: 줄 노트
    c.rect(0, 236, 180, 84, "p"); c.hline(0, 236, 180, "K")
    for (let y = 246; y < 320; y += 9) c.hline(0, y, 180, "l")
    c.vline(39, 237, 37, "Q")
    const blink = f % 6 < 3
    c.stamp(blink ? "_portrait_low" : "_portrait", 3, 239)
    if (blink) c.box(2, 238, 36, 36, "U")
    // 수면량 18%: 깜빡이며 붉은 경고 테두리
    c.stamp("_t_sleep", 42, 242, { swap: { X: blink ? "U" : "K" } })
    if (blink) { c.box(73, 239, 104, 13, "U"); c.dither(72, 238, 106, 15, ".", "Q", 0.25) ; c.rect(74, 240, 102, 11, "p") }
    c.rect(75, 241, 100, 9, "K"); c.rect(76, 242, 98, 7, "m"); c.rect(76, 242, 18, 7, blink ? "U" : "Z"); c.hline(76, 242, 18, blink ? "Q" : "b")
    c.stamp("_o_danger", 110, 241, { swap: { X: blink ? "X" : "Q" } })
    c.stamp("_t_caff", 42, 257, { swap: { X: "K" } })
    c.rect(75, 256, 100, 9, "K"); c.rect(76, 257, 98, 7, "m"); c.rect(76, 257, 78, 7, "O"); c.hline(76, 257, 78, "y")
    for (let x = 95; x < 174; x += 20) { c.vline(x, 242, 7, "K"); c.vline(x, 257, 7, "K") }
    // 스킬 칸
    c.stamp("_ic_wire", 3, 277); c.stamp("_ic_can", 34, 277); c.stamp("_ic_push", 65, 277)
    c.stamp("_t_s1", 3 + 14 - 12, 308, { swap: { X: "K" } }); c.stamp("_t_s2", 34 + 14 - 8, 308, { swap: { X: "K" } }); c.stamp("_t_s3", 65 + 14 - 18, 308, { swap: { X: "A" } })
    // 반박 버튼: 크게, 입체 테두리 + 네온 띠. 누른 순간에는 2px 내려가고 테두리가 하얗게 번쩍
    const down = f === PARRY || f === PARRY + 1, dy = down ? 2 : 0
    c.rect(97, 273, 81, 45, "n"); c.box(98, 274, 79, 43, down ? "X" : "N"); c.box(99, 275, 77, 41, down ? "6" : "N")
    c.rect(100, 276 + dy, 75, 39 - dy, "7")
    c.rect(100, 276 + dy, 75, 36 - dy, "R")
    if (!down) { c.hline(100, 276, 75, "Q"); c.hline(100, 277, 75, "Q"); c.vline(100, 276, 36, "Q") }
    c.hline(100, 311, 75, "r"); c.vline(174, 276 + dy, 36 - dy, "r")
    c.stamp("_o_parry", 118, 283 + dy)
    c.stamp("_t_space", 125, 302 + dy, { swap: { X: "Q" } })
    // 화면 연타 안내
    c.rect(101, 225, 67, 10, "K"); c.stamp("_t_hint", 103, 227)
  },
  layer("cooldown", { shade: 2 }, rect(66, 278, 26, 26, "K")),
  (c) => c.stamp("_o_cd", 72, 284))
