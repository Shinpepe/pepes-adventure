'use strict';
/* [분할 02] 에셋 로더 (이미지/BGM/프리로드) */
/* =====================================================================
   외부 에셋 연동 — assets/ 폴더에 파일이 있으면 사용, 없으면 이모지/합성음 폴백
   (깃허브 페이지 등에서 이 HTML 옆에 assets/ 폴더를 두면 자동 적용)
   ===================================================================== */
const ASSET_BASE = 'assets/';
function aimg(path, emoji, size, extraStyle='', imgScale=1.5) {
  if (!path) return `<span style="font-size:${size}px;line-height:1;${extraStyle}">${emoji}</span>`;
  const mw = Math.round(size*imgScale);
  return `<span style="position:relative;display:inline-block;line-height:1;${extraStyle}">`+
    `<span style="font-size:${size}px;visibility:hidden">${emoji}</span>`+
    `<img src="${ASSET_BASE}${path}" alt="" draggable="false" `+
      `style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:${mw}px;max-height:${mw}px;pointer-events:none" `+
      `onerror="this.previousElementSibling.style.visibility='visible';this.remove()">`+
  `</span>`;
}

/* ---- 이미지 프리로드 (표시 지연 방지) ---- */
const PRELOADED = new Map(); /* 디코드된 이미지 참조 유지 → 표시 시 즉시 페인트 */
function preloadList(files) {
  files.forEach(f => {
    if (PRELOADED.has(f)) return;
    const im = new Image();
    im.src = ASSET_BASE + f;
    PRELOADED.set(f, im);
    if (im.decode) im.decode().catch(()=>{});
  });
}
function preloadImages() {
  if (typeof Image === 'undefined') return;
  /* 1순위: 마을 진입 직후 바로 보이는 것들 (NPC, 아이템, 훈장) */
  const first = [];
  ['npc_host','npc_merchant','npc_chef'].forEach(b=>['','_man'].forEach(g=>{
    first.push(`${b}${g}.webp`);
  }));
  ITEMS.forEach(i=>first.push(i.img));
  FOODS.forEach(f=>first.push(f.img));
  MEDALS.forEach(m=>first.push(m.img));
  first.push('medal_none.webp','world_map.webp');
  preloadList(first);
  /* 2순위: 전투·이벤트 관련 (1.2초 뒤) */
  setTimeout(()=>{
    const second = [];
    MONSTERS.forEach(m=>{ second.push(m.img); if (m.boss) second.push(m.img.replace('.webp','_shadow.webp')); });
    second.push('gold.webp','event_cat.webp','skill.webp','monster/chest.webp','monster/mimic.webp','monster/treasure.webp');
    ['npc_host','npc_merchant','npc_chef'].forEach(b=>['','_man'].forEach(g=>second.push(`${b}${g}_date.png`)));
    SLOT_SYMBOLS.forEach(x=>second.push(x.img));
    preloadList(second);
  }, 1200);
}
/* 모든 스크립트 로드 후 실행 (분할 파일 환경에서도 안전) */
if (typeof document !== 'undefined' && document.addEventListener) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preloadImages);
  else setTimeout(preloadImages, 0);
}

/* ---- 배경 이미지: 파일이 존재하면 CSS 클래스에 덮어씀 ---- */
const BG_ASSETS = {
  'bg-town':'town_bg.webp',      'bg-cross':'crossroads_bg.webp',
  'bg-forest':'forest_bg.webp',  'bg-desert':'desert_bg.webp',
  'bg-swamp':'swamp_bg.webp',    'bg-mountain':'mountain_bg.webp',
  'bg-casino':'casino_bg.webp',  'bg-shop':'shop_bg.webp',
  'bg-inn':'inn_bg.webp',        'bg-rest':'rest_bg.webp',
  'bg-const':'const_bg.webp',    'bg-event':'event_bg.webp',
  'bg-set':'set_bg.webp',        'bg-medal':'medal_bg.webp',
  'bg-festival':'village_festival.webp'
};
(function probeBackgrounds() {
  if (typeof Image === 'undefined' || typeof document === 'undefined' || !document.head) return;
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  for (const [cls, file] of Object.entries(BG_ASSETS)) {
    const im = new Image();
    im.onload = () => {
      try { styleEl.sheet.insertRule(
        `.${cls}{background:url('${ASSET_BASE}${file}') center/cover no-repeat !important}`); } catch(e){}
    };
    im.src = ASSET_BASE + file;
  }
})();

