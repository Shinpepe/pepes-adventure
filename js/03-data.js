'use strict';
/* [분할 03] 게임 데이터 (몬스터/아이템/음식/훈장/대사) */
/* =====================================================================
   게임 데이터 (원작 CSV DB를 코드에 내장)
   ===================================================================== */
const AREAS = {
  forest:   { name:'깊은 안개 숲', bg:'bg-forest',   bossReq:10 },
  desert:   { name:'불타는 사막',   bg:'bg-desert',   bossReq:15 },
  swamp:    { name:'끈적한 늪',     bg:'bg-swamp',    bossReq:20 },
  mountain: { name:'얼어붙은 산',   bg:'bg-mountain', bossReq:25 }
};
const AREA_ORDER = ['forest','desert','swamp','mountain'];
const AREA_UNLOCK_BOSS = { desert:'숲의 지배자 엔트', swamp:'사막의 지배자 파라오', mountain:'늪의 지배자 메두사' };

const MONSTERS = [
  { name:'슬라임', img:'monster/slime.webp',   area:'forest', emoji:'🟢', hp:70,  min:4,  max:8,  gold:50,  exp:40,  boss:0 },
  { name:'고블린', img:'monster/goblin.webp',   area:'forest', emoji:'👺', hp:150, min:12, max:18, gold:90,  exp:70,  boss:0 },
  { name:'오크', img:'monster/orc.webp',     area:'forest', emoji:'👹', hp:320, min:22, max:30, gold:170, exp:130, boss:0 },
  { name:'숲의 지배자 엔트', img:'monster/ent.webp', area:'forest', emoji:'🌳', hp:1700, min:40, max:52, gold:1500, exp:1500, boss:1 },

  { name:'사막 전갈', img:'monster/scorpion.webp', area:'desert', emoji:'🦂', hp:450,  min:28, max:39,  gold:190, exp:150, boss:0 },
  { name:'미이라', img:'monster/mummy.webp',    area:'desert', emoji:'🧟', hp:800,  min:49, max:66,  gold:310, exp:290, boss:0 },
  { name:'고대 석상', img:'monster/golem.webp', area:'desert', emoji:'🗿', hp:1500, min:80, max:100, gold:530, exp:570, boss:0 },
  { name:'사막의 지배자 파라오', img:'monster/pharaoh.webp', area:'desert', emoji:'👑', hp:5000, min:195, max:250, gold:8500, exp:6000, boss:1 },

  { name:'독 개구리', img:'monster/frog.webp', area:'swamp', emoji:'🐸', hp:1800, min:140, max:180, gold:560,  exp:600,  boss:0 },
  { name:'늪지 악어', img:'monster/crocodile.webp', area:'swamp', emoji:'🐊', hp:3400, min:190, max:240, gold:720,  exp:1100, boss:0 },
  { name:'히드라', img:'monster/hydra.webp',    area:'swamp', emoji:'🐉', hp:6000, min:250, max:310, gold:1230, exp:2000, boss:0 },
  { name:'늪의 지배자 메두사', img:'monster/medusa.webp', area:'swamp', emoji:'🐍', hp:15000, min:450, max:590, gold:12000, exp:13000, boss:1 },

  { name:'얼음 정령', img:'monster/elemental.webp', area:'mountain', emoji:'❄️', hp:6500,  min:280, max:360, gold:1280, exp:2100, boss:0 },
  { name:'설원 늑대', img:'monster/wolf.webp', area:'mountain', emoji:'🐺', hp:11000, min:370, max:450, gold:1690, exp:3300, boss:0 },
  { name:'예티', img:'monster/yeti.webp',      area:'mountain', emoji:'⛄', hp:17000, min:460, max:550, gold:2240, exp:5000, boss:0 },
  { name:'산의 지배자 가고일', img:'monster/gargoyle.webp', area:'mountain', emoji:'👿', hp:40000, min:900, max:1050, gold:80000, exp:27000, boss:1 }
];

const ITEMS = [
  { name:'낡은 목검', img:'item/wooden_sword.webp',  emoji:'🪵', price:350,   dmg:10,   desc:'낡아서 곧 부러질 것 같은 검이다.' },
  { name:'롱소드', img:'item/long_sword.webp',     emoji:'🗡️', price:1800,  dmg:45,   desc:'잘 손질되어 있는 양날검이다.' },
  { name:'전투 도끼', img:'item/battle_axe.webp',  emoji:'🪓', price:6500,  dmg:140,  desc:'묵직해보이는 전투용 도끼이다.' },
  { name:'강철 대검', img:'item/steel_sword.webp',  emoji:'⚔️', price:18000, dmg:350,  desc:'철을 단련하여 제작된 대검이다.' },
  { name:'기사의 창', img:'item/knight_spear.webp',  emoji:'🔱', price:39000, dmg:700,  desc:'기사들이 사용하는 날카로운 창이다.' },
  { name:'성검', img:'item/holy_sword.webp',       emoji:'✨', price:90000, dmg:1500, desc:'보물로 여겨지는 성검이다.' }
];

