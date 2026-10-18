// 종강 파이터: 화면 전환, 교수님 목록, 연속 대전, 입력, 화면 배율.
import { loadArtSource, buildArt } from "./art.js?v=202610190708"
import { loadFonts, drawText, textImage } from "./text.js?v=202610190708"
import { Battle, W, H, drawCeiling, setVibrate } from "./battle.js?v=202610190708"
import { unlock, sfx, setMuted, isMuted } from "./sfx.js?v=202610190708"
import { makeCard } from "./card.js?v=202610190708"
import { PROF_OPTS, STU_OPTS, DEFAULT_STU, PRESETS, ROSTER_MAX, sanitizeProf, sanitizeStu, sanitizeRoster, decodeProf, decodeRoster, decodeStreak, rosterLink, loadLocal, saveLocal, loadRecord, recordWin, recordRunEnd } from "./config.js?v=202610190708"

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
function rebuild(p = menuProf()) { art = buildArt({ prof: p, stu }); drawPreviews() }

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
    const who = linkRoster.length > 1 ? `교수님 ${linkRoster.length}명` : `공대 ${linkRoster[0].name} 교수님`
    c.textContent = linkStreak ? `친구가 ${who} 상대로 ${linkStreak}연승! 넘어 보세요` : `친구가 만든 ${who}이 기다립니다`
    $("#b-fight").textContent = "결투 수락"
  } else { c.hidden = true; $("#b-fight").textContent = "연속 대전 시작" }
}

// 선택지 줄: 이름 | ‹ 값 ›
function optRows(el, opts, get, set, labels) {
  el.innerHTML = ""
  for (const [key, list] of Object.entries(opts)) {
    const row = document.createElement("div"); row.className = "opt"
    const lab = document.createElement("span"); lab.textContent = labels[key]
    const prev = document.createElement("button"); prev.textContent = "<"
    const val = document.createElement("span"); val.className = "v"
    const next = document.createElement("button"); next.textContent = ">"
    const sync = () => { val.textContent = (list.find((o) => o[0] === get()[key]) || list[0])[1] }
    const step = (d) => {
      const i = list.findIndex((o) => o[0] === get()[key]), n = list[(i + d + list.length) % list.length][0]
      set({ ...get(), [key]: n }); sync()
    }
    prev.onclick = () => step(-1); next.onclick = () => step(1)
    row.append(lab, prev, val, next); el.append(row); sync()
    el["sync_" + key] = sync
  }
}
let rebuildTimer = 0
function later(p) { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(() => rebuild(p), 60) }

// 학생 꾸미기
optRows($("#stu-form"), STU_OPTS, () => stu, (v) => { stu = sanitizeStu(v); saveLocal("jg-stu", stu); later() },
  { skin: "피부", jacket: "과잠 몸통", sleeve: "과잠 소매", hair: "머리", dark: "다크서클" })
const stuNo = $("#stu-no"); stuNo.value = stu.no
stuNo.addEventListener("input", () => { const v = stuNo.value.replace(/[^0-9]/g, "").slice(0, 2); stuNo.value = v; if (v.length === 2) { stu = sanitizeStu({ ...stu, no: v }); saveLocal("jg-stu", stu); later() } })

// 교수님 만들기: 목록의 editIdx번째 교수님을 고친다
const pName = $("#prof-name"), pLines = [0, 1, 2].map((i) => $("#prof-l" + i))
const editing = () => roster[editIdx]
const PLABELS = { glasses: "안경", hair: "머리", outfit: "옷", level: "난이도" }
optRows($("#prof-form"), PROF_OPTS, editing, (v) => { roster[editIdx] = sanitizeProf(v); saveRoster(); later(roster[editIdx]) }, PLABELS)
function fillProfForm() {
  const p = editing(); pName.value = p.name; pLines.forEach((el, i) => (el.value = p.lines[i] || ""))
  for (const k of Object.keys(PROF_OPTS)) $("#prof-form")["sync_" + k]?.()
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
    nm.append(`${i + 1}. ${p.name} 교수`)
    const lv = document.createElement("span"); lv.className = "lv"; lv.textContent = `${LVN[p.level]} · “${p.lines[0]}”`; nm.append(lv)
    const ed = document.createElement("button"); ed.className = "btn"; ed.textContent = "수정"; ed.onclick = () => editProf(i)
    const del = document.createElement("button"); del.className = "btn"; del.textContent = "삭제"
    del.onclick = () => { if (roster.length <= 1) return toast("교수님이 한 명은 있어야 해요"); roster.splice(i, 1); saveRoster(); renderRoster() }
    row.append(face, nm, ed, del); list.append(row)
  })
  $("#b-add").textContent = roster.length >= ROSTER_MAX ? "최대 6명" : "교수님 추가"
}
$("#b-add").onclick = () => {
  if (roster.length >= ROSTER_MAX) return toast("교수님은 6명까지예요")
  const base = PRESETS[roster.length % PRESETS.length]
  roster.push(sanitizeProf({ ...base, name: ["이OO", "정OO", "강OO", "윤OO", "한OO", "조OO"][roster.length % 6] }))
  saveRoster(); editProf(roster.length - 1)
}

