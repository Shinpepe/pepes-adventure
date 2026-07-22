'use strict';
/* [분할 07] 마을/NPC/훈장 보관함/지도 */
/* =====================================================================
   마을
   ===================================================================== */
const NPC_EMOJI = { inn:{ '남성':'👩‍🦰', '여성':'🧑‍🦱' }, shop:{ '남성':'👩‍💼', '여성':'🧔' }, chef:{ '남성':'👩‍🍳', '여성':'👨‍🍳' } };
/* 플레이어 성별에 따라 NPC 이미지가 바뀜 (여성 플레이어 → 남성 NPC(_man)) */
function npcImg(key, date=false) {
  const base = { inn:'npc_host', shop:'npc_merchant', chef:'npc_chef' }[key];
  if (!base) return '';
  const man = engine.state.gender === '여성' ? '_man' : '';
  return `${base}${man}${date?'_date':''}.png`;
}

function innMessage() {
  const g = engine.state.npc_affinity.inn.grade, gen = engine.state.gender||'남성';
  if (g==='best') return gen==='남성' ? '또 오셨네요, 반가워요.\n\n오늘도 푹 쉬다 가세요.' : '또 보네, 반가워!\n\n오늘도 푹 쉬다 가~';
  if (g==='friend') return gen==='남성' ? '많이 피곤하시죠?\n\n늘 쓰시던 방으로 준비해드릴까요?' : '많이 피곤하지?\n\n늘 쓰던 방으로 준비해줄까?';
  return gen==='남성' ? '먼 길 오느라 고생하셨어요.\n\n좀 쉬었다 가시겠어요?' : '먼 길 오느라 고생했어~\n\n좀 쉬었다 갈래?';
}
function shopMessage() {
  const g = engine.state.npc_affinity.shop.grade;
  if (g==='best') return '오늘도 오셨네요.\n\n기다리고 있었어요.';
  if (g==='friend') return '날씨가 좋네요.\n\n오늘은 어떤걸 도와드릴까요?';
  return '좋은 물건이 많이 들어왔어요.\n\n천천히 둘러보세요.';
}
function chefMessage() {
  const g = engine.state.npc_affinity.chef.grade;
  if (g==='best') return '제 음식을 그렇게 좋아하시다니~\n\n최고로 맛있게 요리해드릴게요!';
  if (g==='friend') return '단골 고객이시네요~ 반가워요!\n\n오늘도 맛있게 드세요!';
  return '맛있는 음식을 준비해드릴게요~\n\n편하게 즐겨주세요!';
}