const FOODS = [
  { name:'팬케이크', img:'item/pancake.webp',       emoji:'🥞', price:600,   hp:30,   desc:'시럽이 가득 뿌려진 팬케이크이다.' },
  { name:'모듬꼬치구이', img:'item/skewer.webp',   emoji:'🍢', price:1450,  hp:75,   desc:'세 가지 종류의 꼬치구이이다.' },
  { name:'고기스튜', img:'item/stew.webp',       emoji:'🍲', price:3900,  hp:210,  desc:'자부심이 담긴 시그니처 스튜이다.' },
  { name:'연어스테이크', img:'item/salmon.webp',   emoji:'🐟', price:10000, hp:560,  desc:'은은한 허브향이 나는 연어구이이다.' },
  { name:'소고기스테이크', img:'item/steak.webp', emoji:'🥩', price:24000, hp:1400, desc:'다양한 가니쉬를 곁들인 스테이크이다.' }
];

const MEDALS = [
  { boss:'숲의 지배자 엔트',    img:'medal_forest.webp',   emoji:'🥇', label:'숲의 훈장' },
  { boss:'사막의 지배자 파라오',img:'medal_desert.webp',   emoji:'🏅', label:'사막의 훈장' },
  { boss:'늪의 지배자 메두사',  img:'medal_swamp.webp',    emoji:'🎖️', label:'늪의 훈장' },
  { boss:'산의 지배자 가고일',  img:'medal_mountain.webp', emoji:'🏆', label:'산의 훈장' }
];

const BOSS_DIALOGUES = {
  '숲의 지배자 엔트': [
    ['', '깊은 안개 속에서 무언가가 천천히 모습을 드러냈다.'],
    ['', '수백 년의 세월을 버텨온 거목.'],
    ['엔트', '...인간.'],
    ['엔트', '이 숲에 발을 들인 자는 오랜만이로군.'],
    ['엔트', '마지막으로 싸움을 한 게 언제였는지..'],
    ['엔트', '숲을 지키는 것이 나의 의무.']
  ],
  '사막의 지배자 파라오': [
    ['', '뜨거운 모래바람이 소용돌이친다.'],
    ['', '모래 속에서 천천히 솟아오르는 거대한 형체.'],
    ['파라오', '감히 이 모래를 밟는 자가 있다니..'],
    ['파라오', '겁도 없는 녀석구나.'],
    ['파라오', '이 사막에 있는 모든 것은 나의 것이다.'],
    ['파라오', '천 년의 잠에서 깨어난 왕 앞에 무릎을 꿇어라.']
  ],
  '늪의 지배자 메두사': [
    ['', '끈적한 공기. 물 위에 퍼지는 잔물결.'],
    ['', '늪의 깊은 곳에서 두 개의 눈이 빛난다.'],
    ['메두사', '오랜만에 살아있는 자의 냄새가 나는군.'],
    ['메두사', '이 늪을 살아서 지나려는 건가.'],
    ['메두사', '나를 마주한 자들은 모두 이 늪의 일부가 되었다.'],
    ['메두사', '눈을 마주치지 않는 게 좋을 거다.']
  ],
  '산의 지배자 가고일': [
    ['', '산 정상. 눈으로 덮인 신전.'],
    ['', '돌로 만들어진 형체가 천천히 고개를 들었다.'],
    ['가고일', '...오래 기다렸다.'],
    ['가고일', '나는 강한 자를 위해 여기 있다.'],
    ['가고일', '너는 강한가.'],
    ['가고일', '증명해보아라.']
  ]
};

const TUTORIAL_MESSAGES = [
  ['SYSTEM', "모험가의 마을에 도착하셨습니다.\n\n이곳에서 당신만의 특별한 모험을 시작해보세요.\n\n여관, 상점, 식당 등 다양한 시설을 이용할 수 있습니다."],
  ['SYSTEM', "전투 중 HP가 0이 되면 기절합니다.\n\n여관에서 골드를 지불하면 HP를 회복할 수 있습니다.\n\n모험을 떠나기 전 꼭 상태를 확인하세요."],
  ['SYSTEM', "마을에서 ESC 키를 누르면 시스템 메뉴가 열립니다.\n\n게임은 자동으로 저장되지 않으니\n\n잊지말고 저장해두세요."],
  ['SYSTEM', "시작은 '깊은 안개 숲'입니다.\n\n지역 보스를 처치하면 다음 지역의 봉인이 풀립니다.\n\n탐험을 통해 몬스터를 처치한 뒤 보스에게 도전해보세요!"]
];

const NPC_DATE_DIALOGUES = {
  inn: {
    '남성': [['호스트','이 카페가 최근에 새로 생긴 거 알아요?'],['호스트','혼자 가기 좀 그래서 같이 가줄 사람 찾고 있었어요.'],['','창가로 따스한 햇빛이 들어온다.'],['호스트','여기 라떼가 맛있대요. 한번 마셔봐요.'],['호스트','가끔은 이런 시간도 필요한 것 같아요.']],
    '여성': [['호스트','오늘 저녁에 다른 약속 있었어?'],['호스트','같이 저녁먹고 싶었어. 평소에 바빠보이니까.'],['','창가에 비치는 야경이 아름답다.'],['호스트','이거 진짜 맛있다. 먹어볼래?'],['호스트','오늘은 모험 얘기 말고, 그냥 쉬어.']]
  },
  shop: {
    '남성': [['상점 주인','여기 카페 조용하죠?'],['상점 주인','가게 끝나고 가끔 혼자 오곤 해요.'],['','잔잔한 음악이 흐르고 커피 향이 퍼진다.'],['상점 주인','가게에서 보는 모습이랑은 조금 다르죠?'],['상점 주인','이렇게 앉아서 이야기하는 것도 좋네요.']],
    '여성': [['상점 주인','여기 음식 꽤 괜찮죠?'],['상점 주인','가게 일 끝나고 가끔 들르곤 해요.'],['','따뜻한 조명이 테이블 위를 비춘다.'],['상점 주인','이거 맛있어요. 조금 드셔보세요.'],['상점 주인','이렇게 같이 밥 먹는 건… 좀 새롭네요.']]
  },
  chef: {
    '남성': [['요리사','여기 디저트 괜찮죠?'],['요리사','가끔 다른 가게 맛도 보러 와요.'],['','작은 카페 안에 달콤한 향이 퍼진다.'],['요리사','이 케이크, 식감이 재밌네요! 참고해야겠어요.'],['요리사','다음에 제가 더 맛있게 만들어 줄게요!']],
    '여성': [['요리사','여기 음식 어때요?'],['요리사','다른 요리사들 음식도 가끔 먹어봐야 하거든요.'],['','접시 위에서 김이 천천히 올라온다.'],['요리사','이거 괜찮네요. 그래도 내가 만드는 게 조금 더 낫죠?'],['요리사','다음엔 내가 더 맛있는 거 만들어 줄게요.']]
  }
};

/* ---------- 칭호 조건 ---------- */
const TITLE_CONDITIONS = [
  { name:'모험가',        hint:'기본 칭호',                    check:s=>true },
  { name:'전사',          hint:'레벨 10을 달성해보자',          check:s=>s.level>=10 },
  { name:'용사',          hint:'레벨 20을 달성해보자',          check:s=>s.level>=20 },
  { name:'영웅',          hint:'레벨 30을 달성해보자',          check:s=>s.level>=30 },
  { name:'신입 사냥꾼',   hint:'몬스터를 많이 처치해보자',      check:s=>totalKills(s)>=50 },
  { name:'베테랑 사냥꾼', hint:'몬스터를 더 많이 처치해보자',   check:s=>totalKills(s)>=500 },
  { name:'숲의 정복자',   hint:'깊은 안개 숲을 클리어해보자',   check:s=>s.bosses_defeated.includes('숲의 지배자 엔트') },
  { name:'사막의 정복자', hint:'불타는 사막을 클리어해보자',    check:s=>s.bosses_defeated.includes('사막의 지배자 파라오') },
  { name:'늪의 정복자',   hint:'끈적한 늪을 클리어해보자',      check:s=>s.bosses_defeated.includes('늪의 지배자 메두사') },
  { name:'산의 정복자',   hint:'얼어붙은 산을 클리어해보자',    check:s=>s.bosses_defeated.includes('산의 지배자 가고일') },
  { name:'전설',          hint:'모든 지역을 클리어해보자',      check:s=>s.bosses_defeated.length>=4 },
  { name:'불사신',        hint:'죽음을 여러 번 경험해보자',     check:s=>(s.death_count||0)>=10 },
  { name:'부자',          hint:'골드를 많이 모아보자',          check:s=>s.gold>=10000 },
  { name:'대부호',        hint:'골드를 더 많이 모아보자',       check:s=>s.gold>=100000 },
  { name:'수집가',        hint:'모든 아이템을 한 번씩 소지해보자', check:s=>(s.items_ever_owned||[]).length>=6 },
  { name:'미식가',        hint:'모든 음식을 먹어보자',          check:s=>(s.foods_ever_eaten||[]).length>=5 },
  { name:'잠꾸러기',      hint:'여관 주인과 친해져보자',        check:s=>s.npc_affinity.inn.grade==='best' },
  { name:'대식가',        hint:'식당 주인과 친해져보자',        check:s=>s.npc_affinity.chef.grade==='best' },
  { name:'거상',          hint:'상점 주인과 친해져보자',        check:s=>s.npc_affinity.shop.grade==='best' },
  { name:'도파민중독자',  hint:'도박장에서 놀아보자',           check:s=>(s.gold_spent_slot||0)>=5000 }
];
function totalKills(s){ return Object.values(s.kills_by_area).reduce((a,b)=>a+b,0); }

