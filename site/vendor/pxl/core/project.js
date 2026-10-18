// Project: the registry an art file fills in, plus the lazy, cached, cycle-checked resolver.
import {                               buildAsset, gcd } from "./build.js";
import { OPS } from "./canvas.js";
import { PxError, didYouMean, wrap } from "./errors.js";
                                      
import {
                                                                                                               
                                                isLayer, isOp,
} from "./model.js";
import { Palette } from "./palette.js";
import { Trace } from "./trace.js";
import { globRe, rng } from "./util.js";

/**
 * Op signatures: name:type, "?" marks the first optional argument.
 * n number, c color, s string, t text (string|number), S colors ("abc" or array),
 * a point array, r region, o object, b boolean, I items (rest).
 */
export const SIGNATURES                         = {
  px: "x:n y:n c:c",
  rect: "x:n y:n w:n h:n c:c",
  box: "x:n y:n w:n h:n c:c",
  line: "x0:n y0:n x1:n y1:n c:c ?width:n",
  hline: "x:n y:n len:n c:c",
  vline: "x:n y:n len:n c:c",
  ellipse: "cx:n cy:n rx:n ry:n c:c ?ring:b",
  circ: "cx:n cy:n r:n c:c",
  ring: "cx:n cy:n r:n c:c",
  poly: "points:a c:c",
  fill: "x:n y:n c:c",
  dither: "x:n y:n w:n h:n c1:c c2:c ?density:n",
  grad: "x:n y:n w:n h:n colors:S ?dir:s soft:n",
  noise: "x:n y:n w:n h:n colors:S ?density:n seed:n on:s",
  recolor: "map:o ?where:r density:n",
  shade: "?where:r steps:n density:n",
  light: "?where:r steps:n density:n",
  stamp: "name:s ?x:n y:n opts:o",
  tile: "name:s x:n y:n ?cols:n rows:n opts:o",
  pattern: "name:s x:n y:n w:n h:n ?opts:o",
  tilemap: "map:s opts:o",
  scatter: "name:s x:n y:n w:n h:n count:n ?opts:o",
  grid: "x:n y:n str:s",
  wire: "x0:n y0:n x1:n y1:n sag:n c:c ?opts:o",
  text: "x:n y:n str:t c:c ?opts:o",
  clip: "where:r ...items:I",
  lamp: "x:n y:n ?opts:o",
  bump: "?shape:s opts:o",
  normals: "x:n y:n str:s",
  lighting: "?opts:o",
  glow: "keys:S ?opts:o",
};

/** Allowed option keys of ops whose last argument is an options object. */
const OP_OPTS                           = {
  lamp: ["r", "color", "power", "z"],
  bump: ["w", "depth", "on", "where"],
  lighting: ["cell", "ambient", "ambientColor", "sky", "skyColor", "skyReach", "block", "smooth", "emit", "shape", "relief", "skyDir"],
  glow: ["where", "r", "strength", "color", "bands", "ramp"],
};

const ASSET_OPTS                              = {
  sprite: ["w", "h", "base", "mx", "my", "swap", "flip", "rot", "outline", "outline8", "crop", "layers"],
  scene: ["w", "h", "bg", "mx", "my", "swap", "flip", "rot", "outline", "outline8", "crop", "layers"],
  anim: ["w", "h", "base", "mx", "my", "swap", "flip", "rot", "outline", "outline8", "crop", "layers", "fps", "frames", "loop"],
};
const FRAME_OPTS = ["ms", "hold"];
/** Longest loop a combined timeline may have (ms); longer ones are cut. */
const MAX_LOOP = 60000;
const LAYER_OPTS = ["x", "y", "hidden", "shade", "light", "density", "solid", "wall", "unlit"];
const SHEET_OPTS = ["cols", "pad"];

