// 픽셀 글자: 갈무리 글꼴을 원래 크기(1배)로 찍고 반투명을 잘라 0/1로 만든다.
// 효과(굵게, 외곽선, 그림자, 빨간 펜 기울임, 도장)도 모두 1배 격자 위에서 한다.
export const FONTS = {
  s7: ["Galmuri7", 8, "normal"], s9: ["Galmuri9", 10, "normal"],
  m11: ["Galmuri11", 12, "normal"], b11: ["Galmuri11", 12, "bold"], l14: ["Galmuri14", 15, "normal"],
}

export async function loadFonts() {
  await Promise.all(Object.values(FONTS).map(([f, s, w]) => document.fonts.load(`${w} ${s}px "${f}"`, "가A1")))
}

const scratch = document.createElement("canvas"); scratch.width = 512; scratch.height = 32
const sx = scratch.getContext("2d", { willReadFrequently: true })

// 글자 → {w, h, m: Uint8Array}
const maskCache = new Map()
export function mask(str, font = "m11") {
  const key = font + "|" + str
  if (maskCache.has(key)) return maskCache.get(key)
  const [f, size, weight] = FONTS[font]
  sx.clearRect(0, 0, 512, 32); sx.font = `${weight} ${size}px "${f}"`; sx.textBaseline = "top"; sx.fillStyle = "#000"
  sx.fillText(str, 0, 4)
  const W = Math.min(512, Math.ceil(sx.measureText(str).width) + 2), d = sx.getImageData(0, 0, W, 32).data
  let y0 = 32, y1 = -1
  const full = new Uint8Array(W * 32)
  for (let y = 0; y < 32; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 128) { full[y * W + x] = 1; y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  // 글자 높이는 글꼴마다 고정(빈 줄 포함)이라 줄 맞춤이 흔들리지 않게 4줄 아래부터 size만큼 자른다
  const top = 4, H = size
  const m = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m[y * W + x] = full[(y + top) * W + x]
  let w = 0
  for (let x = W - 1; x >= 0; x--) { let any = 0; for (let y = 0; y < H; y++) any |= m[y * W + x]; if (any) { w = x + 1; break } }
  const out = { w: Math.max(1, w), h: H, m: cropW(m, W, H, Math.max(1, w)) }
  maskCache.set(key, out)
  return out
}
function cropW(m, W, H, w) { const o = new Uint8Array(w * H); for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) o[y * w + x] = m[y * W + x]; return o }

export function width(str, font = "m11") { return str ? mask(str, font).w : 0 }

// 마스크 변형
function grow(mk, n) {                                  // 사방으로 n칸 키운 마스크 (외곽선용)
  const w = mk.w + n * 2, h = mk.h + n * 2, o = new Uint8Array(w * h)
  for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) if (mk.m[y * mk.w + x])
    for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) if (Math.abs(dx) + Math.abs(dy) <= n) o[(y + n + dy) * w + x + n + dx] = 1
  return { w, h, m: o }
}
function bold(mk) {
  const w = mk.w + 1, o = new Uint8Array(w * mk.h)
  for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) if (mk.m[y * mk.w + x]) { o[y * w + x] = 1; o[y * w + x + 1] = 1 }
  return { w, h: mk.h, m: o }
}
function pen(mk) {                                       // 빨간 펜: 오른쪽으로 기울이고 글자 덩어리마다 1px 흔들림
  const k = 0.25, extra = Math.ceil((mk.h - 1) * k), w = mk.w + extra, h = mk.h + 2, o = new Uint8Array(w * h)
  let seg = 0, prev = false
  for (let x = 0; x < mk.w; x++) {
    let col = false; for (let y = 0; y < mk.h; y++) col = col || !!mk.m[y * mk.w + x]
    if (!col && prev) seg++
    prev = col
    const off = [1, 0, 2, 1, 0][seg % 5]
    for (let y = 0; y < mk.h; y++) if (mk.m[y * mk.w + x]) o[(y + off) * w + x + Math.floor((mk.h - 1 - y) * k)] = 1
  }
  return { w, h, m: o }
}
function stampify(mk, angle) {                           // 도장: 이중 테두리 + 잉크 빠진 점 + 세 번 밀어 회전
  const pad = 4, w = mk.w + pad * 2, h = mk.h + pad * 2, g = new Uint8Array(w * h)
  for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) if (mk.m[y * mk.w + x]) g[(y + pad) * w + x + pad] = 1
  for (let x = 0; x < w; x++) for (const y of [0, 1, h - 2, h - 1]) g[y * w + x] = 1
  for (let y = 0; y < h; y++) for (const x of [0, 1, w - 2, w - 1]) g[y * w + x] = 1
  for (let i = 0; i < g.length; i++) if (g[i] && ((i * 2654435761) >>> 0) % 9 === 0) g[i] = 0
  const a = angle * Math.PI / 180, t1 = -Math.tan(a / 2), s1 = Math.sin(a), pts = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y * w + x]) {
    let X = x - (w >> 1), Y = y - (h >> 1)
    X += Math.round(t1 * Y); Y += Math.round(s1 * X); X += Math.round(t1 * Y)
    pts.push([X, Y])
  }
  const mx = Math.min(...pts.map((p) => p[0])), my = Math.min(...pts.map((p) => p[1]))
  const W = Math.max(...pts.map((p) => p[0])) - mx + 1, H = Math.max(...pts.map((p) => p[1])) - my + 1, o = new Uint8Array(W * H)
  for (const [X, Y] of pts) o[(Y - my) * W + X - mx] = 1
  return { w: W, h: H, m: o }
}

