'use strict';
/* [분할 10] 갈림길/탐험/상자/전투 */
/* =====================================================================
   모험 — 갈림길 / 탐험 / 상자 / 전투
   ===================================================================== */
function showAreaSelect() {
  clearView(); BGM.play('adventure');
  const s = engine.state;
  const unlocked = a => a==='forest' || s.bosses_defeated.includes(AREA_UNLOCK_BOSS[a]);
  screenEl.innerHTML = `
    <div class="bg-cross" style="position:absolute;left:250px;top:0;width:750px;height:550px"></div>
    <div class="main-area"><div class="main-dim"></div>
      <div class="big-title" style="position:absolute;left:0;right:0;top:60px">갈림길</div>
            <div class="vcol" style="position:absolute;left:0;right:0;top:225px">
        <div style="font-size:18px;font-weight:bold;text-shadow:2px 2px 0 #000">어디로 가시겠습니까?</div>
        ${AREA_ORDER.map(a=>`<button class="btn ${unlocked(a)?'':'disabled'}" style="width:250px" data-area="${a}">
           ${AREAS[a].name}${unlocked(a)?'':' (잠김)'}</button>`).join('')}
        <button class="btn" style="width:250px" id="as-back">◀ 마을로 돌아가기</button>
      </div>
    </div>
    ${sidebarHTML()}${logHTML()}`;
  screenEl.querySelectorAll('[data-area]').forEach(btn=>{
    if (btn.classList.contains('disabled')) return;
    btn.addEventListener('click', ()=>{ SFX.click(); showExplore(btn.dataset.area); });
  });
  bindBtn('as-back', ()=>showVillage('MAIN'));
  currentKeyHandler = e => { if (e.key==='Escape') { SFX.click(); showVillage('MAIN'); } };
}

function showExplore(areaId) {
  clearView(); BGM.play('adventure');
  const s = engine.state;
  const area = AREAS[areaId];
  const bossData = MONSTERS.find(m=>m.area===areaId && m.boss===1);
  const isDefeated = s.bosses_defeated.includes(bossData.name);
  const kills = s.kills_by_area[areaId] || 0;
  const req = area.bossReq;
  const canBoss = kills >= req;

  let bossBtn;
  if (isDefeated) bossBtn = `<button class="btn disabled" style="width:300px">${esc(bossData.name)} 처치 완료</button>`;
  else if (canBoss) bossBtn = `<button class="btn" style="width:300px" id="ex-boss">보스 : ${esc(bossData.name)}</button>`;
  else bossBtn = `<button class="btn disabled" style="width:300px">보스 (지역 몬스터 ${req-kills} 처치 필요)</button>`;

  screenEl.innerHTML = `
    <div class="${area.bg}" style="position:absolute;left:250px;top:0;width:750px;height:550px"></div>
    <div class="main-area"><div class="main-dim"></div>
      <div class="big-title" style="position:absolute;left:0;right:0;top:60px">${esc(area.name)}</div>
      <div class="vcol" style="position:absolute;left:0;right:0;top:270px">
        <button class="btn" style="width:300px" id="ex-go">주변 탐색 (SPACE)</button>
        ${bossBtn}
        <button class="btn" style="width:300px" id="ex-back">◀ 갈림길로 돌아가기</button>
      </div>
    </div>
    ${sidebarHTML()}${logHTML()}`;

  function explore() {
    if (Math.random() < 0.1) { showChest(areaId); return; }
    const candidates = MONSTERS.filter(m=>m.area===areaId && m.boss===0);
    const monster = candidates[Math.floor(Math.random()*candidates.length)];
    showBattle(monster, areaId);
  }
  bindBtn('ex-go', explore);
  bindBtn('ex-back', ()=>showAreaSelect());
  if (canBoss && !isDefeated) bindBtn('ex-boss', ()=>{
    showDialogScene({
      lines: BOSS_DIALOGUES[bossData.name] || [['', '강력한 존재가 나타났다...']],
      bgClass: area.bg, bigEmoji: bossData.emoji,
      bigImg: bossData.img ? bossData.img.replace('.webp','_shadow.webp') : null, bgm:'battle',
      onFinish: ()=>showBattle(bossData, areaId)
    });
  });
  currentKeyHandler = e => {
    if (e.key===' ') { e.preventDefault(); SFX.click(); explore(); }
    if (e.key==='Escape') { SFX.click(); showAreaSelect(); }
  };
}