function checkArgs(name        , args           )       {
  const sig = SIGNATURES[name];
  if (!sig) return;
  let optional = false;
  sig.split(" ").forEach((part, i) => {
    if (part.startsWith("?")) { optional = true; part = part.slice(1); }
    const [pname, type] = part.split(":");
    if (pname.startsWith("...")) return;
    const v = args[i];
    if (v === undefined) {
      if (!optional) throw new PxError(`${name}: missing argument ${i + 1} (${pname}); usage: ${name}(${usage(sig)})`);
      return;
    }
    const bad = (want        ) => {
      throw new PxError(`${name}: argument ${i + 1} (${pname}) must be ${want}, got ${JSON.stringify(v) ?? typeof v}; usage: ${name}(${usage(sig)})`);
    };
    switch (type) {
      case "n": if (typeof v !== "number" || !Number.isFinite(v)) bad("a number"); break;
      case "c": if (typeof v !== "string") bad('a color key or "#hex"'); break;
      case "s": if (typeof v !== "string") bad("a string"); break;
      case "t": if (typeof v !== "string" && typeof v !== "number") bad("text"); break;
      case "S": if (typeof v !== "string" && !Array.isArray(v)) bad('colors like "abc" or ["a","b"]'); break;
      case "a": if (!Array.isArray(v)) bad("an array of numbers"); break;
      case "o": if (typeof v !== "object" || v === null || Array.isArray(v)) bad("an options object"); break;
      case "b": if (typeof v !== "boolean") bad("true/false"); break;
    }
  });
}

function usage(sig        )         {
  return sig.split(" ").map((p) => p.replace(/:.*/, "").replace(/^\?/, "[")).join(", ") + (sig.includes("?") ? "]" : "");
}

function checkKeys(what        , obj        , allowed          , loc         )       {
  for (const k of Object.keys(obj))
    if (!allowed.includes(k)) throw new PxError(`${what}: unknown option '${k}'${didYouMean(k, allowed)} (allowed: ${allowed.join(", ")})`, loc);
}

function isPlainObject(v         )                               {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !isOp(v) && !isLayer(v);
}

function checkItems(where        , items           , loc         )         {
  items.forEach((v, i) => {
    const ok = typeof v === "string" || typeof v === "function" || isOp(v) || isLayer(v);
    if (!ok) {
      const what = Array.isArray(v) ? "an array (use ...spread)" : v === undefined ? "undefined (missing comma or op name?)" : `a ${typeof v}`;
      throw new PxError(`${where}: item ${i + 1} is ${what}; items are grid strings, ops, functions or layers`, loc);
    }
  });
  return items          ;
}

                                 
                                                                
                  
 

export class Project                     {
           assets = new Map                  ();
           order           = [];
           groups = new Map                  ();
           sheets             = [];
  /** Art files loaded so far (absolute paths or virtual names), for locations and watching. */
           files           = [];
  pal          = Palette.builtin("pico8");
  /** Set by a loader to support include(). */
  includeHook                         ;

          cache = new Map                  ();
  /** Timelines gathered from animated assets placed by the builds in progress (innermost last). */
          collect                      = [];
          building = new Set        ();
          cands = new Map                  ();
          failed = new Map                 ();
          tracing         ;

  constructor(opts                 = {}) {
    this.tracing = !!opts.trace;
  }

  // ---------------------------------------------------------------- locations

  addFile(file        )       {
    if (!this.files.includes(file)) this.files.push(file);
  }

  locFromStack(stack        )                     {
    for (const line of stack.split("\n")) {
      for (const f of this.files) {
        const i = line.indexOf(f + ":");
        if (i < 0) continue;
        const m = /^:(\d+):(\d+)/.exec(line.slice(i + f.length));
        if (m) return `${shortName(f)}:${m[1]}:${m[2]}`;
      }
    }
    return undefined;
  }

  callerLoc()                     {
    const limit = Error.stackTraceLimit;
    Error.stackTraceLimit = 60;
    const stack = new Error().stack ?? "";
    Error.stackTraceLimit = limit;
    return this.locFromStack(stack);
  }

  // ---------------------------------------------------------------- DSL