function showVillage(location='MAIN', npcMsg='') {
  clearView();
  BGM.play(location==='CASINO' ? 'casino' : 'game');   /* 원작: rest/cafe는 데이트 전용, 시설은 전부 game_bgm */
  const s = engine.state;
  const entDone = s.bosses_defeated.includes('숲의 지배자 엔트');
  const gen = s.gender || '남성';

  let mainHTML = '';
  if (location === 'MAIN') {
    mainHTML = `
      <div class="big-title" style="position:absolute;left:0;right:0;top:76px;">평화로운 모험가 마을</div>
      <div class="sub-text" style="position:absolute;left:0;right:0;top:138px">ESC를 눌러 메뉴를 열 수 있습니다</div>
      <div class="section-label" style="position:absolute;left:0;right:0;top:243px">모 험</div>
      <div class="hrow" style="position:absolute;left:0;right:0;top:274px">
        <button class="btn" style="width:180px" id="v-go">갈림길로 떠나기</button>
        <button class="btn" style="width:180px" id="v-medal">훈장 보관함 (B)</button>
        <button class="btn" style="width:180px" id="v-map">지도 보기 (M)</button>
      </div>
      <div class="section-label" style="position:absolute;left:0;right:0;top:373px">마 을 시 설</div>
      <div class="hrow" style="position:absolute;left:0;right:0;top:404px">
        <button class="btn" style="width:180px" id="v-shop">상점 가기</button>
        <button class="btn" style="width:180px" id="v-inn">여관 가기</button>
        <button class="btn" style="width:180px" id="v-rest">${entDone?'식당 가기':'식당 (공사중)'}</button>
      </div>
      <div class="hrow" style="position:absolute;left:0;right:0;top:465px">
        <button class="btn" style="width:180px" id="v-casino">도박장 가기</button>
      </div>`;
  } else if (location === 'MEDAL') {
    const defeated = s.bosses_defeated;
    const cells = MEDALS.map((m,i)=>{
      const won = defeated.includes(m.boss);
      const cx = [240,510,240,510][i], cy = [185,185,350,350][i];
      const medalFile = won ? m.img : 'medal_none.PNG';
      return `
        <img src="${ASSET_BASE}medal_shadow.png" alt="" style="position:absolute;left:${cx-65}px;top:${cy-62}px;width:130px;height:125px" onerror="this.remove()">
        <div style="position:absolute;left:${cx-55}px;top:${cy-55}px;width:110px;height:110px;display:flex;align-items:center;justify-content:center;${won?'':'filter:grayscale(1) brightness(.5)'}">${aimg(medalFile, won?m.emoji:'🏅', 88, '', 1.25)}</div>
        <div style="position:absolute;left:${cx-135}px;top:${cy+66}px;width:270px;text-align:center;font-size:11px;color:${won?'gold':'#646464'};text-shadow:1px 1px 0 #000">${won?esc(m.boss):'???'}</div>`;
    }).join('');
    mainHTML = `
      <div class="bg-medal" style="position:absolute;inset:0"></div>
      <div class="main-dim" style="background:rgba(0,0,0,.51)"></div>
      <div class="section-label" style="position:absolute;left:0;right:0;top:58px;font-size:15px">훈장 보관함</div>
      ${cells}
      <div class="sub-text" style="position:absolute;left:0;right:0;top:495px;font-size:14px;color:#f0f0f0">ESC를 눌러 닫기</div>`;
  } else {
    // NPC 하위 화면
    const conf = {
      SHOP_NPC:  { title:'장비 상점', npc:NPC_EMOJI.shop[gen], img:npcImg('shop'), bg:'bg-shop' },
      INN_NPC:   { title:'마을 여관', npc:NPC_EMOJI.inn[gen], img:npcImg('inn'), bg:'bg-inn' },
      REST_NPC:  { title:'마을 식당', npc:NPC_EMOJI.chef[gen], img:npcImg('chef'), bg:'bg-rest' },
      CONST_NPC: { title:'공사 중...', npc:'', shadowOnly:npcImg('chef').replace('.png','_shadow.png'), bg:'bg-const' },
      CASINO:    { title:'도박장', npc:'', bg:'bg-casino' }
    }[location];
    let buttons = '';
    if (location === 'SHOP_NPC') {
      buttons = `<div class="hrow"><button class="btn" style="width:150px" id="n-buy">구매하기</button>
        <button class="btn" style="width:150px" id="n-sell">판매하기</button></div>
        <button class="btn" style="width:320px;margin-top:14px" id="n-back">◀ 상점 나가기</button>`;
    } else if (location === 'INN_NPC') {
      buttons = `<button class="btn" style="width:320px" id="n-rest">zZ 휴식하기 (20 Gold)</button>
        <button class="btn ${s.potions>=5?'disabled':''}" style="width:320px;margin-top:14px" id="n-potion">물약 구매 (150 Gold) [${s.potions||0}/5]</button>
        <button class="btn" style="width:320px;margin-top:14px" id="n-back">◀ 여관 나가기</button>`;
    } else if (location === 'REST_NPC') {
      buttons = `<button class="btn" style="width:320px" id="n-food">음식 구매하기</button>
        <button class="btn" style="width:320px;margin-top:14px" id="n-back">◀ 식당 나가기</button>`;
    } else if (location === 'CONST_NPC') {
      buttons = `<button class="btn" style="width:320px" id="n-back">◀ 돌아가기</button>`;
    } else if (location === 'CASINO') {
      buttons = `<div class="hrow">
        <button class="btn" style="width:150px" id="n-slot">슬롯머신</button>
        <button class="btn" style="width:150px" id="n-bj">블랙잭</button>
        <button class="btn" style="width:150px" id="n-holdem">텍사스 홀덤</button></div>
        <button class="btn" style="width:320px;margin-top:14px" id="n-back">◀ 도박장 나가기</button>`;
    }
    const dateKey = { INN_NPC:'inn', SHOP_NPC:'shop', REST_NPC:'chef' }[location];
    const showDate = dateKey && s.npc_affinity[dateKey].grade === 'best';
    const shadowFile = conf.img ? conf.img.replace('.png','_shadow.png') : (conf.shadowOnly || '');
    const npcHTML = conf.img ? `
        <img src="${ASSET_BASE}${shadowFile}" alt="" style="position:absolute;left:52px;top:294px;width:266px;height:262px;object-fit:contain" onerror="this.remove()">
        <div style="position:absolute;left:60px;top:300px;width:250px;height:250px;font-size:130px;visibility:hidden;display:flex;align-items:center;justify-content:center" id="npc-fb">${conf.npc}</div>
        <img src="${ASSET_BASE}${conf.img}" alt="" style="position:absolute;left:60px;top:300px;width:250px;height:250px;object-fit:contain" onerror="document.getElementById('npc-fb').style.visibility='visible';this.remove()">`
      : (shadowFile ? `
        <img src="${ASSET_BASE}${shadowFile}" alt="" style="position:absolute;left:52px;top:294px;width:266px;height:262px;object-fit:contain" onerror="this.remove()">` : '');
    const bubbleHTML = npcMsg ? `
        <div style="position:absolute;left:340px;top:405px;transform:translateY(-50%);width:350px;min-height:120px;background:rgba(50,40,30,.86);border:2px solid #b48c50;display:flex;align-items:center;justify-content:center;text-align:center;font-size:14px;line-height:1.55;white-space:pre-line;padding:12px 20px;box-sizing:border-box">${esc(npcMsg)}</div>
        <div style="position:absolute;left:322px;top:390px;border:10px solid transparent;border-right:14px solid #b48c50"></div>
        <div style="position:absolute;left:327px;top:392px;border:8px solid transparent;border-right:12px solid rgb(50,40,30)"></div>` : '';
    mainHTML = `
      <div class="${conf.bg}" style="position:absolute;inset:0"></div>
      <div class="main-dim" style="background:rgba(0,0,0,.51)"></div>
      <div class="mid-title" style="position:absolute;left:0;right:0;top:70px;font-size:30px">${conf.title}</div>
      ${npcHTML}${bubbleHTML}
      ${showDate?`<button class="btn" style="position:absolute;left:340px;top:478px;width:350px;height:44px" id="n-date">데이트 가기</button>`:''}
      <div style="position:absolute;left:0;right:0;top:196px;display:flex;flex-direction:column;align-items:center">${buttons}</div>`;
  }

  screenEl.innerHTML = `
    <div class="bg-town" style="position:absolute;left:250px;top:0;width:750px;height:550px"></div>
    <div class="main-area">${mainHTML}</div>
    ${sidebarHTML()}${logHTML()}
    <div id="map-overlay" style="display:none"></div>`;

  // 바인딩
  if (location === 'MAIN') {
    bindBtn('v-go', ()=>showAreaSelect());
    bindBtn('v-medal', ()=>showVillage('MEDAL'));
    bindBtn('v-map', ()=>toggleMap());
    bindBtn('v-shop', ()=>showVillage('SHOP_NPC', shopMessage()));
    bindBtn('v-inn', ()=>showVillage('INN_NPC', innMessage()));
    bindBtn('v-rest', ()=> entDone
      ? showVillage('REST_NPC', chefMessage())
      : showVillage('CONST_NPC', '숲에 몬스터들이 많아서\n\n공사에 사용할 나무가 부족하대요...\n\n완성되면 다시 방문해주세요!'));
    bindBtn('v-casino', ()=>showVillage('CASINO'));
  } else {
    bindBtn('n-back', ()=>showVillage('MAIN'));
    bindBtn('n-buy', ()=>showShop('buy'));
    bindBtn('n-sell', ()=>showShop('sell'));
    bindBtn('n-food', ()=>showRestaurant());
    bindBtn('n-rest', ()=>doInnRest());
    bindBtn('n-potion', ()=>{
      if ((s.potions||0) >= 5) { engine.addLog('물약은 5개까지만 들고 다닐 수 있습니다.'); return; }
      if (s.gold < 150) { engine.addLog('골드가 부족합니다.'); return; }
      s.gold -= 150; s.potions = (s.potions||0) + 1;
      SFX.coin();
      engine.addLog(`물약을 구매했습니다. [${s.potions}/5]`, );
      showVillage('INN_NPC', npcMsg);
    });
    bindBtn('n-slot', ()=>showSlotMachine());
    bindBtn('n-bj', ()=>showBlackjack());
    bindBtn('n-holdem', ()=>showHoldem());
    const dateKey = { INN_NPC:'inn', SHOP_NPC:'shop', REST_NPC:'chef' }[location];
    if (dateKey) bindBtn('n-date', ()=>showNpcDate(dateKey));
  }

  currentKeyHandler = e => {
    const mapOpen = document.getElementById('map-overlay')?.style.display !== 'none';
    if (e.key === 'Escape') {
      SFX.click();
      if (mapOpen) { toggleMap(); return; }
      if (location === 'MAIN') showSystemMenu({ returnTo:()=>showVillage('MAIN') });
      else showVillage('MAIN');
    }
    if (location === 'MAIN' && !mapOpen) {
      if (e.key==='m'||e.key==='M'||e.key==='ㅡ') { SFX.click(); toggleMap(); }
      if (e.key==='b'||e.key==='B'||e.key==='ㅠ') { SFX.click(); showVillage('MEDAL'); }
    }
  };
}

