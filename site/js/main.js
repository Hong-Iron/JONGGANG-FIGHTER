// 종강 파이터: 화면 전환, 교수님 목록, 연속 대전, 입력, 화면 배율.
import { loadArtSource, buildArt } from "./art.js?v=202610191101"
import { loadFonts, drawText, textImage } from "./text.js?v=202610191101"
import { Battle, W, H, RUN_TIME, drawCeiling, setVibrate, buzzOnce, skillSet } from "./battle.js?v=202610191101"
import { UP, rollChoices, upSummary, upStats } from "./upgrades.js?v=202610191101"
import { unlock, sfx, setMuted, isMuted } from "./sfx.js?v=202610191101"
import { makeCard } from "./card.js?v=202610191101"
import { PART_GROUPS, PROF_GROUPS, allowedFor, WEAPON, SETS, statsOf } from "./parts.js?v=202610191101"
import { lbWin, lbBoard } from "./lb.js?v=202610191101"
import { COLLEGES, KAKAO_KEY, gameHome, profTitle, PROF_OPTS, STU_OPTS, DEFAULT_STU, PRESETS, ROSTER_MAX, sanitizeProf, sanitizeStu, sanitizeRoster, decodeProf, decodeRoster, decodeStreak, rosterLink, loadLocal, saveLocal, loadRecord, recordWin, recordRunEnd } from "./config.js?v=202610191101"

const $ = (s) => document.querySelector(s)
const cv = $("#game"), ctx = cv.getContext("2d")
ctx.imageSmoothingEnabled = false

// 친구가 보낸 결투장: ?r=교수님 목록 (옛 링크 ?b=교수님 한 명), ?s=친구 연승
const QS = new URLSearchParams(location.search)
const linkRoster = decodeRoster(QS.get("r")) || (decodeProf(QS.get("b")) ? [decodeProf(QS.get("b"))] : null)
const linkStreak = linkRoster ? decodeStreak(QS.get("s")) : 0
let useChallenge = !!linkRoster
let record = loadRecord()
// 내 교수님 목록 (예전 버전의 교수님 한 명이 있으면 맨 앞에)
let roster = (() => {
  const saved = loadLocal("jg-roster", null)
  if (saved) return sanitizeRoster(saved)
  const old = loadLocal("jg-prof", null)
  return sanitizeRoster(old ? [old, ...PRESETS.slice(1)] : PRESETS)
})()
const saveRoster = () => saveLocal("jg-roster", roster)
let stu = sanitizeStu(loadLocal("jg-stu", DEFAULT_STU))
let art = null, battle = null, lastRes = null, screen = "load", run = null, editIdx = 0
const active = () => (useChallenge && linkRoster ? linkRoster : roster)

// ---------------------------------------------------------------- 배율
// 폰(세로, 터치): 가로를 꽉 채우고 남는 세로만큼 논리 높이를 320~420으로 늘린다. 노치·홈 막대 자리는 비운다.
// PC: 정수 배율로 또렷하게.
let EX = 0
function fit() {
  const wrap = $("#wrap"), cs = getComputedStyle(wrap)
  const vw = window.innerWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  const vh = window.innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
  const phone = vw < vh && (matchMedia("(pointer: coarse)").matches || vw <= 600)
  let k, h = H
  if (phone) {
    k = vw / W
    h = Math.max(H, Math.min(420, Math.floor(vh / k)))
    if (h * k > vh) k = vh / h
  } else {
    k = Math.floor(Math.min(vw / W, vh / H))
    if (k < 1) k = Math.min(vw / W, vh / H)
  }
  EX = h - H
  if (cv.height !== h) { cv.height = h; ctx.imageSmoothingEnabled = false }
  const st = $("#stage"); st.style.height = cv.style.height = h + "px"
  st.style.transform = `scale(${k})`
  st.style.marginRight = `${W * (k - 1)}px`; st.style.marginBottom = `${h * (k - 1)}px`
  if (battle) battle.setExtra(EX)
}
window.addEventListener("resize", fit); fit()

