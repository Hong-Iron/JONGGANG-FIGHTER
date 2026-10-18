import {             TRANSPARENT } from "./color.js";
import { Img } from "./image.js";
                                                      
import { PxError } from "./errors.js";
import { glyph, lineWidth } from "./font.js";
                                                                                                                        
import { bump, dirOf, setNormal } from "./normals.js";
import { bayer, colorList, gridRows, hash, inPoly, polyBounds,              regionPred, rng } from "./util.js";

/** How a canvas reaches other assets. */
                           
     
                                                                                                 
                                                                                           
     
                                                                      
                                                                     
                                                             
                                                                                 
                                     
 

                                              

/**
 * Drawing surface over an image. Coordinates are relative to (ox, oy); colors are palette
 * keys, "#hex", "." (skip) or "_" (erase). All writes go through plot(), which honours clip().
 */
export class Canvas {
  img     ;
  pal         ;
  res          ;
  ox        ;
  oy        ;
  /** Reseed offset applied to every random choice made on this canvas. */
  seed        ;
  /** Time in ms of this build: placed anims show the frame at this time. */
  t = 0;
  /** Inside an anim: the frame being drawn and the frame count (for procedural animation). */
  frame = 0;
  frames = 1;
  /** Building an anim (frame() items allowed). */
  inAnim = false;
  /** Composite below the current layer (absolute coords), for `below` masks. */
  below      ;
  /** Called after each top-level (non-nested) op call; used for tracing. */
  onOp                                          ;
  /** Art-file location of the op item currently running (set by the builder). */
  loc         ;
          clipPred       ;
  /** Nesting depth of op calls (internal). */
  _depth = 0;
          rev                     ;

  constructor(img     , pal         , res          , ox = 0, oy = 0, seed = 0) {
    this.img = img;
    this.pal = pal;
    this.res = res;
    this.ox = ox;
    this.oy = oy;
    this.seed = seed;
  }

  /** Inside an anim: frame / frames, 0 (first frame) up to just below 1. */
  get phase()         { return this.frame / this.frames; }

  get w()         { return this.img.w; }
  get h()         { return this.img.h; }

  color(c         )           {
    return this.pal.resolve(c);
  }

  /** Write an already-resolved color (null = skip); true if it landed. */
  plot(x        , y        , c          )          {
    if (c === null) return false;
    x = Math.floor(x);
    y = Math.floor(y);
    if (this.clipPred && !this.clipPred(x, y)) return false;
    if (!this.img.inside(this.ox + x, this.oy + y)) return false;
    this.img.set(this.ox + x, this.oy + y, c);
    return true;
  }

  get(x        , y        )        {
    return this.img.get(this.ox + Math.floor(x), this.oy + Math.floor(y));
  }

  /** Palette key at (x, y): "." when transparent, "?" when not in the palette. */
  key(x        , y        )         {
    const c = this.get(x, y);
    if (c === TRANSPARENT) return ".";
    this.rev ??= this.pal.reverse();
    return this.rev.get(c) ?? "?";
  }

  /** Pixel is one of `keys` ("*" = any opaque, "." = transparent). */
  is(x        , y        , keys        )          {
    if (keys === ".") return this.get(x, y) === TRANSPARENT;
    return this.colorTest(keys)(this.get(x, y));
  }

  /** Seeded random generator that follows this canvas's reseed offset. */
  rng(seed = 1)               {
    return rng(hash(seed, 0, this.seed));
  }

          colorTest(on        )                        {
    if (on === "*") return (c) => c !== TRANSPARENT;
    const set = new Set       ();
    for (const k of colorList(on)) {
      const c = this.color(k);
      if (c !== null) set.add(c);
    }
    return (c) => set.has(c);
  }

