// 종강 파이터: 화면 전환, 꾸미기, 입력, 화면 배율.
import { loadArtSource, buildArt } from "./art.js"
import { loadFonts, drawText, textImage } from "./text.js"
import { Battle, W, H } from "./battle.js"
import { unlock, sfx, setMuted, isMuted } from "./sfx.js"
import { makeCard } from "./card.js"
import { PROF_OPTS, STU_OPTS, DEFAULT_PROF, DEFAULT_STU, sanitizeProf, sanitizeStu, decodeProf, profLink, loadLocal, saveLocal } from "./config.js"

const $ = (s) => document.querySelector(s)
const cv = $("#game"), ctx = cv.getContext("2d")
ctx.imageSmoothingEnabled = false

const linkProf = decodeProf(new URLSearchParams(location.search).get("b"))
let prof = linkProf || sanitizeProf(loadLocal("jg-prof", DEFAULT_PROF))
let stu = sanitizeStu(loadLocal("jg-stu", DEFAULT_STU))
let art = null, battle = null, lastRes = null, screen = "load"

// ---------------------------------------------------------------- 배율: 정수 배로 꽉 차게
function fit() {
  const vw = window.innerWidth, vh = window.innerHeight
  let k = Math.floor(Math.min(vw / W, vh / H))
  if (k < 1) k = Math.min(vw / W, vh / H)
  const st = $("#stage"); st.style.transform = `scale(${k})`
  st.style.marginRight = `${W * (k - 1)}px`; st.style.marginBottom = `${H * (k - 1)}px`
}
window.addEventListener("resize", fit); fit()

function rebuild() {
  art = buildArt({ prof, stu })
  drawPreviews()
}

// ---------------------------------------------------------------- 화면
function show(name) {
  screen = name
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("on", s.id === "s-" + name))
  if (name === "title") renderTitleBanner()
}
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)))

function toast(s) {
  const t = $("#toast"); t.textContent = s; t.hidden = false
  clearTimeout(toast.id); toast.id = setTimeout(() => (t.hidden = true), 1800)
}
function renderTitleBanner() {
  const c = $("#challenge")
  if (linkProf) { c.hidden = false; c.textContent = `친구가 만든 공대 ${prof.name} 교수님이 기다립니다`; $("#b-fight").textContent = "결투 수락" }
  else { c.hidden = true; $("#b-fight").textContent = "결투 시작" }
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
  }
}
let rebuildTimer = 0
function later() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 60) }

optRows($("#stu-form"), STU_OPTS, () => stu, (v) => { stu = sanitizeStu(v); saveLocal("jg-stu", stu); later() },
  { skin: "피부", jacket: "과잠 몸통", sleeve: "과잠 소매", hair: "머리", dark: "다크서클" })
optRows($("#prof-form"), PROF_OPTS, () => prof, (v) => { prof = sanitizeProf(v); saveLocal("jg-prof", prof); later() },
  { glasses: "안경", hair: "머리", outfit: "옷", level: "난이도" })

const stuNo = $("#stu-no"); stuNo.value = stu.no
stuNo.addEventListener("input", () => { const v = stuNo.value.replace(/[^0-9]/g, "").slice(0, 2); stuNo.value = v; if (v.length === 2) { stu = sanitizeStu({ ...stu, no: v }); saveLocal("jg-stu", stu); later() } })
const pName = $("#prof-name"), pLines = [0, 1, 2].map((i) => $("#prof-l" + i))
function fillProfForm() { pName.value = prof.name; pLines.forEach((el, i) => (el.value = prof.lines[i] || "")) }
fillProfForm()
const onProfText = () => {
  prof = sanitizeProf({ ...prof, name: pName.value || DEFAULT_PROF.name, lines: pLines.map((e) => e.value) })
  saveLocal("jg-prof", prof)
}
pName.addEventListener("input", onProfText); pLines.forEach((e) => e.addEventListener("input", onProfText))

