"""textbits.json(갈무리 글꼴을 1배로 찍은 비트맵) → txt.px.js (pxl 스프라이트).
빨간 펜 낙서체: 굵게 + 오른쪽으로 기울임 + 줄마다 1px 흔들림.
도장: 굵은 글자 + 이중 테두리 + 잉크가 덜 묻은 점 + 살짝 회전(최근접 표본, 격자 유지)."""
import json, math, hashlib
T = json.load(open("textbits.json"))

def bold(rows):
    rows = [r + "." for r in rows]
    return ["".join("X" if (r[i] == "X" or (i > 0 and r[i - 1] == "X")) else "." for i in range(len(r))) for r in rows]

def shear(rows, k):
    h = len(rows); w = len(rows[0]); extra = math.ceil((h - 1) * k)
    out = []
    for y, r in enumerate(rows):
        s = int((h - 1 - y) * k)
        out.append("." * s + r + "." * (extra - s))
    return out

def wobble(rows):
    # 펜으로 쓴 느낌: 글자 덩어리(빈 열로 나뉜)마다 위아래 1px 어긋남
    h, w = len(rows), len(rows[0])
    cols = [any(r[x] == "X" for r in rows) for x in range(w)]
    grid = [["."] * w for _ in range(h + 2)]
    seg, off = 0, 0
    for x in range(w):
        if not cols[x] and x > 0 and cols[x - 1]:
            seg += 1
        off = [1, 0, 2, 1, 0][seg % 5]
        for y in range(h):
            if rows[y][x] == "X":
                grid[y + off][x] = "X"
    return ["".join(r) for r in grid]

def stamp(rows, angle):
    t = bold(rows)
    pad = 4
    w, h = len(t[0]) + pad * 2, len(t) + pad * 2
    g = [["."] * w for _ in range(h)]
    for y, r in enumerate(t):
        for x, ch in enumerate(r):
            if ch == "X": g[y + pad][x + pad] = "X"
    for x in range(w):
        for y in (0, 1, h - 2, h - 1): g[y][x] = "X"
    for y in range(h):
        for x in (0, 1, w - 2, w - 1): g[y][x] = "X"
    # 잉크가 덜 묻은 자리 (재현 가능하게 해시로)
    for y in range(h):
        for x in range(w):
            if g[y][x] == "X" and int(hashlib.md5(f"{x},{y}".encode()).hexdigest(), 16) % 9 == 0: g[y][x] = "."
    # 세 번의 밀기(행 이동, 열 이동, 행 이동)로 회전: 픽셀을 버리지 않아 획이 안 깨진다
    a = math.radians(angle); t1 = -math.tan(a / 2); s1 = math.sin(a)
    pts = [(x - w // 2, y - h // 2) for y in range(h) for x in range(w) if g[y][x] == "X"]
    def r(p):
        x, y = p
        x = x + round(t1 * y); y = y + round(s1 * x); x = x + round(t1 * y)
        return (x, y)
    q = [r(p) for p in pts]
    mx, my = min(p[0] for p in q), min(p[1] for p in q)
    W2, H2 = max(p[0] for p in q) - mx + 1, max(p[1] for p in q) - my + 1
    out = [["."] * W2 for _ in range(H2)]
    for x, y in q: out[y - my][x - mx] = "X"
    return ["".join(r) for r in out]

def emit(name, rows):
    body = "\n".join("  " + r for r in rows)
    return f'sprite("{name}", {{ w: {len(rows[0])}, h: {len(rows)} }}, `\n{body}`)\n'

out = ["// make_text.py가 만든다. 직접 고치지 않는다.\n"]
for k, rows in T.items():
    out.append(emit("_t_" + k, rows))
out.append(emit("_t_parry_b", bold(T["parry"])))
out.append(emit("_t_logic_pen", wobble(shear(T["logic"], 0.25))))
out.append(emit("_t_phase2_stamp", stamp(T["phase2"], -7)))
open("txt.px.js", "w").write("".join(out))
print({k: (len(v[0]), len(v)) for k, v in T.items()})
