import {             TRANSPARENT } from "./color.js";

                                    

/** A light source carried by an image (pixel coords); consumed by lighting(). */
                       
            
            
                                            
            
               
                
                                                                                                
            
 

/** RGBA image as packed colors. Out-of-bounds reads are transparent, writes are ignored. */
export class Img {
           w        ;
           h        ;
           data             ;
  /** Light sources placed in this image; they travel with it through transforms and stamps. */
  lamps         ;
  /**
   * Per-pixel surface normals (nx, ny, nz) * 127, ny pointing down the image; nz = 0 = none
   * (lit flat). Set by bump() / normals(); travels with the pixels like lamps do.
   */
  norm            ;

  constructor(w        , h        , data              ) {
    w = Math.floor(w);
    h = Math.floor(h);
    if (!(w >= 1 && h >= 1)) throw new Error(`image size must be positive, got ${w}x${h}`);
    if (w * h > 16_777_216) throw new Error(`image too large: ${w}x${h}`);
    this.w = w;
    this.h = h;
    this.data = data ?? new Uint32Array(w * h);
  }

  inside(x        , y        )          {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x        , y        )        {
    x = Math.floor(x);
    y = Math.floor(y);
    return this.inside(x, y) ? this.data[y * this.w + x] : TRANSPARENT;
  }

  set(x        , y        , c       )       {
    x = Math.floor(x);
    y = Math.floor(y);
    if (this.inside(x, y)) this.data[y * this.w + x] = c;
  }

  copy()      {
    const o = new Img(this.w, this.h, this.data.slice());
    if (this.lamps) o.lamps = this.lamps.map((l) => ({ ...l }));
    if (this.norm) o.norm = this.norm.slice();
    return o;
  }

  /** Normal channel, allocated (all "none") on first use. */
  normals()            {
    return (this.norm ??= new Int8Array(this.w * this.h * 3));
  }

  /** Copy pixel i's normal from src pixel j, transforming its x/y (flip: sx/sy = -1, swap = rotate). */
          static moveNorm(src           , j        , dst           , i        , sx = 1, sy = 1, rot = 0)       {
    let nx = src[j * 3], ny = src[j * 3 + 1];
    if (rot === 90) [nx, ny] = [-ny, nx];
    else if (rot === 270) [nx, ny] = [ny, -nx];
    dst[i * 3] = nx * sx;
    dst[i * 3 + 1] = ny * sy;
    dst[i * 3 + 2] = src[j * 3 + 2];
  }

  /** Copy lamps into `o` through a position transform (dropping ones it maps outside). */
          moveLamps(o     , f                                            )      {
    if (!this.lamps?.length) return o;
    o.lamps = [];
    for (const l of this.lamps) {
      const [x, y] = f(l.x, l.y);
      if (o.inside(x, y)) o.lamps.push({ ...l, x, y });
    }
    return o;
  }

  fill(c       )       {
    this.data.fill(c);
    return this;
  }

