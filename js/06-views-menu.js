'use strict';
/* [분할 06] 타이틀/캐릭터 설정/튜토리얼 */
/* =====================================================================
   타이틀 / 캐릭터 설정 / 튜토리얼
   ===================================================================== */
function showTitleScreen() {
  clearView(); BGM.play('set');
  screenEl.innerHTML = `
    <div class="bg-night bg-set" style="position:absolute;inset:0"></div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.51)"></div>
    <div class="center-panel">
      <div class="game-logo">페페의모험</div>
      <div class="vcol" style="margin-top:8px">
        <button class="btn" style="width:280px;height:55px" id="t-new">게임 시작하기</button>
        <button class="btn" style="width:280px;height:55px" id="t-load">게임 불러오기</button>
        <button class="btn" style="width:280px;height:55px" id="t-about">게임 정보</button>
      </div>
    </div>`;
  bindBtn('t-new', ()=>showSetup());
  bindBtn('t-load', ()=>showSystemMenu({mode:'LOAD_SELECT', fromTitle:true}));
  bindBtn('t-about', ()=>{
    alertModal('페페의모험 (웹 버전)\n\n마을을 거점으로 4개 지역을 탐험하는 RPG입니다.\n보스를 처치해 다음 지역의 봉인을 풀어보세요.\n\nESC : 시스템 메뉴 / 저장·불러오기');
  });
}
function spawnStars(container, n) {
  if (!container) return;
  let html = '';
  for (let i=0;i<n;i++) {
    const x = Math.random()*1000, y = Math.random()*700;
    const r = (0.8+Math.random()*1.6).toFixed(1);
    const d = (1.2+Math.random()*3).toFixed(1);
    html += `<div class="star" style="left:${x}px;top:${y}px;width:${r}px;height:${r}px;animation-duration:${d}s"></div>`;
  }
  container.innerHTML = html;
}
function bindBtn(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', ()=>{ if (el.classList.contains('disabled')) return; SFX.click(); fn(); });
}
function alertModal(text, onClose) {
  if (document.getElementById('modal-wrap')) return;   /* 중복 열림 방지 */
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();   /* Enter/Space 재클릭 방지 */
  const wrap = document.createElement('div');
  wrap.id = 'modal-wrap';
  wrap.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.7);z-index:70;display:flex;align-items:center;justify-content:center';
  wrap.innerHTML = `<div class="modal-panel">
    <div style="font-size:15px;line-height:2;white-space:pre-line">${esc(text)}</div>
    <button class="btn" style="width:200px;margin-top:24px" id="modal-ok">확인</button></div>`;
  screenEl.appendChild(wrap);
  const prevKey = currentKeyHandler;
  const close = ()=>{ SFX.click(); wrap.remove(); currentKeyHandler = prevKey; if (onClose) onClose(); };
  currentKeyHandler = e => {
    if (e.key==='Escape' || e.key==='Enter' || e.key===' ') { e.preventDefault(); close(); }
  };
  wrap.querySelector('#modal-ok').addEventListener('click', close);
}

function confirmModal(text, onYes, yesLabel='확인', noLabel='취소') {
  if (document.getElementById('modal-wrap')) return;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  const wrap = document.createElement('div');
  wrap.id = 'modal-wrap';
  wrap.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.7);z-index:70;display:flex;align-items:center;justify-content:center';
  wrap.innerHTML = `<div class="modal-panel">
    <div style="font-size:15px;line-height:2;white-space:pre-line">${esc(text)}</div>
    <div style="display:flex;gap:14px;justify-content:center;margin-top:24px">
      <button class="btn" style="width:160px" id="modal-yes">${esc(yesLabel)}</button>
      <button class="btn" style="width:160px" id="modal-no">${esc(noLabel)}</button>
    </div></div>`;
  screenEl.appendChild(wrap);
  const prevKey = currentKeyHandler;
  const close = yes => { SFX.click(); wrap.remove(); currentKeyHandler = prevKey; if (yes && onYes) onYes(); };
  currentKeyHandler = e => { if (e.key==='Escape') close(false); };   /* Enter로 파괴적 행동 방지 */
  wrap.querySelector('#modal-yes').addEventListener('click', ()=>close(true));
  wrap.querySelector('#modal-no').addEventListener('click', ()=>close(false));
}