/* ---------- 수상한 상자 ---------- */
const CHEST_GOLD = { forest:300, desert:1000, swamp:2500, mountain:5000 };
function showChest(areaId) {
  clearView(); BGM.play('adventure');
  const area = AREAS[areaId];
  let busy = false;
  screenEl.innerHTML = `
    <div class="main-area"><div class="${area.bg}" style="position:absolute;inset:-14px"></div><div class="main-dim"></div>
      <div class="monster-shadow"></div>
      <div id="chest-icon" style="position:absolute;left:50%;top:275px;transform:translateX(-50%);font-size:140px;transition:opacity .35s;filter:drop-shadow(4px 8px 6px rgba(0,0,0,.4))">${aimg('monster/chest.webp','📦',140)}</div>
      <div id="chest-text" style="position:absolute;left:0;right:0;top:80px;text-align:center;font-size:20px;text-shadow:2px 2px 0 #000">수상한 상자를 발견했다.</div>
    </div>
    <div class="battle-panel">
      <button class="btn" style="width:180px" id="ch-look">살펴본다 (Z)</button>
      <button class="btn" style="width:180px" id="ch-pass">지나간다 (X)</button>
    </div>
    ${sidebarHTML()}${logHTML()}`;

  function look() {
    if (busy) return; busy = true;
    const icon = document.getElementById('chest-icon');
    const txt = document.getElementById('chest-text');
    icon.style.opacity = '0';
    later(()=>{
      if (Math.random() < 0.75) {
        // 미믹
        icon.innerHTML = aimg('monster/mimic.webp','👹',140); icon.style.opacity = '1';
        engine.addLog('미믹을 발견하였습니다.');
        later(()=>{
          const dmg = Math.max(1, Math.floor(engine.state.max_hp * 0.1));
          engine.state.hp -= dmg;
          engine.addLog(`미믹에게 ${fmt(dmg)} 피해를 입었습니다.`);
          txt.textContent = `미믹 출현! ${fmt(dmg)} 피해!`;
          txt.style.color = '#dc5050';
          SFX.hit();
          refreshSidebar();
          playerHitFx();
          if (engine.state.hp <= 0) { later(()=>showGameOver(), 900); return; }
          later(()=>{ icon.style.opacity='0'; later(()=>showExplore(areaId), 1400); }, 900);
        }, 700);
      } else {
        const gold = CHEST_GOLD[areaId] || 300;
        engine.state.gold += gold;
        engine.addLog(`보물을 발견하였습니다. +${fmt(gold)} Gold를 획득하였습니다.`);
        engine.checkTitles();
        icon.innerHTML = aimg('monster/treasure.webp','💰',140); icon.style.opacity = '1';
        txt.textContent = `보물 발견! ${fmt(gold)} Gold 획득!`;
        txt.style.color = '#c8aa32';
        SFX.coin();
        refreshSidebar();
        later(()=>showExplore(areaId), 2600);
      }
    }, 450);
  }
  function pass() {
    if (busy) return;
    engine.addLog('수상한 상자를 지나쳤다.');
    showExplore(areaId);
  }
  bindBtn('ch-look', look);
  bindBtn('ch-pass', pass);
  currentKeyHandler = e => {
    if (e.key==='z'||e.key==='Z'||e.key==='ㅋ') { SFX.click(); look(); }
    if (e.key==='x'||e.key==='X'||e.key==='ㅌ') { SFX.click(); pass(); }
  };
}