function drawPreviews() {
  if (!art) return
  const a = $("#stu-preview").getContext("2d"); a.imageSmoothingEnabled = false
  a.fillStyle = "#c5dcf2"; a.fillRect(0, 0, 120, 70)
  a.drawImage(art[`por_${stu.dark}_idle`], 4, 18)
  a.drawImage(art.stu_idle, 8, 166, 104, 70, 42, 0, 104, 70)
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
  document.activeElement?.blur?.()                       // 포커스 남은 버튼이 Enter·Space로 다시 눌리지 않게
  const list = active()
  run = { list, stage: 0, defeated: [], time: 0, sleep: 100, stats: TOTAL(), last: list[0].name }
  startFight()
}
function startFight() {
  clearInterval(nextTimer)
  const p = run.list[run.stage % run.list.length]
  run.last = p.name
  rebuild(p)
  battle = new Battle({ art, prof: p, stu, stage: run.stage, sleep: run.sleep, onEnd: endFight, onPause: pause })
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
  addStats(res.stats); run.time += res.time
  if (res.result !== "win") return endRun(res.result)
  run.stage++; run.defeated.push(res.prof.name)
  record = recordWin(record, res.time, run.stage)
  run.sleep = Math.min(100, res.sleep + 30)                // 수면량은 30만 회복
  const next = run.list[run.stage % run.list.length]
  let n = 3
  const info = () => ($("#next-info").textContent = `${run.stage}연승! 수면량 ${run.sleep}%로 회복 · 다음: 공대 ${next.name} 교수 (난이도 ${run.stage + 1}) · ${n}초 뒤 시작`)
  info()
  setTimeout(() => { battle = null; show("next") }, 150)
  nextTimer = setInterval(() => { n--; if (n <= 0) { clearInterval(nextTimer); if (screen === "next") startFight() } else info() }, 1000)
}
function endRun(kind) {
  clearInterval(nextTimer)
  record = recordRunEnd(record, kind, run.stage)
  const res = { result: kind, run: { streak: run.stage, defeated: run.defeated, time: run.time, last: run.last }, stats: run.stats, stu, record }
  lastRes = res
  const card = makeCard(art, res)
  $("#card").src = card.toDataURL("image/png")
  lastRes.cardCanvas = card
  setTimeout(() => { battle = null; show("result") }, 200)
}
function pause() {
  if (!battle || battle.over || battle.paused) return
  battle.paused = true; show("pause")
}
function resume() { if (!battle) return; battle.paused = false; show("battle"); document.activeElement?.blur?.() }
document.addEventListener("visibilitychange", () => { if (document.hidden) pause() })   // 앱을 내리면 자동으로 멈춤

$("#b-fight").onclick = startRun
$("#b-roster-fight").onclick = () => { useChallenge = false; startRun() }
$("#b-again").onclick = startRun
$("#b-next").onclick = () => { clearInterval(nextTimer); startFight() }
$("#b-stop").onclick = () => endRun("quit")
$("#b-resume").onclick = resume
$("#b-quit").onclick = () => { battle = null; endRun("quit") }
$("#b-roster").onclick = () => show("roster")
$("#b-stu").onclick = () => show("stu")
$("#b-help").onclick = () => show("help")
$("#b-link").onclick = () => copyLink(roster, record.best)
$("#b-link2").onclick = () => copyLink(run ? run.list : roster, lastRes?.run?.streak || 0)
const bs = $("#b-sound"); const syncSound = () => (bs.textContent = isMuted() ? "소리·진동 끔" : "소리·진동 켬"); syncSound()
setVibrate(!isMuted())
bs.onclick = () => { unlock(); setMuted(!isMuted()); setVibrate(!isMuted()); syncSound() }

function cardBlob() { return new Promise((r) => lastRes.cardCanvas.toBlob(r, "image/png")) }
$("#b-save").onclick = async () => {
  const blob = await cardBlob(), a = document.createElement("a")
  a.href = URL.createObjectURL(blob); a.download = `종강파이터_${lastRes.run.streak}연승.png`
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
$("#b-share").onclick = async () => {
  const blob = await cardBlob(), file = new File([blob], "jonggang.png", { type: "image/png" })
  const n = lastRes.run.streak
  const text = n >= 1 ? `교수님 ${n}명 연속 격파! (${n}연승) 내 기록 깨 봐` : `공대 ${lastRes.run.last} 교수님에게 바로 졌다… 복수해 줘`
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
    drawText(ctx, "공대 편", 90, 82, { font: "s7", color: "#f39aa0", outline: "#1d1622", align: "c" })
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
window.__jg = { get battle() { return battle }, get art() { return art }, get run() { return run }, get roster() { return roster }, get record() { return record }, startRun, startFight, show, pause, resume, get screen() { return screen } }