  /** Functions visible to art files. */
  env()                          {
    const env                          = {};
    const define = (kind           , name         , rest           ) => {
      const loc = this.callerLoc();
      if (typeof name !== "string" || !name) throw new PxError(`${kind} needs a name string first`, loc);
      const prev = this.assets.get(name) ?? this.groups.get(name);
      if (prev) throw new PxError(`'${name}' is already defined at ${prev.loc}`, loc);
      const opts = (isPlainObject(rest[0]) ? rest.shift() : {})             ;
      checkKeys(`${kind} '${name}'`, opts, ASSET_OPTS[kind], loc);
      const items = checkItems(`${kind} '${name}'`, rest, loc);
      this.assets.set(name, { kind, name, opts, items, pal: this.pal, loc });
      this.order.push(name);
    };

    env.use = (p         ) => {
      if (Array.isArray(p)) this.pal = Palette.fromColors(p                       );
      else if (typeof p === "string") this.pal = Palette.builtin(p);
      else throw new PxError('use("pico8") or use(["#000", "#fff", ...])', this.callerLoc());
    };
    env.pal = (aliases                                 ) => {
      try { this.pal = this.pal.extend(aliases); } catch (e) { throw wrap(e).within("pal", this.callerLoc()); }
    };
    env.ramps = (...ramps          ) => {
      try { this.pal = this.pal.withRamps(ramps); } catch (e) { throw wrap(e).within("ramps", this.callerLoc()); }
    };
    env.sprite = (name         , ...rest           ) => define("sprite", name, rest);
    env.anim = (name         , ...rest           ) => define("anim", name, rest);
    env.frame = (...args           )     => {
      const loc = this.callerLoc();
      if (isPlainObject(args[0])) checkKeys("frame", args[0], FRAME_OPTS, loc);
      checkItems("frame", isPlainObject(args[0]) ? args.slice(1) : args, loc);
      return { __op: true, name: "frame", args, loc };
    };
    env.scene = (name         , ...rest           ) => define("scene", name, rest);
    env.layer = (name         , ...rest           )        => {
      const loc = this.callerLoc();
      if (typeof name !== "string") throw new PxError("layer needs a name string first", loc);
      const opts = (isPlainObject(rest[0]) ? rest.shift() : {})             ;
      checkKeys(`layer '${name}'`, opts, LAYER_OPTS, loc);
      return { __layer: true, name, opts, items: checkItems(`layer '${name}'`, rest, loc), loc };
    };
    env.group = (name         , members         ) => {
      const loc = this.callerLoc();
      if (typeof name !== "string" || !Array.isArray(members) || !members.every((m) => typeof m === "string"))
        throw new PxError('group("name", ["a", "b*", ...])', loc);
      const prev = this.assets.get(name) ?? this.groups.get(name);
      if (prev) throw new PxError(`'${name}' is already defined at ${prev.loc}`, loc);
      this.groups.set(name, { name, members, loc });
    };
    env.sheet = (name         , entries         , opts            = {}) => {
      const loc = this.callerLoc();
      if (typeof name !== "string" || !Array.isArray(entries)) throw new PxError('sheet("name", ["a", "b*"], { cols, pad })', loc);
      checkKeys(`sheet '${name}'`, opts, SHEET_OPTS, loc);
      this.sheets.push({ name, entries, opts, loc });
    };
    env.include = (path         ) => {
      if (typeof path !== "string") throw new PxError('include("other.px.js")', this.callerLoc());
      if (!this.includeHook) throw new PxError("include() is not available here", this.callerLoc());
      this.includeHook(path);
    };
    env.rng = (seed         ) => rng(seed);

    for (const name of [...OPS, "clip", "lighting", "glow"]) {
      env[name] = (...args           )     => {
        const loc = this.callerLoc();
        try {
          checkArgs(name, args);
          const o = args[args.length - 1];
          if (OP_OPTS[name] && isPlainObject(o)) checkKeys(name, o, OP_OPTS[name]);
        } catch (e) { throw wrap(e).within(name, loc); }
        if (name === "clip") checkItems("clip", args.slice(1), loc);
        return { __op: true, name, args, loc };
      };
    }
    return env;
  }

  // ---------------------------------------------------------------- resolving

  candidates(name        , depth = 0)           {
    const hit = this.cands.get(name);
    if (hit) return hit;
    if (typeof name !== "string") throw new PxError(`asset name must be a string, got ${typeof name}`);
    if (depth > 8) throw new PxError(`group nesting too deep at '${name}'`);
    let list           = [];
    const g = this.groups.get(name);
    if (g) for (const m of g.members) list.push(...this.candidates(m, depth + 1));
    else if (name.includes("*")) {
      const re = globRe(name);
      list = this.order.filter((n) => re.test(n));
    } else list = [name];
    if (!list.length) throw new PxError(`'${name}' matches no assets`);
    this.cands.set(name, list);
    return list;
  }

  image(name        , seed = 0, t = 0, track = true)      {
    return this.build(name, seed, t, track).img;
  }

  timeline(name        , seed = 0)                       {
    return this.build(name, seed, 0, false).anim;
  }

  /**
   * Build an asset at time t (ms). Still assets ignore t. Unless `track` is false, an animated
   * result makes the asset being built around this call animated too.
   */
  build(name        , seed = 0, t = 0, track = true)           {
    const first = this.buildAt(name, seed, 0);
    const tl = first.anim;
    if (tl && track && this.collect.length) {
      const acc = this.collect[this.collect.length - 1];
      acc.loop = acc.loop ? Math.min(MAX_LOOP, lcm(acc.loop, tl.loop)) : tl.loop;
      acc.step = acc.step ? gcd(acc.step, tl.step) : tl.step;
    }
    if (!tl || t === 0) return first;
    const tt = tl.once ? Math.min(Math.max(0, t), tl.loop) : ((t % tl.loop) + tl.loop) % tl.loop;
    return tt === 0 ? first : this.buildAt(name, seed, tt);
  }

  /** One full loop of an animated asset as [{ img, ms }]; [] for still assets. */
  frames(name        , seed = 0, max = 600)                             {
    const tl = this.build(name, seed).anim;
    if (!tl) return [];
    if (tl.durations) {
      let t = 0;
      return tl.durations.map((ms) => {
        const f = { img: this.build(name, seed, t).img, ms };
        t += ms;
        return f;
      });
    }
    const n = Math.max(1, Math.min(max, Math.round(tl.loop / tl.step)));
    return Array.from({ length: n }, (_, i) => ({ img: this.build(name, seed, i * tl.step).img, ms: tl.step }));
  }

          buildAt(name        , seed        , t        )           {
    const key = (seed === 0 ? name : `${name}@${seed}`) + (t ? `#${t}` : "");
    const hit = this.cache.get(key);
    if (hit) return hit;
    const def = this.assets.get(name);
    if (!def) {
      if (this.groups.has(name) || name.includes("*"))
        throw new PxError(`'${name}' is a group/glob: use it in stamp, tile, pattern, tilemap, scatter or wire hang`);
      throw new PxError(`unknown asset '${name}'${didYouMean(name, this.order)}`);
    }
    const failed = this.failed.get(key);
    if (failed) throw new PxError(`depends on '${name}', which failed`);
    if (this.building.has(name)) throw new PxError(`reference cycle through '${name}'`);
    this.building.add(name);
    const acc                    = {};
    this.collect.push(acc);
    try {
      const out = buildAsset(this, def, seed, this.tracing && seed === 0 && t === 0 ? new Trace() : undefined, t);
      // Anims keep their own frame timing; other assets are as animated as what they place.
      if (!out.anim && acc.loop) out.anim = { loop: acc.loop, step: acc.step  };
      this.cache.set(key, out);
      return out;
    } catch (e) {
      const err = wrap(e, (s) => this.locFromStack(s)).within(`${def.kind} '${name}'`, def.loc);
      this.failed.set(key, err);
      throw err;
    } finally {
      this.collect.pop();
      this.building.delete(name);
    }
  }

  /** Exported asset names (no "_" prefix), in definition order. */
  exported()           {
    return this.order.filter((n) => !n.startsWith("_"));
  }

  /** Expand a sheet's entries: globs match exported names, groups expand to members. */
  sheetNames(s          )           {
    const out           = [];
    const add = (n        ) => { if (!out.includes(n)) out.push(n); };
    for (const e of s.entries) {
      if (e.includes("*")) {
        const re = globRe(e);
        this.exported().filter((n) => re.test(n)).forEach(add);
      } else if (this.groups.has(e)) this.candidates(e).forEach(add);
      else add(e);
    }
    return out;
  }
}

function lcm(a        , b        )         {
  return (a / gcd(a, b)) * b;
}

function shortName(f        )         {
  return f.replace(/^.*[\\/]/, "");
}
