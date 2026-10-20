// 결과 카드: 연속 대전 한 번의 결과를 180×225 픽셀 공문서로 그리고 6배로 키워 1080×1350 이미지로 만든다.
// res.result: "lose"(쓰러짐) | "timeout"(도전 전체 4분 30초 초과) | "quit"(스스로 그만둠), res.run: { streak, defeated, time, last }
import { gradeOf } from "./config.js?v=202610201623"
import { drawText, drawFit, textImage, wrap } from "./text.js?v=202610201623"

const K = "#1d1622", P = "#f4efe1", L = "#d3dbe9", R = "#c8353b", PL = "#3b4150", PD = "#22252e", X = "#ffffff", G = "#7d7466"

const LAB = { eng: "제1공학관 지하 랩실", hum: "인문관 고문헌 열람실", soc: "사회관 설문 분석실", sci: "자연관 지하 실험실", art: "실기동 크리틱 룸", nur: "간호관 시뮬레이션 실습실", med: "의대 해부학 실습실", law: "법학관 모의법정", edu: "사범관 교생 연구실", biz: "경영관 케이스 스터디룸", phm: "약대 조제 실습실", pe: "체육관 지하 웨이트장" }
const STU_C = { eng: "공대생 ", hum: "인문대생 ", soc: "사회대생 ", sci: "자연대생 ", art: "예대생 ", nur: "간호대생 ", med: "의대생 ", law: "법대생 ", edu: "사범대생 ", biz: "경영대생 ", phm: "약대생 ", pe: "체대생 " }
// 학점별 공문: 제목, 도장, 판정 문장
const VERDICT = {
  "A+": { title: "대학원 납치 통지서", stamp: "납치" }, A: { title: "우수 성적 통지서", stamp: "우수", say: "성적 A로 이수를 인정하고 장학금 심사에 올립니다." },
  B: { title: "합격 통지서", stamp: "합격", say: "성적 B로 이수를 인정합니다." }, C: { title: "합격 통지서", stamp: "턱걸이", say: "턱걸이로 C를 드립니다. 다음 학기엔 분발하십시오." },
  D: { title: "성적 미달 통지서", stamp: "미달", say: "성적 미달(D)로 계절학기 등록을 명합니다." }, F: { title: "재수강 통지서", stamp: "재수강", say: "성적 F로 다음 학기 재수강을 명합니다." },
}
function doc(res) {
  const n = res.run.streak, last = res.run.last, lab = LAB[res.run.lastCollege] || LAB.eng
  const G = gradeOf(n), V = VERDICT[G.g]
  const how = res.result === "timeout" ? `4분 30초 동안 교수님 ${n}명을 넘었습니다.`
    : res.result === "quit" ? (n ? `교수님 ${n}명을 넘고 스스로 강의실을 나섰습니다.` : "한 분의 교수님도 넘지 못하고 스스로 강의실을 나섰습니다.")
    : n ? `교수님 ${n}명을 넘은 뒤 ${last}에게 쓰러졌습니다.` : `${last}에게 바로 쓰러졌습니다.`
  if (G.g === "A+") return { ...V, grade: G, alive: false, body: `귀하는 교수님 ${n}명을 넘을 만큼 지나치게 우수하여 ${last}가 ${lab}로 납치해 갔습니다. 졸업 예정일은 미정입니다.` }
  return { ...V, grade: G, alive: n >= 3, body: `귀하는 ${how} ${V.say}` }
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
  drawText(x, `학점 ${d.grade.g}`, 132, 81, { font: "s9", bold: true, color: d.alive ? "#1d6b3f" : R, align: "c" })
  drawText(x, `${n}연승`, 132, 92, { font: "b11", color: n ? R : G, align: "c" })
  x.fillStyle = K; box(x, 93, 43, 78, 68)
  drawFit(x, res.run.last, 48, 112, 78, { font: "s7", color: K, align: "c" })
  drawText(x, "피고: " + (STU_C[res.stu.college] || "") + res.stu.no + "학번", 132, 112, { font: "s7", color: K, align: "c" })
  // 본문
  wrap(d.body, "s9", w - 24, 5).forEach((l, i) => drawText(x, l, 12, 125 + i * 11, { font: "s9", color: K }))
  const s = res.stats
  drawText(x, `반박 ${s.parries}회 (완벽 ${s.perfect}) · A+ ${s.crits}개`, 12, 178, { font: "s7", color: G })
  drawText(x, `최대 ${s.maxCombo}콤보 · 최고 기록 ${Math.max(rec.best || 0, n)}연승`, 12, 187, { font: "s7", color: G })
  if (res.run.ups) drawFit(x, "강화: " + res.run.ups, 12, 196, 108, { font: "s7", color: G })   // 도장 왼쪽까지만
  // 날짜와 도장
  const dt = new Date(), date = `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}.`
  drawText(x, date, 12, 205, { font: "s9", color: K })
  drawText(x, "종강 파이터 학사지원팀장", 12, 215, { font: "s7", color: K })
  const st = textImage(d.stamp, { font: "l14", bold: true, stamp: -8, color: R, outline: P })
  x.drawImage(st, w - st.width - 10, h - st.height - 8)
  // 6배로
  const big = document.createElement("canvas"); big.width = w * 6; big.height = h * 6
  const bx = big.getContext("2d"); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, big.width, big.height)
  return big
}
function box(x, X, Y, w, h) { x.fillRect(X, Y, w, 1); x.fillRect(X, Y + h - 1, w, 1); x.fillRect(X, Y, 1, h); x.fillRect(X + w - 1, Y, 1, h) }
