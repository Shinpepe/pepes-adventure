'use strict';
/* [분할 05] 뷰 공통 (사이드바/로그/다이얼로그) */
/* =====================================================================
   뷰 시스템
   ===================================================================== */
const screenEl = document.getElementById('screen');
let currentKeyHandler = null;
let viewTimers = [];
function later(fn, ms) { const t = setTimeout(fn, ms); viewTimers.push(t); return t; }
function everyT(fn, ms) { const t = setInterval(fn, ms); viewTimers.push(t); return t; }
function clearView() {
  if (screenEl) { screenEl.classList.remove('view-fade'); void screenEl.offsetWidth; screenEl.classList.add('view-fade'); }
  viewTimers.forEach(t=>{ clearTimeout(t); clearInterval(t); });
  viewTimers = [];
  currentKeyHandler = null;
  screenEl.innerHTML = '';
}
document.addEventListener('keydown', e => {
  if (currentKeyHandler) currentKeyHandler(e);
});
function esc(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmt(n){ return Number(n).toLocaleString('ko-KR'); }

/* ---------- 공통 프레임 (사이드바 + 로그) ---------- */
function playerHitFx() {
  const v = document.createElement('div'); v.className = 'vignette-red';
  screenEl.appendChild(v); setTimeout(()=>v.remove(), 600);
  const gw = document.querySelector('.sidebar .gauge-wrap');
  if (gw) {
    gw.classList.remove('hit'); void gw.offsetWidth; gw.classList.add('hit');
    const gf = gw.querySelector('.gauge-fill');
    if (gf) { gf.classList.add('hitflash'); setTimeout(()=>gf.classList.remove('hitflash'), 120); }
  }
}

let _prevGold = null, _prevExp = null, _prevLv = null, _goldAnim = null;
function sidebarHTML() {
  const s = engine.state;
  if (_prevGold === null) { _prevGold = s.gold; _prevExp = s.exp; _prevLv = s.level; }
  const atk = engine.getTotalAtk();
  const hpRatio = Math.max(0, s.hp / s.max_hp) * 100;
  const needed = engine.neededExp();
  const expRatio = Math.min(1, s.exp / Math.max(1, needed)) * 100;
  const hpColor = (s.hp / s.max_hp) <= 0.3 ? '#c85050' : '#50c850';
  const best = engine.getBestItem();
  let inv = '비어 있음';
  if (s.inventory.length) {
    inv = s.inventory.map(n=>`<div>${esc(n)}${n===best?' (장착중)':''}</div>`).join('');
  }
  return `<div class="sidebar">
    <h2>${esc(s.player_name)||'&nbsp;'}</h2>
    <div class="title-line">Lv.${fmt(s.level)} ${esc(s.equipped_title)}</div>
    <div class="gauge-wrap">
      <div class="gauge-bg"><div class="gauge-fill ${(s.hp/s.max_hp)<=0.3?'low':''}" style="width:${hpRatio}%;background:${hpColor}"></div></div>
      <div class="gauge-label">HP : ${fmt(Math.max(0,Math.floor(s.hp)))} / ${fmt(s.max_hp)}</div>
    </div>
    <div class="gauge-wrap">
      <div class="gauge-bg" style="height:12px"><div class="gauge-fill" style="width:${expRatio}%;background:#c8c832"></div></div>
      <div class="gauge-label">EXP : ${fmt(s.exp)} / ${fmt(needed)}</div>
    </div>
    <div class="stats-box">
      <div>ATK : ${fmt(atk.total)}</div>
      <div class="sub">(기본 : ${fmt(atk.base)} + 장비 : ${fmt(atk.bonus)})</div>
      <div style="margin-top:8px" id="sb-gold-row">Gold : <span id="sb-gold-v">${fmt(s.gold)}</span></div>
      <div style="margin-top:8px">Kills : ${fmt(totalKills(s))}</div>
    </div>
    <div class="inv-title">인벤토리</div>
    <div class="inv-list">${inv}</div>
  </div>`;
}
function classifyLog(l) {
  if (l.startsWith('---') || l.startsWith('SYSTEM') || l.startsWith('[SYSTEM')) return 'lg-sys';
  if (/(레벨업|칭호|배웠|해금|개방|훈장|격파)/.test(l)) return 'lg-lvl';
  if (/(피해|부족|실패|꽝|사망|쓰러졌|폴드|패배)/.test(l)) return 'lg-bad';
  if (/(Gold|골드|획득|당첨|승리|회복|증가)/.test(l)) return 'lg-gain';
  return '';
}
function logLinesHTML() {
  return engine.state.log.slice().reverse().map(l=>`<div class="${classifyLog(l)}">${esc(l)}</div>`).join('');
}
function logHTML() {
  return `<div class="logwin" id="logwin">${logLinesHTML()}</div>`;
}
function refreshLog() {
  const el = document.getElementById('logwin');
  if (!el) return;
  const wasScrolled = el.scrollTop > 6;
  const prevH = el.scrollHeight, prevTop = el.scrollTop;
  el.innerHTML = logLinesHTML();
  /* 최신(위)을 보고 있었으면 그대로, 과거를 읽는 중이면 위치 유지 */
  el.scrollTop = wasScrolled ? prevTop + (el.scrollHeight - prevH) : 0;
}
function stagePos(el) {
  /* 화면 스케일을 역산해 스테이지 좌표(1000x700)로 변환 */
  const wrap = document.getElementById('scale-wrap');
  const wr = wrap.getBoundingClientRect();
  const scale = wr.width / 1000;
  const r = el.getBoundingClientRect();
  return { x:(r.left - wr.left)/scale, y:(r.top - wr.top)/scale, w:r.width/scale };
}
function spawnStatFloat(anchorEl, text, color) {
  if (!anchorEl || !screenEl) return;
  const p = stagePos(anchorEl);
  const f = document.createElement('div');
  f.className = 'stat-float';
  f.textContent = text;
  f.style.cssText += `;left:${Math.round(p.x + p.w + 10)}px;top:${Math.round(p.y - 2)}px;color:${color}`;
  screenEl.appendChild(f);
  setTimeout(()=>f.remove(), 1100);
}
function animateGoldCount(from, to) {
  const el = document.getElementById('sb-gold-v');
  if (!el) return;
  if (_goldAnim) cancelAnimationFrame(_goldAnim);
  const D = 450, t0 = performance.now();
  const step = now => {
    const t = Math.min(1, (now - t0) / D);
    const e = 1 - Math.pow(1 - t, 3); /* easeOutCubic — 큰 수도 동일 시간에 수렴 */
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (t < 1) _goldAnim = requestAnimationFrame(step);
    else _goldAnim = null;
  };
  _goldAnim = requestAnimationFrame(step);
}
function refreshSidebar() {
  const s = engine.state;
  const pg = _prevGold, pe = _prevExp, pl = _prevLv;
  const old = screenEl.querySelector('.sidebar');
  if (old) { old.outerHTML = sidebarHTML(); }
  const goldRow = document.getElementById('sb-gold-row');
  if (old && pg !== null && s.gold !== pg) {
    const d = s.gold - pg;
    spawnStatFloat(goldRow, (d>0?'+':'') + fmt(d), d>0 ? '#ffd76a' : '#ff9d94');
    animateGoldCount(pg, s.gold);
  }
  if (old && pe !== null && pl === s.level && s.exp > pe) {
    const gauges = screenEl.querySelectorAll('.sidebar .gauge-wrap');
    spawnStatFloat(gauges[1], '+' + fmt(s.exp - pe) + ' EXP', '#74c0fc');
  }
  _prevGold = s.gold; _prevExp = s.exp; _prevLv = s.level;
}