function showSetup() {
  clearView(); BGM.play('set');
  let gender = null;
  screenEl.innerHTML = `
    <div class="bg-night bg-set" style="position:absolute;inset:0"></div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.51)"></div>
    <div class="center-panel" style="gap:16px">
      <div style="font-size:26px">당신의 이름은 무엇입니까?</div>
      <div style="font-size:13px;color:#c8c8c8" id="setup-msg">한글 혹은 영문 8자 이하로 입력해 주세요.</div>
      <input class="text-input" id="name-input" maxlength="8" autocomplete="off">
      <div style="font-size:15px;margin-top:6px">성별을 선택하세요.</div>
      <div class="hrow" style="gap:20px">
        <button class="btn" style="width:140px;height:52px" id="g-m">남성</button>
        <button class="btn" style="width:140px;height:52px" id="g-f">여성</button>
      </div>
      <button class="btn" style="width:300px;height:52px" id="setup-go">모험 시작하기 (ENTER)</button>
      <button class="btn" style="width:300px;height:52px" id="setup-back">◀ 돌아가기 (ESC)</button>
    </div>`;
  const input = document.getElementById('name-input');
  input.focus();
  const bm = document.getElementById('g-m'), bf = document.getElementById('g-f');
  bindBtn('g-m', ()=>{ gender = gender==='남성'?null:'남성'; bm.classList.toggle('selected',gender==='남성'); bf.classList.remove('selected'); });
  bindBtn('g-f', ()=>{ gender = gender==='여성'?null:'여성'; bf.classList.toggle('selected',gender==='여성'); bm.classList.remove('selected'); });
  function finish() {
    const name = input.value.trim();
    const msg = document.getElementById('setup-msg');
    if (!name) { msg.textContent = '이름을 입력해 주세요.'; msg.style.color='#ff8c50'; return; }
    if (name.length > 8) { msg.textContent = '이름은 최대 8글자까지 가능합니다.'; msg.style.color='#ff8c50'; return; }
    if (!gender) { msg.textContent = '성별을 선택해 주세요.'; msg.style.color='#ff8c50'; return; }
    engine.state.player_name = name;
    engine.state.gender = gender;
    engine.state.play_time = 0;
    showDialogScene({
      lines: TUTORIAL_MESSAGES, system:true, bgClass:'bg-night bg-set', bgm:'set',
      onFinish: ()=>showVillage()
    });
  }
  bindBtn('setup-go', finish);
  bindBtn('setup-back', ()=>showTitleScreen());
  currentKeyHandler = e => {
    if (e.key==='Escape') { SFX.click(); showTitleScreen(); return; } if (e.key === 'Enter') { SFX.click(); finish(); } };
}

/* ---------- 타이핑 대화 장면 (튜토리얼 / 보스 인트로 / 데이트) ---------- */
function showDialogScene(opts) {
  clearView();
  const { lines, onFinish, system=false, bgClass='bg-dark', bigEmoji=null, bigImg=null, stars=false, cafe=false, cafeImg=null, bgm=null } = opts;
  if (bgm) BGM.play(bgm);
  let li = 0, ci = 0, typing = null, finishing = false;

  screenEl.innerHTML = `
    <div class="${bgClass}" style="position:absolute;inset:0"></div>
    ${stars ? '<div id="dlg-stars"></div>' : ''}
    ${cafe ? `<div style="position:absolute;inset:0;background:#000"></div>
      <div id="date-fb" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:200px">☕</div>
      <img src="${ASSET_BASE}${cafeImg}" alt="" draggable="false"
        style="position:absolute;left:150px;top:0;width:700px;height:700px;object-fit:cover"
        onerror="document.getElementById('date-fb').style.display='flex';this.remove()">` : ''}
    ${bigEmoji ? `<div style="position:absolute;left:0;right:0;top:60px;text-align:center;filter:drop-shadow(0 0 30px rgba(0,0,0,.8))">${aimg(bigImg,`<span style="filter:brightness(0.25)">${bigEmoji}</span>`,230,'',1.35)}</div>` : ''}
    <div class="dialog-box ${system?'system':cafe?'date':''}" style="${cafe?'left:170px;right:170px;bottom:110px;height:100px':'left:150px;right:150px;bottom:130px;height:200px'}">
      <div class="speaker-tag" id="dlg-speaker" style="display:none"></div>
      <div id="dlg-text" style="white-space:pre-line"></div>
      <div class="blink-arrow" id="dlg-arrow" style="display:none">▼</div>
    </div>
    <button class="btn" id="dlg-next" style="position:absolute;${cafe?'right:170px;bottom:40px':'right:40px;bottom:60px'};width:200px">다음 (ENTER)</button>
    <div class="fade-overlay fade-in-anim" id="dlg-fade"></div>`;
  if (stars) spawnStars(document.getElementById('dlg-stars'), 90);
  later(()=>{ const f=document.getElementById('dlg-fade'); if(f) f.remove(); }, 1100);

  function renderLine() {
    const [speaker, text] = lines[li];
    const sp = document.getElementById('dlg-speaker');
    if (speaker) { sp.style.display='flex'; sp.textContent = speaker;
      sp.style.color = system ? '' : cafe ? '#ffd764' : (speaker==='페페' ? '#96d2ff' : '#ff6464'); }
    else sp.style.display='none';
    document.getElementById('dlg-arrow').style.display='none';
    ci = 0;
    clearInterval(typing);
    typing = everyT(()=>{
      ci++;
      document.getElementById('dlg-text').textContent = text.slice(0, ci);
      if (ci >= text.length) { clearInterval(typing); document.getElementById('dlg-arrow').style.display='block'; }
    }, 30);
  }
  function advance() {
    if (finishing) return;
    const [, text] = lines[li];
    if (ci < text.length) { ci = text.length; clearInterval(typing);
      document.getElementById('dlg-text').textContent = text;
      document.getElementById('dlg-arrow').style.display='block'; return; }
    li++;
    if (li >= lines.length) {
      finishing = true;
      const f = document.createElement('div');
      f.className = 'fade-overlay'; f.style.opacity = '0'; f.style.transition = 'opacity 1s';
      screenEl.appendChild(f);
      requestAnimationFrame(()=>f.style.opacity='1');
      later(onFinish, 1050);
      return;
    }
    renderLine();
  }
  bindBtn('dlg-next', advance);
  currentKeyHandler = e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); SFX.click(); advance(); } };
  renderLine();
}

