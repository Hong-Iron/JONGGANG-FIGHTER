// 전투: 연타로 과제를 제출해 교수님 체력을 깎고, 말풍선 공격은 타이밍 맞춰 [반박]으로 쳐낸다.
// 화면은 세로 180×320 논리 픽셀. 모든 그림은 정수 좌표에 찍는다.
import { drawText, textImage, wrap, width } from "./text.js"
import { sfx } from "./sfx.js"

export const W = 180, H = 320
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
const SKILLS = [
  { id: "wire", name: "점퍼선", cost: 35, cd: 10, x: 3 },
  { id: "can", name: "원샷", cost: 0, cd: 18, x: 34 },
  { id: "push", name: "강제 푸시", cost: 100, cd: 4, x: 65 },
]
const GRADES = ["B0", "B+", "A0", "C+", "B0", "A0"]
const NOTES = ["논리적 비약", "출처 불분명", "오타", "근거 부족", "재수강?"]
const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const inRect = (x, y, rx, ry, rw, rh) => x >= rx && x < rx + rw && y >= ry && y < ry + rh

export class Battle {
  constructor({ art, prof, stu, onEnd }) {
    this.art = art; this.prof = prof; this.stu = stu; this.onEnd = onEnd
    const L = LV[prof.level] || LV.normal
    this.L = L
    this.t = 0; this.freeze = 0
    this.hpMax = L.hp; this.hp = L.hp; this.trail = L.hp
    this.sleep = 100; this.caff = 40; this.timeLeft = 180
    this.phase = 1; this.cine = null
    this.attack = null; this.nextAttack = 0.6
    this.intro = 1.1; this.anim = null; this.quiz = null; this.quizzes = 0
    this.parryLock = 0; this.parryPress = -9
    this.bind = 0; this.bindTick = 0; this.haste = 0; this.spec = 0
    this.cd = { wire: 0, can: 0, push: 0 }
    this.grad = null; this.summons = 0
    this.fx = []; this.notes = []
    this.shakeT = 0; this.shakeMag = 0; this.flash = null
    this.swingT = 0; this.hurtT = 0; this.profHitT = 0; this.lastTap = -1
    this.combo = 0; this.comboT = 0
    this.stats = { taps: 0, crits: 0, parries: 0, perfect: 0, whiffs: 0, maxCombo: 0, taken: 0, skills: 0 }
    this.over = null; this.overT = 0; this.ended = false
    this.armsT = 0
    this.hintT = 6
  }

  // ------------------------------------------------------------ 입력
  pointer(x, y) {
    if (this.over) return
    if (inRect(x, y, 97, 273, 81, 45)) return this.parry()
    for (let i = 0; i < 3; i++) if (inRect(x, y, SKILLS[i].x, 277, 28, 40)) return this.skill(i)
    if (y >= ARENA_TOP && y < ARENA_BOT) return this.tap(x, y)
  }
  key(k) {
    if (this.over) return
    if (k === " " || k === "k" || k === "K") this.parry()
    else if (k === "1" || k === "2" || k === "3") this.skill(Number(k) - 1)
    else if ("jJfFdD".includes(k) || k === "Enter") this.tap(100, 120)
  }

  tap() {
    if (this.cine || this.t - this.lastTap < 0.065) return
    this.lastTap = this.t
    this.stats.taps++
    this.combo = this.t - this.comboT < 0.45 ? this.combo + 1 : 1; this.comboT = this.t
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo)
    this.caff = Math.min(100, this.caff + 0.6)
    let mult = this.haste > 0 ? 2 : 1
    if (this.spec > 0) mult *= pick([0, 0.5, 1, 2, 3])
    const crit = Math.random() < 0.12
    const dmg = (crit ? 6 : 2) * mult
    sfx("key")
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
    this.damage(dmg + (finisher ? 15 : 0), { x: hx, y: hy, crit })
    for (let i = 0; i < (crit ? 3 : 1); i++) this.spawnCap(tx, ty)
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