  /** Mask predicate over canvas coords; `below` reads the composite under this layer. */
  maskAt(on                    , below = false)       {
    if (on === undefined) return () => true;
    const test = this.colorTest(on);
    if (below) {
      const b = this.below;
      if (!b) return (x, y) => test(this.get(x, y));
      return (x, y) => {
        const own = this.get(x, y);
        return test(own !== TRANSPARENT ? own : b.get(this.ox + x, this.oy + y));
      };
    }
    return (x, y) => test(this.get(x, y));
  }

  /** Run `fn` with drawing restricted to `region` (nests by intersection). */
  clip(region        , fn            )       {
    const prev = this.clipPred, p = regionPred(region);
    this.clipPred = prev ? (x, y) => prev(x, y) && p(x, y) : p;
    try { fn(); } finally { this.clipPred = prev; }
  }

  // ---------------------------------------------------------------- shapes

  px(x        , y        , c        )       {
    this.plot(x, y, this.color(c));
  }

  rect(x        , y        , w        , h        , c        )       {
    const col = this.color(c);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.plot(xx, yy, col);
  }

  box(x        , y        , w        , h        , c        )       {
    const col = this.color(c);
    for (let xx = x; xx < x + w; xx++) { this.plot(xx, y, col); this.plot(xx, y + h - 1, col); }
    for (let yy = y + 1; yy < y + h - 1; yy++) { this.plot(x, yy, col); this.plot(x + w - 1, yy, col); }
  }

  /** Bresenham line; width > 1 uses a round brush. */
  line(x0        , y0        , x1        , y1        , c        , width = 1)       {
    const col = this.color(c);
    const brush           = [];
    if (width > 1) {
      const f = width % 2 === 0 ? 0.5 : 0, r2 = (width / 2) ** 2;
      const lo = -Math.floor((width - 1) / 2), hi = Math.ceil((width - 1) / 2);
      for (let oy = lo; oy <= hi; oy++)
        for (let ox = lo; ox <= hi; ox++) if ((ox - f) ** 2 + (oy - f) ** 2 <= r2) brush.push(ox, oy);
    } else brush.push(0, 0);
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      for (let i = 0; i < brush.length; i += 2) this.plot(x0 + brush[i], y0 + brush[i + 1], col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  hline(x        , y        , len        , c        )       { this.rect(x, y, len, 1, c); }
  vline(x        , y        , len        , c        )       { this.rect(x, y, 1, len, c); }

  /** Ellipse centered at (cx, cy); `ring` draws only the 1px border. */
  ellipse(cx        , cy        , rx        , ry        , c        , ring = false)       {
    const col = this.color(c);
    const ax = rx + 0.5, ay = ry + 0.5;
    const inside = (x        , y        ) => (x / ax) ** 2 + (y / ay) ** 2 <= 1;
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++)
        if (inside(x, y) && (!ring || !(inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1))))
          this.plot(cx + x, cy + y, col);
  }

  circ(cx        , cy        , r        , c        )       { this.ellipse(cx, cy, r, r, c); }
  ring(cx        , cy        , r        , c        )       { this.ellipse(cx, cy, r, r, c, true); }

  /** Filled polygon [x0,y0, x1,y1, ...] with vertices on pixel corners. */
  poly(pts          , c        )       {
    if (!Array.isArray(pts) || pts.length < 6 || pts.length % 2) throw new PxError("poly needs [x0,y0, x1,y1, x2,y2, ...]");
    const col = this.color(c), inside = inPoly(pts), b = polyBounds(pts);
    for (let y = Math.floor(b.y0); y < Math.ceil(b.y1); y++)
      for (let x = Math.floor(b.x0); x < Math.ceil(b.x1); x++) if (inside(x, y)) this.plot(x, y, col);
  }

