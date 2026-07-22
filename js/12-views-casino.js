'use strict';
/* [분할 12] 도박장 (슬롯/블랙잭/홀덤) */
/* =====================================================================
   도박장 — 슬롯머신
   ===================================================================== */
const SLOT_SYMBOLS = [
  { key:'lucky',      img:'slot/lucky.PNG',      reward:2000, weight:1 },
  { key:'bar',        img:'slot/bar.PNG',        reward:900,  weight:2 },
  { key:'bell',       img:'slot/bell.PNG',       reward:700,  weight:2 },
  { key:'watermelon', img:'slot/watermelon.PNG', reward:500,  weight:3 },
  { key:'orange',     img:'slot/orange.PNG',     reward:400,  weight:3 },
  { key:'cherry',     img:'slot/cherry.PNG',     reward:200,  weight:5 },
  { key:'coconut',    img:'slot/coconut.PNG',    reward:100,  weight:5 }
];
function slotCellHTML(sym) {
  return `<img src="${ASSET_BASE}${sym.img}" alt="" style="width:80px;height:58px;object-fit:contain"
    onerror="this.outerHTML='<span style=\'font-size:16px;font-weight:bold\'>'+this.dataset.k+'</span>'" data-k="${sym.key.slice(0,3).toUpperCase()}">`;
}
function slotPick() {
  const total = SLOT_SYMBOLS.reduce((a,s)=>a+s.weight,0);
  let r = Math.random()*total;
  for (const s of SLOT_SYMBOLS) { r -= s.weight; if (r <= 0) return s; }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length-1];
}
function showSlotMachine() {
  clearView(); BGM.play('casino');
  const s = engine.state;
  const BET = 10;
  let spinning = false;

  screenEl.innerHTML = `
    <div style="position:absolute;inset:0;background:rgb(20,20,30)"></div>
    <div style="position:absolute;left:270px;top:20px;width:710px;height:510px;background:rgb(25,25,40);border:2px solid rgb(80,100,180)"></div>
    <div class="mid-title" style="position:absolute;left:250px;width:750px;top:88px;font-size:24px">슬롯머신</div>
    <div class="sub-text" style="position:absolute;left:250px;width:750px;top:127px">행운을 시험해보세요!</div>
    <div style="position:absolute;left:250px;width:750px;top:160px;text-align:center;font-size:13px;color:#c8c8c8" id="sl-balance"></div>
    <div style="position:absolute;left:300px;top:182px;width:170px;text-align:center;font-size:13px;color:#c8c8c8;line-height:2.15">
      <div>[ 배율표 ]</div>
      ${SLOT_SYMBOLS.map(x=>`<div style="display:flex;justify-content:space-between;font-size:12px"><span>${x.key}</span><span>+${x.reward}G</span></div>`).join('')}
    </div>
    <div style="position:absolute;left:515px;top:205px;width:380px;height:130px;background:rgb(40,40,60);border:3px solid rgb(80,100,180)"></div>
    <div class="slot-reels" style="position:absolute;left:530px;top:225px;width:350px;display:flex;justify-content:space-between">
      <div class="slot-reel" id="reel-0" style="width:90px;height:90px;background:rgb(30,30,50);display:flex;align-items:center;justify-content:center">${slotCellHTML(SLOT_SYMBOLS[5])}</div>
      <div class="slot-reel" id="reel-1" style="width:90px;height:90px;background:rgb(30,30,50);display:flex;align-items:center;justify-content:center">${slotCellHTML(SLOT_SYMBOLS[5])}</div>
      <div class="slot-reel" id="reel-2" style="width:90px;height:90px;background:rgb(30,30,50);display:flex;align-items:center;justify-content:center">${slotCellHTML(SLOT_SYMBOLS[5])}</div>
    </div>
    <div id="sl-msg" style="position:absolute;left:515px;top:358px;width:380px;text-align:center;font-size:15px;font-weight:bold;height:22px"></div>
    <div style="position:absolute;left:250px;width:750px;top:400px;display:flex;flex-direction:column;align-items:center;gap:15px">
      <button class="btn" style="width:250px" id="sl-spin">슬롯 돌리기 (SPACE)</button>
      <button class="btn" style="width:250px" id="sl-back">◀ 돌아가기</button>
    </div>
    ${sidebarHTML()}${logHTML()}`;

  function updateBalance() {
    document.getElementById('sl-balance').textContent = `베팅 : ${BET}골드  |  잔액 : ${fmt(s.gold)}골드`;
  }
  updateBalance();

  function setReel(i, sym) { document.getElementById('reel-'+i).innerHTML = slotCellHTML(sym); }
  function setSpinBtns(dis) {
    document.getElementById('sl-spin').textContent = dis ? '돌아가는 중...' : '슬롯 돌리기 (SPACE)';
    document.getElementById('sl-spin').classList.toggle('disabled', dis);
    document.getElementById('sl-back').classList.toggle('disabled', dis);
  }
  function spin() {
    if (spinning) return;
    if (s.gold < 100) {
      document.getElementById('sl-msg').textContent = '골드가 부족합니다! (100골드 이상 필요)';
      document.getElementById('sl-msg').style.color = '#ff8c50';
      return;
    }
    spinning = true; setSpinBtns(true);
    s.gold -= BET;
    s.gold_spent_slot = (s.gold_spent_slot||0) + BET;
    engine.checkTitles();
    updateBalance(); refreshSidebar();
    SFX.slot();
    document.getElementById('sl-msg').textContent = '';
    const finals = [slotPick(), slotPick(), slotPick()];
    const stopped = [false, false, false];
    const spinT = everyT(()=>{
      for (let i=0;i<3;i++) if (!stopped[i]) setReel(i, slotPick());
    }, 80);
    [2600, 3000, 3400].forEach((t,i)=>later(()=>{
      stopped[i] = true;
      setReel(i, finals[i]);
      SFX.card();
      if (i===2) {
        clearInterval(spinT);
        judge(finals);
        spinning = false; setSpinBtns(false);
      }
    }, t));
  }
  function judge(finals) {
    const msgEl = document.getElementById('sl-msg');
    if (finals[0].key===finals[1].key && finals[1].key===finals[2].key) {
      const reward = finals[0].reward;
      s.gold += reward;
      msgEl.textContent = `${finals[0].key.toUpperCase()} 3개! +${reward}골드!`;
      msgEl.style.color = 'gold';
      engine.addLog(`${finals[0].key} 3개 당첨! +${reward}골드를 얻었습니다.`);
      SFX.win();
      engine.checkTitles();
    } else {
      msgEl.textContent = '꽝! 다시 도전해보세요.';
      msgEl.style.color = '#c8c8c8';
      engine.addLog('슬롯머신 꽝...');
    }
    updateBalance(); refreshSidebar();
  }
  bindBtn('sl-spin', spin);
  bindBtn('sl-back', ()=>{ if (!spinning) showVillage('CASINO'); });
  currentKeyHandler = e => {
    if (e.key===' ') { e.preventDefault(); if (!spinning) { SFX.click(); spin(); } }
    if (e.key==='Escape' && !spinning) { SFX.click(); showVillage('CASINO'); }
  };
}

