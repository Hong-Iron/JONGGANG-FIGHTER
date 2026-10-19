import { PARTS, PROF_PARTS, PROF_KEYS, allowedFor } from "./parts.js?v=202610191042"
// 꾸미기 선택지, 기본값, 교수님 링크(URL ?b=) 만들기와 읽기.
export const PROF_OPTS = PROF_PARTS                       // 묶음은 parts.js의 PROF_GROUPS
// 단과대: [코드, 줄임말, 정식 이름]. 순위표 코드와 같다 (supabase/schema.sql의 jg_college)
export const COLLEGES = [["eng", "공대", "공과대학"], ["hum", "인문대", "인문대학"], ["soc", "사회대", "사회과학대학"], ["sci", "자연대", "자연과학대학"], ["art", "예대", "예술대학"], ["nur", "간호대", "간호대학"], ["med", "의대", "의과대학"]]
export const STU_OPTS = PARTS                             // 묶음과 스탯은 parts.js
// 카카오톡 공유: 카카오 앱 "종강 파이터"의 JavaScript 키 (공개 키, 사이트 도메인 https://hong-iron.github.io 등록)
export const KAKAO_KEY = "de3c45d83caca2bbab2ec89f8fc967f2"
export const DEFAULT_LINES = ["질문 있나?", "그건 기본이야.", "내 컴퓨터에선 되던데?"]
export const DEFAULT_PROF = {
  name: "김OO", lines: DEFAULT_LINES.slice(), college: "eng", level: "normal", grad: "shield", gender: "m", age: "middle", skin: "base", eyes: "normal", body: "normal", face: "smirk", beard: "none",
  hair: "bald", hcolor: "gray", glasses: "half", hat: "none", outfit: "tweed", neck: "auto", pocket: "pens", hand: "laser", desk: "thinkpad",
}
// 교수님 부르는 이름: "인문대 박OO 교수"
const CSHORT = { eng: "공대", hum: "인문대", soc: "사회대", sci: "자연대", art: "예대", nur: "간호대", med: "의대" }
export const profTitle = (p) => `${CSHORT[p.college] || "공대"} ${p.name} 교수`
export const DEFAULT_STU = {
  college: "", gender: "m", skin: "dry", eyeshape: "normal", eyes: "tired", dark: 3, red: "no", mouth: "none", hair: "greasy", hstate: "none",
  top: "jamba", print: "college", printText: "", jacket: "navy", sleeve: "cream", head: "none", neck: "none", wrist: "none", back: "none", weapon: "keyboard", pet: "none", no: "19",
}

const NAME_MAX = 8, LINE_MAX = 24
const keys = (o) => o.map((x) => x[0])

function clean(s, max) {
  return String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max)
}

export function sanitizeProf(p) {
  const out = { ...DEFAULT_PROF }
  if (!p || typeof p !== "object") return out
  out.name = clean(p.name, NAME_MAX) || DEFAULT_PROF.name
  const lines = Array.isArray(p.lines) ? p.lines.slice(0, 3).map((l) => clean(l, LINE_MAX)).filter(Boolean) : []
  out.lines = lines.length ? lines : DEFAULT_LINES.slice()
  for (const k of PROF_KEYS) if (keys(PROF_OPTS[k]).includes(p[k])) out[k] = p[k]
  return fitGender("prof", out)
}
// 성별을 바꾸면 그 성별에 없는 머리(·수염)는 첫 선택지로 바꾼다
function fitGender(kind, o) {
  for (const k of ["hair", "beard"]) { const a = allowedFor(kind, k, o); if (a && !a.includes(o[k])) o[k] = a[0] }
  return o
}
export function sanitizeStu(s) {
  const out = { ...DEFAULT_STU }
  if (!s || typeof s !== "object") return out
  for (const k of Object.keys(STU_OPTS)) if (k !== "dark" && keys(STU_OPTS[k]).includes(s[k])) out[k] = s[k]
  out.printText = clean(s.printText, 6)
  const no = String(s.no ?? "").replace(/[^0-9]/g, "").slice(0, 2)
  if (no.length === 2) out.no = no
  const d = Number(s.dark); if (d >= 1 && d <= 5) out.dark = Math.round(d)
  return fitGender("stu", out)
}