  /** 4-connected flood fill of the region containing (x, y). */
  fill(x        , y        , c        )       {
    const col = this.color(c);
    if (col === null) return;
    const img = this.img;
    const sx = this.ox + Math.floor(x), sy = this.oy + Math.floor(y);
    if (!img.inside(sx, sy)) return;
    const target = img.get(sx, sy);
    if (target === col) return;
    const seen = new Uint8Array(img.w * img.h);
    const stack = [sx, sy];
    while (stack.length) {
      const py = stack.pop() , px = stack.pop() ;
      if (!img.inside(px, py)) continue;
      const i = py * img.w + px;
      if (seen[i] || img.data[i] !== target) continue;
      seen[i] = 1;
      this.plot(px - this.ox, py - this.oy, col);
      stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1);
    }
  }

  // ---------------------------------------------------------------- texture

  /** Ordered dither: c2 covers `density` of the area, c1 the rest. */
  dither(x        , y        , w        , h        , c1        , c2        , density = 0.5)       {
    const a = this.color(c1), b = this.color(c2);
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.plot(xx, yy, bayer(xx, yy) < density ? b : a);
  }

  /** Banded gradient through colors with dithered seams. dir "v" (default) or "h"; soft 0..1. */
  grad(x        , y        , w        , h        , colors                   , dir            = "v", soft = 0.5)       {
    const cols = colorList(colors).map((c) => this.color(c));
    const n = cols.length;
    if (!n) throw new PxError("grad needs at least one color");
    const len = dir === "h" ? w : h;
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        const pos = dir === "h" ? xx : yy;
        const f = len > 1 ? (pos / (len - 1)) * (n - 1) : 0;
        const i = Math.floor(f);
        let col          ;
        if (i >= n - 1) col = cols[n - 1];
        else {
          let t = f - i;
          t = soft > 0 ? (t - 0.5) / soft + 0.5 : t >= 0.5 ? 1 : 0;
          col = bayer(x + xx, y + yy) < t ? cols[i + 1] : cols[i];
        }
        this.plot(x + xx, y + yy, col);
      }
  }

  /** Deterministic scatter of colors over `density` of the area; `on` limits it to those keys. */
  noise(x        , y        , w        , h        , colors                   , density = 0.1, seed = 1, on         )       {
    const cols = colorList(colors).map((c) => this.color(c));
    const ok = this.maskAt(on);
    const r = this.rng(seed);
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++)
        if (r() < density) {
          const pick = cols[Math.floor(r() * cols.length)];
          if (ok(xx, yy)) this.plot(xx, yy, pick);
        }
  }

  /** Apply a color map inside a region `steps` times; density < 1 dithers it. */
  remap(map                   , where         , steps = 1, density = 1)       {
    const ok = regionPred(where);
    for (let y = -this.oy; y < this.img.h - this.oy; y++)
      for (let x = -this.ox; x < this.img.w - this.ox; x++) {
        if (!ok(x, y) || (density < 1 && bayer(x, y) >= density)) continue;
        let c = this.get(x, y);
        for (let i = 0; i < steps; i++) c = map.get(c) ?? c;
        this.plot(x, y, c);
      }
  }

  /** Recolor { m: "M" } inside a region. */
  recolor(map                        , where         , density = 1)       {
    this.remap(this.swapMap(map), where, 1, density);
  }

  /** Step colors darker along the palette ramps inside a region. */
  shade(where         , steps = 1, density = 1)       {
    this.remap(this.pal.stepMap(-1), where, steps, density);
  }

  /** Step colors lighter along the palette ramps inside a region. */
  light(where         , steps = 1, density = 1)       {
    this.remap(this.pal.stepMap(1), where, steps, density);
  }

  swapMap(swap                        )                    {
    const m = new Map              ();
    for (const from of Object.keys(swap)) {
      const a = this.color(from), b = this.color(swap[from]);
      if (a !== null && b !== null) m.set(a, b);
    }
    return m;
  }

  // ---------------------------------------------------------------- assets

  /** Pick one candidate of `name` and transform it; random choices seeded by (a, b). */
  asset(name        , opts            = {}, a = 0, b = 0)      {
    const list = this.res.candidates(name);
    const r = rng(hash(a, b, (opts.seed ?? 0) + this.seed));
    let inner = this.seed;
    if (opts.reseed === true) inner += (hash(a, b, opts.seed ?? 0) % 99991) + 1;
    else if (typeof opts.reseed === "number") inner += opts.reseed;
    const pick = list[Math.floor(r() * list.length)];
    let t = this.t, track = true;
    if (opts.frame !== undefined || opts.delay || opts.rdelay) {
      const tl = this.res.timeline(pick, inner);
      if (tl) {
        if (opts.frame !== undefined) {
          t = frameStart(tl, opts.frame);
          track = false;
        } else {
          // Shifts snap to the anim's step so combined timelines stay on a frame grid.
          let d = opts.delay ?? 0;
          if (opts.rdelay) d += rng(hash(a, b, (opts.seed ?? 0) + this.seed + 7919))() * tl.loop;
          t += Math.round(d / tl.step) * tl.step;
        }
      }
    }
    let src = this.res.image(pick, inner, t, track);
    const swap = opts.rswap ? opts.rswap[Math.floor(r() * opts.rswap.length)] : opts.swap;
    if (swap && Object.keys(swap).length) src = src.remap(this.swapMap(swap));
    if (opts.flip) src = src.flip(opts.flip);
    if (opts.rflip) {
      let f = "";
      for (const ax of opts.rflip) if ((ax === "x" || ax === "y") && r() < 0.5) f += ax;
      if (f) src = src.flip(f                    );
    }
    if (opts.rot) src = src.rot(opts.rot);
    return src;
  }

  /** Draw an image at canvas coords; with a predicate, only onto pixels it accepts. Lamps come along. */
  put(src     , x        , y        , ok       )       {
    if (src.lamps?.length) {
      const dx = this.ox + Math.floor(x), dy = this.oy + Math.floor(y);
      (this.img.lamps ??= []).push(...src.lamps.map((l) => ({ ...l, x: l.x + dx, y: l.y + dy })));
    }
    if (!ok && !this.clipPred) {
      this.img.blit(src, this.ox + x, this.oy + y);
      return;
    }
    for (let yy = 0; yy < src.h; yy++)
      for (let xx = 0; xx < src.w; xx++) {
        const c = src.data[yy * src.w + xx];
        if (c === TRANSPARENT || (ok && !ok(x + xx, y + yy)) || !this.plot(x + xx, y + yy, c)) continue;
        const i = (this.oy + Math.floor(y) + yy) * this.img.w + this.ox + Math.floor(x) + xx, j = yy * src.w + xx;
        if (src.norm) {
          const n = this.img.normals();
          n.set(src.norm.subarray(j * 3, j * 3 + 3), i * 3);
        } else if (this.img.norm) this.img.norm[i * 3 + 2] = 0;
      }
  }

  stamp(name        , x = 0, y = 0, opts            )       {
    this.put(this.asset(name, opts, x, y), x, y);
  }

  tile(name        , x        , y        , cols = 1, rows = 1, opts            )       {
    const step = this.res.image(this.res.candidates(name)[0], 0);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const tx = x + c * step.w, ty = y + r * step.h;
        this.put(this.asset(name, opts, tx, ty), tx, ty);
      }
  }

  /** Tile `name` over an area; edge tiles are cut to fit. */
  pattern(name        , x        , y        , w        , h        , opts            )       {
    const step = this.res.image(this.res.candidates(name)[0], 0);
    for (let ty = y; ty < y + h; ty += step.h)
      for (let tx = x; tx < x + w; tx += step.w) {
        let src = this.asset(name, opts, tx, ty);
        const cw = Math.min(src.w, x + w - tx), ch = Math.min(src.h, y + h - ty);
        if (cw < src.w || ch < src.h) src = src.sub(0, 0, cw, ch);
        this.put(src, tx, ty);
      }
  }

  /** Character map of tiles: tilemap(`gg\ndd`, { map: { g: "grass" }, size: 16 }). */
  tilemap(str        , opts             )       {
    if (typeof str !== "string") throw new PxError("tilemap(str, { map, size }) needs the map string first");
    if (!opts?.map) throw new PxError("tilemap needs { map: { char: assetName } }");
    const rows = gridRows(str);
    const x0 = opts.x ?? 0, y0 = opts.y ?? 0;
    rows.forEach((row, r) => {
      [...row].forEach((ch, i) => {
        if (ch === "." || ch === " ") return;
        const name = opts.map[ch];
        if (!name) throw new PxError(`tilemap: no tile for '${ch}' (row ${r}, col ${i}); map has: ${Object.keys(opts.map).join(" ")}`);
        const step = opts.w && opts.h ? null : this.res.image(this.res.candidates(name)[0], 0);
        const tx = x0 + i * (opts.w ?? opts.size ?? step .w), ty = y0 + r * (opts.h ?? opts.size ?? step .h);
        this.put(this.asset(name, opts, tx, ty), tx, ty);
      });
    });
  }

  /** Brush: `count` random picks of `name` centered at random points in the area. */
  scatter(name        , x        , y        , w        , h        , count        , opts              = {})       {
    const r = rng(hash(x * 31 + w, y * 17 + h, (opts.seed ?? 0) + this.seed));
    const ok = this.maskAt(opts.on, opts.below);
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 30) {
      tries++;
      const cx = x + Math.floor(r() * w), cy = y + Math.floor(r() * h);
      if (!ok(cx, cy)) continue;
      const src = this.asset(name, opts, cx, cy);
      this.put(src, cx - Math.floor(src.w / 2), cy - Math.floor(src.h / 2), opts.clip ? ok : undefined);
      placed++;
    }
  }

  /** Grid string at (x, y): one char per pixel; "." keeps, "_" erases. */
  grid(x        , y        , s        )       {
    gridRows(String(s)).forEach((row, r) => {
      [...row].forEach((ch, i) => {
        if (ch === "." || ch === " ") return;
        let c          ;
        try { c = this.color(ch); } catch (e) {
          throw new PxError(`${(e         ).message} at grid row ${r}, col ${i}`);
        }
        this.plot(x + i, y + r, c);
      });
    });
  }

  /** Hanging cable sagging `sag` px; `hang` stamps an asset/group under it every `every` px. */
  wire(x0        , y0        , x1        , y1        , sag        , c        , opts           = {})       {
    const at = (t        )                   => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + Math.abs(sag) * 2 + 1;
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const [fx, fy] = at(i / n);
      const qx = Math.round(fx), qy = Math.round(fy);
      this.line(px, py, qx, qy, c);
      px = qx; py = qy;
    }
    if (!opts.hang || x1 === x0) return;
    const every = opts.every ?? 6, span = Math.abs(x1 - x0), dir = Math.sign(x1 - x0);
    for (let d = opts.start ?? Math.floor(every / 2); d < span; d += every) {
      const [, fy] = at(d / span);
      const hx = x0 + dir * d, hy = Math.round(fy);
      const src = this.asset(opts.hang, opts, hx, hy);
      this.put(src, hx - Math.floor(src.w / 2), hy + 1);
    }
  }

  /** Light source at (x, y): lights the scene when a lighting() item runs; travels with stamps. */
  lamp(x        , y        , opts           = {})       {
    const c = this.color(opts.color ?? "#fff");
    if (c === null || c === TRANSPARENT) throw new PxError(`lamp color must be a visible color, got '${opts.color}'`);
    const r = opts.r ?? 32;
    if (!(r > 0)) throw new PxError(`lamp r must be > 0, got ${r}`);
    (this.img.lamps ??= []).push({ x: this.ox + Math.floor(x), y: this.oy + Math.floor(y), r, color: c, power: opts.power ?? 1, z: opts.z ?? 8 });
  }

  /** Generate surface normals for this canvas's opaque pixels (see normals.ts). */
  bump(shape                    = "dome", opts           = {})       {
    const { w, h } = this.img, mask = new Uint8Array(w * h);
    const keys = this.maskAt(opts.on ?? "*"), inside = opts.where === undefined ? undefined : regionPred(opts.where);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const cx = x - this.ox, cy = y - this.oy;
        if (keys(cx, cy) && (!inside || inside(cx, cy)) && (!this.clipPred || this.clipPred(cx, cy))) mask[y * w + x] = 1;
      }
    bump(this.img, mask, { ...opts, shape });
  }

  /** Paint normals with a numpad grid: 8 faces up, 3 down-right, 5 the viewer; qweasdzxc are softer. */
  normals(x        , y        , s        )       {
    gridRows(String(s)).forEach((row, r) => {
      [...row].forEach((ch, i) => {
        let d;
        try { d = dirOf(ch); } catch (e) { throw new PxError(`${(e         ).message} at row ${r}, col ${i}`); }
        const px = Math.floor(x) + i, py = Math.floor(y) + r;
        if (d === null || (this.clipPred && !this.clipPred(px, py)) || !this.img.inside(this.ox + px, this.oy + py)) return;
        const k = (this.oy + py) * this.img.w + this.ox + px;
        if (d === "none") { if (this.img.norm) this.img.norm[k * 3 + 2] = 0; }
        else setNormal(this.img.normals(), k, d[0], d[1], d[2]);
      });
    });
  }

  /** Text in the built-in 3x5 font. */
  text(x        , y        , s        , c        , opts           = {})       {
    s = String(s);
    if (opts.shadow) this.text(x + 1, y + 1, s, opts.shadow, { ...opts, shadow: undefined });
    const col = this.color(c);
    const sc = opts.scale ?? 1, gap = opts.gap ?? 1, lead = opts.lead ?? 1;
    let ly = y;
    for (const line of s.split("\n")) {
      const lw = lineWidth(line, opts);
      let cx = opts.align === "c" ? x - Math.floor(lw / 2) : opts.align === "r" ? x - lw + 1 : x;
      for (const ch of line) {
        const rows = glyph(ch);
        rows.forEach((row, r) => {
          for (let b = 0; b < row.length; b++)
            if (row[b] === "#")
              for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) this.plot(cx + b * sc + xx, ly + r * sc + yy, col);
        });
        cx += (rows[0].length + gap) * sc;
      }
      ly += (5 + lead) * sc;
    }
  }
}