/* ---------- 전투 ---------- */
const SKILL_COOLDOWN = 3;
function showBattle(monster, areaId) {
  clearView(); BGM.play('battle');
  const s = engine.state;
  const area = AREAS[areaId];
  let mHp = monster.hp;
  const mMaxHp = monster.hp;
  let processing = false, victory = false, skillCd = 0, showingSkills = false;
  /* 보스 강공격 / 방어 / 물약 상태 */
  let defending = false, heavyCharged = false, mTurn = 0;
  let nextWarn = 2 + Math.floor(Math.random()*4);   /* 첫 예고: 몬스터 2~5번째 행동 → 발동 3~6턴째 */
  let atkDownTurns = 0, frostTurns = 0, petrified = false;
  const BOSS_HEAVY = {
    '숲의 지배자 엔트':    { mult:2.2, warn:'엔트가 거대한 뿌리를 움직인다.',        banner:'⚠ 대지가 울리고 있다.',   fire:'지진으로 숲 전체가 흔들린다.',       extra:null },
    '사막의 지배자 파라오': { mult:1.7, warn:'파라오 주위로 모래가 소용돌이 친다.',   banner:'⚠ 모래폭풍이 몰려온다.', fire:'모래폭풍이 사막을 집어삼킨다.',     extra:'sand' },
    '늪의 지배자 메두사':   { mult:1.5, warn:'메두사의 눈이 붉게 빛나기 시작한다.',   banner:'⚠ 눈을 마주치지 마라.',   fire:'메두사의 눈이 번쩍인다.',           extra:'petrify' },
    '산의 지배자 가고일':   { mult:1.8, warn:'가고일이 날개를 펼치고 냉기를 뿜는다.', banner:'⚠ 주변이 얼어붙는다.',   fire:'눈보라가 산을 뒤덮는다.',           extra:'frost' },
  };
  const heavy = monster.boss === 1 ? BOSS_HEAVY[monster.name] : null;
  engine.addLog(`${monster.name}와(과) 전투 시작!`);

  screenEl.innerHTML = `
    <div class="main-area" id="battle-main">
      <div class="${area.bg}" style="position:absolute;inset:-14px"></div>
      <div class="main-dim"></div>
      <div class="boss-warn" id="b-warn" style="display:none"></div>
      <div class="monster-name" id="b-name">${esc(monster.name)}</div>
      <div class="mhp-wrap">
        <div class="mhp-bg">
          <div class="mhp-ghost" id="b-hpghost" style="width:100%"></div>
          <div class="mhp-fill" id="b-hpfill" style="width:100%"></div>
          <div class="mhp-ticks"></div>
        </div>
        <div class="mhp-label" id="b-hplabel">HP : ${fmt(mHp)} / ${fmt(mMaxHp)}</div>
      </div>
      <div class="monster-shadow"></div>
      <div class="monster-emoji enter" id="b-monster">${aimg(monster.img,monster.emoji,130,'',2.05)}</div>
    </div>
    <div class="battle-panel" id="b-panel"></div>
    ${sidebarHTML()}${logHTML()}`;

  const panel = document.getElementById('b-panel');
  const mEl = document.getElementById('b-monster');
  const mainEl = document.getElementById('battle-main');

  function updateMonsterHp() {
    const ratio = Math.max(0, mHp/mMaxHp);
    const fill = document.getElementById('b-hpfill');
    fill.style.width = (ratio*100)+'%';
    fill.style.background = ratio > 0.3 ? '#9632fa' : '#ff3232';
    const ghost = document.getElementById('b-hpghost');
    if (ghost) ghost.style.width = (ratio*100)+'%';   /* CSS 지연 트랜지션이 잔상 효과를 만든다 */
    document.getElementById('b-hplabel').textContent = `HP : ${fmt(Math.max(0,Math.floor(mHp)))} / ${fmt(mMaxHp)}`;
  }
  function dropGold() {
    const g = document.createElement('img');
    g.src = ASSET_BASE + 'gold.webp';
    g.style.cssText = 'position:absolute;left:50%;top:352px;width:84px;height:84px;animation:goldDrop 1.3s ease-out forwards;pointer-events:none;filter:drop-shadow(3px 5px 4px rgba(0,0,0,.4))';
    g.onerror = ()=>g.remove();
    mainEl.appendChild(g);
    setTimeout(()=>{ g.style.transition='opacity .5s'; g.style.opacity='0'; setTimeout(()=>g.remove(),550); }, 1400);
  }
  function floatText(text, cls) {
    const d = document.createElement('div');
    d.className = 'dmg-float ' + cls;
    d.textContent = text;
    d.style.left = (330 + Math.random()*90) + 'px';
    d.style.top = (250 + Math.random()*30) + 'px';
    mainEl.appendChild(d);
    setTimeout(()=>d.remove(), 1200);
  }
  later(()=>mEl.classList.remove('enter'), 350);
  function heavyHitFx() {
    /* 강공격 무방비 피격: 흰 섬광 + 진한 비네트 + 화면 진동 */
    const fw = document.createElement('div'); fw.className='flash-white';
    screenEl.appendChild(fw); setTimeout(()=>fw.remove(), 520);
    const vh = document.createElement('div'); vh.className='vignette-heavy';
    screenEl.appendChild(vh); setTimeout(()=>vh.remove(), 950);
    const bm = document.getElementById('battle-main');
    if (bm) { bm.classList.remove('bshake'); void bm.offsetWidth; bm.classList.add('bshake'); }
    const gw = document.querySelector('.sidebar .gauge-wrap');
    if (gw) { gw.classList.remove('hit'); void gw.offsetWidth; gw.classList.add('hit'); }
    SFX.hit(); SFX.tone && SFX.tone(70, .35, 'sawtooth', .14);
  }
  function guardFx() {
    /* 방어 성공: 푸른 방패 비네트 */
    const vg = document.createElement('div'); vg.className='vignette-guard';
    screenEl.appendChild(vg); setTimeout(()=>vg.remove(), 750);
    SFX.tone && (SFX.tone(420, .09, 'square', .1), SFX.tone(300, .14, 'square', .08, .07));
  }
  function setWarnBanner(text) {
    const w = document.getElementById('b-warn');
    if (!w) return;
    if (text) { w.textContent = text; w.style.display = 'block'; }
    else w.style.display = 'none';
  }
  function shakeMonster(big) {
    mEl.classList.remove('shake-s','shake-l','hurt','hurt-skill'); void mEl.offsetWidth;
    mEl.classList.add(big?'shake-l':'shake-s');
    mEl.classList.add(big?'hurt-skill':'hurt');   /* 일반 = 흰색 플래시 / 스킬 = 황금 섬광 */
    setTimeout(()=>mEl.classList.remove('hurt','hurt-skill'), big?400:200);
  }
  function shakeScreen() {
    mainEl.classList.remove('shake-l'); void mainEl.offsetWidth;
    mainEl.classList.add('shake-l');
  }

  function mainButtons() {
    showingSkills = false;
    panel.innerHTML = `
      <button class="btn" style="width:128px" id="b-atk">공격 (Z)</button>
      <button class="btn" style="width:128px" id="b-skill">스킬 (S)</button>
      <button class="btn" style="width:128px" id="b-def">방어 (D)</button>
      <button class="btn ${(s.potions||0)<1?'disabled':''}" style="width:128px" id="b-pot">물약 ${s.potions||0} (A)</button>
      <button class="btn" style="width:128px" id="b-run">도망 (X)</button>`;
    bindBtn('b-atk', doAttack);
    bindBtn('b-skill', openSkills);
    bindBtn('b-def', doDefend);
    bindBtn('b-pot', doPotion);
    bindBtn('b-run', doRun);
  }
  function doDefend() {
    if (processing || mHp<=0) return;
    processing = true;
    defending = true;
    if (skillCd > 0) skillCd--;
    engine.addLog('방어 태세를 취했다.');
    SFX.click();
    later(monsterAttack, 800);
  }
  function doPotion() {
    if (processing || mHp<=0) return;
    if ((s.potions||0) < 1) { engine.addLog('물약이 없습니다.'); return; }
    if (s.hp >= s.max_hp) { engine.addLog('체력이 이미 가득 찼습니다.'); return; }
    processing = true;
    s.potions--;
    const heal = Math.floor(s.max_hp * 0.2);
    s.hp = Math.min(s.max_hp, s.hp + heal);
    if (skillCd > 0) skillCd--;
    engine.addLog(`물약을 마셨다. HP +${fmt(heal)} [남은 물약 ${s.potions}]`);
    SFX.tone && (SFX.tone(392,.1,'triangle',.1), SFX.tone(523,.14,'triangle',.09,.08));
    refreshSidebar();
    later(monsterAttack, 800);
  }
  function skillButtons() {
    const skills = s.skills || [];
    if (!skills.length) { engine.addLog('배운 스킬이 없습니다.'); mainButtons(); return; }
    showingSkills = true;
    const keys = ['Q','W','E'];
    panel.innerHTML = skills.map((sk,i)=>
      skillCd > 0
        ? `<button class="btn disabled" style="width:150px">[쿨타임 ${skillCd}턴]</button>`
        : `<button class="btn" style="width:150px" data-skill="${i}">${esc(sk)} (${keys[i]||''})</button>`
    ).join('') + `<button class="btn" style="width:150px" id="b-cancel">돌아가기 (ESC)</button>`;
    panel.querySelectorAll('[data-skill]').forEach(btn=>
      btn.addEventListener('click', ()=>{ SFX.click(); useSkill(skills[Number(btn.dataset.skill)]); }));
    bindBtn('b-cancel', mainButtons);
  }
  function openSkills() { if (processing || mHp<=0) return; skillButtons(); }

  function doAttack() {
    if (processing || mHp<=0) return;
    processing = true;
    SFX.attack();
    const atk = engine.getTotalAtk().total;
    let dmg = Math.floor(atk*0.9 + Math.random()*(atk*0.2));
    if (atkDownTurns > 0) dmg = Math.floor(dmg * 0.85);
    mHp -= dmg;
    updateMonsterHp();
    shakeMonster(false);
    floatText('-'+fmt(dmg), '');
    if (skillCd > 0) skillCd--;
    engine.addLog(`${monster.name}에게 ${fmt(dmg)} 피해를 입혔습니다!`);
    if (mHp <= 0) later(onVictory, 500);
    else later(monsterAttack, 800);
  }
  function useSkill(name) {
    if (processing || mHp<=0 || skillCd>0) { mainButtons(); return; }
    processing = true;
    SFX.skill();
    const atk = engine.getTotalAtk().total;
    const mult = 2 + Math.random();
    let dmg = Math.floor((atk*0.9 + Math.random()*(atk*0.2)) * mult);
    if (atkDownTurns > 0) dmg = Math.floor(dmg * 0.85);
    mHp -= dmg;
    skillCd = SKILL_COOLDOWN;
    updateMonsterHp();
    shakeMonster(true);
    floatText('-'+fmt(dmg), 'skill');
    const flash = document.createElement('div'); flash.className='flash-skill'; screenEl.appendChild(flash);
    setTimeout(()=>flash.remove(), 600);
    const big = document.createElement('div'); big.className='skill-name-big'; big.textContent = name;
    screenEl.appendChild(big); setTimeout(()=>big.remove(), 1650);
    engine.addLog(`[${name}](으)로 ${monster.name}에게 ${fmt(dmg)} 피해를 입혔습니다!`);
    if (mHp <= 0) later(onVictory, 600);
    else later(monsterAttack, 900);
  }
  function monsterAttack() {
    if (victory) return;
    mTurn++;
    if (atkDownTurns > 0) atkDownTurns--;   /* 모래폭풍 디버프는 내 행동 1회마다 감소 */

    /* --- 강공격 발동 턴 --- */
    if (heavy && heavyCharged) {
      heavyCharged = false;
      setWarnBanner(null);
      let dmg = Math.floor(((monster.min+monster.max)/2) * heavy.mult * (0.95 + Math.random()*0.1));
      engine.addLog(heavy.fire, );
      if (defending) {
        dmg = Math.floor(dmg * 0.4);
        s.hp -= dmg;
        engine.addLog('방어에 성공했다.');
        engine.addLog(`${fmt(dmg)} 피해를 입었습니다!`);
        guardFx();
      } else {
        s.hp -= dmg;
        engine.addLog(`${fmt(dmg)} 피해를 입었습니다!`);
        heavyHitFx();
        if (heavy.extra === 'sand') { atkDownTurns = 2; engine.addLog('공격력이 떨어졌다.(2턴)'); }
        else if (heavy.extra === 'petrify') { petrified = true; engine.addLog('몸이 굳어 움직일 수 없다.(1턴)'); }
        else if (heavy.extra === 'frost') { frostTurns = 2; engine.addLog('동상 피해를 입었다.(2턴)'); }
      }
    }
    /* --- 예고 턴 (3~6턴 랜덤 주기, 공격 대신 준비) --- */
    else if (heavy && mTurn >= nextWarn) {
      engine.addLog(heavy.warn);
      setWarnBanner(heavy.banner);
      heavyCharged = true;
      nextWarn = mTurn + 3 + Math.floor(Math.random()*4);   /* 다음 예고까지 3~6행동 간격 */
    }
    /* --- 일반 공격 --- */
    else {
      let dmg = monster.min + Math.floor(Math.random()*(monster.max-monster.min+1));
      if (defending) {
        dmg = Math.floor(dmg * 0.4);
        s.hp -= dmg;
        engine.addLog('방어에 성공했다.');
        engine.addLog(`${fmt(dmg)} 피해를 입었습니다!`);
        guardFx();
      } else {
        s.hp -= dmg;
        engine.addLog(`${fmt(dmg)} 피해를 입었습니다!`);
        SFX.hit();
        playerHitFx();
      }
    }
    defending = false;

    /* --- 동상 지속 피해 --- */
    if (frostTurns > 0) {
      frostTurns--;
      const fd = Math.max(5, Math.floor(s.max_hp * 0.05));
      s.hp -= fd;
      engine.addLog(`동상으로 ${fmt(fd)} 피해를 입었다.`);
    }
    refreshSidebar();
    if (s.hp <= 0) { later(()=>showGameOver(), 700); return; }

    /* --- 석화: 다음 내 턴 스킵 --- */
    if (petrified) {
      petrified = false;
      mainButtons();
      panel.querySelectorAll('.btn').forEach(b=>b.classList.add('disabled'));
      later(()=>{ if (!victory && s.hp > 0) monsterAttack(); }, 1300);
      return;
    }
    processing = false;
    mainButtons();
  }
  function doRun() {
    if (processing || mHp<=0) return;
    if (monster.boss === 1) { engine.addLog('보스전에서는 도망칠 수 없습니다!'); return; }
    if (Math.random() < 0.6) {
      engine.addLog('무사히 도망쳤습니다.');
      showExplore(areaId);
    } else {
      if (skillCd > 0) skillCd--;
      processing = true;
      engine.addLog('도망에 실패했습니다! 몬스터가 공격합니다!');
      later(monsterAttack, 800);
    }
  }
  function onVictory() {
    if (victory) return; victory = true;
    const goldReward = Math.floor(monster.gold * (0.8 + Math.random()*0.4));
    const expReward = monster.exp;
    s.gold += goldReward;
    s.exp += expReward;
    if (areaId in s.kills_by_area) s.kills_by_area[areaId]++;
    while (s.exp >= engine.neededExp()) {
      s.exp -= engine.neededExp();
      s.level++;
      const hpGain = 30 + s.level * 8;
      s.max_hp += hpGain;
      s.hp = s.max_hp;
      engine.addLog(`레벨업! Lv.${fmt(s.level)}`);
      SFX.win();
    }
    engine.checkTitles();
    engine.addLog(`승리! +${fmt(goldReward)}Gold / +${fmt(expReward)}EXP를 얻었습니다.`);
    /* 버튼은 유지하되 비활성화 (레이아웃 유지, 입력만 차단) */
    showingSkills = false; mainButtons();
    panel.querySelectorAll('.btn').forEach(b=>b.classList.add('disabled'));
    /* 1) 그림자와 함께 소멸 → 2) 빈 자리에서 전리품 */
    mEl.classList.remove('hurt','hurt-skill','shake-s','shake-l');
    later(()=>{
      mEl.classList.add('dead');
      const sh = mainEl.querySelector('.monster-shadow');
      if (sh) sh.classList.add('gone');
    }, 250);
    later(()=>{
      dropGold();
      SFX.coin();
      floatText('+'+fmt(goldReward)+'G', 'gold-t');
      setTimeout(()=>floatText('+'+fmt(expReward)+'EXP', 'exp-t'), 220);
      refreshSidebar();
    }, 780);

    if (monster.boss === 1 && !s.bosses_defeated.includes(monster.name)) {
      s.bosses_defeated.push(monster.name);
      engine.checkTitles();
      const medal = MEDALS.find(m=>m.boss===monster.name);
      engine.addLog(`축하합니다! ${monster.name}을(를) 처치했습니다!`);
      if (monster.name === '사막의 지배자 파라오') {
        later(()=>showDesertEvent(areaId, medal, monster.name), 2200);
      } else if (monster.name === '산의 지배자 가고일') {
        later(()=>showMedalVictory(areaId, medal, monster.name, ()=>showEndingCrawl()), 2200);
      } else {
        later(()=>showMedalVictory(areaId, medal, monster.name), 2200);
      }
      return;
    }
    later(()=>showExplore(areaId), 2200);
  }

  mainButtons();
  currentKeyHandler = e => {
    const k = e.key;
    if (showingSkills) {
      if (k==='Escape') { SFX.click(); mainButtons(); }
      const idx = {'q':0,'Q':0,'ㅂ':0,'w':1,'W':1,'ㅈ':1,'e':2,'E':2,'ㄷ':2}[k];
      if (idx !== undefined && s.skills[idx] && skillCd<=0) { SFX.click(); useSkill(s.skills[idx]); }
      return;
    }
    if (k==='z'||k==='Z'||k==='ㅋ') { doAttack(); }
    else if (k==='s'||k==='S'||k==='ㄴ') { SFX.click(); openSkills(); }
    else if (k==='d'||k==='D'||k==='ㅇ') { doDefend(); }
    else if (k==='a'||k==='A'||k==='ㅁ') { doPotion(); }
    else if (k==='x'||k==='X'||k==='ㅌ') { SFX.click(); doRun(); }
  };
}

