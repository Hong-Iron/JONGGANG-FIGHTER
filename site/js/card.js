// 결과 카드: 연속 대전 한 번의 결과를 180×225 픽셀 공문서로 그리고 6배로 키워 1080×1350 이미지로 만든다.
// res.result: "lose"(쓰러짐) | "timeout"(3분 초과) | "quit"(스스로 그만둠), res.run: { streak, defeated, time, last }
import { drawText, drawFit, textImage, wrap } from "./text.js?v=202610190708"

const K = "#1d1622", P = "#f4efe1", L = "#d3dbe9", R = "#c8353b", PL = "#3b4150", PD = "#22252e", X = "#ffffff", G = "#7d7466"

function doc(res) {
  const n = res.run.streak, last = res.run.last, t = res.run.time
  const mm = Math.floor(t / 60), ss = Math.floor(t % 60)
  if (res.result === "quit") {
    if (n === 0) return { title: "휴학계 수리 통지서", stamp: "수리", alive: true,
      body: "귀하는 한 분의 교수님도 넘지 못하고 스스로 강의실을 나섰으므로 휴학을 허가합니다. 다음 학기에 다시 오십시오." }
    return { title: "수강철회 승인서", stamp: "승인", alive: true,
      body: `귀하는 교수님 ${n}명을 연달아 물리치고 (총 ${mm}분 ${ss}초) 스스로 강의실을 나섰으므로 수강철회를 승인합니다.` }
  }
  if (res.result === "timeout") return { title: "계절학기 등록금 고지서", stamp: "미달", alive: false,
    body: n ? `귀하는 교수님 ${n}명을 넘었으나 공대 ${last} 교수를 3분 안에 설득하지 못했으므로 계절학기 등록을 명합니다.`
      : `귀하는 3분 동안 공대 ${last} 교수를 설득하지 못했으므로 계절학기 등록을 명합니다.` }
  return { title: "대학원 강제 입학 통지서", stamp: "입학", alive: false,
    body: n ? `귀하는 교수님 ${n}명을 연달아 물리쳤으나 공대 ${last} 교수에게 쓰러져 제1공학관 지하 랩실에 무기한 수감되었습니다.`
      : `귀하는 다크서클 5단계 상태로 쓰러져 제1공학관 지하 랩실에 무기한 수감되었습니다. (남은 수면량 0%)` }
}

export function makeCard(art, res) {
  const w = 180, h = 225, c = document.createElement("canvas"); c.width = w; c.height = h
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false
  const d = doc(res), n = res.run.streak, rec = res.record || {}
  // 종이
  x.fillStyle = P; x.fillRect(0, 0, w, h)
  x.fillStyle = L; for (let y = 60; y < h - 8; y += 9) x.fillRect(8, y, w - 16, 1)
  x.fillStyle = K; x.fillRect(0, 0, w, 1); x.fillRect(0, h - 1, w, 1); x.fillRect(0, 0, 1, h); x.fillRect(w - 1, 0, 1, h)
  x.fillStyle = PL; x.fillRect(1, 1, w - 2, 16); x.fillStyle = PD; x.fillRect(1, 16, w - 2, 1)
  drawText(x, "종강 파이터 공문", 6, 4, { font: "s9", color: X })
  drawText(x, "제 " + new Date().getFullYear() + "-" + String(Math.floor(res.run.time * 37 + n * 101) % 10000).padStart(4, "0") + " 호", w - 6, 5, { font: "s7", color: "#9aa2b5", align: "r" })
  drawFit(x, d.title, w / 2, 21, w - 12, { font: "l14", bold: true, color: K, align: "c" })
  x.fillStyle = K; x.fillRect(20, 40, w - 40, 1)
  // 그림: 마지막 교수님 얼굴(쓰러짐 또는 의기양양) + 학생 초상화
  const prof = d.alive && n ? art.prof_ko : art.prof_p2
  x.fillStyle = "#2e5442"; x.fillRect(10, 44, 76, 66); x.drawImage(prof, 53, 34, 76, 66, 10, 44, 76, 66)
  x.fillStyle = K; box(x, 9, 43, 78, 68)
  const por = art[`por_${d.alive ? 2 : 5}_${d.alive ? "win" : "hurt"}`]
  x.fillStyle = "#c5dcf2"; x.fillRect(94, 44, 76, 66)
  x.drawImage(por, 0, 0, 34, 34, 115, 46, 34, 34)
  drawText(x, d.alive ? "생존" : "기절", 132, 81, { font: "s9", color: d.alive ? "#1d6b3f" : R, align: "c" })
  drawText(x, `${n}연승`, 132, 92, { font: "b11", color: n ? R : G, align: "c" })
  x.fillStyle = K; box(x, 93, 43, 78, 68)
  drawFit(x, `공대 ${res.run.last} 교수`, 48, 112, 78, { font: "s7", color: K, align: "c" })
  drawText(x, "피고: 공대생 " + res.stu.no + "학번", 132, 112, { font: "s7", color: K, align: "c" })
  // 본문
  wrap(d.body, "s9", w - 24, 5).forEach((l, i) => drawText(x, l, 12, 125 + i * 11, { font: "s9", color: K }))
  const s = res.stats
  drawText(x, `반박 ${s.parries}회 (완벽 ${s.perfect}) · A+ ${s.crits}개`, 12, 180, { font: "s7", color: G })
  drawText(x, `최대 ${s.maxCombo}콤보 · 최고 기록 ${Math.max(rec.best || 0, n)}연승`, 12, 189, { font: "s7", color: G })
  // 날짜와 도장
  const dt = new Date(), date = `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}.`
  drawText(x, date, 12, 201, { font: "s9", color: K })
  drawText(x, "종강 파이터 학사지원팀장", 12, 211, { font: "s7", color: K })
  const st = textImage(d.stamp, { font: "l14", bold: true, stamp: -8, color: R, outline: P })
  x.drawImage(st, w - st.width - 10, h - st.height - 8)
  // 6배로
  const big = document.createElement("canvas"); big.width = w * 6; big.height = h * 6
  const bx = big.getContext("2d"); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, big.width, big.height)
  return big
}
function box(x, X, Y, w, h) { x.fillRect(X, Y, w, 1); x.fillRect(X, Y + h - 1, w, 1); x.fillRect(X, Y, 1, h); x.fillRect(X + w - 1, Y, 1, h) }