/* ---- 효과음 파일 (있으면 wav 사용, 없으면 합성음) ---- */
const SFX_FILES = { click:'sound/button.wav', attack:'sound/attack.wav', skill:'sound/skill.wav',
                    hit:'sound/hit.wav', coin:'sound/coin.wav', slot:'sound/slot.wav', card:'sound/card.wav' };
const sfxAudio = {};
if (typeof Audio !== 'undefined') {
  for (const [k, f] of Object.entries(SFX_FILES)) {
    const a = new Audio(ASSET_BASE + f);
    a.addEventListener('canplaythrough', ()=>{ sfxAudio[k] = a; }, { once:true });
    a.onerror = ()=>{};
  }
  for (const k of Object.keys(SFX_FILES)) {
    const synth = SFX[k].bind(SFX);
    SFX[k] = function() {
      if (SFX.muted) return;
      const base = sfxAudio[k];
      if (base) { const c = base.cloneNode(); c.volume = Math.min(1, SFX.volume*1.5); c.play().catch(()=>{}); }
      else synth();
    };
  }
}

/* ---- 배경음악 (assets/sound/*.mp3, 없으면 무음) ---- */
const BGM = {
  cur:null, key:null, volume:0.4, muted:false, unlocked:false,
  files:{ game:'sound/game_bgm.mp3', set:'sound/set_bgm.mp3', adventure:'sound/adventure_bgm.mp3',
          battle:'sound/battle_bgm.mp3', casino:'sound/casino_bgm.mp3', event:'sound/event_bgm.mp3',
          medal:'sound/medal_bgm.mp3', rest:'sound/rest_bgm.mp3', cafe:'sound/cafe_bgm.mp3',
          fail:'sound/fail_bgm.mp3' },
  play(key) {
    if (typeof Audio === 'undefined') return;
    if (this.key === key) return;
    this.key = key;
    if (this.cur) { this.cur.pause(); this.cur = null; }
    if (this.muted || !this.files[key]) return;
    const a = new Audio(ASSET_BASE + this.files[key]);
    a.loop = true; a.volume = this.volume;
    a.onerror = ()=>{ if (this.cur === a) this.cur = null; };
    this.cur = a;
    if (this.unlocked) a.play().catch(()=>{});
  },
  unlock() { this.unlocked = true; if (this.cur && this.cur.paused) this.cur.play().catch(()=>{}); },
  setMuted(m) { this.muted = m; if (m && this.cur) { this.cur.pause(); this.cur = null; const k=this.key; this.key=null; if(!m) this.play(k); } else if (!m) { const k=this.key; this.key=null; this.play(k); } },
  setVol(v) { this.volume = v; if (this.cur) this.cur.volume = v; }
};
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('pointerdown', ()=>BGM.unlock());
  document.addEventListener('keydown', ()=>BGM.unlock());
}
/* 사운드 설정 저장/복원 */
function saveSoundPrefs() {
  try { store.set('pepe_sound', JSON.stringify({ sv:SFX.volume, sm:SFX.muted, bv:BGM.volume, bm:BGM.muted })); } catch(e){}
}
(function loadSoundPrefs() {
  try {
    const raw = store.get('pepe_sound'); if (!raw) return;
    const p = JSON.parse(raw);
    if (typeof p.sv==='number') SFX.volume = p.sv;
    if (typeof p.sm==='boolean') SFX.muted = p.sm;
    if (typeof p.bv==='number') BGM.volume = p.bv;
    if (typeof p.bm==='boolean') BGM.muted = p.bm;
  } catch(e){}
})();