  parry() {
    if (this.cine) return
    if (this.parryLock > 0) return
    this.parryPress = this.t
    const a = this.attack
    if (!a || a.done) return this.whiff("헛반박!")                   // 공격이 없을 때
    const left = a.hitAt - a.e
    if (left > PARRY_WIN) return this.whiff("너무 일찍!")            // 반박할 때가 아직 아닐 때
    const perfect = left <= PERFECT_WIN
    a.done = true; a.parried = true
    this.stats.parries++; if (perfect) this.stats.perfect++
    sfx("parry"); this.hitstop(0.09); this.shake(perfect ? 3 : 2, 0.15)
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
    this.hurtT = 0.2; this.shake(1, 0.08); this.flash = { t: 0.08, color: C.Q }; sfx("early")
    this.say(`${msg} -${pen} 수면량`, 52, 176, C.X, { font: "b11", outline: C.r, outline2: C.K })
    if (this.sleep <= 0) this.finish("lose")
  }

  skill(i) {
    const s = SKILLS[i]
    if (this.cine || this.cd[s.id] > 0 || this.caff < s.cost) { sfx("early"); return }
    this.caff -= s.cost; this.cd[s.id] = s.cd; this.stats.skills++
    if (s.id === "wire") {
      sfx("skill"); this.bind = 3; this.bindTick = 0
      this.wires = Array.from({ length: 3 }, () => Array.from({ length: 6 }, (_, k) => [44 + k * 18 + rnd(-4, 4), rnd(96, 140)]))
      if (this.attack && !this.attack.done) { this.attack.done = true; this.endAttack() }
      this.say("while(true) 묶기!", 90, 150, C.N, { font: "b11", outline: C.K })
    } else if (s.id === "can") {
      sfx("gulp"); this.haste = 5; this.caff = Math.min(100, this.caff + 40)
      this.say("카페인 오버클럭!", 60, 168, C.O, { font: "b11", outline: C.K })
    } else {
      sfx("push"); this.cine = { kind: "push", t: 0 }
    }
  }