/** Start time (ms) of frame `n` of a timeline. */
export function frameStart(tl          , n        )         {
  if (!tl.durations) return Math.max(0, Math.floor(n)) * tl.step;
  const d = tl.durations, k = ((Math.floor(n) % d.length) + d.length) % d.length;
  let t = 0;
  for (let i = 0; i < k; i++) t += d[i];
  return t;
}

/** Ops callable from art files; each top-level call can be traced as one painting step. */
export const OPS = [
  "px", "rect", "box", "line", "hline", "vline", "ellipse", "circ", "ring", "poly", "fill",
  "dither", "grad", "noise", "recolor", "shade", "light",
  "stamp", "tile", "pattern", "tilemap", "scatter", "grid", "wire", "text", "lamp", "bump", "normals",
]         ;
                                          

// Wrap ops so only the outermost call reports to onOp (ring -> ellipse, text -> plot, ...).
for (const name of OPS) {
  const proto = Canvas.prototype                                                           ;
  const fn = proto[name];
  proto[name] = function (              ...args           ) {
    this._depth++;
    let ok = false;
    try {
      const r = fn.apply(this, args);
      ok = true;
      return r;
    } finally {
      this._depth--;
      if (ok && this._depth === 0 && this.onOp) this.onOp(name, args);
    }
  };
}