const menuProf = () => active()[0]
// 등판 글씨: 갈무리를 1배 픽셀로 찍어 'o'/'.' 줄로 넘긴다 (그림 원본은 한글 글꼴이 없어서)
const COLLEGE_FULL = Object.fromEntries(COLLEGES.map(([c, , f]) => [c, f]))
function printRows(st) {
  const SHORT = Object.fromEntries(COLLEGES.map(([c, sh]) => [c, sh]))
  const full = st.print === "college" ? COLLEGE_FULL[st.college] || "대학교" : st.print === "custom" ? st.printText || "종강" : st.print === "jersey" ? st.no : st.print === "crest" ? "UNIV" : ""
  if (!full) return []
  const maxW = st.print === "jersey" ? 48 : 42                         // 마크(12칸) 옆에 들어가게
  // 차례로 시도: 원래 글꼴 → 작은 글꼴 → (단과대면) 줄임말
  const tries = st.print === "jersey" ? [[full, "l14", true], [full, "b11", true]]
    : [[full, "s9", false], [full, "s7", false], ...(st.print === "college" ? [[SHORT[st.college] || "대학", "s9", false]] : [])]
  let pick = tries[tries.length - 1]
  for (const t of tries) if (textImage(t[0], { font: t[1], bold: t[2], color: "#000" }).width <= maxW) { pick = t; break }
  const im = textImage(pick[0], { font: pick[1], bold: pick[2], color: "#000" })
  const w = Math.min(im.width, maxW), d = im.getContext("2d").getImageData(0, 0, w, im.height).data, rows = []
  for (let y = 0; y < im.height; y++) { let r = ""; for (let x = 0; x < w; x++) r += d[(y * w + x) * 4 + 3] > 127 ? "o" : "."; rows.push(r) }
  while (rows.length && !rows[rows.length - 1].includes("o")) rows.pop()
  while (rows.length && !rows[0].includes("o")) rows.shift()
  return rows.slice(0, st.print === "jersey" ? 16 : 10)
}
const withRows = (st) => ({ ...st, printRows: printRows(st) })
function rebuild(p = menuProf()) { art = buildArt({ prof: p, stu: withRows(stu) }); drawPreviews(); renderStats() }

// ---------------------------------------------------------------- 화면
function show(name) {
  screen = name
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("on", s.id === "s-" + name))
  if (name === "title") renderTitle()
  if (name === "roster") renderRoster()
}
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.go === "roster" && screen === "prof") commitProfForm()
  if (b.dataset.go === "title" && !battle) rebuild()
  show(b.dataset.go)
}))

function toast(s) {
  const t = $("#toast"); t.textContent = s; t.hidden = false
  clearTimeout(toast.id); toast.id = setTimeout(() => (t.hidden = true), 2000)
}
function renderTitle() {
  const c = $("#challenge")
  if (linkRoster && useChallenge) {
    c.hidden = false
    const who = linkRoster.length > 1 ? `교수님 ${linkRoster.length}명` : `${profTitle(linkRoster[0])}님`
    c.textContent = linkStreak ? `친구가 ${who} 상대로 ${linkStreak}연승! 넘어 보세요` : `친구가 만든 ${who}이 기다립니다`
    $("#b-fight").textContent = "결투 수락"
  } else { c.hidden = true; $("#b-fight").textContent = "연속 대전 시작" }
}

// 선택지 줄: 이름 | ‹ 값 ›
const SYNC = {}
// kind: "stu" | "prof"면 성별에 맞는 선택지만 보인다(parts.js BY_GENDER). reg: 줄마다 다시 그리는 함수 모음
function optRows(el, opts, get, set, labels, kind, reg = SYNC) {
  el.innerHTML = ""
  for (const [key, all] of Object.entries(opts)) {
    const vis = () => { const a = kind && allowedFor(kind, key, get()); return a ? all.filter((o) => a.includes(o[0])) : all }
    const row = document.createElement("div"); row.className = "opt"
    const lab = document.createElement("span"); lab.textContent = labels[key]
    const prev = document.createElement("button"); prev.textContent = "<"
    const val = document.createElement("span"); val.className = "v"
    const next = document.createElement("button"); next.textContent = ">"
    const sync = () => {
      const list = vis(), t = (list.find((o) => o[0] === get()[key]) || list[0])[1]; val.textContent = t; val.classList.toggle("tiny", t.length > 11)   // 긴 이름은 작은 글꼴
      row.style.display = list.length < 2 && list.length < all.length ? "none" : ""   // 고를 게 하나뿐이면 (여자 교수님 수염) 줄을 숨긴다
    }
    const step = (d) => {
      const list = vis(), i = list.findIndex((o) => o[0] === get()[key]), n = list[(i + d + list.length) % list.length][0]
      set({ ...get(), [key]: n }); for (const f of Object.values(reg)) f()
    }
    prev.onclick = () => step(-1); next.onclick = () => step(1)
    row.append(lab, prev, val, next); el.append(row); sync()
    el["sync_" + key] = sync; reg[key] = sync
  }
}
let rebuildTimer = 0
function later(p) { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(() => rebuild(p), 60) }

