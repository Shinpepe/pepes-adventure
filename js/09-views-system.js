'use strict';
/* [분할 09] 시스템 메뉴/칭호 도감/게임오버 */
/* =====================================================================
   시스템 메뉴 / 칭호 도감 / 게임오버
   ===================================================================== */
function showSystemMenu(opts={}) {
  clearView();
  const mode = opts.mode || 'MAIN';
  const returnTo = opts.returnTo || (()=>showVillage('MAIN'));
  const fromTitle = !!opts.fromTitle;
  const msg = opts.message || '';

  let body = '';
  if (mode === 'MAIN') {
    body = `<div style="font-size:24px;font-weight:bold">SYSTEM MENU</div>
      <button class="btn" style="width:250px" id="m-resume">▶ 계속하기</button>
      <button class="btn" style="width:250px" id="m-sound">사운드 설정</button>
      <button class="btn" style="width:250px" id="m-titles">칭호 도감</button>
      <button class="btn" style="width:250px" id="m-new">새 게임 시작</button>
      <button class="btn" style="width:250px" id="m-save">게임 저장하기</button>
      <button class="btn" style="width:250px" id="m-load">게임 불러오기</button>
      <button class="btn" style="width:250px" id="m-exit">타이틀로 돌아가기</button>`;
  } else if (mode === 'SOUND') {
    body = `<div style="font-size:24px;font-weight:bold">사운드 설정</div>
      <div style="font-size:14px;color:#c8c8c8">배경음 볼륨 : ${Math.round(BGM.volume*10)} / 10</div>
      <div class="hrow">
        <button class="btn" style="width:90px" id="bv-down">-</button>
        <button class="btn" style="width:90px" id="bv-up">+</button>
        <button class="btn" style="width:130px" id="bv-mute">${BGM.muted?'배경음 켜기':'배경음 끄기'}</button>
      </div>
      <div style="font-size:14px;color:#c8c8c8;margin-top:8px">효과음 볼륨 : ${Math.round(SFX.volume*10)} / 10</div>
      <div class="hrow">
        <button class="btn" style="width:50px" id="sv-down">◀</button>
        <button class="btn" style="width:130px" id="sv-mute">${SFX.muted?'효과음 켜기':'효과음 끄기'}</button>
        <button class="btn" style="width:50px" id="sv-up">▶</button>
      </div>
      <div style="font-size:11px;color:#8c8c8c">※ 웹 버전은 합성 효과음을 사용합니다.</div>
      <button class="btn" style="width:250px" id="m-back">◀ 뒤로가기</button>`;
  } else if (mode === 'NEW_CONFIRM') {
    body = `<div style="font-size:16px;color:#ff6440">※ 정말 새로 시작하시겠습니까?</div>
      <div style="font-size:12px;color:#c8c8c8">저장하지 않은 현재 진행 상황은 사라집니다.</div>
      <button class="btn" style="width:250px" id="m-yes">예, 새로 시작합니다</button>
      <button class="btn" style="width:250px" id="m-back">아니오, 돌아갑니다</button>`;
  } else if (mode === 'EXIT_CONFIRM') {
    body = `<div style="font-size:16px;color:#ff6440">※ 타이틀 화면으로 돌아가시겠습니까?</div>
      <div style="font-size:12px;color:#c8c8c8">저장하지 않은 데이터는 모두 사라집니다.</div>
      <button class="btn" style="width:250px" id="m-yes">네, 돌아갑니다</button>
      <button class="btn" style="width:250px" id="m-back">아니오, 돌아갑니다</button>`;
  } else { // SAVE_SELECT / LOAD_SELECT
    const isSave = mode==='SAVE_SELECT';
    body = `<div style="font-size:18px;color:gold">${isSave?'저장할 슬롯 선택':'불러올 슬롯 선택'}</div>
      ${[1,2,3].map(i=>`<button class="btn" style="width:380px" id="slot-${i}">슬롯 ${i}${esc(engine.slotInfo(i))}</button>`).join('')}
      <button class="btn" style="width:380px" id="m-back">◀ 뒤로가기</button>`;
  }

  screenEl.innerHTML = `
    <div class="bg-dark" style="position:absolute;inset:0"></div>
    ${msg?`<div class="msg-cyan" style="position:absolute;left:0;right:0;top:80px">${esc(msg)}</div>`:''}
    <div class="vcol" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">${body}</div>`;

  bindBtn('m-resume', returnTo);
  bindBtn('m-sound', ()=>showSystemMenu({...opts, mode:'SOUND', message:''}));
  bindBtn('m-titles', ()=>showTitleBook(opts));
  bindBtn('m-new', ()=>showSystemMenu({...opts, mode:'NEW_CONFIRM', message:''}));
  bindBtn('m-save', ()=>showSystemMenu({...opts, mode:'SAVE_SELECT', message:''}));
  bindBtn('m-load', ()=>showSystemMenu({...opts, mode:'LOAD_SELECT', message:''}));
  bindBtn('m-exit', ()=>showSystemMenu({...opts, mode:'EXIT_CONFIRM', message:''}));
  bindBtn('m-back', ()=> fromTitle && (mode==='LOAD_SELECT') ? showTitleScreen() : showSystemMenu({...opts, mode:'MAIN', message:''}));
  bindBtn('sv-down', ()=>{ SFX.volume=Math.max(0,Math.round((SFX.volume-0.1)*10)/10); saveSoundPrefs(); showSystemMenu({...opts, mode:'SOUND'}); });
  bindBtn('sv-up', ()=>{ SFX.volume=Math.min(1,Math.round((SFX.volume+0.1)*10)/10); saveSoundPrefs(); showSystemMenu({...opts, mode:'SOUND'}); });
  bindBtn('sv-mute', ()=>{ SFX.muted=!SFX.muted; saveSoundPrefs(); showSystemMenu({...opts, mode:'SOUND'}); });
  bindBtn('bv-down', ()=>{ BGM.setVol(Math.max(0,Math.round((BGM.volume-0.1)*10)/10)); saveSoundPrefs(); showSystemMenu({...opts, mode:'SOUND'}); });
  bindBtn('bv-up', ()=>{ BGM.setVol(Math.min(1,Math.round((BGM.volume+0.1)*10)/10)); saveSoundPrefs(); showSystemMenu({...opts, mode:'SOUND'}); });
  bindBtn('bv-mute', ()=>{ BGM.setMuted(!BGM.muted); saveSoundPrefs(); showSystemMenu({...opts, mode:'SOUND'}); });

  if (mode==='NEW_CONFIRM') bindBtn('m-yes', ()=>{ engine.resetData(); showSetup(); });
  if (mode==='EXIT_CONFIRM') bindBtn('m-yes', ()=>showTitleScreen());
  if (mode==='SAVE_SELECT' || mode==='LOAD_SELECT') {
    [1,2,3].forEach(i=>bindBtn('slot-'+i, ()=>{
      if (mode==='SAVE_SELECT') {
        engine.saveGame(i);
        showSystemMenu({...opts, mode:'SAVE_SELECT', message:`슬롯 ${i}에 저장되었습니다!`});
      } else {
        const r = engine.loadGame(i);
        if (r==='ok') showVillage('MAIN');
        else if (r==='corrupted') showSystemMenu({...opts, mode:'LOAD_SELECT', message:`슬롯 ${i}의 저장 파일이 손상되었습니다!`});
        else showSystemMenu({...opts, mode:'LOAD_SELECT', message:`슬롯 ${i}은 비어 있습니다!`});
      }
    }));
  }
  currentKeyHandler = e => {
    if (e.key==='Escape') {
      SFX.click();
      if (mode==='MAIN') returnTo();
      else if (fromTitle && mode==='LOAD_SELECT') showTitleScreen();
      else showSystemMenu({...opts, mode:'MAIN', message:''});
    }
  };
}