function toggleMap() {
  const ov = document.getElementById('map-overlay');
  if (!ov) return;
  if (ov.style.display === 'none') {
    ov.style.display = 'block';
    ov.style.cssText += ';position:absolute;inset:0;background:rgba(0,0,0,.78);z-index:50';
    const s = engine.state;
    const unlocked = a => a==='forest' || s.bosses_defeated.includes(AREA_UNLOCK_BOSS[a]);
    ov.innerHTML = `
      <img src="${ASSET_BASE}world_map.png" alt="" style="position:absolute;left:625px;top:350px;transform:translate(-50%,-50%);width:700px;height:700px;max-height:696px;object-fit:contain"
        onerror="const f=document.getElementById('map-fallback'); if(f) f.style.display='block'; this.remove()">
      <div id="map-fallback" style="display:none;position:absolute;left:625px;top:350px;transform:translate(-50%,-50%);width:640px;height:560px;
                  background:linear-gradient(160deg,#d9c9a3,#c4b087);border:6px double #7a643c;padding:30px;color:#3c2f1e;box-sizing:border-box">
        <div style="text-align:center;font-size:24px;font-weight:bold">— 세 계 지 도 —</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:26px;text-align:center">
          ${AREA_ORDER.map(a=>`
            <div style="background:rgba(255,255,255,.35);border:2px solid #7a643c;padding:14px 10px;${unlocked(a)?'':'opacity:.4'}">
              <div style="font-size:15px;font-weight:bold">${AREAS[a].name}${unlocked(a)?'':' (봉인)'}</div>
              <div style="font-size:11px;margin-top:4px">처치 : ${fmt(s.kills_by_area[a])}마리</div>
            </div>`).join('')}
        </div>
        <div style="text-align:center;margin-top:20px;font-size:14px">모험가 마을 — 당신의 거점</div>
      </div>
      <div style="position:absolute;left:625px;bottom:38px;transform:translateX(-50%);font-size:12px;color:#282828;text-shadow:0 0 4px rgba(255,255,255,.5)">ESC를 눌러 닫기</div>`;
  } else {
    ov.style.display = 'none'; ov.innerHTML = '';
  }
}