// 학생 꾸미기: 묶음별 선택지 + 스탯이 붙은 파츠는 이름 옆에 표시
const STAT_N = { mental: "멘탈", speed: "타자", luck: "운", caff: "카페인" }
const statText = (o) => (o ? " · " + Object.entries(o).map(([k, v]) => `${STAT_N[k]}+${v}`).join(" ") : "")
function stuForm() {
  const box = $("#stu-form"); box.innerHTML = ""
  for (const [gname, rows] of PART_GROUPS) {
    const h = document.createElement("div"); h.className = "grp"; h.textContent = gname
    const sub = document.createElement("div"); sub.className = "form"
    box.append(h, sub)
    const opts = Object.fromEntries(rows.map(([k, , list]) => [k, list.map((o) => [o[0], o[1] + statText(o[2])])]))
    const labels = Object.fromEntries(rows.map(([k, n]) => [k, n]))
    optRows(sub, opts, () => stu, (v) => { stu = sanitizeStu(v); saveLocal("jg-stu", stu); later(); renderStats() }, labels, "stu")
  }
}
stuForm()
const stars = (v, lo, hi) => { const n = Math.max(1, Math.min(3, Math.round(1 + 2 * (v - lo) / (hi - lo)))); return "■".repeat(n) + "□".repeat(3 - n) }
function renderStats() {
  const st = statsOf(stu), Wp = WEAPON[stu.weapon] || WEAPON.keyboard, box = $("#stu-stats")
  box.textContent = ""
  const line = (parts) => { const d = document.createElement("div"); for (const [t, b] of parts) { const e = document.createElement(b ? "b" : "span"); e.textContent = t; d.append(e) } box.append(d) }
  line([["멘탈 ", 0], [String(st.mental), 1], [" · 타자 ", 0], [String(st.speed), 1], [" · 운 ", 0], [String(st.luck), 1], [" · 카페인 ", 0], [String(st.caff), 1]])
  line([[Wp.name + "  ", 1], [`공격 ${stars(Wp.dmg * (Wp.shots || 1), 1.5, 3.6)} 속도 ${stars(-Wp.rate, -0.11, -0.05)} 치명 ${stars(Wp.crit, 0.06, 0.22)}`, 0]])
  line([[Wp.note, 0]])
  const sk = skillSet(stu.college)                                   // 단과대마다 다른 스킬 세 칸
  line([["스킬 ", 0], [sk.map((k) => k.name).join(" · "), 1]])
  for (const k of sk) line([[`${k.name}: ${k.desc}${k.cost ? ` (카페인 ${k.cost})` : ""}`, 0]])
  const sets = $("#stu-sets"); sets.textContent = ""
  for (const set of SETS) {
    const on = st.sets.includes(set), d = document.createElement("div")
    d.textContent = `${on ? "[켜짐] " : ""}${set.name}: ${set.hint} → ${set.desc}`
    if (on) d.style.color = "#1d6b3f"
    sets.append(d)
  }
}
const stuPrint = $("#stu-print"); stuPrint.value = stu.printText || ""
stuPrint.addEventListener("input", () => { stu = sanitizeStu({ ...stu, printText: stuPrint.value, print: stuPrint.value ? "custom" : stu.print }); saveLocal("jg-stu", stu); SYNC.print?.(); later() })
const stuNo = $("#stu-no"); stuNo.value = stu.no
stuNo.addEventListener("input", () => { const v = stuNo.value.replace(/[^0-9]/g, "").slice(0, 2); stuNo.value = v; if (v.length === 2) { stu = sanitizeStu({ ...stu, no: v }); saveLocal("jg-stu", stu); later() } })

// 교수님 만들기: 목록의 editIdx번째 교수님을 고친다
const pName = $("#prof-name"), pLines = [0, 1, 2].map((i) => $("#prof-l" + i))
const editing = () => roster[editIdx]
const PSYNC = {}
function profForm() {                                                    // 학생 꾸미기처럼 묶음별로
  const box = $("#prof-form"); box.innerHTML = ""
  for (const [gname, rows] of PROF_GROUPS) {
    const h = document.createElement("div"); h.className = "grp"; h.textContent = gname
    const sub = document.createElement("div"); sub.className = "form"
    box.append(h, sub)
    optRows(sub, Object.fromEntries(rows.map(([k, , list]) => [k, list])), editing, (v) => { roster[editIdx] = sanitizeProf(v); saveRoster(); later(roster[editIdx]); profPre() },
      Object.fromEntries(rows.map(([k, n]) => [k, n])), "prof", PSYNC)
  }
}
profForm()
const profPre = () => ($("#prof-pre").textContent = profTitle(editing()).split(" ")[0])   // 이름 앞 단과대
function fillProfForm() {
  const p = editing(); pName.value = p.name; pLines.forEach((el, i) => (el.value = p.lines[i] || ""))
  for (const f of Object.values(PSYNC)) f()
  profPre()
  $("#prof-title").textContent = `${editIdx + 1}번째 교수님`
}
function commitProfForm() {
  roster[editIdx] = sanitizeProf({ ...editing(), name: pName.value || "김OO", lines: pLines.map((e) => e.value) })
  saveRoster()
}
pName.addEventListener("input", commitProfForm); pLines.forEach((e) => e.addEventListener("input", commitProfForm))
function editProf(i) { editIdx = i; fillProfForm(); rebuild(roster[i]); show("prof") }