  // ------------------------------------------------------------ 진행
  update(dt) {
    if (this.ended) return
    dt = Math.min(dt, 0.05)
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
    this.caff = Math.min(100, this.caff + dt * 5)
    this.trail = Math.max(this.hp, this.trail - dt * 120)
    if (this.phase === 2) this.armsT = Math.min(1, this.armsT + dt * 2)
    if (this.bind > 0) {
      this.bind -= dt; this.bindTick -= dt
      if (this.bindTick <= 0) { this.bindTick = 0.5; this.damage(4, { x: 90 + rnd(-30, 30), y: 120, noGrade: true, quiet: true }) }
    }
    if (this.grad && this.grad.enter < 1) this.grad.enter = Math.min(1, this.grad.enter + dt * 2.5)
    // 교수님 공격 (시작 연출과 쪽지시험 동안은 쉰다)
    if (this.attack) this.updateAttack(dt)
    else if (this.bind <= 0 && this.intro <= 0 && !this.quiz) {
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
    const tele = kind === "barrage" ? 0.62 : kind === "chalk" ? 0.72 : L.tele[p2 ? 1 : 0]
    this.attack = { kind, text, count, idx: 0, e: 0, hitAt: tele, tele, done: false }
    sfx("laser")
  }
  updateAttack(dt) {
    const a = this.attack
    a.e += dt
    if (!a.done && a.e >= a.hitAt + 0.05) {                           // 맞았다
      a.done = true
      const dmg = this.L.dmg[this.phase === 2 ? 1 : 0] * (a.kind === "barrage" ? 0.6 : a.kind === "chalk" ? 0.5 : 1)
      this.sleep = Math.max(0, this.sleep - dmg); this.stats.taken += dmg
      this.hurtT = 0.45; this.shake(4, 0.25); this.flash = { t: 0.18, color: C.U }; sfx("hurt")
      this.combo = 0
      this.say("-" + Math.round(dmg) + " 수면량", 40, 168, C.X, { font: "b11", outline: C.U, outline2: C.K, rise: 1 })
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
      sfx("laser"); return
    }
    this.attack = null
    const g = this.L.gap[this.phase === 2 ? 1 : 0]
    this.nextAttack = rnd(g[0], g[1])
  }

  damage(n, { x, y, crit, noGrade, quiet } = {}) {
    if (this.over || this.cine?.kind === "phase") return
    if (this.grad && this.grad.enter >= 1) {                           // 랩장이 대신 맞는다
      this.grad.hp -= n; this.grad.hitT = 0.08
      n *= 0.2
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
    this.grad = { hp: this.L.gradHp, max: this.L.gradHp, enter: 0, hitT: 0, line: this.summons === 1 ? "그건 교수님께 말씀드리기 전에 제 선에서 정리할게요" : "교수님, 제가 막겠습니다", lineT: 2.6 }
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
    if (c.kind === "push") {
      if (!c.hit && c.t >= 0.38) {
        c.hit = true; this.flash = { t: 0.2, color: C.X }; this.shake(6, 0.45); this.hitstop(0.12)
        if (this.grad) this.gradDown()
        this.cine = null
        this.damage(120, { x: 100, y: 110, crit: true })
        this.say("강제 푸시!", 90, 136, C.N, { font: "l14", bold: true, outline: C.K, outline2: C.X, rise: 0 })
        if (!this.over && !(this.cine)) this.cine = null
      }
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
      this.onEnd({ result: this.over, time: used, sleep: Math.round(this.sleep), stats: this.stats, prof: this.prof, stu: this.stu })
    }
  }

  // ------------------------------------------------------------ 효과
  hitstop(s) { this.freeze = Math.max(this.freeze, s) }
  shake(m, t) { this.shakeMag = Math.max(this.shakeMag, m); this.shakeT = Math.max(this.shakeT, t) }
  spawnCap(x, y) {
    const img = this.art[pick(["cap_c", "cap_v", "cap_ctrl", "cap_blank", "cap_blank"])]
    this.fx.push({ type: "part", img, x, y, vx: rnd(-90, 90), vy: rnd(-150, -70), t: 0, life: 0.9 })
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
    x.fillStyle = C.k; x.fillRect(0, 0, W, H)
    const sh = this.shakeT > 0 ? [Math.round(rnd(-1, 1) * this.shakeMag), Math.round(rnd(-1, 1) * this.shakeMag * 0.6)] : [0, 0]
    const [ox, oy] = sh
    x.save(); x.beginPath(); x.rect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP); x.clip()
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
    if (this.bind > 0 && this.wires) this.drawWires(x, ox, oy + bob)
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
    if (this.cine?.kind === "push") this.drawPushCine(x)
    if (this.over) this.drawOver(x)
    x.restore()
    this.drawHUD(x)
    if (this.flash) { x.fillStyle = this.flash.color; for (let i = 0; i < 3; i++) { x.fillRect(i, i, W - i * 2, 1); x.fillRect(i, H - 1 - i, W - i * 2, 1); x.fillRect(i, i, 1, H - i * 2); x.fillRect(W - 1 - i, i, 1, H - i * 2) } }
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
    const lh = f === "s9" ? 11 : f === "s7" ? 9 : 13
    const w = Math.max(...lines.map((l) => width(l, f))) + 8, h = lines.length * lh + 5
    const x0 = Math.max(2, Math.min(W - 2 - w, Math.round(cx - w / 2))), y0 = Math.round(tailY - h - 6)
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
    if (left < PARRY_WIN) drawText(x, "지금 반박!", 137, 262, { font: "s9", color: C.X, outline: C.U, align: "c" })
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
    const s = this.intro > 0.5 ? "출석 체크!" : "시작!"
    const img = textImage(s, { font: "l14", bold: true, stamp: this.intro > 0.5 ? -6 : 5, color: C.U, outline: C.X, outline2: C.d7 })
    const pop = (this.intro > 0.5 ? 1.1 - this.intro : 0.5 - this.intro) < 0.06 ? -4 : 0
    x.drawImage(img, 90 - (img.width >> 1), 96 + pop)
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
    drawText(x, `공대 ${this.prof.name} 교수`, 6, 3, { font: "b11", color: C.X, shadow: C.plateD })
    if (this.phase === 1) drawText(x, `2페이즈 -${Math.max(0, Math.round((this.hp / this.hpMax - 0.5) * 100))}%`, 151, 5, { font: "s7", color: C.Q, align: "r" })
    else drawText(x, "학회 마감 D-1", 151, 5, { font: "s7", color: Math.floor(t * 4) % 2 ? C.U : C.Q, align: "r" })
    x.fillStyle = C.plateD; x.fillRect(5, 16, 146, 11); x.fillStyle = C.K; x.fillRect(6, 17, 144, 9); x.fillStyle = C.m; x.fillRect(7, 18, 142, 7)
    const hw = Math.round(142 * this.hp / this.hpMax), tw = Math.round(142 * this.trail / this.hpMax)
    x.fillStyle = C.Q; x.fillRect(7, 18, tw, 7); x.fillStyle = C.R; x.fillRect(7, 18, hw, 7); x.fillStyle = C.Q; x.fillRect(7, 18, hw, 1); x.fillStyle = C.r; x.fillRect(7, 24, hw, 1)
    x.fillStyle = C.X; x.fillRect(78, 15, 1, 13); x.fillRect(77, 14, 3, 1)
    x.fillStyle = C.p; x.fillRect(155, 4, 21, 24); x.fillStyle = C.K; x.fillRect(154, 3, 23, 1); x.fillRect(154, 28, 23, 1); x.fillRect(154, 3, 1, 26); x.fillRect(176, 3, 1, 26)
    const sec = Math.ceil(this.timeLeft), mm = Math.floor(sec / 60), ss = String(sec % 60).padStart(2, "0")
    drawText(x, `${mm}:${ss}`, 166, 10, { font: "s7", color: this.timeLeft < 20 && Math.floor(t * 4) % 2 ? C.U : C.K, align: "c" })
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
    // 스킬
    SKILLS.forEach((s, i) => {
      const img = A[["ic_wire", "ic_can", "ic_push"][i]]
      x.drawImage(img, s.x, 277)
      const cd = this.cd[s.id], lack = this.caff < s.cost
      if (cd > 0 || lack) { this.dither(x, s.x + 1, 278, 26, 26, C.K, 0.5); if (cd > 0) drawText(x, String(Math.ceil(cd)), s.x + 14, 285, { font: "s9", color: C.X, outline: C.K, align: "c" }) }
      else if (s.id === "push" && Math.floor(t * 4) % 2) this.box(x, s.x - 1, 276, 30, 30, C.N)
      drawText(x, s.name, s.x + 14, 308, { font: "s7", color: cd > 0 || lack ? C.A : C.K, align: "c" })
    })
    // 반박 버튼
    const down = this.t - this.parryPress < 0.12, dy = down ? 2 : 0, ready = this.attack && !this.attack.done && this.attack.hitAt - this.attack.e < PARRY_WIN
    x.fillStyle = C.n; x.fillRect(97, 273, 81, 45)
    this.box(x, 98, 274, 79, 43, down || (ready && Math.floor(t * 16) % 2) ? C.X : C.N); this.box(x, 99, 275, 77, 41, down ? C.n6 : C.N)
    x.fillStyle = C.d7; x.fillRect(100, 276 + dy, 75, 39 - dy); x.fillStyle = this.parryLock > 0 ? C.r : C.R; x.fillRect(100, 276 + dy, 75, 36 - dy)
    if (!down) { x.fillStyle = C.Q; x.fillRect(100, 276, 75, 2); x.fillRect(100, 276, 1, 36) }
    x.fillStyle = C.r; x.fillRect(100, 311, 75, 1); x.fillRect(174, 276 + dy, 1, 36 - dy)
    drawText(x, "반박!", 137, 282 + dy, { font: "l14", bold: true, color: C.X, outline: C.d7, align: "c" })
    drawText(x, "SPACE", 137, 302 + dy, { font: "s7", color: C.Q, align: "c" })
    if (this.hintT > 0) { const img = textImage("화면 연타 = 과제 제출", { font: "s7", color: C.X }); x.fillStyle = C.K; x.fillRect(176 - img.width - 4, 224, img.width + 4, 10); x.drawImage(img, 176 - img.width - 2, 226) }
    if (this.spec > 0) drawText(x, `스펙 변경 ${Math.ceil(this.spec)}초`, 6, 225, { font: "s7", color: C.N, outline: C.K })
    if (this.combo >= 5) drawText(x, `${this.combo} 콤보`, 6, 34 + 2, { font: "b11", color: C.O, outline: C.K })
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