function showTitleBook(menuOpts, message='') {
  clearView();
  const s = engine.state;
  const rows = [];
  for (let i=0;i<TITLE_CONDITIONS.length;i+=4) rows.push(TITLE_CONDITIONS.slice(i,i+4));
  screenEl.innerHTML = `
    <div class="bg-dark" style="position:absolute;inset:0"></div>
    ${message?`<div class="msg-cyan" style="position:absolute;left:0;right:0;top:52px">${esc(message)}</div>`:''}
    <div class="vcol" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);gap:12px">
      <div style="font-size:24px;font-weight:bold;margin-bottom:8px">칭호 도감</div>
      ${rows.map(row=>`<div class="hrow" style="gap:10px">${row.map(t=>{
        const unlocked = s.unlocked_titles.includes(t.name);
        const equipped = s.equipped_title === t.name;
        const label = equipped ? `${t.name} (장착중)` : unlocked ? t.name : '???';
        return `<button class="btn ${equipped?'selected':''}" style="width:185px" data-title="${esc(t.name)}" data-un="${unlocked?1:0}">${esc(label)}</button>`;
      }).join('')}</div>`).join('')}
      <button class="btn" style="width:250px;margin-top:10px" id="tb-back">◀ 돌아가기</button>
    </div>`;
  screenEl.querySelectorAll('[data-title]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      SFX.click();
      const name = btn.dataset.title;
      if (btn.dataset.un === '1') {
        s.equipped_title = name;
        engine.addLog(`칭호 [${name}]을(를) 장착했습니다.`);
        showTitleBook(menuOpts);
      } else {
        const t = TITLE_CONDITIONS.find(x=>x.name===name);
        showTitleBook(menuOpts, `아직 얻지 못한 칭호입니다. (${t.hint})`);
      }
    });
  });
  bindBtn('tb-back', ()=>showSystemMenu({...menuOpts, mode:'MAIN'}));
  currentKeyHandler = e => { if (e.key==='Escape') { SFX.click(); showSystemMenu({...menuOpts, mode:'MAIN'}); } };
}