  /** Draw src at (dx, dy); transparent source pixels are skipped. */
  blit(src     , dx        , dy        )       {
    dx = Math.floor(dx);
    dy = Math.floor(dy);
    for (let y = 0; y < src.h; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= this.h) continue;
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        const tx = dx + x;
        if (c === TRANSPARENT || tx < 0 || tx >= this.w) continue;
        const i = ty * this.w + tx;
        this.data[i] = c;
        // Normals come along; flat art drawn over a bumped surface clears it.
        if (src.norm) Img.moveNorm(src.norm, y * src.w + x, this.normals(), i);
        else if (this.norm) this.norm[i * 3 + 2] = 0;
      }
    }
  }

  flip(axis      )      {
    const o = new Img(this.w, this.h);
    const fx = axis.includes("x"), fy = axis.includes("y");
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const j = (fy ? this.h - 1 - y : y) * this.w + (fx ? this.w - 1 - x : x);
        o.data[y * this.w + x] = this.data[j];
        if (this.norm) Img.moveNorm(this.norm, j, o.normals(), y * this.w + x, fx ? -1 : 1, fy ? -1 : 1);
      }
    return this.moveLamps(o, (x, y) => [fx ? this.w - 1 - x : x, fy ? this.h - 1 - y : y]);
  }

  /** Clockwise rotation by a multiple of 90 degrees. */
  rot(deg        )      {
    const d = ((deg % 360) + 360) % 360;
    if (d === 0) return this.copy();
    if (d === 180) return this.flip("xy");
    if (d !== 90 && d !== 270) throw new Error(`rot must be a multiple of 90, got ${deg}`);
    const o = new Img(this.h, this.w);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.data[y * this.w + x];
        const [tx, ty] = d === 90 ? [this.h - 1 - y, x] : [y, this.w - 1 - x];
        o.set(tx, ty, c);
        if (this.norm) Img.moveNorm(this.norm, y * this.w + x, o.normals(), ty * o.w + tx, 1, 1, d);
      }
    return this.moveLamps(o, (x, y) => (d === 90 ? [this.h - 1 - y, x] : [y, this.w - 1 - x]));
  }

  /** Copy the left half onto the right ("x") or the top onto the bottom ("y"), in place. */
  mirror(axis           )       {
    const n = this.norm;
    if (axis === "x") {
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < Math.floor(this.w / 2); x++) {
          this.set(this.w - 1 - x, y, this.get(x, y));
          if (n) Img.moveNorm(n, y * this.w + x, n, y * this.w + this.w - 1 - x, -1, 1);
        }
    } else {
      for (let y = 0; y < Math.floor(this.h / 2); y++)
        for (let x = 0; x < this.w; x++) {
          this.set(x, this.h - 1 - y, this.get(x, y));
          if (n) Img.moveNorm(n, y * this.w + x, n, (this.h - 1 - y) * this.w + x, 1, -1);
        }
    }
    if (this.lamps) {
      const half = axis === "x" ? Math.floor(this.w / 2) : Math.floor(this.h / 2);
      for (const l of [...this.lamps]) {
        if (axis === "x" && l.x < half) this.lamps.push({ ...l, x: this.w - 1 - l.x });
        if (axis === "y" && l.y < half) this.lamps.push({ ...l, y: this.h - 1 - l.y });
      }
    }
  }

  /** Bounding box of opaque pixels, or undefined when empty. */
  bounds()                                                             {
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.data[y * this.w + x] !== TRANSPARENT) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          y1 = y;
        }
    return x1 < 0 ? undefined : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  sub(x        , y        , w        , h        )      {
    const o = new Img(w, h);
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        o.data[yy * w + xx] = this.get(x + xx, y + yy);
        if (this.norm && this.inside(x + xx, y + yy)) Img.moveNorm(this.norm, (y + yy) * this.w + x + xx, o.normals(), yy * w + xx);
      }
    return this.moveLamps(o, (lx, ly) => [lx - x, ly - y]);
  }

  crop()      {
    const b = this.bounds();
    return b ? this.sub(b.x, b.y, b.w, b.h) : this.copy();
  }

  pad(n        )      {
    const o = new Img(this.w + 2 * n, this.h + 2 * n);
    o.blit(this, n, n);
    return this.moveLamps(o, (x, y) => [x + n, y + n]);
  }

  /** 1px outline around opaque pixels; grows the canvas by 1 on every side. */
  outline(c       , diagonal = false)      {
    const src = this.pad(1);
    const o = src.copy();
    const op = (x        , y        ) => src.get(x, y) !== TRANSPARENT;
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        if (op(x, y)) continue;
        let hit = op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1);
        if (!hit && diagonal) hit = op(x - 1, y - 1) || op(x + 1, y - 1) || op(x - 1, y + 1) || op(x + 1, y + 1);
        if (hit) o.set(x, y, c);
      }
    return o;
  }

  /** Replace colors through a map. */
  remap(map                   )      {
    const o = this.copy();
    for (let i = 0; i < o.data.length; i++) {
      const to = map.get(o.data[i]);
      if (to !== undefined) o.data[i] = to;
    }
    return o;
  }

  /** Nearest-neighbour upscale. */
  scale(s        )      {
    if (s === 1) return this.copy();
    const o = new Img(this.w * s, this.h * s);
    for (let y = 0; y < o.h; y++) {
      const row = Math.floor(y / s) * this.w;
      for (let x = 0; x < o.w; x++) o.data[y * o.w + x] = this.data[row + Math.floor(x / s)];
    }
    return o;
  }

  /** FNV-1a over size + pixels, for change detection. */
  hash()         {
    let h = 0x811c9dc5 ^ this.w ^ (this.h << 16);
    for (let i = 0; i < this.data.length; i++) {
      h ^= this.data[i];
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
  }
}
