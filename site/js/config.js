import { PARTS } from "./parts.js?v=202610190747"
// 꾸미기 선택지, 기본값, 교수님 링크(URL ?b=) 만들기와 읽기.
export const PROF_OPTS = {
  glasses: [["half", "코끝 반무테"], ["tint", "변색렌즈"], ["horn", "두꺼운 뿔테"]],
  hair: [["bald", "대머리 + 흰 옆머리"], ["pomade", "2:8 포마드"], ["white", "부스스한 백발"]],
  outfit: [["tweed", "팔꿈치 패치 재킷"], ["hiking", "등산 자켓"], ["turtle", "올블랙 터틀넥"]],
  level: [["easy", "순한맛"], ["normal", "보통맛"], ["hard", "매운맛"]],
}
// 단과대: [코드, 줄임말, 정식 이름]. 순위표 코드와 같다 (supabase/schema.sql의 jg_college)
export const COLLEGES = [["eng", "공대", "공과대학"], ["hum", "인문대", "인문대학"], ["soc", "사회대", "사회과학대학"], ["sci", "자연대", "자연과학대학"], ["art", "예대", "예술대학"]]
export const STU_OPTS = PARTS                             // 묶음과 스탯은 parts.js
export const DEFAULT_LINES = ["질문 있나?", "그건 기본이야.", "내 컴퓨터에선 되던데?"]
export const DEFAULT_PROF = { name: "김OO", lines: DEFAULT_LINES.slice(), glasses: "half", hair: "bald", outfit: "tweed", level: "normal" }
export const DEFAULT_STU = {
  college: "", skin: "dry", eyes: "tired", dark: 3, red: "no", mouth: "none", hair: "greasy", hstate: "none",
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
  for (const k of ["glasses", "hair", "outfit", "level"]) if (keys(PROF_OPTS[k]).includes(p[k])) out[k] = p[k]
  return out
}
export function sanitizeStu(s) {
  const out = { ...DEFAULT_STU }
  if (!s || typeof s !== "object") return out
  for (const k of Object.keys(STU_OPTS)) if (k !== "dark" && keys(STU_OPTS[k]).includes(s[k])) out[k] = s[k]
  out.printText = clean(s.printText, 6)
  const no = String(s.no ?? "").replace(/[^0-9]/g, "").slice(0, 2)
  if (no.length === 2) out.no = no
  const d = Number(s.dark); if (d >= 1 && d <= 5) out.dark = Math.round(d)
  return out
}

// 처음 받는 교수님 목록 (차례로 싸운다)
export const PRESETS = [
  { name: "김OO", lines: ["질문 있나?", "그건 기본이야.", "내 컴퓨터에선 되던데?"], glasses: "half", hair: "bald", outfit: "tweed", level: "normal" },
  { name: "박OO", lines: ["이 정도는 다들 하는데?", "제출 기한은 어제였네", "질문은 수업 끝나고"], glasses: "tint", hair: "pomade", outfit: "hiking", level: "normal" },
  { name: "최OO", lines: ["이게 최선인가?", "다시 생각해 오게", "근거가 뭐지?"], glasses: "horn", hair: "white", outfit: "turtle", level: "normal" },
]
export const ROSTER_MAX = 6
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
const compact = (p) => { const s = sanitizeProf(p); return { n: s.name, l: s.lines, g: s.glasses, h: s.hair, o: s.outfit, d: s.level } }
const expand = (j) => sanitizeProf({ name: j?.n, lines: j?.l, glasses: j?.g, hair: j?.h, outfit: j?.o, level: j?.d })

export function encodeProf(p) { return toB64({ ...compact(p), v: 1 }) }
export function decodeProf(code) { try { const j = fromB64(code, 2000); return j ? expand(j) : null } catch { return null } }
export function encodeRoster(list) { return toB64({ v: 2, r: sanitizeRoster(list).map(compact) }) }
export function decodeRoster(code) {
  try { const j = fromB64(code, 6000); return j && Array.isArray(j.r) && j.r.length ? j.r.slice(0, ROSTER_MAX).map(expand) : null } catch { return null }
}
// 결투장 링크: 교수님 목록 전체 + 내 연승
export function rosterLink(list, streak = 0) {
  const u = new URL(location.href); u.search = ""; u.hash = ""
  u.searchParams.set("r", encodeRoster(list))
  if (streak > 0) u.searchParams.set("s", String(Math.min(999, Math.floor(streak))))
  return u.toString()
}
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
