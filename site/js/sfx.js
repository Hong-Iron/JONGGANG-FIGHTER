// 효과음: 파일 없이 WebAudio로 합성한다. 첫 입력 때 켠다(브라우저 자동재생 규칙).
let ac = null, master = null, muted = false
try { muted = localStorage.getItem("jg-mute") === "1" } catch {}

export function unlock() {
  if (ac) { if (ac.state === "suspended") ac.resume(); return }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination)
}
export function setMuted(m) { muted = m; try { localStorage.setItem("jg-mute", m ? "1" : "0") } catch {} ; if (master) master.gain.value = m ? 0 : 0.5 }
export function isMuted() { return muted }

function noise(dur) {
  const b = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate), d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const s = ac.createBufferSource(); s.buffer = b; return s
}
function env(node, t, a, peak, dec) {
  const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec)
  node.connect(g); g.connect(master); return g
}
function tone(type, f0, f1, t, dur, peak = 0.3) {
  const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  env(o, t, 0.003, peak, dur); o.start(t); o.stop(t + dur + 0.05)
}
function burst(t, dur, freq, q, peak) {
  const n = noise(dur + 0.02), f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q
  n.connect(f); env(f, t, 0.001, peak, dur); n.start(t); n.stop(t + dur + 0.02)
}

const S = {
  // 청축 타건음: 높은 딸깍 + 짧은 바닥 소리
  key() { const t = ac.currentTime, p = 0.9 + Math.random() * 0.2; burst(t, 0.012, 4200 * p, 3, 0.5); tone("square", 2400 * p, 1800 * p, t, 0.012, 0.08); burst(t + 0.018, 0.03, 900, 1.5, 0.25) },
  hitProf() { const t = ac.currentTime; tone("triangle", 180, 70, t, 0.12, 0.35); burst(t, 0.06, 1800, 1, 0.3) },
  crit() { const t = ac.currentTime; tone("square", 880, 1320, t, 0.08, 0.15); tone("square", 1320, 1760, t + 0.06, 0.1, 0.12) },
  laser() { const t = ac.currentTime; tone("sawtooth", 600, 1400, t, 0.18, 0.06) },
  hurt() { const t = ac.currentTime; tone("sawtooth", 220, 60, t, 0.25, 0.3); burst(t, 0.12, 600, 0.8, 0.4) },
  parry() { const t = ac.currentTime; for (const f of [1568, 2349, 3136]) tone("triangle", f, f * 0.98, t, 0.35, 0.12); burst(t, 0.02, 6000, 2, 0.4) },
  early() { const t = ac.currentTime; tone("square", 300, 200, t, 0.08, 0.1) },
  stamp() { const t = ac.currentTime; tone("sine", 120, 45, t, 0.3, 0.6); burst(t, 0.08, 400, 0.7, 0.5) },
  skill() { const t = ac.currentTime; for (let i = 0; i < 4; i++) tone("square", 523 * (1 + i * 0.25), 523 * (1 + i * 0.25), t + i * 0.04, 0.06, 0.08) },
  gulp() { const t = ac.currentTime; for (let i = 0; i < 3; i++) tone("sine", 300 - i * 40, 160, t + i * 0.12, 0.09, 0.25); burst(t + 0.38, 0.1, 3000, 0.5, 0.12) },
  push() { const t = ac.currentTime; tone("sawtooth", 80, 40, t, 0.6, 0.4); burst(t, 0.5, 1200, 0.4, 0.4); tone("square", 220, 880, t, 0.4, 0.1) },
  alarm() { const t = ac.currentTime; tone("square", 1046, 1046, t, 0.07, 0.07) },
  win() { const t = ac.currentTime; [523, 659, 784, 1046].forEach((f, i) => tone("square", f, f, t + i * 0.11, 0.18, 0.12)) },
  lose() { const t = ac.currentTime; [392, 330, 262, 196].forEach((f, i) => tone("triangle", f, f * 0.97, t + i * 0.18, 0.3, 0.2)) },
}
export function sfx(name) { if (!ac || muted) return; try { S[name]() } catch {} }
