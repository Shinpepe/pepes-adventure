'use strict';
/* [분할 08] 상점/판매/식당 */
/* =====================================================================
   상점 / 판매 / 식당
   ===================================================================== */
function showShop(mode, page=0) {
  clearView(); BGM.play('game');
  const s = engine.state;
  const isBuy = mode === 'buy';
  const list = isBuy ? ITEMS : s.inventory.map(n=>ITEMS.find(i=>i.name===n)).filter(Boolean);
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(list.length/perPage));
  page = Math.min(page, totalPages-1);
  const pageItems = list.slice(page*perPage, page*perPage+perPage);

  let rows = '';
  if (!list.length) {
    rows = `<div style="text-align:center;padding:150px 0;color:#b4b4b4;font-size:16px">판매할 아이템이 없습니다.</div>`;
  } else {
    rows = pageItems.map((it,i)=>{
      const owned = isBuy && s.inventory.includes(it.name);
      const price = isBuy ? it.price : Math.floor(it.price/2);
      return `<div class="item-row ${owned?'owned':''}">
        <div class="item-icon">${aimg(it.img,it.emoji,48,'',1.4)}</div>
        <div class="item-info">
          <div class="nm">${esc(it.name)}</div>
          <div class="ds">${esc(it.desc)} / ATK +${fmt(it.dmg)}</div>
        </div>
        <div class="item-price" style="${isBuy?'':'color:#ffd700'}">${fmt(price)} Gold</div>
        <button class="btn ${owned?'disabled':''}" style="width:88px" data-idx="${i}">${owned?'보유 중':(isBuy?'구매':'판매')}</button>
      </div>`;
    }).join('');
  }

  screenEl.innerHTML = `
    <div style="position:absolute;inset:0;background:#140f0a"></div>
    <div class="mid-title" style="position:absolute;left:250px;width:750px;top:26px">${isBuy?'구매하기':'판매하기'}</div>
    <div class="sub-text" style="position:absolute;left:250px;width:750px;top:60px">${isBuy?'강력한 장비를 구입해보세요.':'중고 아이템을 반값에 판매합니다.'}</div>
    <div class="shop-panel" style="top:90px;height:348px">${rows}</div>
    <div class="pager" style="position:absolute;left:250px;width:750px;bottom:172px">
      <button class="btn small ${page>0?'':'disabled'}" style="width:64px" id="pg-prev">◀ 이전</button>
      <span style="font-size:12px">${page+1} / ${totalPages}</span>
      <button class="btn small ${page<totalPages-1?'':'disabled'}" style="width:64px" id="pg-next">다음 ▶</button>
      <button class="btn" style="width:180px;margin-left:30px" id="shop-back">◀ 돌아가기</button>
    </div>
    ${sidebarHTML()}${logHTML()}`;

  screenEl.querySelectorAll('.item-row .btn:not(.disabled)').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      SFX.click();
      const it = pageItems[Number(btn.dataset.idx)];
      if (isBuy) {
        if (s.gold >= it.price) {
          s.gold -= it.price;
          s.inventory.push(it.name);
          if (!s.items_ever_owned.includes(it.name)) s.items_ever_owned.push(it.name);
          engine.updateShopAffinity(it.name);
          engine.addLog(`${it.name}을(를) 구매했습니다.`);
          SFX.coin();
        } else engine.addLog('골드가 부족하여 구매할 수 없습니다.');
      } else {
        const price = Math.floor(it.price/2);
        s.inventory.splice(s.inventory.indexOf(it.name),1);
        s.gold += price;
        engine.addLog(`${it.name}을(를) ${fmt(price)} Gold에 판매했습니다.`);
        SFX.coin();
        engine.checkTitles();
      }
      showShop(mode, page);
    });
  });
  bindBtn('pg-prev', ()=>showShop(mode, page-1));
  bindBtn('pg-next', ()=>showShop(mode, page+1));
  bindBtn('shop-back', ()=>showVillage('SHOP_NPC', isBuy?'찾으시는 물건이 있으신가요?\n\n필요한게 있으시면 말씀해주세요.':'판매하실 물건이 있으신가요?\n\n필요한게 있으시면 말씀해주세요.'));
  currentKeyHandler = e => { if (e.key==='Escape') { SFX.click(); showVillage('SHOP_NPC', shopMessage()); } };
}

function showRestaurant(page=0) {
  clearView(); BGM.play('cafe');
  const s = engine.state;
  const perPage = 3;
  const totalPages = Math.ceil(FOODS.length/perPage);
  page = Math.min(page, totalPages-1);
  const pageItems = FOODS.slice(page*perPage, page*perPage+perPage);

  const rows = pageItems.map((f,i)=>`
    <div class="item-row">
      <div class="item-icon">${aimg(f.img,f.emoji,48,'',1.4)}</div>
      <div class="item-info">
        <div class="nm">${esc(f.name)}</div>
        <div class="ds">${esc(f.desc)} / MAX HP +${fmt(f.hp)}</div>
      </div>
      <div class="item-price">${fmt(f.price)} Gold</div>
      <button class="btn" style="width:88px" data-idx="${i}">주문하기</button>
    </div>`).join('');

  screenEl.innerHTML = `
    <div style="position:absolute;inset:0;background:#0f140a"></div>
    <div class="mid-title" style="position:absolute;left:250px;width:750px;top:26px">마을 식당</div>
    <div class="sub-text" style="position:absolute;left:250px;width:750px;top:60px">신선한 재료로 만든 요리입니다. 먹으면 최대 체력이 늘어납니다.</div>
    <div class="shop-panel green" style="top:90px;height:348px">${rows}</div>
    <div class="pager" style="position:absolute;left:250px;width:750px;bottom:172px">
      <button class="btn small ${page>0?'':'disabled'}" style="width:64px" id="pg-prev">◀ 이전</button>
      <span style="font-size:12px">${page+1} / ${totalPages}</span>
      <button class="btn small ${page<totalPages-1?'':'disabled'}" style="width:64px" id="pg-next">다음 ▶</button>
      <button class="btn" style="width:180px;margin-left:30px" id="rest-back">◀ 돌아가기</button>
    </div>
    ${sidebarHTML()}${logHTML()}`;

  screenEl.querySelectorAll('.item-row .btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      SFX.click();
      const f = pageItems[Number(btn.dataset.idx)];
      if (s.gold >= f.price) {
        s.gold -= f.price;
        s.max_hp += f.hp; s.hp += f.hp;
        if (!s.foods_ever_eaten.includes(f.name)) s.foods_ever_eaten.push(f.name);
        engine.updateChefAffinity(f.name);
        engine.addLog(`${f.name}(을)를 먹었습니다!`);
        engine.addLog(`최대 체력이 ${f.hp}만큼 증가하였습니다.`);
        SFX.coin();
        refreshSidebar();
      } else engine.addLog('골드가 부족하여 주문할 수 없습니다.');
    });
  });
  bindBtn('pg-prev', ()=>showRestaurant(page-1));
  bindBtn('pg-next', ()=>showRestaurant(page+1));
  bindBtn('rest-back', ()=>showVillage('REST_NPC','맛있게 드셨나요?\n\n다음에 또 방문해주세요!'));
  currentKeyHandler = e => { if (e.key==='Escape') { SFX.click(); showVillage('REST_NPC', chefMessage()); } };
}

