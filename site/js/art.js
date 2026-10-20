// pxl 엔진을 브라우저에서 돌려 그림 원본(art/game.px.js)을 꾸미기 선택(OPT)대로 그린다.
import { Project } from "../vendor/pxl/core/index.js?v=202610201623"

let SRC = ""
export async function loadArtSource() {
  SRC = await (await fetch("art/game.px.js?v=202610201623")).text()
}

const NAMES = [
  "room", "prof_idle", "prof_p2", "prof_ko", "prof_arms", "lectern", "stu_idle", "stu_windup", "stu_smash", "stu_follow", "stu_sweepA", "stu_sweepB", "stu_overUp", "stu_overDown", "grad",
  "cap_c", "cap_v", "cap_ctrl", "cap_blank", "aplus", "ic_wire", "ic_can", "ic_push",
  "ic_postit", "ic_pen3", "ic_report", "ic_recorder", "ic_factcheck", "ic_petition", "ic_lamp", "ic_nitrogen", "ic_centrifuge", "ic_spray", "ic_metronome", "ic_canvas", "ic_bandage", "ic_nightshift", "ic_codeblue", "ic_anesthesia", "ic_rounds", "ic_surgery", "ic_objection", "ic_counsel", "ic_verdict", "ic_rollcall", "ic_sticker", "ic_chalkstorm", "ic_meeting", "ic_compound", "ic_ipo", "ic_leaflet", "ic_vitamin", "ic_pillrain", "ic_yellow", "ic_shake", "ic_relay",
]
for (let lv = 1; lv <= 5; lv++) for (const m of ["idle", "hurt", "win"]) NAMES.push(`por_${lv}_${m}`)
for (const p of ["rc", "drone", "penguin", "owl", "rat", "bust"]) NAMES.push(`pet_${p}_0`, `pet_${p}_1`)

// 이미지(0xRRGGBBAA)를 캔버스로
function toCanvas(img) {
  const c = document.createElement("canvas"); c.width = img.w; c.height = img.h
  const id = new ImageData(img.w, img.h), d = id.data
  for (let i = 0; i < img.data.length; i++) {
    const v = img.data[i]; d[i * 4] = v >>> 24; d[i * 4 + 1] = (v >>> 16) & 255; d[i * 4 + 2] = (v >>> 8) & 255; d[i * 4 + 3] = v & 255
  }
  c.getContext("2d").putImageData(id, 0, 0)
  return c
}

// 실루엣: 불투명한 픽셀을 한 색으로 (피격 섬광, 드리운 그림자)
export function silhouette(src, color) {
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height
  const x = c.getContext("2d"); x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height)
  return c
}

export function buildArt(opt, names = NAMES) {
  const p = new Project(); p.addFile("game.px.js")
  const env = { ...p.env(), OPT: opt }
  new Function(...Object.keys(env), SRC)(...Object.values(env))
  const out = {}
  for (const n of names) out[n] = toCanvas(p.image(n))
  if (names !== NAMES) return out                                   // 목록 썸네일처럼 일부만 그릴 때
  for (const n of ["prof_idle", "prof_p2", "grad"]) out[n + "_white"] = silhouette(out[n], "#ffffff")
  for (const n of ["prof_idle", "prof_p2", "prof_ko", "lectern", "grad", "stu_idle", "stu_windup", "stu_smash", "stu_follow", "stu_sweepA", "stu_sweepB", "stu_overUp", "stu_overDown"]) out[n + "_shadow"] = silhouette(out[n], "#6e6178")
  out.prof_arms_shadow = silhouette(out.prof_arms, "#6e6178")
  return out
}