function doInnRest() {
  const s = engine.state;
  if (s.gold < 20) { engine.addLog('골드가 부족합니다!'); return; }
  s.gold -= 20;
  engine.updateInnAffinity();
  engine.addLog('20골드를 지불하고 여관에서 휴식을 취합니다...');
  refreshSidebar();
  const f = document.createElement('div');
  f.className = 'fade-overlay';
  f.style.cssText += ';opacity:0;transition:opacity 1.4s;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff';
  f.textContent = 'zZ 휴식 중...';
  screenEl.appendChild(f);
  requestAnimationFrame(()=>f.style.opacity='1');
  later(()=>{
    s.hp = s.max_hp;
    engine.addLog('HP가 모두 회복되었습니다!');
    refreshSidebar();
    f.textContent = '';
    f.style.opacity = '0';
    later(()=>f.remove(), 1500);
  }, 1700);
}

function showNpcDate(npcKey) {
  const gen = engine.state.gender || '남성';
  const lines = NPC_DATE_DIALOGUES[npcKey][gen];
  showDialogScene({ lines, cafe:true, cafeImg:npcImg(npcKey,true), bgm: engine.state.gender==='여성' ? 'rest' : 'cafe', bgClass:'bg-dark', onFinish: ()=>{
    const loc = { inn:'INN_NPC', shop:'SHOP_NPC', chef:'REST_NPC' }[npcKey];
    const msg = { inn:innMessage(), shop:shopMessage(), chef:chefMessage() }[npcKey];
    showVillage(loc, msg);
  }});
}