function showGameOver() {
  clearView(); BGM.play('fail');
  const s = engine.state;
  s.death_count = (s.death_count||0) + 1;
  engine.checkTitles();
  SFX.lose();
  const penalty = Math.floor(engine.neededExp() * 0.1);
  screenEl.innerHTML = `
    <div class="bg-dark" style="position:absolute;inset:0"></div>
    <div id="go-embers" style="position:absolute;inset:0;overflow:hidden;pointer-events:none"></div>
    <div class="go-vignette"></div>
    <div class="go-title">GAME OVER</div>
    <div class="go-info">${fmt(s.death_count)}번째 죽음... ${fmt(penalty)}경험치를 잃었다.</div>
    <div class="go-btnwrap">
      <button class="btn" style="width:260px" id="go-revive">마을에서 부활하기 (R)</button>
    </div>`;
  /* 떨어지는 재 파티클 */
  const em = document.getElementById('go-embers');
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('div');
    e.className = 'go-ember';
    const sz = 2 + Math.floor(Math.random()*3);
    e.style.cssText += `;left:${Math.floor(Math.random()*1000)}px;top:${Math.floor(Math.random()*160)}px;`+
      `width:${sz}px;height:${sz}px;animation-duration:${(3.2+Math.random()*3.2).toFixed(1)}s;`+
      `animation-delay:${(Math.random()*2.4).toFixed(1)}s;background:${Math.random()<0.4?'#8a8a8a':'#c85040'}`;
    em.appendChild(e);
  }
  let ready = false;
  later(()=>{ ready = true; }, 1400);   /* 연타 방지: 버튼 등장 전 입력 무시 */
  function revive() {
    if (!ready) return;
    s.hp = Math.floor(s.max_hp * 0.3);
    s.exp = Math.max(0, s.exp - penalty);
    showVillage('MAIN');
  }
  bindBtn('go-revive', revive);
  currentKeyHandler = e => { if (e.key==='r'||e.key==='R'||e.key==='ㄱ') { SFX.click(); revive(); } };
}