// 교수님 목록 화면
function renderRoster() {
  const list = $("#roster-list"); list.innerHTML = ""
  const LVN = Object.fromEntries(PROF_OPTS.level)
  roster.forEach((p, i) => {
    const row = document.createElement("div"); row.className = "rrow"
    const face = document.createElement("canvas"); face.width = 24; face.height = 24
    const f = face.getContext("2d"); f.imageSmoothingEnabled = false
    const img = buildArt({ prof: p, stu }, ["prof_idle"]).prof_idle
    f.fillStyle = "#2e5442"; f.fillRect(0, 0, 24, 24); f.drawImage(img, 67, 50, 48, 48, 0, 0, 24, 24)
    const nm = document.createElement("div"); nm.className = "nm"
    nm.append(`${i + 1}. ${profTitle(p)}`)
    const lv = document.createElement("span"); lv.className = "lv"; lv.textContent = `${LVN[p.level]} · “${p.lines[0]}”`; nm.append(lv)
    const ed = document.createElement("button"); ed.className = "btn"; ed.textContent = "수정"; ed.onclick = () => editProf(i)
    const del = document.createElement("button"); del.className = "btn"; del.textContent = "삭제"
    del.onclick = () => { if (roster.length <= 1) return toast("교수님이 한 명은 있어야 해요"); roster.splice(i, 1); saveRoster(); renderRoster() }
    row.append(face, nm, ed, del); list.append(row)
  })
  $("#b-add").textContent = roster.length >= ROSTER_MAX ? `최대 ${ROSTER_MAX}명` : "교수님 추가"
}
$("#b-add").onclick = () => {
  if (roster.length >= ROSTER_MAX) return toast(`교수님은 ${ROSTER_MAX}명까지예요`)
  const base = PRESETS[roster.length % PRESETS.length]
  roster.push(sanitizeProf({ ...base, name: ["이OO", "정OO", "강OO", "윤OO", "한OO", "조OO"][roster.length % 6] }))
  saveRoster(); editProf(roster.length - 1)
}

function drawPreviews() {
  if (!art) return
  const a = $("#stu-preview").getContext("2d"); a.imageSmoothingEnabled = false
  a.fillStyle = "#a89e8a"; a.fillRect(0, 0, 168, 100); a.fillStyle = "#cbc4b2"; a.fillRect(0, 0, 168, 30)
  a.drawImage(art.stu_idle, 0, 137, 134, 100, 0, 0, 134, 100)
  a.drawImage(art[`por_${stu.dark}_idle`], 133, 2)
  if (stu.pet && stu.pet !== "none" && art[`pet_${stu.pet}_0`]) a.drawImage(art[`pet_${stu.pet}_0`], 136, 74)
  const b = $("#prof-preview").getContext("2d"); b.imageSmoothingEnabled = false
  b.fillStyle = "#2e5442"; b.fillRect(0, 0, 80, 64); b.drawImage(art.prof_idle, 51, 36, 80, 64, 0, 0, 80, 64)
}

async function copyText(s) {
  try { await navigator.clipboard.writeText(s); return true } catch {
    const t = document.createElement("textarea"); t.value = s; document.body.append(t); t.select()
    let ok = false; try { ok = document.execCommand("copy") } catch {}
    t.remove(); return ok
  }
}
async function copyLink(list, streak) {
  if (screen === "prof") commitProfForm()
  const url = rosterLink(list, streak)
  toast((await copyText(url)) ? "결투장 링크를 복사했어요. 친구에게 보내 보세요" : url)
}

