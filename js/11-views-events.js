'use strict';
/* [분할 11] 사막 이벤트/훈장 수여/엔딩 */
/* =====================================================================
   이벤트 — 사막 스킬 습득 / 훈장 수여 / 엔딩 크롤
   ===================================================================== */
function showDesertEvent(areaId, medal, bossName) {
  clearView(); BGM.play('event');
  screenEl.innerHTML = `
    <div class="bg-event" style="position:absolute;inset:0"></div>
    <div class="glow-orb" style="left:50%;top:44%;transform:translate(-50%,-50%)"></div>
    <div class="vcol" style="position:absolute;left:0;right:0;bottom:150px">
      <div style="font-size:16px;color:#c8c8c8">뭔가 신비한 기운이 느껴진다...</div>
      <button class="btn" style="width:320px" id="de-go">느껴지는 기운을 따라간다 (ENTER)</button>
    </div>`;
  const go = ()=>showStatueEvent(areaId, medal, bossName);
  bindBtn('de-go', go);
  currentKeyHandler = e => { if (e.key==='Enter') { SFX.click(); go(); } };
}

function showStatueEvent(areaId, medal, bossName) {
  clearView(); BGM.play('event');
  screenEl.innerHTML = `
    <div class="bg-event" style="position:absolute;left:250px;top:0;width:750px;height:550px"></div>
    <div class="main-area"><div class="main-dim"></div>
      <div class="glow-orb" style="left:50%;top:44%;transform:translate(-50%,-50%)"></div>
      <div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:130px;filter:drop-shadow(4px 6px 6px rgba(0,0,0,.5))">${aimg('event_cat.webp','🐈',130,'',1.7)}</div>
      <div class="vcol" style="position:absolute;left:0;right:0;bottom:40px">
        <button class="btn" style="width:320px" id="se-go">조각상 아래에 무언가 있다 (ENTER)</button>
      </div>
    </div>
    ${sidebarHTML()}${logHTML()}`;
  const go = ()=>showSkillLearn(areaId, medal, bossName);
  bindBtn('se-go', go);
  currentKeyHandler = e => { if (e.key==='Enter') { SFX.click(); go(); } };
}

function showSkillLearn(areaId, medal, bossName) {
  clearView(); BGM.play('event');
  screenEl.innerHTML = `
    <div class="bg-event" style="position:absolute;left:250px;top:0;width:750px;height:550px"></div>
    <div class="main-area"><div class="main-dim"></div>
      <div class="glow-orb" style="left:50%;top:130px;transform:translateX(-50%)"></div>
      <div style="position:absolute;left:50%;top:70px;transform:translateX(-50%);font-size:110px;filter:drop-shadow(4px 6px 6px rgba(0,0,0,.5))">${aimg('skill.webp','📜',110,'',1.6)}</div>
      <div class="vcol" style="position:absolute;left:0;right:0;bottom:30px;gap:10px">
        <div style="font-size:15px;text-shadow:1px 1px 0 #000">새로운 스킬을 배웠습니다. 스킬 이름을 정해주세요.</div>
        <div style="font-size:12px;color:#b4b4b4">(8글자 이내)</div>
        <input class="text-input" id="skill-input" maxlength="8" autocomplete="off">
        <button class="btn" style="width:200px;height:48px" id="sk-ok">확인 (ENTER)</button>
      </div>
    </div>
    ${sidebarHTML()}${logHTML()}`;
  const input = document.getElementById('skill-input');
  input.focus();
  function confirm() {
    const name = input.value.trim();
    if (!name) { engine.addLog('스킬 이름을 입력해 주세요.'); return; }
    if (name.length > 8) { engine.addLog('스킬 이름은 8글자 이내로 입력해 주세요.'); return; }
    engine.state.skills.push(name);
    engine.addLog(`스킬 "${name}"을(를) 배웠습니다!`);
    SFX.win();
    showMedalVictory(areaId, medal, bossName);
  }
  bindBtn('sk-ok', confirm);
  currentKeyHandler = e => { if (e.key==='Enter') { SFX.click(); confirm(); } };
}