function drawPreviews() {
  if (!art) return
  const a = $("#stu-preview").getContext("2d"); a.imageSmoothingEnabled = false
  a.fillStyle = "#c5dcf2"; a.fillRect(0, 0, 120, 70)
  a.drawImage(art.por_5_idle && art[`por_${stu.dark}_idle`], 4, 18)
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
async function copyLink() {
  onProfText()
  const url = profLink(prof)
  toast((await copyText(url)) ? "결투장 링크를 복사했어요. 친구에게 보내 보세요" : url)
}

// ---------------------------------------------------------------- 전투
function startBattle() {
  unlock(); onProfText()
  if (!art) rebuild()
  battle = new Battle({ art, prof, stu, onEnd: endBattle })
  show("battle")
}
function endBattle(res) {
  lastRes = res
  const card = makeCard(art, res)
  $("#card").src = card.toDataURL("image/png")
  $("#card").dataset.ready = "1"
  lastRes.cardCanvas = card
  setTimeout(() => { battle = null; show("result") }, 200)
}

$("#b-fight").onclick = startBattle
$("#b-prof-fight").onclick = startBattle
$("#b-again").onclick = startBattle
$("#b-prof").onclick = () => { fillProfForm(); show("prof") }
$("#b-stu").onclick = () => show("stu")
$("#b-help").onclick = () => show("help")
$("#b-link").onclick = copyLink
$("#b-link2").onclick = copyLink
const bs = $("#b-sound"); const syncSound = () => (bs.textContent = isMuted() ? "소리 끔" : "소리 켬"); syncSound()
bs.onclick = () => { unlock(); setMuted(!isMuted()); syncSound() }

function cardBlob() { return new Promise((r) => lastRes.cardCanvas.toBlob(r, "image/png")) }
$("#b-save").onclick = async () => {
  const blob = await cardBlob(), a = document.createElement("a")
  a.href = URL.createObjectURL(blob); a.download = lastRes.result === "win" ? "수강철회승인서.png" : "대학원입학통지서.png"
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
$("#b-share").onclick = async () => {
  const blob = await cardBlob(), file = new File([blob], "jonggang.png", { type: "image/png" })
  const text = lastRes.result === "win" ? `공대 ${prof.name} 교수님을 이겼다. 너도 해 봐` : `공대 ${prof.name} 교수님에게 졌다… 복수해 줘`
  const url = profLink(prof)
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text, url }); return } catch { return } }
  if (navigator.share) { try { await navigator.share({ text, url }); return } catch { return } }
  toast((await copyText(text + " " + url)) ? "공유 문구와 링크를 복사했어요" : url)
}

// 캔버스 입력 (전투 중)
function logical(e) {
  const r = cv.getBoundingClientRect()
  return [Math.floor((e.clientX - r.left) * W / r.width), Math.floor((e.clientY - r.top) * H / r.height)]
}
cv.addEventListener("pointerdown", (e) => { unlock(); if (battle) { e.preventDefault(); battle.pointer(...logical(e)) } })
window.addEventListener("keydown", (e) => {
  if (!battle || e.repeat) return
  if (e.key === " ") e.preventDefault()
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
  ctx.fillStyle = "#2e2436"; ctx.fillRect(0, 0, W, H)
  ctx.drawImage(art.room, 0, 0)
  const bob = Math.floor(t * 1.6) % 2
  ctx.drawImage(art.prof_idle, -1, -1 + bob); ctx.drawImage(art.lectern, -1, -1); ctx.drawImage(art.stu_idle, -1, -1)
  ctx.fillStyle = "rgba(20,10,30,0.45)"; ctx.fillRect(0, 0, W, 236)
  ctx.fillStyle = "#3b4150"; ctx.fillRect(0, 236, W, 84)
  if (screen === "title") {
    const logo = textImage("종강 파이터", { font: "l14", bold: true, color: "#ffffff", outline: "#c8353b", outline2: "#1d1622", shadow: "#5a1020" })
    ctx.drawImage(logo, 90 - (logo.width >> 1), 46)
    drawText(ctx, "교수님과의 사투", 90, 70, { font: "s9", color: "#b8ffd6", outline: "#1d1622", align: "c" })
    drawText(ctx, "공대 프로토타입", 90, 82, { font: "s7", color: "#f39aa0", outline: "#1d1622", align: "c" })
  }
}

// ---------------------------------------------------------------- 시작
;(async () => {
  try {
    await Promise.all([loadFonts(), loadArtSource()])
    rebuild()
    show("title")
    requestAnimationFrame(frame)
  } catch (e) {
    $("#s-load").innerHTML = `<p class="center">불러오지 못했어요<br>${String(e.message || e).slice(0, 80)}</p>`
    console.error(e)
  }
})()

// 테스트용 손잡이
window.__jg = { get battle() { return battle }, get art() { return art }, startBattle, show, get prof() { return prof }, get stu() { return stu } }
