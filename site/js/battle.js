// 전투: 연타로 과제를 제출해 교수님 체력을 깎고, 말풍선 공격은 타이밍 맞춰 [반박]으로 쳐낸다.
// 화면은 세로 180×320 논리 픽셀. 모든 그림은 정수 좌표에 찍는다.
import { drawText, drawFit, textImage, wrap, width } from "./text.js?v=202610190955"
import { sfx } from "./sfx.js?v=202610190955"
import { WEAPON, statsOf } from "./parts.js?v=202610190955"
import { profTitle } from "./config.js?v=202610190955"

export const W = 180, H = 320

// 늘어난 천장: 각진 천장 타일과 형광등 (세로로 긴 폰 화면에서만)
export function drawCeiling(x, top, ex, ox = 0) {
  x.fillStyle = "#a89e8a"; x.fillRect(0, top, W, ex)
  x.fillStyle = "#958b77"
  for (let y = top + 13; y < top + ex; y += 14) x.fillRect(0, y, W, 1)
  for (let i = 0; i < 6; i++) x.fillRect(((i * 32 + ox) % W + W) % W, top, 1, ex)
  for (let y = top + 4; y + 4 < top + ex; y += 28) { x.fillStyle = "#fffbe6"; x.fillRect(30 + ox, y, 50, 3); x.fillRect(100 + ox, y, 50, 3); x.fillStyle = "#cbc4b2"; x.fillRect(30 + ox, y + 3, 50, 1); x.fillRect(100 + ox, y + 3, 50, 1) }
}
const ARENA_TOP = 32, ARENA_BOT = 236
const C = {
  K: "#1d1622", k: "#2e2436", X: "#ffffff", R: "#c8353b", r: "#85223a", Q: "#f39aa0", d7: "#5a1020", U: "#ff3434",
  N: "#46d17f", n: "#1d6b3f", n6: "#b8ffd6", p: "#f4efe1", l: "#d3dbe9", Z: "#4f9be0", O: "#e08a2c", y: "#efe4c6",
  m: "#26262e", M: "#45454f", plate: "#3b4150", plateL: "#5d6578", plateD: "#22252e", rivet: "#9aa2b5", b: "#c5dcf2",
  c: "#d8e6dc", shadow: "#6e6178", A: "#a89e8a", o: "#e8b84a",
}
const LV = {
  easy: { whiff: 2, hp: 420, tele: [1.35, 1.05], gap: [[1.8, 2.6], [1.4, 2.0]], dmg: [8, 11], gradHp: 35, quiz: 14 },
  normal: { whiff: 3, hp: 520, tele: [1.15, 0.9], gap: [[1.3, 2.0], [1.0, 1.6]], dmg: [11, 15], gradHp: 50, quiz: 18 },
  hard: { whiff: 5, hp: 640, tele: [0.95, 0.75], gap: [[1.0, 1.5], [0.8, 1.3]], dmg: [14, 19], gradHp: 65, quiz: 22 },
}
// 연승(stage)마다 어려워진다: 체력·공격력은 늘고, 예고·공격 간격은 줄고, 쪽지시험 목표와 함정이 늘어난다
function scaled(b, s) {
  const quick = Math.max(0.6, 1 - 0.045 * s), often = Math.max(0.55, 1 - 0.05 * s)
  return {
    ...b,
    hp: Math.round(b.hp * (1 + 0.12 * s)),
    tele: b.tele.map((v) => Math.max(0.5, v * quick)),
    gap: b.gap.map(([lo, hi]) => [lo * often, hi * often]),
    dmg: b.dmg.map((v) => Math.round(v * (1 + 0.08 * s))),
    gradHp: Math.round(b.gradHp * (1 + 0.15 * s)),
    quiz: b.quiz + Math.floor(s / 2) * 2,
    whiff: b.whiff + Math.floor(s / 3),
    decoy: Math.min(0.65, 0.3 + 0.05 * s),
    decoyP1: s >= 3 ? Math.min(0.4, 0.1 * (s - 2)) : 0,
  }
}
let vibrate = true
export function setVibrate(v) { vibrate = v }
// 진동을 켤 때 한 번 길게 울려 확인시킨다. 결과: "sent"(브라우저가 받음) | "blocked"(브라우저가 막음) | "ios"(아이폰 햅틱)
export function buzzOnce() {
  if (navigator.vibrate) { try { return navigator.vibrate(200) ? "sent" : "blocked" } catch { return "blocked" } }
  iosTap(); return "ios"
}
// 진동: 안드로이드는 Vibration API. 아이폰 Safari(iOS 18+)는 이 API가 없어서, 숨긴 스위치 체크박스를 눌러 생기는 햅틱을 쓴다.
// 아이폰 햅틱은 화면을 누른 그 순간에만 나므로, 터치 없이 맞을 때는 진동이 없다
let hapticEl = null
function iosTap() {
  try {
    if (!hapticEl) {
      hapticEl = document.createElement("label"); hapticEl.ariaHidden = "true"; hapticEl.style.display = "none"
      const sw = document.createElement("input"); sw.type = "checkbox"; sw.setAttribute("switch", ""); hapticEl.append(sw); document.body.append(hapticEl)
    }
    hapticEl.click()
  } catch {}
}
// 아이폰은 손가락을 뗄 때(touchend)만 사용자 동작으로 쳐 준다. 게임은 누르는 순간(pointerdown)에 반응하므로,
// 진동이 필요하면 표시만 해 두고 0.4초 안에 손을 뗄 때 햅틱을 낸다
let iosWant = -1
if (typeof document !== "undefined") for (const ev of ["touchend", "pointerup"]) document.addEventListener(ev, () => { if (iosWant > 0 && performance.now() - iosWant < 400) { iosWant = -1; iosTap() } }, true)
function buzz(p, now = false) {
  if (!vibrate) return
  if (navigator.vibrate) { try { navigator.vibrate(p) } catch {} ; return }
  if (now) iosTap(); else iosWant = performance.now()
}

// 학생 공격 동작: [자세, 길이(초), 맞는 순간]. 빠르게 연타하면 휘두르기 준비 자세를 건너뛴다
const MOVES = {
  smash: [["windup", 0.035], ["smash", 0.075, true], ["follow", 0.09]],
  sweep: [["sweepA", 0.035], ["sweepB", 0.085, true]],
  over: [["overUp", 0.03], ["overDown", 0.06, true]],
}
const LUNGE = { idle: [0, 0], windup: [0, 1], smash: [2, -4], follow: [1, -2], sweepA: [1, 0], sweepB: [-1, -3], overUp: [0, 1], overDown: [0, -4] }
// 휘두를 때 남는 잔상: 키보드 끝이 지나간 자리 (그림 원본의 자세 좌표에서 계산)
const SMEAR = {
  smash: [93, 184, 112, 142, 138, 166, 100, 178],
  sweep: [118, 200, 158, 188, 4, 189, 56, 192],
  over: [30, 168, 72, 168, 72, 186, 30, 186],
}
const QUIPS = ["어허!", "흠…", "그게 과제인가?", "다시!", "근거는?", "이 친구가…"]
const PARRY_WIN = 0.3, PERFECT_WIN = 0.12
// 단과대별 스킬 세 칸: [코드, 이름, 카페인, 재사용 대기(초), 아이콘, 설명]. 1칸 묶기·방해, 2칸 강화·방어, 3칸 궁극기
const SLOT_X = [3, 62, 121]
export const SKILLSETS = {
  eng: [["wire", "점퍼선", 35, 10, "ic_wire", "3초 묶기 + 지속 피해"], ["can", "원샷", 0, 18, "ic_can", "5초 데미지 2배, 카페인 +40"], ["push", "강제 푸시", 100, 4, "ic_push", "git push --force 한 방 (120)"]],
  hum: [["postit", "포스트잇 부적", 30, 11, "ic_postit", "4초 동안 교수님이 공격 못 함"], ["pen3", "3색 볼펜 밑줄", 0, 18, "ic_pen3", "6초 치명타 확률 +30%"], ["report", "레포트 30장", 100, 4, "ic_report", "종이 폭우 (110)"]],
  soc: [["recorder", "녹음기", 30, 12, "ic_recorder", "6초 동안 공격 예고가 느려짐"], ["factcheck", "팩트체크 도장", 0, 16, "ic_factcheck", "다음 공격을 저절로 완벽 반박"], ["petition", "국민청원 20만", 100, 4, "ic_petition", "100 + 2.5초 기절"]],
  sci: [["lamp", "알코올 램프", 35, 11, "ic_lamp", "4초 동안 강한 화상"], ["nitrogen", "액체질소", 0, 18, "ic_nitrogen", "2.5초 얼림, 그동안 데미지 1.5배"], ["centrifuge", "원심분리기 폭주", 100, 4, "ic_centrifuge", "14연속 타격"]],
  nur: [["bandage", "압박붕대", 30, 11, "ic_bandage", "3.5초 묶기, 그동안 데미지 1.3배"], ["nightshift", "나이트 근무", 0, 20, "ic_nightshift", "수면량 +25, 6초 받는 피해 절반"], ["codeblue", "코드 블루", 100, 4, "ic_codeblue", "가슴 압박 15연타"]],
  med: [["anesthesia", "마취 주사", 35, 12, "ic_anesthesia", "4초 동안 교수님이 잠듦"], ["rounds", "교수 회진", 0, 18, "ic_rounds", "6초 동안 치명타 피해 2배"], ["surgery", "응급 수술", 100, 4, "ic_surgery", "절개 다섯 번 (130)"]],
  art: [["spray", "락카 스프레이", 30, 12, "ic_spray", "5초 동안 공격이 절반은 빗나감"], ["metronome", "메트로놈", 0, 18, "ic_metronome", "6초 동안 박자 맞춰 누르면 치명타"], ["canvas", "100호 캔버스", 100, 4, "ic_canvas", "캔버스 내려찍기 (140)"]],
}
export function skillSet(college) {
  return (SKILLSETS[college] || SKILLSETS.eng).map(([id, name, cost, cd, icon, desc], i) => ({ id, name, cost, cd, icon, desc, x: SLOT_X[i] }))
}
const BEAT = 0.42                                                     // 메트로놈 박자 (초)
const SKW = 56, SKY = 274, SKH = 43                                   // 스킬 칸 크기
// 반박 표시: 공격 예고 중 화면 아무 데나 뜨는 빨간 도장. 떠 있는 동안 누르면 막는다
const TW = 46, TH = 26, PERFECT_REACT = 0.35
const GRADES = ["B0", "B+", "A0", "C+", "B0", "A0"]
const NOTES = ["논리적 비약", "출처 불분명", "오타", "근거 부족", "재수강?"]
const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const inRect = (x, y, rx, ry, rw, rh) => x >= rx && x < rx + rw && y >= ry && y < ry + rh

