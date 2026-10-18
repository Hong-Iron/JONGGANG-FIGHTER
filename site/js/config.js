// 꾸미기 선택지, 기본값, 교수님 링크(URL ?b=) 만들기와 읽기.
export const PROF_OPTS = {
  glasses: [["half", "코끝 반무테"], ["tint", "변색렌즈"], ["horn", "두꺼운 뿔테"]],
  hair: [["bald", "대머리 + 흰 옆머리"], ["pomade", "2:8 포마드"], ["white", "부스스한 백발"]],
  outfit: [["tweed", "팔꿈치 패치 재킷"], ["hiking", "등산 자켓"], ["turtle", "올블랙 터틀넥"]],
  level: [["easy", "순한맛"], ["normal", "보통맛"], ["hard", "매운맛"]],
}
export const STU_OPTS = {
  skin: [["dry", "카페인 푸석"], ["pale", "지박령 창백"], ["flush", "숙취 홍조"], ["tan", "실습 탄 피부"]],
  jacket: [["navy", "남색"], ["black", "검정"], ["wine", "와인"], ["green", "초록"], ["gray", "회색"]],
  sleeve: [["cream", "크림"], ["white", "흰색"], ["gray", "회색"], ["black", "검정"]],
  hair: [["greasy", "3일 안 감은 머리"], ["buzz", "전역 밤톨"], ["pudding", "푸딩 탈색모"]],
  dark: [[1, "1단계"], [2, "2단계"], [3, "3단계"], [4, "4단계"], [5, "5단계 (판다)"]],
}
export const DEFAULT_LINES = ["질문 있나?", "그건 기본이야.", "내 컴퓨터에선 되던데?"]
export const DEFAULT_PROF = { name: "김OO", lines: DEFAULT_LINES.slice(), glasses: "half", hair: "bald", outfit: "tweed", level: "normal" }
export const DEFAULT_STU = { skin: "dry", jacket: "navy", sleeve: "cream", hair: "greasy", no: "19", dark: 3 }

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
  for (const k of ["skin", "jacket", "sleeve", "hair"]) if (keys(STU_OPTS[k]).includes(s[k])) out[k] = s[k]
  const no = String(s.no ?? "").replace(/[^0-9]/g, "").slice(0, 2)
  if (no.length === 2) out.no = no
  const d = Number(s.dark); if (d >= 1 && d <= 5) out.dark = Math.round(d)
  return out
}

// 교수님 → 짧은 문자열 (UTF-8 → base64url)
export function encodeProf(p) {
  const s = sanitizeProf(p)
  const compact = { n: s.name, l: s.lines, g: s.glasses, h: s.hair, o: s.outfit, d: s.level, v: 1 }
  const bytes = new TextEncoder().encode(JSON.stringify(compact))
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
export function decodeProf(code) {
  try {
    if (!code || code.length > 2000) return null
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/")
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4))
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
    return sanitizeProf({ name: json.n, lines: json.l, glasses: json.g, hair: json.h, outfit: json.o, level: json.d })
  } catch { return null }
}
export function profLink(p, streak = 0) {
  const u = new URL(location.href); u.search = ""; u.hash = ""
  u.searchParams.set("b", encodeProf(p))
  if (streak > 0) u.searchParams.set("s", String(Math.min(999, Math.floor(streak))))
  return u.toString()
}
// 링크에 실린 친구의 연승 (숫자만, 0~999)
export function decodeStreak(v) { const n = Number(String(v ?? "").replace(/[^0-9]/g, "").slice(0, 3)); return n > 0 ? n : 0 }

// 전적: 이 브라우저에만 남는다
export const EMPTY_RECORD = { streak: 0, best: 0, wins: 0, losses: 0, plays: 0, fastest: 0, last: "" }
export function loadRecord() {
  const r = loadLocal("jg-record", {}), out = { ...EMPTY_RECORD }
  for (const k of ["streak", "best", "wins", "losses", "plays", "fastest"]) { const n = Number(r[k]); if (Number.isFinite(n) && n >= 0) out[k] = Math.floor(n * (k === "fastest" ? 10 : 1)) / (k === "fastest" ? 10 : 1) }
  if (["win", "lose", "timeout"].includes(r.last)) out.last = r.last
  return out
}
export function addResult(rec, res) {
  const r = { ...rec, plays: rec.plays + 1, last: res.result }
  if (res.result === "win") {
    r.wins++; r.streak++; r.best = Math.max(r.best, r.streak)
    if (!r.fastest || res.time < r.fastest) r.fastest = Math.round(res.time * 10) / 10
  } else { r.losses++; r.streak = 0 }
  saveLocal("jg-record", r)
  return r
}

export function loadLocal(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback } catch { return fallback }
}
export function saveLocal(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }
