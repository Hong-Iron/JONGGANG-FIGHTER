                                      

/**
 * One painting step. Either `full` (first frame or size change) or `changes` as a flat
 * [index, color, index, color, ...] list against the previous frame.
 */
                        
                
               
            
            
                     
                        
 

/** Records the composite image after every painting step of one asset build. */
export class Trace {
  frames          = [];
  /** Steps that happened after `max` was reached (folded into the last frame). */
  dropped = 0;
          prev      ;
          max        ;

  constructor(max = 4000) {
    this.max = max;
  }

  record(label        , loc                    , img     )       {
    if (this.frames.length >= this.max - 1) {
      this.dropped++;
      this.pending = img;
      return;
    }
    this.push(label, loc, img);
  }

          pending      ;

  /** Make sure the last frame shows the final image. */
  finish(img     )       {
    if (this.pending || this.dropped) this.push(`… ${this.dropped} more steps`, undefined, this.pending ?? img);
    this.pending = undefined;
    const last = this.prev;
    if (!last || last.w !== img.w || last.h !== img.h || !sameData(last.data, img.data)) this.push("final", undefined, img);
  }

          push(label        , loc                    , img     )       {
    const prev = this.prev;
    if (!prev || prev.w !== img.w || prev.h !== img.h) {
      this.frames.push({ label, loc, w: img.w, h: img.h, full: img.data.slice() });
    } else {
      const ch           = [];
      const a = prev.data, b = img.data;
      for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) ch.push(i, b[i]);
      this.frames.push({ label, loc, w: img.w, h: img.h, changes: Uint32Array.from(ch) });
    }
    this.prev = img.copy();
  }
}

function sameData(a             , b             )          {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