// 처음 받는 교수님 목록 (차례로 싸운다)
// 단과대마다 어울리는 교수님 (처음 목록 3명 + 추가할 때 차례로)
export const PRESETS = [
  { name: "김OO", college: "eng", lines: ["질문 있나?", "그건 기본이야.", "내 컴퓨터에선 되던데?"], glasses: "half", hair: "bald", outfit: "tweed", hand: "laser", desk: "thinkpad" },
  { name: "박OO", college: "soc", age: "young", eyes: "sharp", lines: ["이 정도는 다들 하는데?", "제출 기한은 어제였네", "질문은 수업 끝나고"], glasses: "tint", hair: "pomade", hcolor: "black", outfit: "suit", neck: "nametag", hand: "mic", desk: "ipad", body: "big" },
  { name: "최OO", college: "art", lines: ["이게 최선인가?", "다시 생각해 오게", "크리틱 시작하지"], gender: "f", age: "young", eyes: "sharp", glasses: "horn", hair: "bob", hcolor: "black", outfit: "turtle", neck: "scarf", hand: "espresso", hat: "beret", face: "stone" },
  { name: "이OO", college: "hum", age: "senior", eyes: "droopy", lines: ["자네, 원문은 읽었나?", "그 해석은 틀렸네", "레포트는 30장이네"], glasses: "chain", hair: "side", outfit: "cardigan", hand: "chalk", desk: "thermos", face: "kind", beard: "full", body: "thin" },
  { name: "정OO", college: "sci", lines: ["오차가 너무 크군", "실험 다시 하게", "데이터가 말해 주지"], gender: "f", age: "middle", eyes: "big", glasses: "metal", hair: "perm", hcolor: "brown", outfit: "labcoat", hand: "pad", desk: "molecule", face: "tired", beard: "stubble" },
  { name: "윤OO", college: "nur", lines: ["활력징후 다시 재 와요", "인계는 5분 안에", "케이스 스터디 50장"], gender: "f", age: "middle", eyes: "sharp", glasses: "metal", hair: "updo", hcolor: "black", outfit: "cardigan", neck: "nametag", hand: "pad", desk: "thermos", face: "stone" },
  { name: "강OO", college: "med", lines: ["그건 국시에 안 나오나?", "이건 그냥 외우게", "다음 주 땡시험이네"], age: "senior", eyes: "narrow", glasses: "chain", hair: "side", hcolor: "salt", outfit: "labcoat", neck: "bluetie", hand: "stick", desk: "books", face: "smirk" }
]
export const ROSTER_MAX = 8
export function sanitizeRoster(list) {
  const arr = Array.isArray(list) ? list.slice(0, ROSTER_MAX).filter((p) => p && typeof p === "object").map(sanitizeProf) : []
  return arr.length ? arr : PRESETS.map((p) => sanitizeProf(p))
}

// 문자열 ↔ base64url (UTF-8)
function toB64(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
function fromB64(code, max) {
  if (!code || code.length > max) return null
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/")
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4))
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
}
// 링크: 선택지는 번호 배열 x로 짧게. 옛 링크(g,h,o,d)도 읽는다
const compact = (p) => { const s = sanitizeProf(p); return { n: s.name, l: s.lines, x: PROF_KEYS.map((k) => Math.max(0, keys(PROF_OPTS[k]).indexOf(s[k]))) } }
const expand = (j) => {
  const p = { name: j?.n, lines: j?.l }
  if (Array.isArray(j?.x)) PROF_KEYS.forEach((k, i) => { const v = PROF_OPTS[k][j.x[i]]; if (v) p[k] = v[0] })
  else Object.assign(p, { glasses: j?.g, hair: j?.h, outfit: j?.o, level: j?.d })
  return sanitizeProf(p)
}

