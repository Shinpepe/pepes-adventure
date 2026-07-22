'use strict';
/* [분할 04] 게임 엔진 (상태/저장/칭호/호감도) */
/* =====================================================================
   게임 엔진 (상태 / 저장 / 칭호)
   ===================================================================== */
const engine = {
  state: null,
  resetData() {
    this.state = {
      player_name:'', gender:'',
      hp:200, max_hp:200, gold:50, level:1, exp:0, inventory:[],
      kills_by_area:{forest:0,desert:0,swamp:0,mountain:0},
      bosses_defeated:[], skills:[],
      npc_affinity:{
        inn:{count:0,grade:'normal'},
        shop:{bought:[],grade:'normal'},
        chef:{food_count:{},grade:'normal'}
      },
      unlocked_titles:['모험가'], equipped_title:'모험가',
      gold_spent_slot:0, death_count:0, potions:0, enhance:{},
      items_ever_owned:[], foods_ever_eaten:[],
      log:['--- 모험의 시작 ---','모험가의 마을에 오신 것을 환영합니다.','평화로운 마을에 도착했습니다.'],
      play_time:0
    };
  },
  addLog(msg) {
    this.state.log.push(msg);
    if (this.state.log.length > 50) this.state.log = this.state.log.slice(-50);
    refreshLog();
  },
  checkTitles() {
    const s = this.state, out = [];
    for (const t of TITLE_CONDITIONS) {
      if (!s.unlocked_titles.includes(t.name) && t.check(s)) {
        s.unlocked_titles.push(t.name);
        out.push(t.name);
      }
    }
    for (const name of out) {
      this.addLog(`칭호 [${name}]을(를) 얻었습니다.`);
      showTitlePopup(name);
    }
    return out;
  },
  enhLevel(name) { return (this.state.enhance||{})[name] || 0; },
  enhBonusOf(name) {
    const it = ITEMS.find(i=>i.name===name);
    if (!it) return 0;
    return Math.ceil(it.dmg * 0.12) * this.enhLevel(name);   /* 강화 1단계당 기본 공격력의 12% */
  },
  getTotalAtk() {
    const s = this.state;
    const base = 10 + (s.level - 1) * 5;
    let bonus = 0, bestName = null;
    for (const n of s.inventory) {
      const it = ITEMS.find(i=>i.name===n);
      if (it && it.dmg > bonus) { bonus = it.dmg; bestName = n; }
    }
    if (bestName) bonus += this.enhBonusOf(bestName);
    return { base, bonus, total: base + bonus };
  },
  getBestItem() {
    const s = this.state; let best=null, bd=-1;
    for (const n of s.inventory) {
      const it = ITEMS.find(i=>i.name===n);
      if (it && it.dmg > bd) { bd = it.dmg; best = n; }
    }
    return best || '비어 있음';
  },
  neededExp() { return this.state.level ** 2 * 20; },
  updateInnAffinity() {
    const inn = this.state.npc_affinity.inn;
    inn.count += 1;
    if (inn.count >= 60) inn.grade = 'best';
    else if (inn.count >= 30) inn.grade = 'friend';
    this.checkTitles();
  },
  updateShopAffinity(itemName) {
    const shop = this.state.npc_affinity.shop;
    if (!shop.bought.includes(itemName)) shop.bought.push(itemName);
    if (shop.bought.includes('성검')) shop.grade = 'best';
    else if (shop.bought.includes('강철 대검')) shop.grade = 'friend';
    this.checkTitles();
  },
  updateChefAffinity(foodName) {
    const chef = this.state.npc_affinity.chef;
    chef.food_count[foodName] = (chef.food_count[foodName]||0) + 1;
    if ((chef.food_count['소고기스테이크']||0) >= 5) chef.grade = 'best';
    else if ((chef.food_count['고기스튜']||0) >= 5) chef.grade = 'friend';
    this.checkTitles();
  },
  saveGame(slot) {
    try {
      store.set('pepe_save_'+slot, JSON.stringify({ data:this.state, v:1 }));
      this.addLog(`슬롯 ${slot}에 저장 완료!`);
      return true;
    } catch(e) { this.addLog('저장 실패: '+e); return false; }
  },
  loadGame(slot) {
    const raw = store.get('pepe_save_'+slot);
    if (!raw) return 'empty';
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.data || !parsed.data.player_name) return 'corrupted';
      this.resetData();
      this.state = Object.assign(this.state, parsed.data);
      this.checkTitles();
      this.addLog(`슬롯 ${slot} 로드 완료!`);
      return 'ok';
    } catch(e) { return 'corrupted'; }
  },
  slotInfo(slot) {
    const raw = store.get('pepe_save_'+slot);
    if (!raw) return ' [비어 있음]';
    try {
      const d = JSON.parse(raw).data;
      const g = d.gold>=1e6 ? (d.gold/1e6).toFixed(1)+'M' : d.gold>=1000 ? Math.round(d.gold/1000)+'K' : d.gold.toLocaleString();
      return ` [${d.player_name} / Lv.${d.level.toLocaleString()} / ${g} Gold]`;
    } catch(e) { return ' [데이터 오류]'; }
  }
};
engine.resetData();

/* 플레이 시간 누적 */
setInterval(()=>{ if (engine.state) engine.state.play_time += 0.5; }, 500);

/* ---------- 칭호 팝업 ---------- */
function showTitlePopup(name) {
  const layer = document.getElementById('popup-layer');
  const el = document.createElement('div');
  el.className = 'title-popup';
  el.innerHTML = `<div class="pp-head">칭호 해금!</div><div class="pp-name">[ ${name} ]</div>`;
  layer.appendChild(el);
  setTimeout(()=>el.remove(), 5100);
}

