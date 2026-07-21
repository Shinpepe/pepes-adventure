'use strict';
/* [분할 01] 효과음 합성 + 공용 유틸 */
/* =====================================================================
   페페의모험 — 웹 버전
   원작: Python Arcade / 이 파일 하나로 동작하는 HTML5 포팅본
   ===================================================================== */

/* ---------- 화면 스케일 ---------- */
function fitStage() {
  const s = Math.min(window.innerWidth / 1000, window.innerHeight / 700);
  document.getElementById('scale-wrap').style.transform = 'scale(' + s + ')';
}
window.addEventListener('resize', fitStage); fitStage();

/* ---------- 안전한 저장소 (localStorage 실패 시 메모리) ---------- */
const memStore = {};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch(e) { return memStore[k] ?? null; } },
  set(k,v) { try { localStorage.setItem(k,v); } catch(e) { memStore[k] = v; } },
  del(k) { try { localStorage.removeItem(k); } catch(e) { delete memStore[k]; } }
};

/* ---------- 효과음 (WebAudio 합성) ---------- */
const SFX = {
  ctx: null, muted: false, volume: 0.5,
  ac() { if (!this.ctx) { try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } return this.ctx; },
  tone(freq, dur, type='square', vol=0.18, when=0, slide=0) {
    const ctx = this.ac(); if (!ctx || this.muted) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t+dur);
    g.gain.setValueAtTime(vol*this.volume*2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+dur+0.02);
  },
  noise(dur, vol=0.2, when=0) {
    const ctx = this.ac(); if (!ctx || this.muted) return;
    const t = ctx.currentTime + when;
    const buf = ctx.createBuffer(1, ctx.sampleRate*dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*(1-i/d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol*this.volume*2;
    src.connect(g); g.connect(ctx.destination); src.start(t);
  },
  click()  { this.tone(660, .06, 'square', .1); },
  attack() { this.noise(.12,.22); this.tone(180,.1,'sawtooth',.14,0,-120); },
  skill()  { this.tone(520,.1,'sawtooth',.16); this.tone(780,.14,'sawtooth',.16,.07); this.noise(.2,.15,.05); },
  hit()    { this.noise(.16,.26); this.tone(110,.16,'sawtooth',.2,0,-60); },
  coin()   { this.tone(988,.07,'square',.14); this.tone(1319,.18,'square',.14,.07); },
  slot()   { for(let i=0;i<10;i++) this.tone(440+Math.random()*300,.05,'square',.06,i*.09); },
  card()   { this.noise(.05,.12); },
  win()    { [523,659,784,1047].forEach((f,i)=>this.tone(f,.14,'square',.13,i*.11)); },
  lose()   { this.tone(330,.18,'sawtooth',.12); this.tone(233,.3,'sawtooth',.12,.16); }
};