// ---------------------------------------------------------------- 연속 대전
// 이기면 3초 뒤 다음 교수님(목록을 돌아가며). 연승(stage)이 쌓일수록 어려워진다.
const TOTAL = () => ({ parries: 0, perfect: 0, crits: 0, maxCombo: 0, whiffs: 0, skills: 0, taps: 0, taken: 0 })
let nextTimer = 0
function startRun() {
  unlock(); if (screen === "prof") commitProfForm()
  if (!stu.college) return askCollege(startRun)
  document.activeElement?.blur?.()                       // 포커스 남은 버튼이 Enter·Space로 다시 눌리지 않게
  const list = active()
  run = { list, stage: 0, defeated: [], time: 0, sleep: 100, stats: TOTAL(), last: profTitle(list[0]), lastCollege: list[0].college, ups: {}, timeLeft: RUN_TIME }
  startFight()
}
const clock = (s) => { const t = Math.ceil(s); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` }
function startFight() {
  clearInterval(nextTimer)
  const p = run.list[run.stage % run.list.length]
  run.last = profTitle(p); run.lastCollege = p.college
  rebuild(p)
  battle = new Battle({ art, prof: p, stu, stage: run.stage, sleep: run.sleep, ups: run.ups, timeLeft: run.timeLeft, onEnd: endFight, onPause: pause })
  battle.setExtra(EX)
  document.activeElement?.blur?.()
  show("battle")
}
function addStats(s) {
  const t = run.stats
  for (const k of ["parries", "perfect", "crits", "whiffs", "skills", "taps", "taken"]) t[k] += s[k] || 0
  t.maxCombo = Math.max(t.maxCombo, s.maxCombo || 0)
}
function endFight(res) {
  addStats(res.stats); run.time += res.time; run.timeLeft = Math.max(0, res.timeLeft ?? run.timeLeft - res.time)
  if (res.result !== "win") return endRun(res.result)
  run.stage++; run.defeated.push(res.prof.name)
  record = recordWin(record, res.time, run.stage)
  lbWin(stu.college, run.stage)                          // 단과대 랭킹에 한 명 격파 + 이번 연승
  run.sleep = Math.min(100, res.sleep + 30 + upStats(run.ups).nap)   // 수면량은 30(+쪽잠)만 회복
  const next = run.list[run.stage % run.list.length]
  let n = 3, picked = false
  const info = () => ($("#next-info").textContent = `${run.stage}연승! 수면량 ${run.sleep}%로 회복 · 다음: ${profTitle(next)} (난이도 ${run.stage + 1}) · 남은 시간 ${clock(run.timeLeft)}` + (picked ? ` · ${n}초 뒤 시작` : ""))
  // 무기 강화: 셋 중 하나를 고르면 3초 뒤 시작한다 (다 최대면 고르지 않고 바로 센다)
  const box = $("#up-pick"), choices = rollChoices(run.ups)
  box.innerHTML = ""; box.classList.remove("done")
  const nextBtn = $("#b-next")
  const go = () => {
    picked = true; nextBtn.disabled = false; nextBtn.textContent = "바로 다음 교수님"
    $("#up-have").textContent = upSummary(run.ups) ? "지금 강화: " + upSummary(run.ups) : ""
    info(); nextTimer = setInterval(() => { n--; if (n <= 0) { clearInterval(nextTimer); if (screen === "next") startFight() } else info() }, 1000)
  }
  for (const id of choices) {
    const u = UP[id], lv = (run.ups[id] || 0) + 1, b = document.createElement("button")
    b.className = "btn up-card"; b.innerHTML = "<b></b><span></span>"
    b.querySelector("b").textContent = `${u.name} Lv${lv}${lv >= u.max ? " (최대)" : ""}`; b.querySelector("span").textContent = u.desc
    b.onclick = () => { if (picked) return; run.ups[id] = lv; b.classList.add("picked"); box.classList.add("done"); sfx("skill"); go() }
    box.append(b)
  }
  $(".up-title").hidden = !choices.length
  $("#up-have").textContent = upSummary(run.ups) ? "지금 강화: " + upSummary(run.ups) : ""
  if (choices.length) { nextBtn.disabled = true; nextBtn.textContent = "강화를 먼저 고르세요" }
  info()
  setTimeout(() => { battle = null; show("next"); document.activeElement?.blur?.() }, 150)
  if (!choices.length) go()
}
function endRun(kind) {
  clearInterval(nextTimer)
  record = recordRunEnd(record, kind, run.stage)
  const res = { result: kind, run: { streak: run.stage, defeated: run.defeated, time: run.time, last: run.last, lastCollege: run.lastCollege, ups: upSummary(run.ups) }, stats: run.stats, stu, record }
  lastRes = res
  const card = makeCard(art, res)
  $("#card").src = card.toDataURL("image/png")
  lastRes.cardCanvas = card
  lastRes.kakaoImage = null; prepKakao(lastRes)
  setTimeout(() => { battle = null; show("result") }, 200)
  if (run.stage && stu.college !== "none") setTimeout(async () => {   // 결과 화면에 내 단과대 순위 한 줄
    const rows = await lbBoard(); if (!rows || screen !== "result") return
    const r = rank(rows, "today", "best"), i = r.findIndex((x) => x.code === stu.college)
    if (i >= 0) toast(`${cname(stu.college)} 오늘 최고 연승 ${i + 1}위 (${r[i].today_best}연승)`)
  }, 1500)
}

// ---------------------------------------------------------------- 단과대
const cname = (c) => (COLLEGES.find((x) => x[0] === c) || [c, c])[1]
let afterCollege = null
function askCollege(then) {
  afterCollege = then
  const box = $("#college-list"); box.innerHTML = ""
  for (const [code, short, full] of COLLEGES) {
    const b = document.createElement("button"); b.className = "btn college-btn"; b.textContent = `${full} (${short})`
    b.onclick = () => setCollege(code); box.append(b)
  }
  show("college")
}
function setCollege(code) {
  stu = sanitizeStu({ ...stu, college: code }); saveLocal("jg-stu", stu)
  SYNC.college?.()
  const f = afterCollege; afterCollege = null; f?.()
}
$("#b-college-none").onclick = () => setCollege("none")

// 순위표: 오늘/전체 × 최고 연승 순/격파 수 순
const board = { tab: "today", sort: "best", rows: null, at: 0, back: "title", timer: 0 }
function rank(rows, tab, sort) {
  const k = tab === "today" ? { best: "today_best", wins: "today_wins" } : { best: "best_ever", wins: "total_wins" }
  const a = k[sort], b = sort === "best" ? k.wins : k.best
  return rows.slice().sort((x, y) => (y[a] - x[a]) || (y[b] - x[b]) || (x.sort - y.sort))
}
async function openBoard(from) {
  board.back = from; show("board"); drawBoard()
  await refreshBoard()
  clearInterval(board.timer); board.timer = setInterval(() => { if (screen === "board") refreshBoard(); else clearInterval(board.timer) }, 30000)
}
async function refreshBoard() {
  $("#board-note").textContent = "불러오는 중…"
  const rows = await lbBoard()
  if (rows) { board.rows = rows; board.at = Date.now() }
  drawBoard(!rows)
}
function drawBoard(failed) {
  document.querySelectorAll("#s-board [data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === board.tab))
  document.querySelectorAll("#s-board [data-sort]").forEach((b) => b.classList.toggle("on", b.dataset.sort === board.sort))
  const box = $("#board"); box.innerHTML = ""
  const head = document.createElement("div"); head.className = "brow head"
  for (const t of ["", "단과대", "최고", "격파", "도전"]) { const s = document.createElement("span"); s.textContent = t; s.className = t && t !== "단과대" ? "n" : ""; head.append(s) }
  box.append(head)
  if (!board.rows) { $("#board-note").textContent = failed ? "순위표를 불러오지 못했어요. 잠시 뒤 다시 눌러 보세요" : "불러오는 중…"; return }
  const today = board.tab === "today"
  rank(board.rows, board.tab, board.sort).forEach((r, i) => {
    const row = document.createElement("div"); row.className = "brow" + (r.code === stu.college ? " mine" : "")
    const cells = [String(i + 1), cname(r.code), `${today ? r.today_best : r.best_ever}연승`, String(today ? r.today_wins : r.total_wins), String(today ? r.today_runs : r.total_runs)]
    cells.forEach((t, j) => { const s = document.createElement("span"); s.textContent = t; s.className = j === 0 ? "rk" : j >= 2 ? "n" : ""; row.append(s) })
    box.append(row)
  })
  const mine = stu.college && stu.college !== "none" ? `내 단과대 ${cname(stu.college)} · ` : ""
  const ago = Math.max(0, Math.round((Date.now() - board.at) / 1000))
  $("#board-note").textContent = `${mine}${today ? "오늘(한국 시간 기준)" : "전체 기간"} · ${ago < 5 ? "방금" : ago + "초 전"} 갱신${failed ? " · 새로 고침 실패" : ""}`
}
document.querySelectorAll("#s-board [data-tab]").forEach((b) => (b.onclick = () => { board.tab = b.dataset.tab; drawBoard() }))
document.querySelectorAll("#s-board [data-sort]").forEach((b) => (b.onclick = () => { board.sort = b.dataset.sort; drawBoard() }))
$("#b-board-refresh").onclick = refreshBoard
$("#b-board-back").onclick = () => show(board.back)
$("#b-board").onclick = () => openBoard("title")
$("#b-board2").onclick = () => openBoard("result")

function pause() {
  if (!battle || battle.over || battle.paused) return
  battle.paused = true
  $("#pause-ups").textContent = run && upSummary(run.ups) ? "무기 강화: " + upSummary(run.ups) : ""
  show("pause")
}
function resume() { if (!battle) return; battle.paused = false; show("battle"); document.activeElement?.blur?.() }
document.addEventListener("visibilitychange", () => { if (document.hidden) pause() })   // 앱을 내리면 자동으로 멈춤

$("#b-fight").onclick = startRun
$("#b-roster-fight").onclick = () => { useChallenge = false; startRun() }
$("#b-again").onclick = startRun
$("#b-next").onclick = () => { if ($("#b-next").disabled) return; clearInterval(nextTimer); startFight() }
$("#b-stop").onclick = () => endRun("quit")
$("#b-resume").onclick = resume
$("#b-quit").onclick = () => { battle = null; endRun("quit") }
$("#b-roster").onclick = () => show("roster")
$("#b-stu").onclick = () => show("stu")
$("#b-help").onclick = () => show("help")
$("#b-link").onclick = () => copyLink(roster, record.best)
$("#b-link2").onclick = () => copyLink(run ? run.list : roster, lastRes?.run?.streak || 0)
// 소리와 진동은 따로 켜고 끈다. 진동 설정은 jg-vib ("0"이면 끔)
let vibOn = true
try { vibOn = localStorage.getItem("jg-vib") !== "0" } catch {}
setVibrate(vibOn)
const syncSound = () => {
  for (const id of ["#b-sound", "#b-sound2"]) $(id).textContent = isMuted() ? "소리 끔" : "소리 켬"
  for (const id of ["#b-vib", "#b-vib2"]) $(id).textContent = vibOn ? "진동 켬" : "진동 끔"
}
syncSound()
const toggleSound = () => { unlock(); setMuted(!isMuted()); syncSound() }
const toggleVib = () => { vibOn = !vibOn; try { localStorage.setItem("jg-vib", vibOn ? "1" : "0") } catch {} ; setVibrate(vibOn); syncSound()
  if (!vibOn) return
  const r = buzzOnce()
  if (r === "sent") toast("진동을 보냈어요. 안 울리면 폰의 무음·방해 금지 모드를 꺼 보세요")
  else if (r === "blocked") toast("브라우저가 진동을 막았어요. 화면을 한 번 누른 뒤 다시 켜 보세요")
}
for (const id of ["#b-sound", "#b-sound2"]) $(id).onclick = toggleSound
for (const id of ["#b-vib", "#b-vib2"]) $(id).onclick = toggleVib

function cardBlob() { return new Promise((r) => lastRes.cardCanvas.toBlob(r, "image/png")) }
$("#b-save").onclick = async () => {
  const blob = await cardBlob(), a = document.createElement("a")
  a.href = URL.createObjectURL(blob); a.download = `종강파이터_${lastRes.run.streak}연승.png`
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
// 카카오톡 공유: 결과 카드를 카카오 서버에 미리 올려 두고, 누르면 카드 + [나도 해보기] 버튼을 보낸다
let kakaoReady = null
function loadKakao() {
  if (!KAKAO_KEY) return Promise.resolve(false)
  if (kakaoReady) return kakaoReady
  kakaoReady = new Promise((res) => {
    const sc = document.createElement("script")
    sc.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js"; sc.crossOrigin = "anonymous"
    sc.integrity = "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J"
    sc.onload = () => { try { if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY); res(true) } catch { res(false) } }
    sc.onerror = () => res(false)
    document.head.append(sc)
  })
  return kakaoReady
}
function prepKakao(res) {                                                 // 누르는 순간 바로 보내야 팝업이 막히지 않는다
  res.kakaoImage = loadKakao().then(async (ok) => {
    if (!ok) return null
    const blob = await new Promise((r) => res.cardCanvas.toBlob(r, "image/png"))
    const out = await window.Kakao.Share.uploadImage({ file: [new File([blob], "jonggang.png", { type: "image/png" })] })
    return out.infos.original.url
  }).catch(() => null)
}
const shareText = (res) => res.run.streak >= 1 ? `교수님 ${res.run.streak}명 연속 격파! (${res.run.streak}연승) 내 기록 깨 봐` : `${res.run.last}님에게 바로 졌다… 복수해 줘`
$("#b-kakao").onclick = async () => {
  const res = lastRes, n = res.run.streak, url = rosterLink(run.list, n, 600), home = gameHome()   // 카톡 메시지 크기 제한 때문에 짧게
  if (await loadKakao()) {
    const img = await Promise.race([res.kakaoImage, new Promise((r) => setTimeout(() => r(null), 4000))])
    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: n >= 1 ? `종강 파이터 ${n}연승` : "종강 파이터",
          description: shareText(res),
          imageUrl: img || new URL("og.png", location.href).toString(), imageWidth: img ? 1080 : 1200, imageHeight: img ? 1350 : 630,
          link: { mobileWebUrl: home, webUrl: home },                  // 카드를 누르면 첫 화면, 버튼은 결투장
        },
        buttons: [{ title: "나도 해보기", link: { mobileWebUrl: url, webUrl: url } }],
      })
      return
    } catch { /* 아래 다른 방법으로 */ }
  }
  toast((await copyText(shareText(res) + " " + url)) ? "카카오톡을 열 수 없어 공유 문구와 링크를 복사했어요" : url)
}
$("#b-share").onclick = async () => {
  const blob = await cardBlob(), file = new File([blob], "jonggang.png", { type: "image/png" })
  const n = lastRes.run.streak, text = shareText(lastRes)
  const url = rosterLink(run.list, n)
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text, url }); return } catch { return } }
  if (navigator.share) { try { await navigator.share({ text, url }); return } catch { return } }
  toast((await copyText(text + " " + url)) ? "공유 문구와 링크를 복사했어요" : url)
}

// 캔버스 입력 (전투 중)
function logical(e) {
  const r = cv.getBoundingClientRect()
  return [Math.floor((e.clientX - r.left) * W / r.width), Math.floor((e.clientY - r.top) * cv.height / r.height)]   // 폰에서 늘어난 높이까지
}
cv.addEventListener("pointerdown", (e) => { unlock(); if (battle && !battle.paused) { e.preventDefault(); battle.pointer(...logical(e)) } })
window.addEventListener("keydown", (e) => {
  if (!battle) return
  if (e.key === " " || e.key === "Enter") e.preventDefault()
  if (e.repeat) return
  if (battle.paused) { if (e.key === "p" || e.key === "P" || e.key === "Escape") resume(); return }
  battle.key(e.key)
})

// ---------------------------------------------------------------- 그리기 반복
let last = performance.now()
function frame(now) {
  const dt = (now - last) / 1000; last = now
  if (battle) { battle.update(dt); battle.render(ctx) }
  else if (art) drawMenu(now / 1000)
  requestAnimationFrame(frame)
}
function drawMenu(t) {
  ctx.fillStyle = "#2e2436"; ctx.fillRect(0, 0, W, cv.height)
  ctx.drawImage(art.room, 0, 0, W, 32, 0, 0, W, 32)
  if (EX) drawCeiling(ctx, 32, EX)
  ctx.save(); ctx.translate(0, EX)
  ctx.drawImage(art.room, 0, 32, W, 204, 0, 32, W, 204)
  const bob = Math.floor(t * 1.6) % 2
  ctx.drawImage(art.prof_idle, -1, -1 + bob); ctx.drawImage(art.lectern, -1, -1); ctx.drawImage(art.stu_idle, -1, -1)
  ctx.restore()
  ctx.fillStyle = "rgba(20,10,30,0.45)"; ctx.fillRect(0, 0, W, 236 + EX)
  ctx.fillStyle = "#3b4150"; ctx.fillRect(0, 236 + EX, W, 84)
  ctx.save(); ctx.translate(0, Math.floor(EX / 2))
  if (screen === "title") {
    const logo = textImage("종강 파이터", { font: "l14", bold: true, color: "#ffffff", outline: "#c8353b", outline2: "#1d1622", shadow: "#5a1020" })
    ctx.drawImage(logo, 90 - (logo.width >> 1), 46)
    drawText(ctx, "교수님과의 사투", 90, 70, { font: "s9", color: "#b8ffd6", outline: "#1d1622", align: "c" })
    drawText(ctx, "전 단과대 편", 90, 82, { font: "s7", color: "#f39aa0", outline: "#1d1622", align: "c" })
    if (record.plays || record.wins) {                      // 이 브라우저에 남은 전적
      drawText(ctx, `최고 ${record.best}연승`, 90, 100, { font: "b11", color: record.best ? "#ffe04a" : "#ffffff", outline: "#1d1622", align: "c" })
      const fast = record.fastest ? ` · 최단 ${Math.floor(record.fastest / 60)}:${String(Math.floor(record.fastest % 60)).padStart(2, "0")}` : ""
      drawText(ctx, `지난 도전 ${record.streak}연승 · ${record.wins}승 ${record.losses}패${fast}`, 90, 114, { font: "s7", color: "#d3dbe9", outline: "#1d1622", align: "c" })
    }
  }
  ctx.restore()
}

// ---------------------------------------------------------------- 시작
;(async () => {
  try {
    await Promise.all([loadFonts(), loadArtSource()])
    rebuild()
    show(loadLocal("jg-seen-help", false) || linkRoster ? "title" : "help")   // 처음 온 사람은 하는 법부터
    saveLocal("jg-seen-help", true)
    requestAnimationFrame(frame)
  } catch (e) {
    $("#s-load").innerHTML = `<p class="center">불러오지 못했어요<br>${String(e.message || e).slice(0, 80)}</p>`
    console.error(e)
  }
})()

// 테스트용 손잡이
// 방문 수 (GoatCounter, 쿠키 없음): 공유·후원·랭킹 버튼과 친구 링크로 들어온 것만 센다. SMASH와 같은 사이트라 이름 앞에 jg-
function gcEvent(path) {
  try { const g = window.goatcounter; if (g && g.count) g.count({ path: "jg-" + path, title: "jonggang", event: true }) } catch { /* 브라우저가 막음 */ }
}
for (const [sel, ev] of [["#b-kakao", "share-kakao"], ["#b-share", "share-open"], ["#b-save", "share-save"], ["#b-link2", "share-link"], ["#b-link", "duel-link"], ["#s-result .support.kakao", "support-kakaopay"], ["#s-result .support.bmc", "support-bmc"], ["#b-kakaopay-title", "support-kakaopay-title"], ["#b-bmc-title", "support-bmc-title"], ["#b-board", "board-open"], ["#b-board2", "board-open"]])
  document.querySelector(sel)?.addEventListener("click", () => gcEvent(ev))
if (linkRoster) {                                                         // count.js가 늦게 오면 잠깐 기다렸다 보낸다
  let tries = 0; const t = setInterval(() => { if (window.goatcounter?.count || ++tries > 20) { clearInterval(t); gcEvent("challenge-open") } }, 500)
}

window.__jg = { get battle() { return battle }, get art() { return art }, get run() { return run }, get roster() { return roster }, get record() { return record }, startRun, startFight, show, editProf, pause, resume, get screen() { return screen } }