/* =====================================================================
   카드 공통
   ===================================================================== */
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function makeDeck() {
  const d = [];
  for (const su of SUITS) for (const r of RANKS) d.push({ r, s:su });
  for (let i=d.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function cardHTML(c, faceDown=false) {
  if (faceDown) return `<div class="pcard back"></div>`;
  const red = c.s==='♥'||c.s==='♦';
  return `<div class="pcard ${red?'red':''}">
    <div class="tl">${c.r}<br>${c.s}</div><div class="ct">${c.s}</div></div>`;
}
function bjValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.r==='A') { total += 11; aces++; }
    else if (['J','Q','K'].includes(c.r)) total += 10;
    else total += Number(c.r);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

/* =====================================================================
   블랙잭
   ===================================================================== */
function showBlackjack() {
  clearView(); BGM.play('casino');
  const s = engine.state;
  const BET = 50;
  let deck, player, dealer, state = 'betting'; // betting / playing / dealer / result

  screenEl.innerHTML = `
    <div class="bg-casino" style="position:absolute;inset:0"></div>
    <div class="mid-title" style="position:absolute;left:250px;width:750px;top:26px">블랙잭</div>
    <div class="sub-text" style="position:absolute;left:250px;width:750px;top:60px" id="bj-balance"></div>
    <div class="shop-panel blue" style="top:90px;height:352px;padding:20px 24px">
      <div style="text-align:center">
        <div style="font-size:13px;color:#c8c8c8">딜러 <span id="bj-dscore"></span></div>
        <div id="bj-dealer" style="margin-top:10px;min-height:86px"></div>
      </div>
      <div style="text-align:center;margin-top:22px">
        <div style="font-size:13px;color:#c8c8c8">플레이어 <span id="bj-pscore"></span></div>
        <div id="bj-player" style="margin-top:10px;min-height:86px"></div>
      </div>
      <div id="bj-msg" style="text-align:center;font-size:17px;font-weight:bold;margin-top:16px;height:24px"></div>
    </div>
    <div class="pager" id="bj-panel" style="position:absolute;left:250px;width:750px;bottom:172px"></div>
    ${sidebarHTML()}${logHTML()}`;

  function updateBalance() {
    document.getElementById('bj-balance').textContent = `베팅 : ${BET}골드  |  잔액 : ${fmt(s.gold)}골드`;
  }
  function render() {
    updateBalance();
    const hideHole = state === 'playing';
    document.getElementById('bj-dealer').innerHTML = dealer
      ? dealer.map((c,i)=>cardHTML(c, hideHole && i===0)).join('') : '';
    document.getElementById('bj-player').innerHTML = player ? player.map(c=>cardHTML(c)).join('') : '';
    document.getElementById('bj-dscore').textContent = dealer && !hideHole ? '('+bjValue(dealer)+')' :
      dealer ? '(?)' : '';
    document.getElementById('bj-pscore').textContent = player ? '('+bjValue(player)+')' : '';
    const panel = document.getElementById('bj-panel');
    if (state==='betting' || state==='result') {
      panel.innerHTML = `<button class="btn" style="width:260px" id="bj-start">게임 시작 (${BET}골드 베팅) (SPACE)</button>
        <button class="btn" style="width:180px" id="bj-back">◀ 돌아가기</button>`;
      bindBtn('bj-start', start);
      bindBtn('bj-back', ()=>showVillage('CASINO'));
    } else if (state==='playing') {
      panel.innerHTML = `<button class="btn" style="width:160px" id="bj-hit">히트 (Z)</button>
        <button class="btn" style="width:160px" id="bj-stand">스탠드 (X)</button>`;
      bindBtn('bj-hit', hit);
      bindBtn('bj-stand', stand);
    } else panel.innerHTML = '';
  }
  function msg(t, color='#fff') {
    const el = document.getElementById('bj-msg');
    el.textContent = t; el.style.color = color;
  }
  function start() {
    if (s.gold < BET) { msg('골드가 부족합니다!', '#ff8c50'); return; }
    s.gold -= BET;
    s.gold_spent_slot = (s.gold_spent_slot||0) + BET;
    engine.checkTitles();
    deck = makeDeck();
    player = [deck.pop(), deck.pop()];
    dealer = [deck.pop(), deck.pop()];
    state = 'playing';
    engine.addLog(`블랙잭 시작! ${BET}골드 베팅`);
    SFX.card(); msg('');
    refreshSidebar(); render();
    if (bjValue(player) === 21) stand();
  }
  function hit() {
    if (state!=='playing') return;
    player.push(deck.pop()); SFX.card();
    if (bjValue(player) > 21) { endRound('bust'); return; }
    render();
  }
  function stand() {
    if (state!=='playing') return;
    state = 'dealer'; render();
    const step = ()=>{
      if (bjValue(dealer) < 17) {
        dealer.push(deck.pop()); SFX.card(); render();
        later(step, 650);
      } else {
        const pv = bjValue(player), dv = bjValue(dealer);
        if (dv > 21 || pv > dv) endRound(pv===21 && player.length===2 ? 'blackjack' : 'win');
        else if (pv === dv) endRound('push');
        else endRound('lose');
      }
    };
    later(step, 600);
  }
  function endRound(outcome) {
    state = 'result';
    if (outcome === 'blackjack') {
      const reward = Math.floor(BET*2.5); s.gold += reward;
      msg(`블랙잭! +${fmt(reward-BET)}골드!`, 'gold'); SFX.win();
      engine.addLog(`블랙잭! +${fmt(reward-BET)}골드를 얻었습니다.`);
    } else if (outcome === 'win') {
      const reward = BET*2; s.gold += reward;
      msg(`승리! +${fmt(BET)}골드!`, 'gold'); SFX.win();
      engine.addLog(`블랙잭에서 승리! +${fmt(BET)}골드를 얻었습니다.`);
    } else if (outcome === 'push') {
      s.gold += BET;
      msg('무승부. 베팅금이 반환됩니다.', '#c8c8c8');
      engine.addLog('블랙잭 무승부.');
    } else if (outcome === 'bust') {
      msg(`버스트! -${BET}골드`, '#ff6464'); SFX.lose();
      engine.addLog(`버스트로 패배하였습니다. -${BET}골드를 잃었습니다.`);
    } else {
      msg(`패배... -${BET}골드`, '#ff6464'); SFX.lose();
      engine.addLog(`블랙잭에서 패배하였습니다. -${BET}골드를 잃었습니다.`);
    }
    engine.checkTitles();
    refreshSidebar(); render();
  }
  render();
  currentKeyHandler = e => {
    if (e.key===' ') { e.preventDefault(); if (state==='betting'||state==='result') { SFX.click(); start(); } }
    if (e.key==='z'||e.key==='Z'||e.key==='ㅋ') hit();
    if (e.key==='x'||e.key==='X'||e.key==='ㅌ') stand();
    if (e.key==='Escape' && (state==='betting'||state==='result')) { SFX.click(); showVillage('CASINO'); }
  };
}

/* =====================================================================
   텍사스 홀덤 (1:1 AI 대전)
   ===================================================================== */
function rankVal(r){ return {A:14,K:13,Q:12,J:11}[r] || Number(r); }
function evalBest(cards7) {
  // 7장 중 5장 최고 조합 — [카테고리, 타이브레이커...] 배열로 비교
  const combos = [];
  const n = cards7.length;
  for (let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++)
    combos.push([cards7[a],cards7[b],cards7[c],cards7[d],cards7[e]]);
  let best = null;
  for (const hand of combos) {
    const score = eval5(hand);
    if (!best || cmpScore(score,best) > 0) best = score;
  }
  return best;
}
function eval5(hand) {
  const vals = hand.map(c=>rankVal(c.r)).sort((a,b)=>b-a);
  const suits = hand.map(c=>c.s);
  const flush = suits.every(s=>s===suits[0]);
  let straightHigh = 0;
  const uniq = [...new Set(vals)].sort((a,b)=>b-a);
  if (uniq.length===5) {
    if (uniq[0]-uniq[4]===4) straightHigh = uniq[0];
    else if (uniq.join(',')==='14,5,4,3,2') straightHigh = 5;
  }
  const counts = {};
  vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  const groups = Object.entries(counts).map(([v,c])=>[Number(v),c])
    .sort((a,b)=> b[1]-a[1] || b[0]-a[0]);
  const kick = groups.flatMap(([v,c])=>Array(c).fill(v));
  if (flush && straightHigh) return [8, straightHigh];
  if (groups[0][1]===4) return [7, ...kick];
  if (groups[0][1]===3 && groups[1][1]===2) return [6, ...kick];
  if (flush) return [5, ...vals];
  if (straightHigh) return [4, straightHigh];
  if (groups[0][1]===3) return [3, ...kick];
  if (groups[0][1]===2 && groups[1][1]===2) return [2, ...kick];
  if (groups[0][1]===2) return [1, ...kick];
  return [0, ...vals];
}
function cmpScore(a,b) {
  for (let i=0;i<Math.max(a.length,b.length);i++) {
    const x=a[i]||0, y=b[i]||0;
    if (x!==y) return x-y;
  }
  return 0;
}
const HAND_NAMES = ['하이 카드','원 페어','투 페어','트리플','스트레이트','플러시','풀 하우스','포 카드','스트레이트 플러시'];

function showHoldem() {
  clearView(); BGM.play('casino');
  const s = engine.state;
  const BASE = 100, MIN_GOLD = 200;
  let deck, pHole, aHole, community, stage='betting', pot=0, pBet=0, aBet=0, curBet=0;
  let pTotal = 0, pActs = 0, pRaises = 0;
  let revealed = 0, busy = false;

  screenEl.innerHTML = `
    <div class="bg-casino" style="position:absolute;inset:0"></div>
    <div class="mid-title" style="position:absolute;left:250px;width:750px;top:22px">텍사스 홀덤</div>
    <div class="sub-text" style="position:absolute;left:250px;width:750px;top:56px" id="hd-balance"></div>
    <div class="shop-panel blue" style="top:80px;height:372px;padding:14px 24px">
      <div style="text-align:center">
        <div style="font-size:13px;color:#c8c8c8">상대 (AI)</div>
        <div id="hd-ai" style="margin-top:8px;min-height:86px"></div>
      </div>
      <div style="text-align:center;margin-top:5px">
        <div style="font-size:12px;color:gold" id="hd-pot"></div>
        <div id="hd-comm" style="margin-top:8px;min-height:86px"></div>
      </div>
      <div style="text-align:center;margin-top:5px">
        <div style="font-size:13px;color:#c8c8c8">플레이어 <span id="hd-pname"></span></div>
        <div id="hd-hole" style="margin-top:8px;min-height:86px"></div>
      </div>
      <div id="hd-msg" style="position:absolute;right:14px;top:12px;max-width:250px;background:rgba(10,10,24,.85);border:1px solid rgb(80,100,180);padding:8px 12px;font-size:13px;font-weight:bold;text-align:right;line-height:1.6;white-space:pre-line;display:none"></div>
    </div>
    <div class="pager" id="hd-panel" style="position:absolute;left:250px;width:750px;bottom:172px;gap:10px"></div>
    ${sidebarHTML()}${logHTML()}`;

  function updateInfo() {
    document.getElementById('hd-balance').textContent = `블라인드 : ${BASE}골드  |  잔액 : ${fmt(s.gold)}골드`;
    document.getElementById('hd-pot').textContent = pot ? `POT : ${fmt(pot)} Gold` : '';
  }
  function msg(t, color='#fff') {
    const el = document.getElementById('hd-msg');
    el.textContent = t; el.style.color = color;
    el.style.display = t ? 'block' : 'none';
  }
  function render(showAI=false) {
    updateInfo();
    document.getElementById('hd-ai').innerHTML = aHole
      ? aHole.map(c=>cardHTML(c, !showAI)).join('') : '';
    document.getElementById('hd-hole').innerHTML = pHole ? pHole.map(c=>cardHTML(c)).join('') : '';
    document.getElementById('hd-comm').innerHTML = community
      ? community.map((c,i)=>cardHTML(c, i>=revealed)).join('') : '';
    const panel = document.getElementById('hd-panel');
    if (stage==='betting' || stage==='result') {
      panel.innerHTML = `<button class="btn" style="width:290px" id="hd-start">게임 시작 (${BASE}골드 블라인드) (SPACE)</button>
        <button class="btn" style="width:170px" id="hd-back">◀ 돌아가기</button>`;
      bindBtn('hd-start', start);
      bindBtn('hd-back', ()=>showVillage('CASINO'));
    } else if (stage==='action') {
      const isCheck = curBet === pBet;
      const callAmt = curBet - pBet;
      panel.innerHTML = `
        <button class="btn" style="width:150px" id="hd-cc">${isCheck?'체크 (C)':'콜 '+fmt(callAmt)+'G (C)'}</button>
        <button class="btn" style="width:150px" id="hd-raise">레이즈 +${BASE} (R)</button>
        <button class="btn" style="width:150px" id="hd-fold">폴드 (F)</button>`;
      bindBtn('hd-cc', playerCallCheck);
      bindBtn('hd-raise', playerRaise);
      bindBtn('hd-fold', playerFold);
    } else panel.innerHTML = '';
  }
  function start() {
    if (s.gold < MIN_GOLD) { msg(`골드가 부족합니다! (${MIN_GOLD}골드 이상 필요)`, '#ff8c50'); return; }
    s.gold -= BASE;
    s.gold_spent_slot = (s.gold_spent_slot||0) + BASE;
    engine.checkTitles();
    deck = makeDeck();
    pHole = [deck.pop(), deck.pop()];
    aHole = [deck.pop(), deck.pop()];
    community = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    revealed = 0;
    pot = BASE*2; pBet = BASE; aBet = BASE; curBet = BASE;
    pTotal = BASE;
    stage = 'action'; busy = false;
    engine.addLog(`텍사스 홀덤 시작! ${BASE}골드 블라인드`);
    msg(''); SFX.card();
    refreshSidebar(); render();
  }
  function aiStrength() {
    const known = aHole.concat(community.slice(0, revealed));
    if (known.length < 5) {
      // 프리플랍 간이 평가
      const v = aHole.map(c=>rankVal(c.r));
      let str = (v[0]+v[1]) / 56;
      if (v[0]===v[1]) str += 0.35;
      if (aHole[0].s===aHole[1].s) str += 0.06;
      return Math.min(1, str);
    }
    const score = evalBest(known);
    /* 족보별 기준 강도 + 킥커 미세 보정. 미완성 스트리트는 발전 가능성 가산 */
    const HAND_BASE = [0.14, 0.42, 0.58, 0.70, 0.80, 0.88, 0.93, 0.97, 1.0];
    let st = HAND_BASE[Math.min(8, score[0])] + Math.min(0.05, (score[1]||0)/3000);
    if (revealed < 5) st += 0.05;
    return Math.min(1, st);
  }
  function aiRespond(afterRaise) {
    const str = aiStrength() + (Math.random()*0.12 - 0.06);
    const toCall = curBet - aBet;
    /* 플레이어 레이즈 빈도 — 공격적일수록 블러핑을 의심해 가볍게 콜 */
    const aggr = pActs >= 3 ? pRaises / pActs : 0.35;
    const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
    const need = potOdds + 0.14 - Math.min(0.14, aggr * 0.28);
    const bluffCatch = Math.random() < (0.15 + Math.min(0.25, aggr * 0.4));
    later(()=>{
      if (toCall > 0 && str < need && !bluffCatch) { // AI 폴드
        msg(`상대가 폴드했습니다! +${fmt(pot - pTotal)}골드!`, 'gold');
        s.gold += pot;
        engine.addLog(`상대가 폴드! +${fmt(pot - pTotal)}골드를 얻었습니다.`);
        SFX.win(); stage = 'result'; engine.checkTitles();
        refreshSidebar(); render(true);
        return;
      }
      const valueRaise = str > 0.62 && Math.random() < 0.55;
      const bluffRaise = str < 0.30 && toCall === 0 && Math.random() < 0.14;
      if (!afterRaise && (valueRaise || bluffRaise)) {
        // AI 레이즈 (밸류/블러프)
        const raiseTotal = curBet + BASE;
        pot += raiseTotal - aBet;
        aBet = raiseTotal; curBet = raiseTotal;
        msg('상대가 레이즈했습니다!', '#ffc864');
        engine.addLog('상대가 레이즈했습니다.');
        busy = false; render();
        return;
      }
      // AI 콜/체크
      pot += toCall; aBet = curBet;
      msg(toCall > 0 ? '상대가 콜했습니다.' : '상대가 체크했습니다.', '#c8c8c8');
      nextStreet();
    }, 800);
  }
  function nextStreet() {
    if (revealed === 0) revealed = 3;
    else if (revealed === 3) revealed = 4;
    else if (revealed === 4) revealed = 5;
    else { showdown(); return; }
    curBet = pBet = aBet = 0; // 새 스트리트는 체크부터
    busy = false;
    SFX.card();
    render();
  }
  function playerCallCheck() {
    if (busy || stage!=='action') return;
    pActs++;
    const callAmt = curBet - pBet;
    if (callAmt > 0) {
      if (s.gold < callAmt) { msg('골드가 부족합니다!', '#ff8c50'); return; }
      s.gold -= callAmt; pot += callAmt; pBet = curBet; pTotal += callAmt;
      refreshSidebar();
      busy = true; render();
      nextStreet();  // 콜로 베팅 라운드 종료
    } else {
      busy = true; render();
      aiRespond(false);
    }
  }
  function playerRaise() {
    if (busy || stage!=='action') return;
    pActs++; pRaises++;
    const raiseTotal = curBet + BASE;
    const cost = raiseTotal - pBet;
    if (s.gold < cost) { msg('골드가 부족합니다!', '#ff8c50'); return; }
    s.gold -= cost; pot += cost; pTotal += cost;
    pBet = raiseTotal; curBet = raiseTotal;
    engine.addLog(`${fmt(BASE)}골드 레이즈!`);
    refreshSidebar();
    busy = true; render();
    aiRespond(true);
  }
  function playerFold() {
    if (busy || stage!=='action') return;
    msg(`폴드... -${fmt(pTotal)}골드`, '#ff6464');
    engine.addLog(`폴드하였습니다. -${fmt(pTotal)}골드를 잃었습니다.`);
    SFX.lose();
    stage = 'result';
    render(true);
  }
  function showdown() {
    revealed = 5;
    const pScore = evalBest(pHole.concat(community));
    const aScore = evalBest(aHole.concat(community));
    const cmp = cmpScore(pScore, aScore);
    stage = 'result';
    if (cmp > 0) {
      s.gold += pot;
      msg(`승리! [${HAND_NAMES[pScore[0]]}] +${fmt(pot-pTotal)}골드!`, 'gold');
      engine.addLog(`홀덤 승리! [${HAND_NAMES[pScore[0]]}] +${fmt(pot-pTotal)}골드를 얻었습니다.`);
      SFX.win();
    } else if (cmp < 0) {
      msg(`패배... 상대 [${HAND_NAMES[aScore[0]]}] -${fmt(pTotal)}골드`, '#ff6464');
      engine.addLog(`홀덤 패배... -${fmt(pTotal)}골드를 잃었습니다.`);
      SFX.lose();
    } else {
      s.gold += Math.floor(pot/2);
      msg('무승부. POT을 나눕니다.', '#c8c8c8');
      engine.addLog('홀덤 무승부.');
    }
    engine.checkTitles();
    refreshSidebar(); render(true);
  }
  render();
  currentKeyHandler = e => {
    if (e.key===' ') { e.preventDefault(); if (stage==='betting'||stage==='result') { SFX.click(); start(); } }
    if (stage==='action' && !busy) {
      if (e.key==='c'||e.key==='C'||e.key==='ㅊ') { SFX.click(); playerCallCheck(); }
      if (e.key==='r'||e.key==='R'||e.key==='ㄱ') { SFX.click(); playerRaise(); }
      if (e.key==='f'||e.key==='F'||e.key==='ㄹ') { SFX.click(); playerFold(); }
    }
    if (e.key==='Escape' && (stage==='betting'||stage==='result')) { SFX.click(); showVillage('CASINO'); }
  };
}



/* =====================================================================
   장비강화 (도박장)
   ===================================================================== */
const ENH_MAX = 5;
const ENH_RATES = [0.50, 0.40, 0.30, 0.20, 0.10];   /* +1 ~ +5 도전 성공률 */
const ENH_DROP_FROM = 1;   /* 이 단계 이상에서 실패하면 하락 (= +2 도전부터. +1 도전 실패만 유지) */
function enhCost(itemName) {
  const it = ITEMS.find(i=>i.name===itemName);
  const lv = engine.enhLevel(itemName);
  return Math.max(100, Math.round(it.price * 0.01) * (lv + 1));   /* 확률이 벽, 비용은 가볍게 */
}
function showEnhance() {
  clearView(); BGM.play('casino');
  const s = engine.state;
  const bestRaw = engine.getBestItem();
  const weapon = ITEMS.some(i=>i.name===bestRaw) ? bestRaw : null;   /* 빈 인벤토리('비어 있음') 방어 */
  const render = () => {
    const lv = weapon ? engine.enhLevel(weapon) : 0;
    const it = weapon ? ITEMS.find(i=>i.name===weapon) : null;
    const per = it ? Math.ceil(it.dmg * 0.12) : 0;
    const maxed = lv >= ENH_MAX;
    const cost = (weapon && !maxed) ? enhCost(weapon) : 0;
    const rate = (weapon && !maxed) ? Math.round(ENH_RATES[lv]*100) : 0;
    screenEl.innerHTML = `
      ${sidebarHTML()}
      ${logHTML()}
      <div class="bg-casino" style="position:absolute;left:250px;top:0;width:750px;height:550px"></div>
      <div class="main-area"><div class="main-dim"></div>
        <div style="position:absolute;left:0;right:0;top:24px;text-align:center;font-size:26px;font-weight:bold">장비강화</div>
        <div class="enh-panel" id="enh-panel" style="position:absolute;left:175px;top:80px;width:400px;background:rgba(20,16,12,.92);border:2px solid #b48c50;padding:24px;text-align:center">
          ${weapon ? `
            <div class="enh-img" id="enh-img" style="display:inline-block">${aimg(it.img, it.emoji, 120, '', 1.2)}</div>
            <div style="font-size:19px;margin-top:12px" id="enh-name">${enhTag(weapon)}</div>
            <div style="font-size:13px;color:#c8c8c8;margin-top:10px">
              공격력 ${fmt(it.dmg)} <span style="color:#96d2ff">+ 강화 ${fmt(per*lv)}</span></div>
            <div style="border-top:1px solid #5a4632;margin:16px 0 12px"></div>
            ${maxed
              ? `<div style="color:#ff5050;font-size:16px">최대 강화 단계입니다!</div>`
              : `<div style="font-size:13px;line-height:2.1">
                  다음 단계 : <span style="color:${ENH_COLORS[lv+1]}">+${lv+1}</span> (공격력 +${fmt(per)})<br>
                  성공 확률 : ${rate}% &nbsp;·&nbsp; 비용 : ${fmt(cost)} Gold<br>
                  <span style="color:#b4a08c">${lv >= ENH_DROP_FROM ? '실패 시 강화 단계가 1 하락합니다' : '+1 도전은 실패해도 잃을 것이 없습니다'}</span></div>`}
            <div style="margin-top:16px" id="enh-msg" style="min-height:22px"></div>`
          : `<div style="font-size:15px;line-height:2;padding:30px 0">강화할 무기가 없습니다.<br>
             <span style="color:#b4a08c">상점에서 무기를 구매한 뒤 찾아와 주세요.</span></div>`}
        </div>
        <div style="position:absolute;left:0;right:0;bottom:34px;text-align:center">
          ${weapon && !maxed ? `<button class="btn" style="width:220px" id="enh-go">강화하기 (${fmt(cost)} G)</button>` : ''}
          <button class="btn" style="width:180px;margin-left:${weapon && !maxed?'14px':'0'}" id="enh-back">◀ 나가기 (ESC)</button>
        </div>
      </div>`;
    bindBtn('enh-back', ()=>showVillage('CASINO'));
    if (weapon && !maxed) bindBtn('enh-go', tryEnhance);
    refreshSidebar && 0;
  };
  let busy = false;
  function tryEnhance() {
    if (busy) return;
    const lv = engine.enhLevel(weapon);
    if (lv >= ENH_MAX) return;
    const cost = enhCost(weapon);
    if (s.gold < cost) { engine.addLog('골드가 부족합니다.'); return; }
    busy = true;
    s.gold -= cost;
    refreshSidebar();
    const go = document.getElementById('enh-go');
    if (go) go.classList.add('disabled');
    const back = document.getElementById('enh-back');
    if (back) back.classList.add('disabled');
    /* 두근두근 차징 연출 */
    const img = document.getElementById('enh-img');
    if (img) img.classList.add('charging');
    SFX.tone && (SFX.tone(300,.1,'square',.06), SFX.tone(360,.1,'square',.06,.3), SFX.tone(430,.1,'square',.06,.6));
    later(()=>{
      const ok = Math.random() < ENH_RATES[lv];
      const panel = document.getElementById('enh-panel');
      if (ok) {
        s.enhance[weapon] = lv + 1;
        const burst = document.createElement('div'); burst.className = 'enh-burst';
        panel.appendChild(burst); setTimeout(()=>burst.remove(), 750);
        SFX.tone && (SFX.tone(660,.12,'square',.1), SFX.tone(880,.12,'square',.1,.1), SFX.tone(1320,.2,'square',.1,.2));
        engine.addLog(`강화 성공! [${weapon} +${lv+1}]`);
      } else {
        const dropped = lv >= ENH_DROP_FROM;
        if (dropped) s.enhance[weapon] = lv - 1;
        const fl = document.createElement('div'); fl.className = 'enh-fail-flash';
        panel.appendChild(fl); setTimeout(()=>fl.remove(), 650);
        panel.classList.remove('failshake'); void panel.offsetWidth; panel.classList.add('failshake');
        SFX.tone && (SFX.tone(220,.16,'sawtooth',.1), SFX.tone(140,.28,'sawtooth',.1,.13));
        engine.addLog(dropped
          ? `강화 실패... [${weapon} +${lv} → +${lv-1}]`
          : `강화 실패... 단계는 유지되었다. [+${lv}]`);
      }
      engine.save && 0;
      refreshSidebar();
      later(()=>{ busy = false; render(); }, 900);
    }, 1000);
  }
  render();
  currentKeyHandler = e => { if (e.key==='Escape' && !busy) { SFX.click(); showVillage('CASINO'); } };
}