function showMedalVictory(areaId, medal, bossName, nextOverride=null) {
  clearView(); BGM.play('medal');
  SFX.win();
  screenEl.innerHTML = `
    <div class="bg-night bg-festival" style="position:absolute;inset:0"></div>
    <div id="mv-sparks" style="position:absolute;inset:0;pointer-events:none"></div>
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center">
      <div style="font-size:26px;font-weight:bold;color:gold;text-shadow:2px 2px 0 #000">보스 처치 기념 훈장 수여</div>
      <div style="font-size:16px;margin-top:18px">&lt;${esc(bossName)}&gt;을(를) 물리쳤습니다!</div>
      <div id="mv-medal" style="position:relative;height:210px;margin-top:34px;transform:scale(0);transition:transform 1.1s ease-out;
           filter:drop-shadow(0 0 26px rgba(255,215,0,.6));animation:medalfloat 2.4s ease-in-out infinite 1.2s">${medal?`<img src="${ASSET_BASE}${medal.img}" alt="" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:230px;height:222px;object-fit:contain;filter:brightness(0)" onerror="this.remove()">`+aimg(medal.img,medal.emoji,120,'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)',1.7):'🏅'}</div>
      <button class="btn" style="width:220px;margin-top:52px;opacity:0;transition:opacity .5s" id="mv-next">모험 계속하기 (ENTER)</button>
    </div>
    <style>@keyframes medalfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}</style>`;
  requestAnimationFrame(()=>{ document.getElementById('mv-medal').style.transform = 'scale(1)'; });
  const sparkLayer = document.getElementById('mv-sparks');
  everyT(()=>{
    const cx = 60 + Math.random()*880, cy = 60 + Math.random()*300;
    const colors = ['#ff5050','#ffc832','#64c8ff','#b464ff','#64ff96'];
    const col = colors[Math.floor(Math.random()*colors.length)];
    for (let i=0;i<12;i++) {
      const sp = document.createElement('div');
      const ang = Math.random()*Math.PI*2, dist = 45 + Math.random()*95;
      sp.className = 'spark';
      sp.style.cssText = `left:${cx}px;top:${cy}px;background:${col};--dx:${Math.cos(ang)*dist}px;--dy:${Math.sin(ang)*dist+55}px`;
      sparkLayer.appendChild(sp);
      setTimeout(()=>sp.remove(), 1050);
    }
  }, 1000);
  let ready = false;
  later(()=>{ ready = true; document.getElementById('mv-next').style.opacity = '1'; }, 1500);
  const next = ()=>{ if (!ready) return; nextOverride ? nextOverride() : showExplore(areaId); };
  bindBtn('mv-next', next);
  currentKeyHandler = e => { if (e.key==='Enter') { SFX.click(); next(); } };
}

function showEndingCrawl() {
  clearView(); BGM.play('medal');
  const s = engine.state;
  const total = totalKills(s);
  const sec = Math.floor(s.play_time||0);
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), ss = sec%60;
  const lines = [
    ['tt','― 모험의 기록 ―'], ['b',''], ['b',''],
    ['hd','[ 모험가 정보 ]'], ['b',''],
    ['bd',`이름  :  ${s.player_name}`],
    ['bd',`레벨  :  Lv. ${fmt(s.level)}`],
    ['bd',`칭호  :  ${s.equipped_title}`], ['b',''], ['b',''],
    ['hd','[ 플레이 시간 ]'], ['b',''],
    ['bd',`${h}시간 ${m}분 ${ss}초`], ['b',''], ['b',''],
    ['hd','[ 게임오버 횟수 ]'], ['b',''],
    ['bd',`${fmt(s.death_count||0)} 회`], ['b',''], ['b',''],
    ['hd','[ 전투 기록 ]'], ['b',''],
    ['bd',`총 처치 몬스터  :  ${fmt(total)} 마리`],
    ['bd',`깊은 안개 숲  :  ${fmt(s.kills_by_area.forest)} 마리`],
    ['bd',`불타는 사막   :  ${fmt(s.kills_by_area.desert)} 마리`],
    ['bd',`끈적한 늪     :  ${fmt(s.kills_by_area.swamp)} 마리`],
    ['bd',`얼어붙은 산   :  ${fmt(s.kills_by_area.mountain)} 마리`], ['b',''], ['b',''],
    ['hd','[ 처치 보스 ]'], ['b',''],
    ['bd','✔  숲의 지배자 엔트'], ['bd','✔  사막의 지배자 파라오'],
    ['bd','✔  늪의 지배자 메두사'], ['bd','✔  산의 지배자 가고일'], ['b',''], ['b',''],
    ['hd','[ 획득 골드 ]'], ['b',''],
    ['bd',`현재 보유  :  ${fmt(s.gold)} Gold`], ['b',''], ['b',''], ['b',''],
    ['tt','모험해주셔서 감사합니다'], ['b',''],
    ['bd','― 페페의모험 ―']
  ];
  const crawlHTML = lines.map(([t,txt])=>{
    const cls = t==='hd'?'hd':t==='tt'?'tt':'';
    return `<div class="${cls}" style="min-height:32px">${esc(txt)}</div>`;
  }).join('');
  screenEl.innerHTML = `
    <div class="bg-night" style="position:absolute;inset:0"></div>
    <div id="end-stars"></div>
    <div class="crawl-wrap">
      <div class="crawl-text" id="crawl" style="top:700px">${crawlHTML}</div>
    </div>
    <div class="sub-text" style="position:absolute;right:20px;bottom:14px">ENTER · 화면 터치 : 넘기기</div>
    <div id="end-tap" style="position:absolute;inset:0;z-index:8"></div>`;
  spawnStars(document.getElementById('end-stars'), 180);

  const crawl = document.getElementById('crawl');
  const totalH = lines.length*32 + 750;
  let y = 700, done = false, msgIdx = 0;
  const scrollTimer = everyT(()=>{
    y -= 0.65;
    crawl.style.top = y+'px';
    if (y < -totalH+650) finishCrawl();
  }, 16);

  const SYSTEM_MESSAGES = [
    '모든 지역의 보스를 물리쳤습니다!\n\n모험은 재밌으셨나요?\n\n하지만 아직 끝나지 않았습니다.',
    '칭호 도감 완성에 도전해보세요!\n\n도감에 있는 모든 칭호를 모아보세요.',
    '이제 마을로 돌아갑니다.\n\n[ ENTER ] 를 눌러 계속하기'
  ];
  function finishCrawl() {
    if (done) return; done = true;
    clearInterval(scrollTimer);
    crawl.style.display = 'none';
    showSystemMsg();
  }
  function showSystemMsg() {
    let box = document.getElementById('end-msgbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'end-msgbox';
      box.className = 'dialog-box system';
      box.style.cssText = 'left:170px;right:170px;top:230px;height:220px';
      box.innerHTML = `<div class="speaker-tag">SYSTEM</div><div id="end-msgtext" style="white-space:pre-line;text-align:center;padding-top:20px"></div>`;
      screenEl.appendChild(box);
    }
    document.getElementById('end-msgtext').textContent = SYSTEM_MESSAGES[msgIdx];
  }
  function advance() {
    if (!done) { finishCrawl(); return; }
    msgIdx++;
    if (msgIdx >= SYSTEM_MESSAGES.length) { showVillage('MAIN'); return; }
    showSystemMsg();
  }
  currentKeyHandler = e => { if (e.key==='Enter') { SFX.click(); advance(); } };
  document.getElementById('end-tap').addEventListener('click', ()=>{ SFX.click(); advance(); });   /* 터치 대응: ENTER와 동일 경로 */
}

