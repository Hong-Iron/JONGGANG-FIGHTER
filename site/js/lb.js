// 단과대 대항 랭킹 (Supabase, SMASH와 같은 프로젝트). 공개 키라 브라우저에 있어도 되고, 함수 두 개만 부를 수 있다.
// 보내는 것: 단과대 코드와 이번 도전의 연승 수뿐. 이름·기기 정보는 보내지 않는다.
const LB = { url: "https://qohxhopinnwrzrgxrdvj.supabase.co", key: "sb_publishable_9RcuLHwCWIpdzjqDvXMtIA_kicFhQ8g" }
try { const o = localStorage.getItem("jg-lb-url"); if (o && /^http:\/\/127\.0\.0\.1:\d+$/.test(o)) LB.url = o } catch {}   // 로컬 시험용

function headers(json) {
  const h = { apikey: LB.key }
  if (/^eyJ/.test(LB.key)) h.Authorization = `Bearer ${LB.key}`   // 옛 anon 키(JWT)일 때만
  if (json) h["Content-Type"] = "application/json"
  return h
}

// 보내지 못한 승리는 줄 세워 두었다가 다시 보낸다 (지하철·와이파이 끊김)
const QKEY = "jg-lb-queue"
const loadQ = () => { try { const q = JSON.parse(localStorage.getItem(QKEY) || "[]"); return Array.isArray(q) ? q.slice(-20) : [] } catch { return [] } }
const saveQ = (q) => { try { localStorage.setItem(QKEY, JSON.stringify(q.slice(-20))) } catch {} }
let busy = false
export function lbWin(code, streak) {
  if (!code || code === "none") return
  const q = loadQ(); q.push({ c: code, s: Math.max(1, Math.min(300, Math.floor(streak))) }); saveQ(q)
  flush()
}
async function flush() {
  if (busy) return
  busy = true
  try {
    let q = loadQ()
    while (q.length) {
      const r = await fetch(`${LB.url}/rest/v1/rpc/jg_add`, { method: "POST", headers: headers(true), body: JSON.stringify({ p_code: q[0].c, p_streak: q[0].s }) })
      if (!r.ok) break
      q = loadQ(); q.shift(); saveQ(q)
    }
  } catch { /* 오프라인: 다음에 */ }
  busy = false
}
setInterval(flush, 20000)
window.addEventListener("online", flush)
setTimeout(flush, 1500)

// 순위표: [{ code, name, today_wins, today_best, today_runs, total_wins, best_ever, total_runs }]
export async function lbBoard() {
  try {
    const r = await fetch(`${LB.url}/rest/v1/rpc/jg_board`, { method: "POST", headers: headers(true), body: "{}" })
    if (!r.ok) return null
    const rows = await r.json()
    return Array.isArray(rows) ? rows : null
  } catch { return null }
}