export class Battle {
  constructor({ art, prof, stu, onEnd, onPause, stage = 0, sleep = 100 }) {
    this.art = art; this.prof = prof; this.stu = stu; this.onEnd = onEnd; this.onPause = onPause
    this.stage = stage
    this.W = WEAPON[stu.weapon] || WEAPON.keyboard
    this.ST = statsOf(stu)
    this.pet = stu.pet && stu.pet !== "none" ? { kind: stu.pet, t: 4, act: 0 } : null
    this.burn = 0; this.burnTick = 0
    const L = scaled(LV[prof.level] || LV.normal, stage)
    this.L = L
    this.t = 0; this.freeze = 0
    this.hpMax = L.hp; this.hp = L.hp; this.trail = L.hp
    this.sleep = Math.max(1, Math.min(100, sleep)); this.caff = 40; this.timeLeft = 180; this.paused = false
    this.phase = 1; this.cine = null
    this.attack = null; this.nextAttack = 0.6
    this.intro = 1.1; this.anim = null; this.quiz = null; this.quizzes = 0
    this.parryLock = 0; this.parryPress = -9
    this.bind = 0; this.bindTick = 0; this.haste = 0; this.spec = 0
    this.SK = skillSet(stu.college); this.cd = Object.fromEntries(this.SK.map((k) => [k.id, 0]))
    this.bindKind = "wire"; this.critB = 0; this.shield = false; this.slowT = 0; this.freezeP = 0; this.blindT = 0; this.beatT = 0; this.beat0 = 0; this.burnDmg = 1.5; this.guardT = 0; this.roundsT = 0
    this.grad = null; this.summons = 0
    this.fx = []; this.notes = []
    this.shakeT = 0; this.shakeMag = 0; this.flash = null
    this.swingT = 0; this.hurtT = 0; this.profHitT = 0; this.lastTap = -1
    this.combo = 0; this.comboT = 0
    this.stats = { taps: 0, crits: 0, parries: 0, perfect: 0, whiffs: 0, maxCombo: 0, taken: 0, skills: 0 }
    this.over = null; this.overT = 0; this.ended = false
    this.armsT = 0
    this.hintT = 6
    this.ex = 0
  }
  setExtra(ex) { this.ex = Math.max(0, Math.round(ex)) }

  // ------------------------------------------------------------ 입력
  pointer(x, y) {
    if (this.over) return
    if (inRect(x, y, 153, 2, 25, 28)) return this.onPause?.()           // 시계를 누르면 일시정지
    if (y >= ARENA_TOP) y = Math.max(ARENA_TOP, y - this.ex)            // 늘어난 천장을 누르면 강의실 위쪽을 누른 것으로
    const a = this.attack
    if (a && !a.done && a.e >= a.appear) {                            // 손가락이 조금 빗나가도 잡히게 3px 여유
      if (inRect(x, y, a.tx - 3, a.ty - 3, TW + 6, TH + 6)) return this.counter()
      if (a.decoy && inRect(x, y, a.dx - 3, a.dy - 3, TW + 6, TH + 6)) { a.decoy = null; return this.whiff("함정!") }
    }
    for (let i = 0; i < 3; i++) if (inRect(x, y, this.SK[i].x, SKY, SKW, SKH)) return this.skill(i)
    if (y >= ARENA_TOP && y < ARENA_BOT) return this.tap(x, y)
  }
  // 반박 표시를 눌렀다: 뜨자마자 빨리 누를수록 완벽한 반박
  counter() {
    const a = this.attack
    if (this.cine || !a || a.done) return
    this.resolveParry(a.e - a.appear <= PERFECT_REACT + 0.02 * this.ST.speed)
  }
  placeTarget(a) {
    const spot = () => [Math.round(rnd(8, W - TW - 8)), Math.round(rnd(44, ARENA_BOT - TH - 30))]
    ;[a.tx, a.ty] = spot()
    a.decoy = null
    if (Math.random() < (this.phase === 2 ? this.L.decoy : this.L.decoyP1)) {   // 회색 '재수강' 함정 (2페이즈, 연승이 쌓이면 1페이즈에도)
      for (let k = 0; k < 12; k++) { const [x, y] = spot(); if (Math.abs(x - a.tx) > TW + 6 || Math.abs(y - a.ty) > TH + 8) { a.decoy = true; a.dx = x; a.dy = y; break } }
    }
    a.appear = Math.max(0.12, a.hitAt * 0.28)
  }
  key(k) {
    if (this.over) return
    if (k === " " || k === "k" || k === "K") this.parry()
    else if (k === "1" || k === "2" || k === "3") this.skill(Number(k) - 1)
    else if ("jJfFdD".includes(k) || k === "Enter") this.tap(100, 120)
    else if (k === "p" || k === "P" || k === "Escape") this.onPause?.()
  }

  tap() {
    const rate = Math.max(0.035, this.W.rate * this.ST.fx.rate * (1 - 0.04 * this.ST.speed))   // 무기·타자 속도·세트
    if (this.cine || this.t - this.lastTap < rate) return
    this.lastTap = this.t
    this.stats.taps++
    this.combo = this.t - this.comboT < 0.45 ? this.combo + 1 : 1; this.comboT = this.t
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo)
    this.caff = Math.min(100, this.caff + 0.6)
    let mult = this.haste > 0 ? 2 : 1
    if (this.spec > 0) mult *= pick([0, 0.5, 1, 2, 3])
    const W = this.W
    const onBeat = this.beatT > 0 && (() => { const ph = ((this.t - this.beat0) % BEAT + BEAT) % BEAT; return ph < 0.09 || ph > BEAT - 0.09 })()
    const crit = onBeat || Math.random() < W.crit + 0.01 * this.ST.luck + (this.critB > 0 ? 0.3 : 0)
    if (onBeat) this.say("박자!", 140, 182, C.o, { font: "s9", outline: C.K })
    if (this.freezeP > 0) mult *= 1.5
    const dmg = W.dmg * (crit ? (W.critMul || 3) * (this.roundsT > 0 ? 2 : 1) : 1) * mult * this.ST.fx.dmgMul * (this.bind > 0 && this.bindKind === "bandage" ? 1.3 : 1)
    sfx("key"); if (crit) buzz(18)
    // 동작 고르기: 콤보 6부터 두 손 내려찍기, 그 전에는 내려치기와 옆으로 휘두르기를 번갈아
    const kind = this.combo >= 6 ? "over" : this.stats.taps % 2 ? "smash" : "sweep"
    const busy = this.anim && this.anim.i < this.anim.frames.length
    const skip = busy && kind !== "over"
    const frames = skip ? MOVES[kind].slice(1) : MOVES[kind]
    this.anim = { kind, frames, i: 0, t: 0 }
    const delay = skip ? 0 : MOVES[kind][0][1]
    const tx = this.grad ? 146 : 100, ty = this.grad ? 196 : 118
    const hx = tx + rnd(-10, 10), hy = ty + rnd(-8, 8)
    this.fx.push({ type: "smear", kind, t: 0, delay, life: delay + 0.06 })
    this.fx.push({ type: "star", x: Math.round(hx), y: Math.round(hy), big: crit, t: 0, delay, life: delay + 0.08 })
    if (this.quiz) this.quiz.n++
    const finisher = this.combo > 0 && this.combo % 12 === 0
    const shots = W.shots || 1                                          // 피펫: 한 번에 여러 발
    for (let k = 0; k < shots; k++) {
      const sx = shots > 1 ? hx + (k - 1) * 12 : hx, sy = shots > 1 ? hy + rnd(-6, 6) : hy
      if (k) this.fx.push({ type: "star", x: Math.round(sx), y: Math.round(sy), big: false, t: 0, delay, life: delay + 0.08 })
      this.damage(dmg + (finisher && !k ? 15 : 0), { x: sx, y: sy, crit: crit && !k, noGrade: k > 0 })
    }
    for (let i = 0; i < (crit ? 3 : 1) + (shots > 1 ? 2 : 0); i++) this.spawnCap(tx, ty)
    if (crit) this.weaponFx()
    if (finisher) {
      this.shake(4, 0.2); this.hitstop(0.07); sfx("stamp")
      this.fx.push({ type: "wave", x: tx, y: ty, t: 0, life: 0.3 })
      this.say(this.combo + "연타 보너스!", 90, 150, C.O, { font: "b11", outline: C.K, outline2: C.X })
    }
    if (crit) {
      this.stats.crits++; this.hitstop(0.05); this.shake(2, 0.12); sfx("crit")
      if (!this.grad && Math.random() < 0.3) this.say(pick(QUIPS), 120 + rnd(-10, 20), 50, C.X, { font: "s9", outline: C.K })
    } else this.shake(1, 0.06)
  }

  weaponFx() {
    const fx = this.W.fx
    if (fx === "burn") { this.burn = 1.5; this.say("화상!", 112, 70, C.O, { font: "b11", outline: C.K }) }
    if (fx === "reject") this.fx.push({ type: "stampfx", s: "기각", x: 96, y: 92, t: 0, life: 0.7 })
    if (fx === "order") {                                               // 판사봉: 교수님 공격이 늦어진다
      if (this.attack && !this.attack.done) this.attack.hitAt += 0.35; else this.nextAttack += 0.8
      this.say("정숙!", 112, 70, C.X, { font: "b11", outline: C.K })
    }
  }

  parry() {
    if (this.cine) return
    if (this.parryLock > 0) return
    this.parryPress = this.t
    const a = this.attack
    if (!a || a.done) return this.whiff("헛반박!")                   // 공격이 없을 때
    const left = a.hitAt - a.e
    if (left > PARRY_WIN) return this.whiff("너무 일찍!")            // 반박할 때가 아직 아닐 때
    this.resolveParry(left <= PERFECT_WIN)
  }
  resolveParry(perfect) {
    const a = this.attack
    this.parryPress = this.t
    a.done = true; a.parried = true
    this.stats.parries++; if (perfect) this.stats.perfect++
    sfx("parry"); this.hitstop(0.09); this.shake(perfect ? 3 : 2, 0.15); buzz(perfect ? [35, 40, 35] : 35)
    this.caff = Math.min(100, this.caff + (perfect ? 18 : 10))
    this.shatter(a)
    if (a.kind === "chalk") this.fx.push({ type: "chalkback", t: 0, life: 0.25 })
    this.say(perfect ? "완벽한 반박!" : "반박 성공!", 145, 34, C.n6, { font: "b11", outline: C.n, outline2: C.K, rise: 1 })
    if (a.kind === "spec") this.say("스펙 변경 무효", 145, 50, C.X, { font: "s9", outline: C.K })
    this.damage(perfect ? 30 : 18, { x: 100, y: 96, crit: perfect, noGrade: true })
    if (perfect) this.note(pick(NOTES), true)
    this.endAttack()
  }

  // 잘못된 때 반박: 수면량이 깎이고 잠깐 못 누른다 (같은 실수로 두 번 깎이지 않게)
  whiff(msg) {
    const pen = this.L.whiff
    this.parryLock = 0.4; this.stats.whiffs++
    this.sleep = Math.max(0, this.sleep - pen); this.stats.taken += pen
    this.hurtT = 0.2; this.shake(1, 0.08); this.flash = { t: 0.08, color: C.Q }; sfx("early"); buzz(60)
    this.say(`${msg} -${pen} 수면량`, 52, 176, C.X, { font: "b11", outline: C.r, outline2: C.K })
    if (this.sleep <= 0) this.finish("lose")
  }

  skill(i) {
    const s = this.SK[i]
    if (!s || this.cine || this.cd[s.id] > 0 || this.caff < s.cost) { sfx("early"); return }
    this.caff -= s.cost; this.cd[s.id] = s.cd; this.stats.skills++; buzz(s.cost >= 100 ? [60, 30, 120] : 40)
    const stopAttack = () => { if (this.attack && !this.attack.done) { this.attack.done = true; this.endAttack() } }
    const shout = (t, col, y = 150) => this.say(t, 90, y, col, { font: "b11", outline: C.K })
    switch (s.id) {
      case "wire":
        sfx("skill"); this.bind = 3; this.bindTick = 0; this.bindKind = "wire"; stopAttack()
        this.wires = Array.from({ length: 3 }, () => Array.from({ length: 6 }, (_, k) => [44 + k * 18 + rnd(-4, 4), rnd(96, 140)]))
        return shout("while(true) 묶기!", C.N)
      case "postit":
        sfx("skill"); this.bind = 4; this.bindTick = 0; this.bindKind = "postit"; stopAttack()
        this.notesOn = Array.from({ length: 7 }, () => [Math.round(rnd(60, 112)), Math.round(rnd(52, 140)), Math.random() < 0.5])
        return shout("포스트잇 부적!", "#ffe48a")
      case "lamp": sfx("skill"); this.burn = 4; this.burnTick = 0; this.burnDmg = 3; return shout("알코올 램프 점화!", C.O)
      case "recorder": sfx("skill"); this.slowT = 6; return shout("지금부터 녹음합니다", C.U)
      case "spray": sfx("skill"); this.blindT = 5; this.sprayDots = Array.from({ length: 16 }, () => [Math.round(rnd(66, 116)), Math.round(rnd(60, 96)), pick(["#29b6e8", "#e8296f", "#f2d430", C.N])]); return shout("락카로 안경 칠하기!", "#e8296f")
      case "can": sfx("gulp"); this.haste = 5; this.caff = Math.min(100, this.caff + 40); return this.say("카페인 오버클럭!", 60, 168, C.O, { font: "b11", outline: C.K })
      case "pen3": sfx("skill"); this.critB = 6; return shout("밑줄 쫙, 별표 세 개!", C.R)
      case "factcheck": sfx("stamp"); this.shield = true; return shout("팩트체크 준비", C.N)
      case "nitrogen": sfx("skill"); this.freezeP = 2.5; stopAttack(); this.shake(2, 0.1); return shout("액체질소 투하!", "#7fe6ff")
      case "bandage":
        sfx("skill"); this.bind = 3.5; this.bindTick = 0; this.bindKind = "bandage"; stopAttack()
        return shout("압박붕대 칭칭!", C.X)
      case "anesthesia": sfx("skill"); this.bind = 4; this.bindTick = 0; this.bindKind = "sleep"; stopAttack(); return shout("마취 들어갑니다", "#7fe6ff")
      case "nightshift": sfx("gulp"); this.sleep = Math.min(100, this.sleep + 25); this.guardT = 6; return shout("나이트 근무 버티기", "#9b8cff")
      case "rounds": sfx("skill"); this.roundsT = 6; return shout("교수 회진 따라붙기!", C.X)
      case "metronome": sfx("skill"); this.beatT = 6; this.beat0 = this.t; return shout("박자 맞춰서!", C.o)
      default: sfx("push"); this.cine = { kind: "ult", id: s.id, t: 0, n: 0 }; this.stopForUlt = stopAttack(); return
    }
  }


  // ------------------------------------------------------------ 진행
  update(dt) {
    if (this.ended) return
    dt = Math.min(dt, 0.05)
    if (this.paused) return
    this.updateFx(dt)
    if (this.freeze > 0) { this.freeze -= dt; return }
    this.t += dt
    if (this.over) { this.overT += dt; this.updateOver(dt); return }
    if (this.cine) { this.updateCine(dt); return }
    this.timeLeft -= dt; this.hintT -= dt
    if (this.intro > 0) { const before = this.intro; this.intro -= dt; if (before > 0.5 && this.intro <= 0.5) sfx("stamp") }
    if (this.anim) {
      const a = this.anim
      a.t += dt
      while (a.i < a.frames.length && a.t >= a.frames[a.i][1]) { a.t -= a.frames[a.i][1]; a.i++ }
      if (a.i >= a.frames.length) this.anim = null
    }
    if (this.quiz) {
      const q = this.quiz
      q.t += dt
      if (q.t >= q.dur && !q.done) {
        q.done = true
        if (q.n >= q.goal) { sfx("win"); this.say("만점!", 90, 96, C.U, { font: "l14", bold: true, outline: C.X, outline2: C.K, rise: 0 }); this.fx.push({ type: "aplus", x: 112, y: 64, t: 0, life: 0.9 }); this.damage(40, { x: 100, y: 110, noGrade: true }) }
        else { sfx("hurt"); this.sleep = Math.max(0, this.sleep - 6); this.say("재시험… -6 수면량", 90, 96, C.X, { font: "b11", outline: C.U, outline2: C.K }) }
      }
      if (q.t >= q.dur + 0.5) { this.quiz = null; this.nextAttack = 0.8 }
    }
    if (this.timeLeft <= 0) { this.timeLeft = 0; return this.finish("timeout") }
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt)
    this.parryLock = Math.max(0, this.parryLock - dt)
    this.hurtT = Math.max(0, this.hurtT - dt); this.profHitT = Math.max(0, this.profHitT - dt); this.profKnock = Math.max(0, (this.profKnock || 0) - dt)
    this.haste = Math.max(0, this.haste - dt); this.spec = Math.max(0, this.spec - dt)
    this.guardT = Math.max(0, this.guardT - dt); this.roundsT = Math.max(0, this.roundsT - dt)
    this.critB = Math.max(0, this.critB - dt); this.slowT = Math.max(0, this.slowT - dt); this.freezeP = Math.max(0, this.freezeP - dt)
    this.blindT = Math.max(0, this.blindT - dt); this.beatT = Math.max(0, this.beatT - dt)
    if (this.burn <= 0) this.burnDmg = 1.5
    this.caff = Math.min(100, this.caff + dt * (5 + this.ST.caff) * this.ST.fx.caffMul)
    if (this.ST.fx.drain && this.intro <= 0) { this.sleep = Math.max(1, this.sleep - this.ST.fx.drain * dt) }
    if (this.burn > 0) { this.burn -= dt; this.burnTick -= dt; if (this.burnTick <= 0) { this.burnTick = 0.3; this.damage(this.burnDmg, { x: 100 + rnd(-20, 20), y: 110, noGrade: true, quiet: true }) } }
    if (this.pet && this.intro <= 0) this.updatePet(dt)
    this.trail = Math.max(this.hp, this.trail - dt * 120)
    if (this.phase === 2) this.armsT = Math.min(1, this.armsT + dt * 2)
    if (this.bind > 0) {
      this.bind -= dt; this.bindTick -= dt
      if (this.bindKind === "wire" && this.bindTick <= 0) { this.bindTick = 0.5; this.damage(4, { x: 90 + rnd(-30, 30), y: 120, noGrade: true, quiet: true }) }
    }
    if (this.grad && this.grad.enter < 1) this.grad.enter = Math.min(1, this.grad.enter + dt * 2.5)
    if (this.grad && this.grad.enter >= 1 && this.grad.type !== "shield" && !this.cine && this.intro <= 0) {
      this.grad.tick -= dt
      if (this.grad.tick <= 0) {
        if (this.grad.type === "attack") {                                // 공격형 랩장: 5초마다 감점 -4
          this.grad.tick = 5; this.sleep = Math.max(0, this.sleep - 4); this.stats.taken += 4; sfx("early")
          this.say("감점 -4", 150, 140, C.X, { font: "b11", outline: C.U, outline2: C.K, rise: 1 })
          if (this.sleep <= 0) return this.finish("lose")
        } else {                                                          // 회복형 랩장: 3초마다 교수님 체력 3% 회복
          this.grad.tick = 3; const h = Math.round(this.hpMax * 0.03); this.hp = Math.min(this.hpMax, this.hp + h); sfx("stamp")
          this.say("결재 완료 +" + h, 150, 140, C.N, { font: "s9", outline: C.K, rise: 1 })
        }
      }
    }
    // 교수님 공격 (시작 연출과 쪽지시험 동안은 쉰다)
    if (this.attack) this.updateAttack(dt)
    else if (this.bind <= 0 && this.freezeP <= 0 && this.intro <= 0 && !this.quiz) {
      this.nextAttack -= dt
      if (this.nextAttack <= 0) this.startAttack()
    }
    if (this.sleep <= 20 && Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) sfx("alarm")
  }

  startAttack() {
    const p2 = this.phase === 2, L = this.L
    const r = Math.random()
    let kind = "single", count = 1
    if (p2 && r < 0.2) { kind = "barrage"; count = 3 }
    else if (p2 && r < 0.34 && this.spec <= 0) kind = "spec"
    else if (r > (p2 ? 0.8 : 0.68)) kind = "chalk"
    const lines = this.prof.lines.length ? this.prof.lines : ["질문 있나?"]
    const text = kind === "spec" ? "과제 스펙 변경!" : kind === "barrage" ? "내 컴퓨터에선 되던데?" : kind === "chalk" ? "졸지 마!" : pick(lines)
    const tele = (kind === "barrage" ? 0.62 : kind === "chalk" ? 0.72 : L.tele[p2 ? 1 : 0]) * (this.slowT > 0 ? 1.6 : 1)
    this.attack = { kind, text, count, idx: 0, e: 0, hitAt: tele, tele, done: false }
    this.placeTarget(this.attack)
    sfx("laser")
  }
  updateAttack(dt) {
    const a = this.attack
    a.e += dt
    if (!a.done && a.e >= a.hitAt + 0.05 && this.shield) {            // 팩트체크 도장이 대신 막는다
      this.shield = false; this.say("팩트체크 완료!", 60, 168, C.N, { font: "b11", outline: C.K }); this.fx.push({ type: "stampfx", s: "사실 아님", x: 145, y: 46, t: 0, life: 0.6 })
      return this.resolveParry(true)
    }
    if (!a.done && a.e >= a.hitAt + 0.05 && this.blindT > 0 && Math.random() < 0.5) {
      a.done = true; this.say("빗나감! (락카 묻은 안경)", 60, 168, C.X, { font: "s9", outline: C.K }); return
    }
    if (!a.done && a.e >= a.hitAt + 0.05) {                           // 맞았다
      a.done = true
      const dmg = this.L.dmg[this.phase === 2 ? 1 : 0] * (a.kind === "barrage" ? 0.6 : a.kind === "chalk" ? 0.5 : 1) * Math.max(0.55, 1 - 0.05 * this.ST.mental) * (this.guardT > 0 ? 0.5 : 1)
      this.sleep = Math.max(0, this.sleep - dmg); this.stats.taken += dmg
      this.hurtT = 0.45; this.shake(4, 0.25); this.flash = { t: 0.18, color: C.U }; sfx("hurt"); buzz([90, 40, 60])
      this.combo = 0
      this.say("-" + Math.round(dmg) + " 수면량", 40, 168, C.X, { font: "b11", outline: C.U, outline2: C.K, rise: 1 })
      this.fx.push({ type: "hurtfx", college: this.stu.college, t: 0, life: 0.5 })   // 단과대마다 다른 피격 연출
      if (a.kind === "spec") { this.spec = 8; this.say("스펙 변경: 데미지 무작위 8초", 90, 150, C.N, { font: "s9", outline: C.K }) }
      this.beamT = 0.12
      if (this.sleep <= 0) return this.finish("lose")
    }
    if (a.done && a.e >= a.hitAt + 0.25) this.endAttack()
  }
  endAttack() {
    const a = this.attack
    if (a && a.kind === "barrage" && a.idx + 1 < a.count && !(this.bind > 0)) {
      a.idx++; a.e = 0; a.done = false; a.parried = false; a.text = pick(["404 Not Found", "Segmentation fault", "되던데?", "다시 해봐"])
      this.placeTarget(a)
      sfx("laser"); return
    }
    this.attack = null
    const g = this.L.gap[this.phase === 2 ? 1 : 0]
    this.nextAttack = rnd(g[0], g[1]) * (this.slowT > 0 ? 1.4 : 1)
  }

  damage(n, { x, y, crit, noGrade, quiet } = {}) {
    if (this.over || this.cine?.kind === "phase") return
    if (this.grad && this.grad.enter >= 1) {                           // 랩장이 대신 맞는다
      this.grad.hp -= n; this.grad.hitT = 0.08
      n *= this.grad.type === "shield" ? 0.2 : 0.5                      // 방어형은 80%, 공격·회복형은 50%를 대신 맞는다
      if (this.grad.hp <= 0) this.gradDown()
    }
    this.hp = Math.max(0, this.hp - n)
    if (!quiet) this.profKnock = 0.06
    if (crit) this.profHitT = 0.05
    if (!noGrade) {
      if (crit) this.fx.push({ type: "aplus", x: Math.round(x + 14), y: Math.round(y - 30), t: 0, life: 0.6 })
      else if (Math.random() < 0.35) this.fx.push({ type: "text", img: textImage(pick(GRADES), { font: "b11", pen: true, color: C.R, outline: C.X }), x: Math.round(x + rnd(-6, 20)), y: Math.round(y - rnd(10, 26)), t: 0, life: 0.45, vy: -14 })
    }
    if (crit && !noGrade && Math.random() < 0.4) this.note(pick(NOTES))
    if (!this.quiz && !this.cine && ((this.quizzes === 0 && this.hp <= this.hpMax * 0.8) || (this.quizzes === 1 && this.phase === 2 && this.hp <= this.hpMax * 0.35))) this.startQuiz()
    if (this.phase === 1 && this.hp <= this.hpMax / 2) return this.toPhase2()
    if (this.phase === 2 && this.summons < 2 && !this.grad && this.hp <= this.hpMax / 4) this.summon()
    if (this.hp <= 0) this.finish("win")
  }
  note(s, big) {
    this.notes.push({ img: textImage(s, { font: "b11", pen: true, color: C.R, outline: C.X, outline2: C.K }), x: Math.round(rnd(98, 120)), y: Math.round(rnd(88, 104)), t: 0, life: big ? 1.4 : 1.0 })
    if (this.notes.length > 2) this.notes.shift()
  }

  startQuiz() {
    this.quizzes++
    if (this.attack) this.attack = null
    this.quiz = { t: 0, dur: 3, n: 0, goal: this.L.quiz, done: false }
    sfx("stamp"); this.shake(2, 0.15)
  }
  toPhase2() {
    this.quiz = null
    this.phase = 2; this.cine = { kind: "phase", t: 0 }
    if (this.attack) { this.attack = null }
    this.bind = 0; this.nextAttack = 2.5
    sfx("stamp"); this.shake(5, 0.4)
  }
  summon() {
    this.summons++
    const type = this.prof.grad || "shield"
    const LINES = { shield: ["그건 교수님께 말씀드리기 전에 제 선에서 정리할게요", "교수님, 제가 막겠습니다"], attack: ["이 부분 감점 사유입니다", "채점 기준표 다시 보세요"], heal: ["교수님, 결재 올려 두었습니다", "연구비 정산 끝났습니다"] }[type] || []
    this.grad = { type, tick: type === "attack" ? 4 : 2.5, hp: this.L.gradHp * (type === "shield" ? 1 : 0.8), max: this.L.gradHp * (type === "shield" ? 1 : 0.8), enter: 0, hitT: 0, line: LINES[this.summons === 1 ? 0 : 1], lineT: 2.6 }
    this.say("랩장, 이거 자네가 좀 봐주게", 100, 50, C.K, { font: "s9", bubble: true })
  }
  gradDown() {
    this.say("드디어 졸업…?", 146, 170, C.X, { font: "b11", outline: C.K, rise: 1 })
    this.fx.push({ type: "gradfall", t: 0, life: 0.6 })
    this.grad = null; sfx("stamp"); this.shake(3, 0.2)
  }

  updateCine(dt) {
    const c = this.cine
    c.t += dt
    if (c.kind === "phase" && c.t >= 1.7) { this.cine = null; this.summon() }
    if (c.kind === "ult") return this.updateUlt(c)

  }

  // 궁극기: 맞는 순간과 피해가 단과대마다 다르다
  updateUlt(c) {
    const big = (n, label, col, after) => {
      this.flash = { t: 0.2, color: C.X }; this.shake(6, 0.45); this.hitstop(0.12)
      if (this.grad) this.gradDown()
      this.cine = null
      this.damage(n, { x: 100, y: 110, crit: true })
      this.say(label, 90, 136, col, { font: "l14", bold: true, outline: C.K, outline2: C.X, rise: 0 })
      after?.()
    }
    if (c.id === "push" && c.t >= 0.38) return big(120, "강제 푸시!", C.N)
    if (c.id === "report") { if (Math.random() < 0.7) this.fx.push({ type: "bit", d: "page", x: rnd(10, 170), y: 30, vx: rnd(-20, 20), vy: rnd(40, 120), t: 0, life: 0.8, r: 0 }); if (c.t >= 0.6) return big(110, "레포트 30장!", C.R) }
    if (c.id === "petition" && c.t >= 0.4) return big(100, "국민청원 20만!", C.U, () => { this.bind = 2.5; this.bindKind = "stun"; if (this.attack && !this.attack.done) { this.attack.done = true; this.endAttack() } })
    if (c.id === "canvas" && c.t >= 0.42) return big(140, "100호 캔버스!", C.o)
    if (c.id === "surgery") {                                            // 절개 다섯 번, 마지막에 큰 한 방
      const n = Math.min(5, Math.floor(c.t / 0.14))
      while (c.n < n) { c.n++; this.damage(c.n < 5 ? 14 : 0, { x: 100, y: 110, noGrade: true, quiet: true }); this.shake(2, 0.06); sfx("hitProf"); if (this.cine !== c) return }
      if (c.t >= 0.85) return big(74, "응급 수술 완료!", C.X)
    }
    if (c.id === "codeblue") {                                           // 가슴 압박 15연타
      const n = Math.floor(Math.max(0, c.t - 0.2) / 0.075)
      while (c.n < Math.min(15, n)) { c.n++; this.damage(8, { x: 100 + rnd(-10, 10), y: 118, noGrade: true }); this.fx.push({ type: "star", x: Math.round(100 + rnd(-14, 14)), y: Math.round(118 + rnd(-8, 8)), big: c.n % 5 === 0, t: 0, life: 0.08 }); this.shake(3, 0.05); if (this.cine !== c) return }
      if (c.n >= 15 && c.t > 1.5) { if (this.grad) this.gradDown(); this.cine = null; this.say("코드 블루 성공!", 90, 136, C.U, { font: "l14", bold: true, outline: C.K, outline2: C.X, rise: 0 }) }
    }
    if (c.id === "centrifuge") {
      const n = Math.floor(Math.max(0, c.t - 0.15) / 0.07)
      while (c.n < Math.min(14, n)) { c.n++; this.damage(9, { x: 100 + rnd(-20, 20), y: 112 + rnd(-14, 14), noGrade: true }); this.fx.push({ type: "star", x: Math.round(100 + rnd(-24, 24)), y: Math.round(112 + rnd(-16, 16)), big: c.n % 4 === 0, t: 0, life: 0.08 }); this.shake(2, 0.06); if (this.cine !== c) return }
      if (c.n >= 14 && c.t > 1.2) { if (this.grad) this.gradDown(); this.cine = null; this.say("원심분리기 폭주!", 90, 136, "#7fe6ff", { font: "l14", bold: true, outline: C.K, outline2: C.X, rise: 0 }) }
    }
  }

  finish(kind) {
    if (this.over) return
    this.over = kind; this.overT = 0; this.attack = null; this.cine = null
    if (kind === "win") { sfx("win"); this.shake(4, 0.3); for (let i = 0; i < 40; i++) this.fx.push({ type: "confetti", x: rnd(0, W), y: rnd(-80, 30), vx: rnd(-10, 10), vy: rnd(30, 70), col: pick([C.R, C.N, C.Z, C.O, C.X, C.o]), t: 0, life: 3 }) }
    else { sfx("lose"); this.hurtT = 9 }
  }
  updateOver() {
    if (!this.ended && this.overT > 2.4) {
      this.ended = true
      const used = 180 - this.timeLeft
      this.onEnd({ result: this.over, time: used, sleep: Math.round(this.sleep), stats: this.stats, prof: this.prof, stu: this.stu, stage: this.stage })
    }
  }

  // ------------------------------------------------------------ 효과
  hitstop(s) { this.freeze = Math.max(this.freeze, s) }
  shake(m, t) { this.shakeMag = Math.max(this.shakeMag, m); this.shakeT = Math.max(this.shakeT, t) }
  spawnCap(x, y) {
    const d = this.W.debris
    if (d === "keycap") { const img = this.art[pick(["cap_c", "cap_v", "cap_ctrl", "cap_blank", "cap_blank"])]; return this.fx.push({ type: "part", img, x, y, vx: rnd(-90, 90), vy: rnd(-150, -70), t: 0, life: 0.9 }) }
    this.fx.push({ type: "bit", d, x, y, vx: rnd(-100, 100), vy: rnd(-160, -60), t: 0, life: 0.8, r: Math.random() })
  }
  // 동료: 6초마다 교수님을 친다 (랩실 붙박이 세트면 두 배)
  updatePet(dt) {
    const p = this.pet
    p.t -= dt; p.act = Math.max(0, p.act - dt)
    if (p.t <= 0 && !this.over && !this.cine) {
      p.t = 6; p.act = 0.45
      const n = 4 * this.ST.fx.petMul
      this.damage(n, { x: 96 + rnd(-10, 10), y: 120, noGrade: true })
      const LINE = { rc: "RC카 돌진!", drone: "드론 폭격!", penguin: "sudo 펭귄!", owl: "부엉이 쪼기!", rat: "흰쥐 깨물기!", bust: "석고상 레이저!" }
      this.say(LINE[p.kind] || "동료 공격!", 140, 186, C.N, { font: "s9", outline: C.K })
      this.fx.push({ type: "star", x: 100, y: 118, big: false, t: 0, life: 0.1 })
    }
  }
  shatter() {
    for (let i = 0; i < 7; i++) this.fx.push({ type: "shard", x: 145 + rnd(-20, 20), y: 50 + rnd(-6, 6), vx: rnd(-80, 80), vy: rnd(-80, 10), s: Math.floor(rnd(4, 8)), t: 0, life: 0.5 })
  }
  say(s, x, y, color, o = {}) {
    const img = o.bubble ? null : textImage(s, { font: o.font || "b11", color, outline: o.outline, outline2: o.outline2, bold: o.bold })
    this.fx.push({ type: o.bubble ? "bubble" : "text", s, img, x, y, t: 0, life: o.bubble ? 1.8 : 0.9, vy: o.rise === 0 ? 0 : -12, center: true })
  }
  updateFx(dt) {
    this.shakeT = Math.max(0, this.shakeT - dt); if (this.shakeT === 0) this.shakeMag = 0
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null }
    this.beamT = Math.max(0, (this.beamT || 0) - dt)
    for (const f of this.fx) {
      f.t += dt
      if (f.type === "part" || f.type === "shard") { f.vy += 600 * dt; f.x += f.vx * dt; f.y += f.vy * dt }
      if (f.type === "confetti") { f.x += (f.vx + Math.sin(f.t * 6 + f.y) * 20) * dt; f.y += f.vy * dt }
      if (f.vy && f.type === "text") f.y += f.vy * dt
    }
    this.fx = this.fx.filter((f) => f.t < f.life)
    for (const n of this.notes) n.t += dt
    this.notes = this.notes.filter((n) => n.t < n.life)
    if (this.grad) { this.grad.hitT = Math.max(0, this.grad.hitT - dt); this.grad.lineT -= dt }
  }

  // ------------------------------------------------------------ 그리기
  render(x) {
    const A = this.art
    x.imageSmoothingEnabled = false
    const CH = x.canvas.height
    x.fillStyle = C.k; x.fillRect(0, 0, W, CH)
    const sh = this.shakeT > 0 ? [Math.round(rnd(-1, 1) * this.shakeMag), Math.round(rnd(-1, 1) * this.shakeMag * 0.6)] : [0, 0]
    const [ox, oy] = sh
    if (this.ex) drawCeiling(x, ARENA_TOP, this.ex, ox)
    x.save(); x.translate(0, this.ex); x.beginPath(); x.rect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP); x.clip()
    x.drawImage(A.room, ox, oy)
    // 교수님
    const p2 = this.phase === 2, ko = this.over === "win"
    const sink = ko ? Math.min(60, Math.floor(this.overT * 40)) : 0
    const bob = !ko && Math.floor(this.t * 1.6) % 2 ? 1 : 0
    const recoil = this.profHitT > 0 || this.profKnock > 0 ? -2 : 0
    const pName = ko ? "prof_ko" : p2 ? "prof_p2" : "prof_idle"
    const px = ox - 1, py = oy - 1 + bob + recoil + sink
    if (p2 && !ko) {
      const ay = Math.round((1 - this.armsT) * 40)
      this.shadowDraw(x, A.prof_arms_shadow, px + 4, py + 3 + ay)
      x.drawImage(A.prof_arms, px, py + ay)
    }
    this.shadowDraw(x, A[pName + "_shadow"], px + 4, py + 3)
    x.drawImage(this.profHitT > 0 && !ko && A[pName + "_white"] ? A[pName + "_white"] : A[pName], px, py)
    if (this.bind > 0) this.drawBind(x, ox, oy + bob)
    if (this.freezeP > 0) this.drawIce(x, ox, oy + bob)
    if (this.blindT > 0 && this.sprayDots) for (const [sx, sy, col] of this.sprayDots) { x.fillStyle = col; x.fillRect(sx + ox, sy + oy + bob, 3, 3) }
    x.drawImage(A.lectern, ox - 1, oy - 1)
    this.shadowPoly(x, [[62 + ox, 149 + oy], [130 + ox, 149 + oy], [131 + ox, 152 + oy], [66 + ox, 156 + oy]])
    // 랩장
    if (this.grad) {
      const gx = Math.round(116 + (1 - this.grad.enter) * 70) + ox, gy = 150 + oy
      this.shadowDraw(x, A.grad_shadow, gx + 4, gy + 2)
      x.drawImage(this.grad.hitT > 0 ? A.grad_white : A.grad, gx, gy)
      const w = Math.round(30 * Math.max(0, this.grad.hp) / this.grad.max)
      x.fillStyle = C.K; x.fillRect(gx + 14, gy - 6, 32, 5); x.fillStyle = C.M; x.fillRect(gx + 15, gy - 5, 30, 3); x.fillStyle = C.N; x.fillRect(gx + 15, gy - 5, w, 3)
      if (this.grad.lineT > 0 && this.grad.enter >= 1 && this.grad.lineT < 2.0) this.bubble(x, this.grad.line, gx + 30, gy + 4, "s9", 2)
    }
    // 학생
    const pose = this.anim && this.anim.i < this.anim.frames.length ? this.anim.frames[this.anim.i][0] : "idle"
    const sName = "stu_" + pose, [lx, ly] = LUNGE[pose]
    const hurt = this.hurtT > 0 && this.over !== "lose" ? Math.round(Math.sin(this.t * 60) * 1) : 0
    this.shadowDraw(x, A[sName + "_shadow"], ox + 4 + hurt + lx, oy + 1 + ly)
    x.drawImage(A[sName], ox - 1 + hurt + lx, oy - 1 + ly + (this.over === "lose" ? Math.min(40, Math.floor(this.overT * 30)) : 0))
    for (const f of this.fx) if (f.type === "smear" && f.t >= f.delay) this.drawSmear(x, f, ox + lx, oy + ly)
    if (this.haste > 0) this.drawChevrons(x, ox, oy)
    if (this.pet) this.drawPet(x, ox, oy)
    // 공격 예고
    if (this.attack && !this.attack.done) this.drawTelegraph(x, ox, oy)
    if (this.beamT > 0) { x.fillStyle = C.U; this.line(x, 34 + ox, 140 + oy, 44, 189, 2) }
    // 효과
    for (const f of this.fx) if (f.t >= (f.delay || 0)) this.drawFx(x, f)
    for (const n of this.notes) {
      const reveal = Math.min(1, n.t / 0.25)
      x.save(); x.beginPath(); x.rect(n.x, n.y, Math.ceil(n.img.width * reveal), n.img.height); x.clip(); x.drawImage(n.img, n.x, n.y); x.restore()
    }
    if (this.quiz) this.drawQuiz(x)
    if (this.intro > 0) this.drawIntro(x)
    if (this.cine?.kind === "phase") this.drawPhaseCine(x)
    if (this.cine?.kind === "ult") this.drawUlt(x)
    this.drawBuffs(x)
    if (this.over) this.drawOver(x)
    x.restore()
    this.drawHUD(x)
    if (this.flash) { x.fillStyle = this.flash.color; for (let i = 0; i < 3; i++) { x.fillRect(i, i, W - i * 2, 1); x.fillRect(i, CH - 1 - i, W - i * 2, 1); x.fillRect(i, i, 1, CH - i * 2); x.fillRect(W - 1 - i, i, 1, CH - i * 2) } }
  }

  shadowDraw(x, img, X, Y) { x.save(); x.globalCompositeOperation = "multiply"; x.drawImage(img, X, Y); x.restore() }
  shadowPoly(x, pts) {
    x.save(); x.globalCompositeOperation = "multiply"; x.fillStyle = C.shadow
    for (let yy = Math.min(...pts.map((p) => p[1])); yy <= Math.max(...pts.map((p) => p[1])); yy++) {
      const xs = []
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]
        if ((y0 <= yy && y1 > yy) || (y1 <= yy && y0 > yy)) xs.push(x0 + (yy - y0) * (x1 - x0) / (y1 - y0))
      }
      xs.sort((a, b) => a - b)
      for (let i = 0; i + 1 < xs.length; i += 2) x.fillRect(Math.round(xs[i]), yy, Math.round(xs[i + 1] - xs[i]), 1)
    }
    x.restore()
  }
  line(x, x0, y0, x1, y1, w = 1, dash = 0, off = 0) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let i = 0; i <= n; i++) {
      if (dash && (i + off) % 3 === 0) continue
      x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, w)
    }
  }
  bubble(x, s, cx, tailY, font = "m11", maxLines = 2) {
    const lines = width(s, font) <= 150 ? [s] : wrap(s, font === "m11" ? "s9" : font, 150, maxLines)
    const f = lines.length > 1 && font === "m11" ? "s9" : font
    const lh = textImage("가", { font: f }).height + 1                // 실제 글자 높이로 줄 간격
    const w = Math.max(...lines.map((l) => width(l, f))) + 8, h = lines.length * lh + 5
    const x0 = Math.max(2, Math.min(W - 2 - w, Math.round(cx - w / 2))), y0 = Math.max(ARENA_TOP + 2, Math.round(tailY - h - 6))   // 위로 넘치면 강의실 안쪽으로
    x.fillStyle = C.K; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); x.fillStyle = C.X; x.fillRect(x0, y0, w, h)
    const tx = Math.max(x0 + 4, Math.min(x0 + w - 8, cx))
    x.fillStyle = C.X; for (let i = 0; i < 5; i++) x.fillRect(tx + i, y0 + h + i, 6 - i, 1)
    x.fillStyle = C.K; for (let i = 0; i < 6; i++) { x.fillRect(tx - 1 + i, y0 + h + i, 1, 1); x.fillRect(tx + 6, y0 + h + Math.max(0, i - 1), 1, 1) }
    lines.forEach((l, i) => drawText(x, l, x0 + 4, y0 + 3 + i * lh, { font: f, color: C.K }))
  }
  drawTelegraph(x, ox, oy) {
    const a = this.attack, pr = Math.min(1, a.e / a.hitAt), left = a.hitAt - a.e
    x.fillStyle = C.U; this.line(x, 34 + ox, 140 + oy, 44, 189, 1, 3, Math.floor(this.t * 20))
    const d = Math.max(5, Math.round(11 - pr * 6)), col = left < PARRY_WIN && Math.floor(this.t * 16) % 2 ? C.X : C.U
    x.fillStyle = col
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      x.fillRect(dx < 0 ? 44 - d : 44 + d - 2, 189 + dy * d, 3, 1); x.fillRect(44 + dx * d, dy < 0 ? 189 - d : 189 + d - 2, 1, 3)
    }
    // 말풍선: 통통 튀며 등장
    const steps = [0.35, 0.8, 1.18, 0.94], i = Math.floor(a.e / 0.04)
    const s = i < steps.length ? steps[i] : 1
    if (s < 1 || i < steps.length) {
      const w = Math.round(60 * s), h = Math.max(3, Math.round(18 * s))
      x.fillStyle = C.K; x.fillRect(145 - (w >> 1) - 1, 51 - (h >> 1) - 1, w + 2, h + 2); x.fillStyle = C.X; x.fillRect(145 - (w >> 1), 51 - (h >> 1), w, h)
    } else this.bubble(x, a.text, 132, 66)
    if (a.kind === "barrage") for (let k = 0; k < 3; k++) drawText(x, ["404", "SEGFAULT", "NULL"][(k + a.idx) % 3], 20 + k * 50, Math.round(220 - ((this.t * 60 + k * 30) % 60)), { font: "s7", color: C.N, outline: C.K })
    if (a.kind === "chalk") {                                         // 교탁 위 손에서 학생 머리로
      const k = Math.max(0, (a.e - (a.hitAt - 0.38)) / 0.38), cx = Math.round(122 + (44 - 122) * k), cy = Math.round(146 + (186 - 146) * k - Math.sin(k * Math.PI) * 18)
      x.fillStyle = C.K; x.fillRect(cx - 1 + ox, cy - 1 + oy, 7, 4); x.fillStyle = C.c; x.fillRect(cx + ox, cy + oy, 5, 2); x.fillStyle = C.X; x.fillRect(cx + ox, cy + oy, 2, 1)
      if (k > 0) { x.fillStyle = C.c; for (let i = 1; i < 4; i++) x.fillRect(cx + ox + i * 6, cy + oy - i * 2 + 1, 1, 1) }
    }
    if (a.e >= a.appear) {
      const age = a.e - a.appear, span = a.hitAt - a.appear, rest = Math.max(0, 1 - age / span)
      const pop = age < 0.04 ? 3 : age < 0.08 ? -1 : 0
      if (a.decoy) this.drawTarget(x, a.dx, a.dy, rest, pop, true)
      this.drawTarget(x, a.tx, a.ty, rest, pop, false, rest < 0.3 && Math.floor(this.t * 16) % 2)
    }
  }
  drawTarget(x, X, Y, rest, pop, decoy, blink) {
    const w = TW + pop * 2, h = TH + pop, x0 = X - pop, y0 = Y - pop
    x.fillStyle = C.K; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2)
    x.fillStyle = decoy ? C.M : blink ? C.X : C.R; x.fillRect(x0, y0, w, h)
    x.fillStyle = decoy ? "#6b6e80" : C.Q; x.fillRect(x0, y0, w, 1); x.fillRect(x0, y0, 1, h)
    x.fillStyle = decoy ? C.m : C.r; x.fillRect(x0, y0 + h - 1, w, 1); x.fillRect(x0 + w - 1, y0, 1, h)
    this.box(x, x0 + 2, y0 + 2, w - 4, h - 7, decoy ? "#9aa2b5" : C.Q)
    const label = textImage(decoy ? "재수강" : "반박!", { font: "b11", color: decoy ? "#cfd3dd" : blink ? C.R : C.X, outline: decoy ? C.m : C.d7 })
    x.drawImage(label, x0 + ((w - label.width) >> 1), y0 + 2 + ((h - 7 - label.height) >> 1))   // 글자 높이를 재서 가운데
    x.fillStyle = C.K; x.fillRect(x0 + 2, y0 + h - 4, w - 4, 2)                        // 남은 시간 막대
    x.fillStyle = decoy ? "#9aa2b5" : rest < 0.3 ? C.U : C.N; x.fillRect(x0 + 2, y0 + h - 4, Math.round((w - 4) * (decoy ? 1 : rest)), 2)
  }
  drawPet(x, ox, oy) {
    const p = this.pet, k = p.kind, a = p.act > 0 ? 1 : 0, img = this.art[`pet_${k}_${a}`]
    if (!img) return
    let px = 108, py = 206
    if (k === "rc" || k === "rat") { px = 104 + Math.round(Math.abs(((this.t * 18) % 60) - 30)); py = 214 }   // 오가다 벽에 쿵
    if (k === "drone") { px = 104; py = 168 + (Math.floor(this.t * 4) % 2) }
    if (k === "owl") { px = 110; py = 186 + (Math.floor(this.t * 3) % 2) * 2 }
    if (k === "penguin" && Math.floor(this.t * 6) % 7 === 0) return                                   // 홀로그램 깜빡임
    if (a) px += 4
    x.drawImage(img, px + ox, py + oy)
  }
  drawBit(x, f) {
    const X = Math.round(f.x), Y = Math.round(f.y), d = f.d, r = f.r
    const P = (col, w, h, dx = 0, dy = 0) => { x.fillStyle = col; x.fillRect(X + dx, Y + dy, w, h) }
    if (d === "spark") { P(r > 0.5 ? "#ffe48a" : C.O, 2, 1); P("#ffffff", 1, 1) }
    else if (d === "bolt") { P(C.K, 5, 5, -1, -1); P("#d2d6e0", 3, 3); P("#555b6d", 1, 1, 1, 1) }
    else if (d === "chip") { P(C.K, 6, 5, -1, -1); P(C.n, 4, 3); P(C.o, 4, 1, 0, 2) }
    else if (d === "page") { P(C.K, 7, 8, -1, -1); P(C.p, 5, 6); P(C.l, 4, 1, 0, 2); P(C.l, 3, 1, 0, 4) }
    else if (d === "ink") { P("#2f4a9a", 2, 2); if (r > 0.5) P("#1b2a5e", 1, 1, 2, 2) }
    else if (d === "candle") { const up = r > 0.5; P(C.K, 4, 7, -1, -1); P(up ? C.U : "#3a9a5b", 2, 5); P(C.K, 1, 2, 0, -2) }
    else if (d === "drop") { P("#4f9be0", 2, 3); P("#c5dcf2", 1, 1) }
    else if (d === "chalk") { P(C.c, 2, 2); P(C.X, 1, 1) }
    else if (d === "rock") { P(C.K, 5, 4, -1, -1); P("#8e94a6", 3, 2); P("#555b6d", 2, 1, 1, 1) }
    else if (d === "paint") { P(["#29b6e8", "#e8296f", "#f2d430", "#1d1622"][Math.floor(r * 4)], 3, 3) }
    else if (d === "note") { P(C.K, 3, 2, 0, 4); P(C.K, 1, 5, 2, 0); P(C.K, 2, 1, 2, 0) }
    else if (d === "pill") { P(["#ff3434", "#4f9be0", "#ffe48a"][Math.floor(r * 3)], 3, 2); P(C.X, 1, 2, 2, 0) }
    else if (d === "bamboo") { P("#dcc479", 1, 4); P("#a68d3c", 1, 2, 1, 1) }
    else P(C.X, 2, 2)
  }
  drawHurtFx(x, f) {
    const t = f.t, col = f.college
    if (col === "eng" && t < 0.25) {                                   // 블루스크린
      x.fillStyle = "#1f5fbf"; x.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP)
      drawText(x, ":(", 12, 60, { font: "l14", bold: true, color: C.X })
      drawText(x, "문제가 발생했습니다", 12, 84, { font: "s9", color: C.X })
      drawText(x, "STOP: 0x0000SLEEP", 12, 100, { font: "s7", color: C.X })
    } else if (col === "hum") {                                        // 빨간 교정 부호 (돼지꼬리)
      x.fillStyle = C.R
      for (const [ax, ay] of [[30, 176], [62, 168]]) { this.line(x, ax, ay, ax + 6, ay - 6); this.line(x, ax + 6, ay - 6, ax + 10, ay - 2); this.line(x, ax + 10, ay - 2, ax + 6, ay + 2); this.line(x, ax + 6, ay + 2, ax + 14, ay - 10) }
      if (t < 0.4) drawText(x, "띄어쓰기!", 40, 150, { font: "s9", color: C.R, outline: C.X })
    } else if (col === "soc") { const img = textImage("반려", { font: "l14", bold: true, stamp: 8, color: C.U, outline: C.X }); x.drawImage(img, 46 - (img.width >> 1), 170 + (t < 0.06 ? -4 : 0)) }
    else if (col === "sci") { x.fillStyle = "#7cd65a"; for (let i = 0; i < 9; i++) x.fillRect(30 + i * 5, Math.round(196 - t * 60 - (i % 3) * 6), 3, 3); drawText(x, "치지직", 36, 160, { font: "s9", color: "#7cd65a", outline: C.K }) }
    else if (col === "nur") {                                          // 모니터가 일자로: 삐—
      x.fillStyle = C.N; this.line(x, 10, 200, 40, 200, 1); this.line(x, 40, 200, 46, 186, 1); this.line(x, 46, 186, 52, 212, 1); this.line(x, 52, 212, 58, 200, 1); x.fillRect(58, 200, Math.round(40 + t * 80), 1)
      if (t < 0.4) drawText(x, "삐—", 40, 170, { font: "b11", color: C.N, outline: C.K })
    } else if (col === "med") { const img = textImage("유급", { font: "l14", bold: true, stamp: -10, color: C.R, outline: C.X }); x.drawImage(img, 46 - (img.width >> 1), 170 + (t < 0.06 ? -4 : 0)) }
    else if (col === "art") { x.fillStyle = C.X; for (let i = 0; i < 14; i++) x.fillRect(20 + (i * 37) % 70, Math.round(190 - t * 40 + (i * 13) % 20), 2, 2); if (t < 0.3) drawText(x, "불협화음", 34, 158, { font: "s9", color: C.X, outline: C.K }) }
  }
  drawSmear(x, f, ox, oy) {
    const p = SMEAR[f.kind]
    x.fillStyle = C.X
    const xs = [p[0], p[2], p[4], p[6]], ys = [p[1], p[3], p[5], p[7]]
    const inside = (px, py) => {
      let c = false
      for (let i = 0, j = 3; i < 4; j = i++) if ((ys[i] > py) !== (ys[j] > py) && px < (xs[j] - xs[i]) * (py - ys[i]) / (ys[j] - ys[i]) + xs[i]) c = !c
      return c
    }
    for (let yy = Math.min(...ys); yy <= Math.max(...ys); yy++) for (let xx = Math.min(...xs); xx <= Math.max(...xs); xx++)
      if ((xx + yy) % 2 === 0 && inside(xx + 0.5, yy + 0.5)) x.fillRect(xx + ox, yy + oy, 1, 1)
  }
  drawStar(x, f) {                                                    // 각진 8각 별
    const r1 = f.big ? 11 : 7, r2 = f.big ? 4 : 3, k = f.t - (f.delay || 0) < 0.04 ? 1 : 0.7
    const pts = []
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = (i % 2 ? r2 : r1) * k; pts.push([f.x + Math.cos(a) * r, f.y + Math.sin(a) * r]) }
    this.fillPoly(x, pts.map(([px, py]) => [f.x + (px - f.x) * 1.35, f.y + (py - f.y) * 1.35]), C.K)
    this.fillPoly(x, pts, f.big ? "#fff3a8" : C.X)
    this.fillPoly(x, pts.map(([px, py]) => [f.x + (px - f.x) * 0.45, f.y + (py - f.y) * 0.45]), f.big ? C.O : "#fff3a8")
  }
  fillPoly(x, pts, col) {
    x.fillStyle = col
    const ys = pts.map((p) => p[1])
    for (let yy = Math.floor(Math.min(...ys)); yy <= Math.ceil(Math.max(...ys)); yy++) {
      const xs = []
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]
        if ((y0 <= yy + 0.5 && y1 > yy + 0.5) || (y1 <= yy + 0.5 && y0 > yy + 0.5)) xs.push(x0 + (yy + 0.5 - y0) * (x1 - x0) / (y1 - y0))
      }
      xs.sort((a, b) => a - b)
      for (let i = 0; i + 1 < xs.length; i += 2) x.fillRect(Math.round(xs[i]), yy, Math.max(1, Math.round(xs[i + 1] - xs[i])), 1)
    }
  }
  drawQuiz(x) {
    const q = this.quiz, slide = Math.min(1, q.t / 0.18), y0 = Math.round(-60 + slide * 104)
    x.fillStyle = C.K; x.fillRect(39, y0 - 1, 102, 52); x.fillStyle = C.p; x.fillRect(40, y0, 100, 50)
    x.fillStyle = C.l; for (let yy = y0 + 14; yy < y0 + 48; yy += 8) x.fillRect(42, yy, 96, 1)
    x.fillStyle = C.Q; x.fillRect(48, y0 + 1, 1, 48)
    drawText(x, "쪽지시험!", 90, y0 + 3, { font: "b11", color: C.R, align: "c" })
    drawText(x, q.done ? (q.n >= q.goal ? "만점" : "재시험") : "연타해서 답안 작성", 90, y0 + 17, { font: "s9", color: C.K, align: "c" })
    const ok = q.n >= q.goal
    drawText(x, `${Math.min(q.n, 99)} / ${q.goal}`, 90, y0 + 29, { font: "b11", color: ok ? C.n : C.K, align: "c" })
    const left = Math.max(0, 1 - q.t / q.dur)
    x.fillStyle = C.K; x.fillRect(50, y0 + 43, 82, 4); x.fillStyle = left < 0.3 ? C.U : C.O; x.fillRect(51, y0 + 44, Math.round(80 * left), 2)
  }
  drawIntro(x) {
    if (this.stage > 0) {
      drawText(x, `${this.stage + 1}번째 교수님`, 90, 74, { font: "b11", color: C.X, outline: C.K, align: "c" })
      drawText(x, `난이도 ${this.stage + 1}`, 90, 132, { font: "s9", color: C.Q, outline: C.K, align: "c" })
    }
    const s = this.intro > 0.5 ? "출석 체크!" : "시작!"
    const img = textImage(s, { font: "l14", bold: true, stamp: this.intro > 0.5 ? -6 : 5, color: C.U, outline: C.X, outline2: C.d7 })
    const pop = (this.intro > 0.5 ? 1.1 - this.intro : 0.5 - this.intro) < 0.06 ? -4 : 0
    x.drawImage(img, 90 - (img.width >> 1), 96 + pop)
  }
  drawBind(x, ox, oy) {
    if (this.bindKind === "wire" && this.wires) return this.drawWires(x, ox, oy)
    if (this.bindKind === "postit" && this.notesOn) {
      for (const [nx, ny, tilt] of this.notesOn) { x.fillStyle = C.K; x.fillRect(nx + ox - 1, ny + oy - 1, 12, 12); x.fillStyle = "#ffe48a"; x.fillRect(nx + ox, ny + oy, 10, 10); x.fillStyle = C.R; x.fillRect(nx + ox + 2, ny + oy + (tilt ? 3 : 2), 6, 1); x.fillRect(nx + ox + 2, ny + oy + (tilt ? 6 : 5), 5, 1) }
      return drawText(x, "부적 " + Math.ceil(this.bind) + "초", 90, 142, { font: "s7", color: C.X, outline: C.K, align: "c" })
    }
    if (this.bindKind === "bandage") {                                 // 흰 붕대 띠가 교수님을 비스듬히 감는다
      x.fillStyle = C.X
      for (let k = 0; k < 5; k++) { const y = 70 + k * 16 + oy; x.fillStyle = C.K; x.fillRect(48 + ox, y - 1, 86, 8); x.fillStyle = k % 2 ? "#eef0f4" : C.X; x.fillRect(48 + ox, y, 86, 6); x.fillStyle = "#c9ccd6"; for (let i = 0; i < 86; i += 6) x.fillRect(48 + ox + i, y + 2, 2, 1) }
      return drawText(x, "압박 " + Math.ceil(this.bind) + "초 · 데미지 1.3배", 90, 142, { font: "s7", color: C.X, outline: C.K, align: "c" })
    }
    if (this.bindKind === "sleep") {
      const k = Math.floor(this.t * 3) % 3
      for (let i = 0; i <= k; i++) drawText(x, "Z", 118 + i * 8 + ox, 56 - i * 8 + oy, { font: "b11", color: "#7fe6ff", outline: C.K })
      return drawText(x, "마취 " + Math.ceil(this.bind) + "초", 90, 142, { font: "s7", color: "#7fe6ff", outline: C.K, align: "c" })
    }
    if (this.bindKind === "stun") drawText(x, "기절 " + Math.ceil(this.bind) + "초", 90, 40, { font: "b11", color: "#ffe48a", outline: C.K, align: "c" })
  }
  drawIce(x, ox, oy) {                                                  // 각진 얼음 덩어리
    x.save(); x.globalAlpha = 0.55; x.fillStyle = "#bfefff"
    for (const [ix, iy, w, h] of [[56, 100, 22, 30], [80, 96, 26, 36], [106, 102, 20, 28], [70, 128, 40, 22]]) x.fillRect(ix + ox, iy + oy, w, h)
    x.restore(); x.fillStyle = "#ffffff"; for (const [ix, iy] of [[60, 102], [84, 98], [108, 104]]) x.fillRect(ix + ox, iy + oy, 6, 1)
    drawText(x, "얼음 " + Math.ceil(this.freezeP) + "초 · 데미지 1.5배", 90, 142, { font: "s7", color: "#7fe6ff", outline: C.K, align: "c" })
  }
  drawBuffs(x) {                                                        // 지금 켜진 효과를 학생 머리 위에 작게
    const tags = []
    if (this.critB > 0) tags.push(["밑줄 " + Math.ceil(this.critB), C.R])
    if (this.slowT > 0) tags.push(["REC " + Math.ceil(this.slowT), C.U])
    if (this.shield) tags.push(["팩트체크", C.N])
    if (this.blindT > 0) tags.push(["락카 " + Math.ceil(this.blindT), "#e8296f"])
    if (this.beatT > 0) tags.push(["박자 " + Math.ceil(this.beatT), C.o])
    if (this.guardT > 0) tags.push(["나이트 " + Math.ceil(this.guardT), "#9b8cff"])
    if (this.roundsT > 0) tags.push(["회진 " + Math.ceil(this.roundsT), C.X])
    let y = 150
    for (const [t, col] of tags) { drawText(x, t, 8, y, { font: "s7", color: col, outline: C.K }); y += 10 }
    if (this.beatT > 0) {                                               // 메트로놈 추: 박자에 맞춰 좌우로
      const ph = ((this.t - this.beat0) % (BEAT * 2)) / (BEAT * 2), sw = Math.round(Math.sin(ph * Math.PI * 2) * 8)
      x.fillStyle = C.K; x.fillRect(150, 160, 14, 22); x.fillStyle = "#a46d45"; x.fillRect(151, 161, 12, 20)
      x.fillStyle = C.K; this.line(x, 157, 178, 157 + sw, 164)
      const ph2 = ((this.t - this.beat0) % BEAT + BEAT) % BEAT
      if (ph2 < 0.09 || ph2 > BEAT - 0.09) { x.fillStyle = C.o; x.fillRect(148, 158, 18, 1); x.fillRect(148, 183, 18, 1) }
    }
  }
  drawUlt(x) {
    const c = this.cine, t = c.t
    if (c.id === "push") return this.drawPushCine(x)
    if (c.id === "report") { this.dim(x, 0.2); return drawText(x, "제출 마감 1분 전", 90, 60, { font: "b11", color: C.X, outline: C.K, align: "c" }) }
    if (c.id === "petition") {
      const n = Math.min(200000, Math.floor(180000 + t * 50000))
      drawText(x, "동의 " + n.toLocaleString("ko-KR") + "명", 90, 60, { font: "b11", color: C.U, outline: C.X, align: "c" })
      return
    }
    if (c.id === "canvas") {                                           // 하늘에서 떨어지는 캔버스
      const k = Math.min(1, t / 0.42), y = Math.round(-90 + k * 150)
      x.fillStyle = C.K; x.fillRect(29, y - 1, 122, 92); x.fillStyle = "#a46d45"; x.fillRect(30, y, 120, 90); x.fillStyle = C.p; x.fillRect(34, y + 4, 112, 82)
      x.fillStyle = "#29b6e8"; x.fillRect(44, y + 14, 30, 20); x.fillStyle = "#e8296f"; x.fillRect(84, y + 34, 40, 30); x.fillStyle = C.N; this.line(x, 40, y + 74, 140, y + 10, 2)
      return
    }
    if (c.id === "surgery") {                                          // 수술등 아래로 절개선이 하나씩 그어진다
      this.dim(x, 0.35)
      x.fillStyle = "#fff7d6"; x.fillRect(66, 30, 48, 6); x.fillStyle = C.K; x.fillRect(66, 36, 48, 1)
      x.fillStyle = C.U; x.fillRect(84, 24, 12, 4)
      x.fillStyle = C.X
      for (let k = 0; k < Math.min(5, c.n); k++) this.line(x, 60 + k * 14, 70, 76 + k * 14, 150, 1)
      return drawText(x, "수술 중", 90, 44, { font: "b11", color: C.U, outline: C.X, align: "c" })
    }
    if (c.id === "codeblue") {                                         // 빨간 경광 + 심전도
      if (Math.floor(t * 8) % 2) { x.fillStyle = "rgba(255,52,52,0.18)"; x.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP) }
      x.fillStyle = C.N
      let px = 0, py = 200
      for (let i = 0; i < 12; i++) { const nx = (i + 1) * 15, ny = i % 3 === 1 ? (i % 2 ? 180 : 214) : 200; if (nx / W < Math.min(1, t / 1.2)) { this.line(x, px, py, nx, ny, 1); px = nx; py = ny } }
      return drawText(x, "CODE BLUE · " + c.n + "/15", 90, 60, { font: "b11", color: C.X, outline: C.U, align: "c" })
    }
    if (c.id === "centrifuge") {                                       // 각진 회전 테두리
      const a = t * 30, r = 34
      x.fillStyle = "#7fe6ff"
      for (let k = 0; k < 4; k++) { const ang = a + k * Math.PI / 2, px = Math.round(100 + Math.cos(ang) * r), py = Math.round(112 + Math.sin(ang) * r * 0.6); x.fillRect(px - 3, py - 3, 6, 6) }
      drawText(x, "RPM " + Math.floor(3000 + t * 9000), 90, 60, { font: "b11", color: "#7fe6ff", outline: C.K, align: "c" })
    }
  }
  drawWires(x, ox, oy) {
    const cols = [C.R, C.N, C.Z]
    this.wires.forEach((pts, j) => { x.fillStyle = cols[j]; for (let i = 0; i + 1 < pts.length; i++) this.line(x, pts[i][0] + ox, pts[i][1] + oy + Math.round(Math.sin(this.t * 10 + i) * 1), pts[i + 1][0] + ox, pts[i + 1][1] + oy, 1) })
    drawText(x, "묶임 " + Math.ceil(this.bind) + "초", 90, 142, { font: "s7", color: C.X, outline: C.K, align: "c" })
  }
  drawChevrons(x, ox, oy) {
    x.fillStyle = C.O
    const k = Math.floor(this.t * 12) % 4
    for (let i = 0; i < 3; i++) { const bx = 14 + i * 8 + ox, by = 190 - ((k + i) % 4) * 3 + oy; this.line(x, bx, by, bx + 3, by + 3); this.line(x, bx + 3, by + 3, bx, by + 6) }
  }
  drawFx(x, f) {
    if (f.type === "part") x.drawImage(f.img, Math.round(f.x), Math.round(f.y))
    else if (f.type === "bit") this.drawBit(x, f)
    else if (f.type === "hurtfx") this.drawHurtFx(x, f)
    else if (f.type === "stampfx") { const img = textImage(f.s, { font: "l14", bold: true, stamp: -9, color: C.U, outline: C.X, outline2: C.d7 }); x.drawImage(img, f.x - (img.width >> 1), f.y + (f.t < 0.06 ? -4 : 0)) }
    else if (f.type === "shard") { x.fillStyle = C.X; x.fillRect(Math.round(f.x), Math.round(f.y), f.s, 2); x.fillRect(Math.round(f.x), Math.round(f.y), 2, f.s - 2); x.fillStyle = C.K; x.fillRect(Math.round(f.x) + f.s, Math.round(f.y), 1, 2) }
    else if (f.type === "aplus") { if (!(f.t > 0.45 && Math.floor(f.t * 20) % 2)) x.drawImage(this.art.aplus, f.x, f.y + (f.t < 0.05 ? -4 : 0)) }
    else if (f.type === "text" && f.img) { const X = f.center ? Math.round(f.x - f.img.width / 2) : Math.round(f.x); x.drawImage(f.img, Math.max(1, Math.min(W - f.img.width - 1, X)), Math.round(f.y)) }
    else if (f.type === "bubble") this.bubble(x, f.s, f.x, f.y + 14, "s9")
    else if (f.type === "confetti") { x.fillStyle = f.col; x.fillRect(Math.round(f.x), Math.round(f.y), 2, Math.floor(f.t * 8) % 2 ? 1 : 3) }
    else if (f.type === "star") this.drawStar(x, f)
    else if (f.type === "wave") {                                     // 연타 보너스: 퍼지는 마름모 테두리
      const r = Math.round(8 + f.t * 120)
      x.fillStyle = Math.floor(f.t * 30) % 2 ? C.O : C.X
      for (let i = 0; i <= r; i++) { x.fillRect(f.x - r + i, f.y - i, 2, 1); x.fillRect(f.x + r - i, f.y - i, 2, 1); x.fillRect(f.x - r + i, f.y + i, 2, 1); x.fillRect(f.x + r - i, f.y + i, 2, 1) }
    } else if (f.type === "chalkback") {
      const k = f.t / f.life, cx = Math.round(44 + (90 - 44) * k), cy = Math.round(186 + (66 - 186) * k)
      x.fillStyle = C.K; x.fillRect(cx - 1, cy - 1, 7, 4); x.fillStyle = C.c; x.fillRect(cx, cy, 5, 2)
      if (k > 0.85) drawText(x, "퍽!", 104, 52, { font: "b11", color: C.X, outline: C.K })
    }
  }
  dim(x, a) { x.fillStyle = `rgba(20,10,30,${a})`; x.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP) }
  drawPhaseCine(x) {
    const t = this.cine.t
    this.dim(x, 0.35)
    const img = textImage("2페이즈", { font: "l14", bold: true, stamp: -7, color: C.U, outline: C.X, outline2: C.d7 })
    if (t > 0.05) x.drawImage(img, 90 - (img.width >> 1), t < 0.12 ? 86 : 96)
    if (t > 0.3) drawText(x, "학회 마감 D-1 모드", 90, 132, { font: "s9", color: Math.floor(t * 8) % 2 ? C.X : C.n6, outline: C.K, align: "c" })
  }
  drawPushCine(x) {
    const t = this.cine.t, k = Math.min(1, t / 0.38)
    const img = textImage("git push --force", { font: "b11", color: C.N, outline: C.K })
    const X = Math.round(40 + k * 30), Y = Math.round(200 - k * 90)
    x.fillStyle = C.K; x.fillRect(X - 3, Y - 3, img.width + 6, img.height + 6); x.fillStyle = "#14271d"; x.fillRect(X - 2, Y - 2, img.width + 4, img.height + 4)
    x.drawImage(img, X, Y)
  }
  drawOver(x) {
    const t = this.overT
    if (this.over === "win") {
      if (t > 0.4) { const img = textImage("종강!", { font: "l14", bold: true, stamp: -6, color: C.U, outline: C.X, outline2: C.d7 }); x.drawImage(img, 90 - (img.width >> 1), t < 0.5 ? 70 : 80) }
    } else {
      this.dim(x, Math.min(0.6, t * 0.4))
      if (t > 0.5) { const img = textImage(this.over === "timeout" ? "학점 미달" : "기절", { font: "l14", bold: true, stamp: 5, color: C.U, outline: C.X, outline2: C.d7 }); x.drawImage(img, 90 - (img.width >> 1), t < 0.6 ? 96 : 104) }
    }
  }

  drawHUD(x) {
    const A = this.art, t = this.t
    // 위쪽 철판
    x.fillStyle = C.plate; x.fillRect(0, 0, W, 32)
    x.fillStyle = C.plateL; x.fillRect(0, 0, W, 2); x.fillStyle = C.plateD; x.fillRect(0, 30, W, 2)
    for (const [rx, ry] of [[2, 3], [176, 3], [2, 27], [176, 27]]) { x.fillStyle = C.rivet; x.fillRect(rx, ry, 2, 2); x.fillStyle = C.plateD; x.fillRect(rx + 1, ry + 1, 1, 1) }
    drawFit(x, profTitle(this.prof), 6, 3, 90, { font: "b11", color: C.X, shadow: C.plateD })   // 이름이 길면 작은 글꼴, 그래도 길면 말줄임
    if (this.phase === 1) drawText(x, `2페이즈 -${Math.max(0, Math.round((this.hp / this.hpMax - 0.5) * 100))}%`, 151, 5, { font: "s7", color: C.Q, align: "r" })
    else drawText(x, "학회 마감 D-1", 151, 5, { font: "s7", color: Math.floor(t * 4) % 2 ? C.U : C.Q, align: "r" })
    x.fillStyle = C.plateD; x.fillRect(5, 16, 146, 11); x.fillStyle = C.K; x.fillRect(6, 17, 144, 9); x.fillStyle = C.m; x.fillRect(7, 18, 142, 7)
    const hw = Math.round(142 * this.hp / this.hpMax), tw = Math.round(142 * this.trail / this.hpMax)
    x.fillStyle = C.Q; x.fillRect(7, 18, tw, 7); x.fillStyle = C.R; x.fillRect(7, 18, hw, 7); x.fillStyle = C.Q; x.fillRect(7, 18, hw, 1); x.fillStyle = C.r; x.fillRect(7, 24, hw, 1)
    x.fillStyle = C.X; x.fillRect(78, 15, 1, 13); x.fillRect(77, 14, 3, 1)
    x.fillStyle = C.p; x.fillRect(155, 4, 21, 24); x.fillStyle = C.K; x.fillRect(154, 3, 23, 1); x.fillRect(154, 28, 23, 1); x.fillRect(154, 3, 1, 26); x.fillRect(176, 3, 1, 26)
    const sec = Math.ceil(this.timeLeft), mm = Math.floor(sec / 60), ss = String(sec % 60).padStart(2, "0")
    drawText(x, `${mm}:${ss}`, 166, 10, { font: "s7", color: this.timeLeft < 20 && Math.floor(t * 4) % 2 ? C.U : C.K, align: "c" })
    x.save(); x.translate(0, this.ex)
    // 아래쪽 줄 노트
    x.fillStyle = C.p; x.fillRect(0, 236, W, 84); x.fillStyle = C.K; x.fillRect(0, 236, W, 1)
    x.fillStyle = C.l; for (let y = 246; y < 320; y += 9) x.fillRect(0, y, W, 1)
    x.fillStyle = C.Q; x.fillRect(39, 237, 1, 37)
    const danger = this.sleep < 20, blink = danger && Math.floor(t * 4) % 2 === 0
    const lv = danger ? 5 : Math.max(this.stu.dark, this.sleep < 50 ? 4 : 1)
    const mood = this.over === "win" ? "win" : this.hurtT > 0 ? "hurt" : "idle"
    x.drawImage(A[`por_${lv}_${mood}`], 3, 239)
    if (blink) this.box(x, 2, 238, 36, 36, C.U)
    drawText(x, "수면량", 42, 242, { font: "s9", color: blink ? C.U : C.K })
    if (blink) { this.box(x, 73, 239, 104, 13, C.U); this.dither(x, 72, 238, 106, 15, C.Q) ; x.fillStyle = C.p; x.fillRect(74, 240, 102, 11) }
    this.gauge(x, 75, 241, this.sleep / 100, blink ? C.U : C.Z, blink ? C.Q : C.b)
    if (danger) drawText(x, "위험! 기절 직전", 112, 242, { font: "s7", color: blink ? C.X : C.Q, outline: C.d7 })
    drawText(x, "카페인", 42, 257, { font: "s9", color: C.K })
    this.gauge(x, 75, 256, this.caff / 100, C.O, C.y)
    // 스킬: 넓은 칸 세 개
    this.SK.forEach((s, i) => {
      const img = A[s.icon] || A.ic_wire, cd = this.cd[s.id], lack = this.caff < s.cost
      x.fillStyle = C.K; x.fillRect(s.x, SKY, SKW, SKH); x.fillStyle = C.plate; x.fillRect(s.x + 1, SKY + 1, SKW - 2, SKH - 2)
      x.fillStyle = C.plateL; x.fillRect(s.x + 1, SKY + 1, SKW - 2, 1); x.fillStyle = C.plateD; x.fillRect(s.x + 1, SKY + SKH - 2, SKW - 2, 1)
      x.drawImage(img, s.x + 14, SKY + 3)
      drawText(x, s.name, s.x + SKW / 2, SKY + 32, { font: "s7", color: cd > 0 || lack ? "#9aa2b5" : C.X, align: "c" })
      if (cd > 0 || lack) {
        this.dither(x, s.x + 1, SKY + 1, SKW - 2, SKH - 2, C.K, 0.5)
        if (cd > 0) drawText(x, String(Math.ceil(cd)), s.x + SKW / 2, SKY + 11, { font: "b11", color: C.X, outline: C.K, align: "c" })
        else if (s.cost) drawText(x, "카페인 " + s.cost, s.x + SKW / 2, SKY + 13, { font: "s7", color: C.O, outline: C.K, align: "c" })
      } else if (s.cost >= 100 && Math.floor(t * 4) % 2) this.box(x, s.x - 1, SKY - 1, SKW + 2, SKH + 2, C.N)
      drawText(x, String(i + 1), s.x + 3, SKY + 2, { font: "s7", color: "#9aa2b5" })
    })
    if (this.hintT > 0) { const img = textImage("연타 = 과제 제출 · 빨간 반박! 터치 = 막기", { font: "s7", color: C.X }); x.fillStyle = C.K; x.fillRect(176 - img.width - 4, 224, img.width + 4, 10); x.drawImage(img, 176 - img.width - 2, 226) }
    if (this.spec > 0) drawText(x, `스펙 변경 ${Math.ceil(this.spec)}초`, 6, 225, { font: "s7", color: C.N, outline: C.K })
    x.restore()
    if (this.combo >= 5) drawText(x, `${this.combo} 콤보`, 6, 34 + 2, { font: "b11", color: C.O, outline: C.K })
    if (this.stage > 0) drawText(x, `${this.stage}연승 중`, 176, 36, { font: "s9", color: "#ffe04a", outline: C.K, align: "r" })
  }
  gauge(x, X, Y, f, col, hi) {
    x.fillStyle = C.K; x.fillRect(X, Y, 100, 9); x.fillStyle = C.m; x.fillRect(X + 1, Y + 1, 98, 7)
    const w = Math.round(98 * Math.max(0, Math.min(1, f)))
    x.fillStyle = col; x.fillRect(X + 1, Y + 1, w, 7); x.fillStyle = hi; x.fillRect(X + 1, Y + 1, w, 1)
    x.fillStyle = C.K; for (let gx = X + 20; gx < X + 99; gx += 20) x.fillRect(gx, Y + 1, 1, 7)
  }
  box(x, X, Y, w, h, col) { x.fillStyle = col; x.fillRect(X, Y, w, 1); x.fillRect(X, Y + h - 1, w, 1); x.fillRect(X, Y, 1, h); x.fillRect(X + w - 1, Y, 1, h) }
  dither(x, X, Y, w, h, col, dens = 0.25) {
    x.fillStyle = col
    const step = dens >= 0.5 ? 2 : 4
    for (let yy = 0; yy < h; yy++) for (let xx = (yy % 2) * (step >> 1); xx < w; xx += step) x.fillRect(X + xx, Y + yy, 1, 1)
  }
}
