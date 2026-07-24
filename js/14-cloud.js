'use strict';
/* [분할 14] 클라우드 계정/세이브 (Firebase Auth + Firestore)
   - 아이디/비밀번호 로그인 후 계정의 세이브 3슬롯을 불러와 게임 시작
   - 저장 시: 이 기기(로컬 캐시)에 즉시 기록 + 클라우드에 백그라운드 동기화
   - 게스트 모드: 기존과 동일하게 이 기기에만 저장
   - 아이디/비밀번호 분실 시 복구 불가(실제 이메일이 아니므로 재설정 메일 없음) */

const CLOUD_CONFIG = {
  apiKey: "AIzaSyAdaxHbwvDorT0bdiQ6snqdfg5Tvgapgm0",
  authDomain: "pepes-adventure.firebaseapp.com",
  projectId: "pepes-adventure",
  storageBucket: "pepes-adventure.firebasestorage.app",
  messagingSenderId: "340670519120",
  appId: "1:340670519120:web:71996260dcbd745b517e55"
};
const CLOUD_EMAIL_DOMAIN = '@pepes-adventure.game';   /* 아이디를 내부 이메일로 변환할 때 사용 */
const ID_RE = /^[A-Za-z0-9]{4,12}$/;                  /* 아이디: 영문·숫자 4~12자 */
const PW_MIN = 6, PW_MAX = 20;                        /* 비밀번호: 6~20자, 공백 불가 */