export function encodeProf(p) { return toB64({ ...compact(p), v: 1 }) }
export function decodeProf(code) { try { const j = fromB64(code, 2000); return j ? expand(j) : null } catch { return null } }
// 목록 링크 3판: JSON 배열. 기본 교수님과 똑같으면 번호 하나, 아니면 [이름, 선택지 문자열(키마다 36진수 한 글자), 말버릇…].
// 말버릇이 기본값이면 뺀다. 카카오톡 공유는 메시지 크기 제한(SDK가 1만 자를 넘으면 거부)이 있어 짧아야 한다
const xstr = (s) => PROF_KEYS.map((k) => Math.max(0, keys(PROF_OPTS[k]).indexOf(s[k])).toString(36)).join("")
const sameLines = (a) => a.length === DEFAULT_LINES.length && a.every((l, i) => l === DEFAULT_LINES[i])
const PRESET_SIG = () => PRESETS.map((p) => { const s = sanitizeProf(p); return s.name + "|" + xstr(s) + "|" + s.lines.join("|") })
function pack(p, noLines) {
  const s = sanitizeProf(p), sig = s.name + "|" + xstr(s) + "|" + s.lines.join("|"), i = PRESET_SIG().indexOf(sig)
  if (i >= 0) return i
  return [s.name, xstr(s), ...(noLines || sameLines(s.lines) ? [] : s.lines)]
}
function unpack(e) {
  if (typeof e === "number") return PRESETS[e] ? sanitizeProf(PRESETS[e]) : null
  if (!Array.isArray(e)) return null
  const [name, x, ...lines] = e, p = { name, lines: lines.length ? lines : DEFAULT_LINES.slice() }
  PROF_KEYS.forEach((k, i) => { const v = PROF_OPTS[k][parseInt(String(x || "")[i] ?? "", 36)]; if (v) p[k] = v[0] })
  return sanitizeProf(p)
}
export function encodeRoster(list, noLines = false) { return toB64(sanitizeRoster(list).map((p) => pack(p, noLines))) }
export function decodeRoster(code) {
  try {
    const j = fromB64(code, 6000)
    if (Array.isArray(j)) { const out = j.slice(0, ROSTER_MAX).map(unpack).filter(Boolean); return out.length ? out : null }   // 3판
    return j && Array.isArray(j.r) && j.r.length ? j.r.slice(0, ROSTER_MAX).map(expand) : null                                 // 2판
  } catch { return null }
}
// 결투장 링크: 교수님 목록 + 내 연승. maxLen을 주면 넘을 때 말버릇을 빼고, 그래도 길면 뒤 교수님부터 줄인다
export function rosterLink(list, streak = 0, maxLen = Infinity) {
  const u = new URL(location.href); u.search = ""; u.hash = ""
  const make = (l, noLines) => { u.search = ""; u.searchParams.set("r", encodeRoster(l, noLines)); if (streak > 0) u.searchParams.set("s", String(Math.min(999, Math.floor(streak)))); return u.toString() }
  let l = sanitizeRoster(list), url = make(l, false)
  if (url.length > maxLen) url = make(l, true)
  while (url.length > maxLen && l.length > 1) { l = l.slice(0, -1); url = make(l, true) }
  return url
}
export const gameHome = () => { const u = new URL(location.href); u.search = ""; u.hash = ""; return u.toString() }
export function profLink(p, streak = 0) { return rosterLink([p], streak) }
// 링크에 실린 친구의 연승 (숫자만, 0~999)
export function decodeStreak(v) { const n = Number(String(v ?? "").replace(/[^0-9]/g, "").slice(0, 3)); return n > 0 ? n : 0 }

// 전적: 이 브라우저에만 남는다. streak = 지난 도전의 연승
export const EMPTY_RECORD = { streak: 0, best: 0, wins: 0, losses: 0, plays: 0, fastest: 0, last: "" }
export function loadRecord() {
  const r = loadLocal("jg-record", {}), out = { ...EMPTY_RECORD }
  for (const k of ["streak", "best", "wins", "losses", "plays", "fastest"]) { const n = Number(r[k]); if (Number.isFinite(n) && n >= 0) out[k] = Math.floor(n * (k === "fastest" ? 10 : 1)) / (k === "fastest" ? 10 : 1) }
  if (["win", "lose", "timeout"].includes(r.last)) out.last = r.last
  return out
}
// 한 판 이길 때마다 (연속 대전 중)
export function recordWin(rec, time, streak) {
  const r = { ...rec, wins: rec.wins + 1, best: Math.max(rec.best, streak), streak, last: "win" }
  if (!r.fastest || time < r.fastest) r.fastest = Math.round(time * 10) / 10
  saveLocal("jg-record", r)
  return r
}
// 도전이 끝날 때 (졌거나, 시간이 다 됐거나, 스스로 그만뒀거나)
export function recordRunEnd(rec, kind, streak) {
  const r = { ...rec, plays: rec.plays + 1, streak, last: kind, best: Math.max(rec.best, streak) }
  if (kind !== "quit") r.losses++
  saveLocal("jg-record", r)
  return r
}

export function loadLocal(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback } catch { return fallback }
}
export function saveLocal(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }
