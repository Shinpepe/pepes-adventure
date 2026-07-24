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

/* ---------- 단축키 키캡 자동 분리 ----------
   버튼 텍스트 끝의 "(Z)" "(SPACE)" 등을 오른쪽 키캡 배지로 변환.
   화면이 다시 그려질 때마다 자동 적용되므로 각 뷰 코드는 수정 불필요. */
const KBD_RE = /\((SPACE|ENTER|ESC|[A-Z])\)\s*$/;
function decorateKeycaps() {
  document.querySelectorAll('#stage .btn').forEach(b => {
    if (b.querySelector('.kbd')) return;                       /* 이미 처리됨 */
    const m = b.textContent.match(KBD_RE);
    if (!m) return;
    const tn = [...b.childNodes].reverse()
      .find(n => n.nodeType === 3 && KBD_RE.test(n.textContent));
    if (!tn) return;
    tn.textContent = tn.textContent.replace(KBD_RE, '').replace(/\s+$/, '');
    const k = document.createElement('span');
    k.className = 'kbd'; k.textContent = m[1];
    b.appendChild(k); b.classList.add('haskey');
  });
}
new MutationObserver(decorateKeycaps)
  .observe(document.getElementById('stage'), { childList:true, subtree:true });
function esc(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmt(n){ return Number(n).toLocaleString('ko-KR'); }

/* ---------- 공통 프레임 (사이드바 + 로그) ---------- */
const ENH_COLORS = ['', '#6ecc6e', '#5ca0e8', '#b45ce0', '#ffd700', '#ff5050'];
function enhTag(name) {
  const lv = engine.enhLevel(name);
  if (!lv) return esc(name);
  return `<span style="color:${ENH_COLORS[lv]}">${esc(name)} +${lv}</span>`;
}
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

let _prevGold = null, _prevExp = null, _prevLv = null, _goldAnim = null, _prevHpR = null;
function invSlotsHTML() {
  const s = engine.state;
  const best = engine.getBestItem();
  const n = Math.max(4, Math.ceil(s.inventory.length / 4) * 4);   /* 4칸 단위로 채움 */
  let out = '';
  for (let i = 0; i < n; i++) {
    const name = s.inventory[i];
    if (!name) { out += `<div class="slot"></div>`; continue; }
    const it = ITEMS.find(x => x.name === name);
    const enh = engine.enhLevel(name);
    out += `<div class="slot ${name === best ? 'equipped' : ''}" title="${esc(name)}${enh ? ' +' + enh : ''}">
      ${it ? aimg(it.img, it.emoji, 24, '', 1.35) : '❔'}
      ${enh ? `<span class="enh">+${enh}</span>` : ''}
    </div>`;
  }
  return out;
}
function sidebarHTML() {
  const s = engine.state;
  if (_prevGold === null) { _prevGold = s.gold; _prevExp = s.exp; _prevLv = s.level; }
  const atk = engine.getTotalAtk();
  const hpRatio = Math.max(0, s.hp / s.max_hp) * 100;
  const needed = engine.neededExp();
  const expRatio = Math.min(1, s.exp / Math.max(1, needed)) * 100;
  const hpColor = (s.hp / s.max_hp) <= 0.3 ? '#c85050' : '#50c850';
  return `<div class="sidebar">
    <h2>${esc(s.player_name)||'&nbsp;'}<small>Lv.${fmt(s.level)}</small></h2>
    <span class="title-chip">${esc(s.equipped_title)}</span>
    <div class="gauge-wrap">
      <div class="gauge-cap"><b>HP</b><span>${fmt(Math.max(0,Math.floor(s.hp)))} / ${fmt(s.max_hp)}</span></div>
      <div class="gauge-bg">
        <div class="gauge-ghost" style="width:${hpRatio}%"></div>
        <div class="gauge-fill ${(s.hp/s.max_hp)<=0.3?'low':''}" style="width:${hpRatio}%;background:${hpColor}"></div>
        <div class="gauge-ticks"></div>
      </div>
    </div>
    <div class="gauge-wrap">
      <div class="gauge-cap"><b>EXP</b><span>${fmt(s.exp)} / ${fmt(needed)}</span></div>
      <div class="gauge-bg" style="height:10px">
        <div class="gauge-fill" style="width:${expRatio}%;background:#c8c832"></div>
        <div class="gauge-ticks"></div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="row"><span class="k">공격력</span><span class="v">${fmt(atk.total)} <small>(${fmt(atk.base)}+${fmt(atk.bonus)})</small></span></div>
      <div class="row"><span class="k">골드</span><span class="v" id="sb-gold-row"><span id="sb-gold-v">${fmt(s.gold)}</span></span></div>
      <div class="row"><span class="k">처치</span><span class="v">${fmt(totalKills(s))}</span></div>
      <div class="row"><span class="k">물약</span><span class="v">${s.potions||0} / 5</span></div>
    </div>
    <div class="inv-title">인벤토리</div>
    <div class="inv-slots">${invSlotsHTML()}</div>
  </div>`;
}
function classifyLog(l) {
  if (l.startsWith('---') || l.startsWith('SYSTEM') || l.startsWith('[SYSTEM')) return 'lg-sys';
  if (/(레벨업|칭호|배웠|해금|개방|훈장|격파)/.test(l)) return 'lg-lvl';
  if (l.includes('강화 성공')) return 'lg-gain';   /* '방어에 성공' 등 일반 성공은 제외, 정확 매칭 */
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
  const pg = _prevGold, phr = _prevHpR;
  const hpRatio = Math.max(0, s.hp / s.max_hp) * 100;
  const old = screenEl.querySelector('.sidebar');
  if (old) { old.outerHTML = sidebarHTML(); }
  if (old && pg !== null && s.gold !== pg) {
    animateGoldCount(pg, s.gold);   /* 플로팅 없이 카운트업만 */
  }
  /* 유령바: 피해를 입으면 빨간 잔상이 이전 HP 지점에서 늦게 따라온다 */
  if (old && phr !== null && phr > hpRatio) {
    const gh = screenEl.querySelector('.sidebar .gauge-ghost');
    if (gh) {
      gh.style.transition = 'none'; gh.style.width = phr + '%';
      void gh.offsetWidth;
      gh.style.transition = ''; gh.style.width = hpRatio + '%';
    }
  }
  _prevGold = s.gold; _prevExp = s.exp; _prevLv = s.level; _prevHpR = hpRatio;
}