const Cloud = {
  ready: false, uid: null, userId: null, db: null,
  init() {
    if (this.ready) return true;
    if (typeof firebase === 'undefined') return false;   /* SDK 로드 실패(오프라인/차단) */
    try {
      firebase.initializeApp(CLOUD_CONFIG);
      this.db = firebase.firestore();
      this.ready = true;
      return true;
    } catch (e) { return false; }
  },
  idFromEmail(email) { return (email || '').split('@')[0]; },
  /* 로그인 직후: 클라우드 세이브 → 이 기기의 계정별 캐시로 */
  async hydrate() {
    try {
      const doc = await this.db.collection('saves').doc(this.uid).get();
      const d = doc.exists ? doc.data() : {};
      for (let i = 1; i <= 3; i++) {
        const k = 'pepe_save_' + i;
        if (d['slot' + i]) store.set(k, d['slot' + i], true);   /* silent: 클라우드 재기록 방지 */
        else store.del(k, true);
      }
      return true;
    } catch (e) { return false; }
  },
  /* 저장/삭제를 클라우드에 백그라운드 반영 */
  push(slotKey, val) {
    if (!this.uid || !this.db) return;
    const m = /^pepe_save_([123])$/.exec(slotKey);
    if (!m) return;
    const field = 'slot' + m[1];
    const payload = { [field]: val };   /* 삭제는 null 기록 — hydrate가 falsy를 빈 슬롯으로 처리 */
    this.db.collection('saves').doc(this.uid).set(payload, { merge: true })
      .catch(() => { try { engine.addLog('⚠ 클라우드 동기화 실패 — 이 기기에는 저장되었습니다.'); } catch (e) {} });
  },
  /* 명예의 전당 등재: 저장할 때마다 내 기록 갱신 (본인만 쓰기 가능 규칙) */
  pushRanking(state) {
    if (!this.uid || !this.db) return;
    try {
      this.db.collection('rankings').doc(this.uid).set({
        name: state.player_name || '모험가',
        title: state.equipped_title || '모험가',
        level: state.level || 1,
        gold: state.gold || 0,
        medals: (state.bosses_defeated || []).length,
        play_time: Math.floor(state.play_time || 0),
        updatedAt: Date.now()
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  },
  logout() {
    if (this.ready) { try { firebase.auth().signOut(); } catch (e) {} }
    this.uid = null; this.userId = null;
  }
};

/* ---------- store 확장 ----------
   로그인 상태에서는 세이브 키를 계정별 캐시(cloud_{uid}_...)로 매핑해
   게스트(로컬) 세이브와 섞이지 않게 하고, 기록 시 클라우드에도 반영한다.
   engine.saveGame/loadGame 등 기존 코드는 수정 없이 그대로 동작한다. */
(function () {
  const _get = store.get.bind(store), _set = store.set.bind(store), _del = store.del.bind(store);
  const mapKey = k => (Cloud.uid && /^pepe_save_[123]$/.test(k)) ? `cloud_${Cloud.uid}_${k}` : k;
  store.get = (k) => _get(mapKey(k));
  store.set = (k, v, silent) => { _set(mapKey(k), v); if (!silent) Cloud.push(k, v); };
  store.del = (k, silent) => { _del(mapKey(k)); if (!silent) Cloud.push(k, null); };
})();

/* ---------- 로그인 화면 ---------- */
function showLoginScreen() {
  clearView(); BGM.play('set');
  TIME_ACTIVE = false;   /* 계정 화면 — 플레이타임 정지 */
  const sdk = Cloud.init();

  screenEl.innerHTML = `
    <div class="bg-night bg-set" style="position:absolute;inset:0"></div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.51)"></div>
    <div class="center-panel" style="gap:14px;min-height:0;padding:32px 36px" id="login-panel">
      <img class="title-icon" src="apple-touch-icon.png" alt="" draggable="false" onerror="this.remove()">
      <div style="font-size:32px;font-weight:bold;letter-spacing:2px;text-shadow:0 2px 0 #000, 0 0 22px rgba(174,182,192,.3)">페페의모험</div>
      <div id="login-body" style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%">
        <div style="font-size:13px;color:#9aa4b0">접속 확인 중...</div>
      </div>
    </div>`;

  if (!sdk) return renderLoginForm(null, true);   /* SDK 없음 → 게스트 전용 */

  let done = false;
  const finish = (user) => { if (done) return; done = true; try { off(); } catch (e) {} renderLoginForm(user, false); };
  const off = firebase.auth().onAuthStateChanged(u => finish(u));
  later(() => finish(null), 4000);   /* 네트워크 지연 대비 (느린 회선에서 세션 복원 대기) */
}

function renderLoginForm(savedUser, offline) {
  const body = document.getElementById('login-body');
  if (!body) return;

  const quick = savedUser ? `
    <button class="btn" style="width:300px;height:48px" id="lg-continue">이어하기 — ${esc(Cloud.idFromEmail(savedUser.email))}</button>
    <button class="btn small" style="width:300px" id="lg-other">다른 계정으로 로그인</button>
    <div style="width:100%;border-top:1px dashed rgba(255,255,255,.12);margin:2px 0"></div>` : '';

  body.innerHTML = `
    ${offline ? `<div style="font-size:12px;color:#ffb45c;text-align:center;line-height:1.7">클라우드 서버에 연결할 수 없습니다.<br>게스트 모드로 플레이해 주세요. (이 기기에만 저장)</div>` : quick + `
    <input class="text-input" id="lg-id" maxlength="12" placeholder="아이디 (영문·숫자 4~12자)" autocomplete="off" style="width:300px;font-size:14px;padding:10px">
    <input class="text-input" id="lg-pw" type="password" maxlength="${PW_MAX}" placeholder="비밀번호 (6~20자)" autocomplete="off" style="width:300px;font-size:14px;padding:10px">
    <div id="lg-msg" style="min-height:18px;font-size:12px;color:#ff8c50;text-align:center"></div>
    <div class="hrow" style="gap:12px">
      <button class="btn" style="width:144px;height:46px" id="lg-login">로그인</button>
      <button class="btn" style="width:144px;height:46px" id="lg-signup">회원가입</button>
    </div>`}
    <button class="btn small" style="width:300px" id="lg-guest">게스트로 플레이 (이 기기에만 저장)</button>
    <div style="font-size:10px;color:#7f8b99;text-align:center;line-height:1.8">아이디·비밀번호를 분실하면 복구할 수 없습니다.</div>
    <div style="font-size:10px;color:#5f6a76;text-align:center;letter-spacing:.5px">© 2026 Shinhyunsu. All rights reserved.</div>`;

  const msg = t => { const el = document.getElementById('lg-msg'); if (el) el.textContent = t; };
  const setBusy = b => body.querySelectorAll('button').forEach(x => x.disabled = b);

  const validate = (id, pw) => {
    if (!ID_RE.test(id)) return '아이디는 영문·숫자 4~12자입니다.';
    if (pw.length < PW_MIN || pw.length > PW_MAX) return `비밀번호는 ${PW_MIN}~${PW_MAX}자입니다.`;
    if (/\s/.test(pw)) return '비밀번호에 공백은 사용할 수 없습니다.';
    return null;
  };
  const errText = (e) => {
    const c = (e && e.code) || '';
    if (c.includes('email-already-in-use')) return '이미 사용 중인 아이디입니다.';
    if (c.includes('invalid-credential') || c.includes('user-not-found') || c.includes('wrong-password')) return '아이디 또는 비밀번호가 올바르지 않습니다.';
    if (c.includes('too-many-requests')) return '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    if (c.includes('network')) return '네트워크 연결을 확인해 주세요.';
    if (c.includes('weak-password')) return '비밀번호가 너무 단순합니다.';
    return '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  };
  const enterGame = async (user) => {
    Cloud.uid = user.uid;
    Cloud.userId = Cloud.idFromEmail(user.email);
    msg('세이브 데이터를 불러오는 중...');
    const ok = await Cloud.hydrate();
    if (!ok) { try { engine.addLog('⚠ 클라우드 세이브를 불러오지 못해 이 기기의 사본으로 시작합니다.'); } catch (e) {} }
    showTitleScreen();
  };
  let submitting = false;   /* Enter 연타 이중 제출 방지 */
  const submit = async (mode) => {
    if (submitting) return;
    const id = (document.getElementById('lg-id').value || '').trim();
    const pw = document.getElementById('lg-pw').value || '';
    const v = validate(id, pw);
    if (v) { msg(v); return; }
    submitting = true; setBusy(true); msg(mode === 'signup' ? '계정을 만드는 중...' : '로그인 중...');
    const email = id.toLowerCase() + CLOUD_EMAIL_DOMAIN;
    try {
      const cred = mode === 'signup'
        ? await firebase.auth().createUserWithEmailAndPassword(email, pw)
        : await firebase.auth().signInWithEmailAndPassword(email, pw);
      SFX.click();
      await enterGame(cred.user);
    } catch (e) { submitting = false; setBusy(false); msg(errText(e)); }
  };

  if (savedUser && !offline) {
    bindBtn('lg-continue', () => { SFX.click(); setBusy(true); enterGame(savedUser); });
    bindBtn('lg-other', () => { SFX.click(); Cloud.logout(); showLoginScreen(); });
  }
  if (!offline) {
    bindBtn('lg-login', () => submit('login'));
    bindBtn('lg-signup', () => submit('signup'));
    const idEl = document.getElementById('lg-id');
    const pwEl = document.getElementById('lg-pw');
    if (idEl) {
      idEl.focus();   /* 진입 즉시 아이디 입력 가능 */
      idEl.addEventListener('keydown', e => { if (e.key === 'Enter' && pwEl) pwEl.focus(); });
    }
    if (pwEl) pwEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit('login'); });
  }
  bindBtn('lg-guest', () => { SFX.click(); Cloud.logout(); showTitleScreen(); });
  currentKeyHandler = null;
}


/* ---------- 명예의 전당 ---------- */
function showHallOfFame() {
  clearView(); BGM.play('set');
  TIME_ACTIVE = false;
  screenEl.innerHTML = `
    <div class="bg-night bg-set" style="position:absolute;inset:0"></div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.51)"></div>
    <div class="vcol sys-panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:640px;gap:10px">
      <div class="sys-head">명 예 의 전 당</div>
      <div id="hall-body" style="width:100%;min-height:220px;font-size:13px">
        <div style="text-align:center;color:#9aa4b0;padding:80px 0">기록을 불러오는 중...</div>
      </div>
      <div style="font-size:10px;color:#7f8b99">계정으로 게임을 저장하면 자동으로 등재됩니다.</div>
      <button class="btn" style="width:250px" id="hf-back">◀ 돌아가기 (ESC)</button>
    </div>`;
  bindBtn('hf-back', ()=>showTitleScreen());
  currentKeyHandler = e => { if (e.key === 'Escape') { SFX.click(); showTitleScreen(); } };

  const bodyEl = () => document.getElementById('hall-body');
  const fail = (t) => { const b = bodyEl(); if (b) b.innerHTML =
    `<div style="text-align:center;color:#ffb45c;padding:80px 0;line-height:1.9">${t}</div>`; };

  if (!Cloud.init()) return fail('클라우드 서버에 연결할 수 없습니다.<br>네트워크 연결을 확인해 주세요.');

  Cloud.db.collection('rankings').orderBy('level', 'desc').limit(20).get().then(snap => {
    const b = bodyEl(); if (!b) return;   /* 이미 다른 화면으로 이동함 */
    if (snap.empty) return fail('아직 등재된 모험가가 없습니다.<br>첫 번째 전설의 주인공이 되어보세요!');
    const fmtGold = g => g >= 1e6 ? (g/1e6).toFixed(1)+'M' : g >= 1000 ? Math.round(g/1000)+'K' : fmt(g);
    const fmtTime = t => `${String(Math.floor(t/3600)).padStart(2,'0')}:${String(Math.floor(t%3600/60)).padStart(2,'0')}`;
    const rankMark = i => i===0 ? '<span style="color:#ffd700">1위</span>'
      : i===1 ? '<span style="color:#c0c8d0">2위</span>'
      : i===2 ? '<span style="color:#d09a6a">3위</span>'
      : `<span style="color:#7f8b99">${i+1}위</span>`;
    let rows = `<div class="hof-list"><div class="hof-head">
      <span class="hof-rank">순위</span><span style="flex:1">모험가</span><span class="hof-lv">레벨</span>
      <span class="hof-gold">골드</span><span class="hof-medal">훈장</span><span class="hof-time">시간</span></div>`;
    const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() }));
    list.forEach((r, i) => {
      const me = Cloud.uid && r.id === Cloud.uid;
      const name = String(r.name || '모험가').slice(0, 8);   /* 이름 최대 8자 방어 */
      rows += `<div class="hof-row ${me?'me':''}">
        <span class="hof-rank">${rankMark(i)}</span>
        <div class="hof-id">
          <div class="hof-name">${esc(name)}${me?' <span class="me-tag">(나)</span>':''}</div>
          ${r.title ? `<div class="hof-title">${esc(String(r.title).slice(0,12))}</div>` : ''}
        </div>
        <span class="hof-lv">Lv.${fmt(r.level||1)}</span>
        <span class="hof-gold">${fmtGold(r.gold||0)}</span>
        <span class="hof-medal">🏅${r.medals||0}</span>
        <span class="hof-time">${fmtTime(r.play_time||0)}</span>
      </div>`;
    });
    rows += `</div>`;
    b.innerHTML = rows;
  }).catch(() => fail('기록을 불러오지 못했습니다.<br>잠시 후 다시 시도해 주세요.'));
}