// 글자 그림 하나를 캔버스로. opts: font, color, bold, pen, stamp(각도), outline, outline2, shadow
const imgCache = new Map()
export function textImage(str, opts = {}) {
  const key = str + "|" + JSON.stringify(opts)
  if (imgCache.has(key)) return imgCache.get(key)
  let mk = mask(str, opts.font || "m11")
  if (opts.bold) mk = bold(mk)
  if (opts.pen) mk = pen(mk)
  if (opts.stamp !== undefined) mk = stampify(mk, opts.stamp)
  const layers = [[mk, opts.color || "#1d1622", 0]]
  let n = 0
  if (opts.outline) { n = 1; layers.unshift([grow(mk, 1), opts.outline, 1]) }
  if (opts.outline2) { n = 2; layers.unshift([grow(mk, 2), opts.outline2, 2]) }
  const sh = opts.shadow ? 1 : 0
  const W = mk.w + n * 2 + sh, H = mk.h + n * 2 + sh
  const c = document.createElement("canvas"); c.width = W; c.height = H
  const x = c.getContext("2d")
  const paint = (m, col, off, dx = 0, dy = 0) => {
    x.fillStyle = col
    for (let y = 0; y < m.h; y++) for (let i = 0; i < m.w; i++) if (m.m[y * m.w + i]) x.fillRect(i + n - off + dx, y + n - off + dy, 1, 1)
  }
  if (sh) paint(layers[0][0], opts.shadow, layers[0][2], 1, 1)
  for (const [m, col, off] of layers) paint(m, col, off)
  imgCache.set(key, c)
  return c
}

export function drawText(ctx, str, x, y, opts = {}) {
  if (!str) return 0
  const im = textImage(str, opts)
  let X = x
  if (opts.align === "c") X = x - Math.floor(im.width / 2)
  else if (opts.align === "r") X = x - im.width
  ctx.drawImage(im, Math.round(X), Math.round(y))
  return im.width
}

// 줄 바꿈: maxW 안에 들어가게 글자 단위로 자른다 (띄어쓰기를 우선)
export function wrap(str, font, maxW, maxLines = 99) {
  const words = str.split(" "), lines = []
  let cur = ""
  const push = (s) => { if (lines.length < maxLines) lines.push(s) }
  for (const w of words) {
    const t = cur ? cur + " " + w : w
    if (width(t, font) <= maxW) { cur = t; continue }
    if (cur) push(cur)
    cur = ""
    let piece = ""
    for (const ch of w) { if (width(piece + ch, font) > maxW) { push(piece); piece = ch } else piece += ch }
    cur = piece
  }
  if (cur) push(cur)
  if (lines.length === maxLines && width(lines[maxLines - 1], font) > maxW - 6) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…"
  return lines
}
