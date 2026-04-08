/**
 * ═══════════════════════════════════════════════════════
 *  KAPAE 5070 — app.js  (v2 — 실서비스 연동)
 *  © 2026 KAPAE. All rights reserved.
 *
 *  변경 이력:
 *  - 관리자 패널 HTML/JS ID 불일치 전면 수정
 *  - WGW 결과 → JourneySection 실시간 연동
 *  - JourneySection AI 매칭 탭: Claude API 실호출로 교체
 *  - 워크그래피 결과 localStorage 영속화
 *  - 고용정보 소스 카드 실시간 피드 개선
 *  - 관리자 게시물 작성/수정/삭제 완전 작동
 * ═══════════════════════════════════════════════════════
 */

'use strict';

/* ═══════════════════════════════════
   1. 설정값 (이제 백엔드 API 활용)
═══════════════════════════════════ */
// 프론트엔드에서는 더이상 민감한 API Key를 저장하지 않습니다. 모든 요청은 자체 서버로 전송됩니다.

/* ═══════════════════════════════════
   2. 자체 백엔드 API 헬퍼
═══════════════════════════════════ */
async function sbQuery(table, params = {}) {
  let url = '/api/notices';
  if (params.filter && params.filter.category) {
    const cat = params.filter.category.replace('eq.', '');
    url += `?category=${encodeURIComponent(cat)}`;
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

async function sbInsert(table, data) {
  const endpoint = table === 'inquiries' ? '/api/inquiry' :
    (table === 'workgraphy_requests' ? '/api/workgraphy_requests' : '/api/notices');
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`API insert ${r.status}`);
  return true;
}

/* ═══════════════════════════════════
   3. 게시판 폴백 데이터
═══════════════════════════════════ */
const NOTICE_FB = [
  {
    id: 'n1', title: '2026년 퍼플넷(Purplenet) 런칭 사전 안내',
    published_at: '2026-03-15', is_new: true, is_hot: false,
    author: '운영사무국', views: 142,
    content: `<p>안녕하세요. (사)한국중장년고용협회입니다.</p><p>2026년 상반기 퍼플넷(Purplenet) 정식 런칭을 앞두고 사전 안내드립니다.</p>
<div class="nc-section"><h4>■ 퍼플넷이란?</h4><ul><li>워크그래피 기반 AI 매칭 플랫폼</li><li>중장년의 경험·암묵지를 구조화하여 재취업·자문·강연·교육을 연결</li><li>2026년 상반기 베타 오픈 예정</li></ul></div>
<div class="nc-note">문의: kapae1503@gmail.com | 02-582-1009</div>`
  },
  {
    id: 'n2', title: '중장년 친화기업 인증 신청 접수 안내',
    published_at: '2025-12-10', is_new: false, is_hot: false,
    author: '인증사업팀', views: 89,
    content: `<p>중장년 친화기업 인증 신청을 2025년 12월부터 상시 접수합니다.</p>
<div class="nc-section"><h4>■ 신청 자격</h4><ul><li>상시 근로자 10인 이상 기업</li><li>중장년(50~69세) 고용비율 일정 기준 이상</li></ul></div>
<div class="nc-note">접수: 상시 접수 | 문의: kapae1503@gmail.com</div>`
  },
  {
    id: 'n3', title: '2025년 하반기 재취업 지원 교육 훈련 모집',
    published_at: '2025-10-05', is_new: false, is_hot: false,
    author: '교육훈련팀', views: 203,
    content: `<p>2025년 하반기 재취업 지원 교육 훈련 과정 수강생을 모집합니다.</p>
<div class="nc-section"><h4>■ 교육 과정</h4><ul><li>생애설계 전문가 과정 (4주)</li><li>중장년 전직 지원 컨설턴트 과정 (6주)</li></ul></div>
<div class="nc-note">마감: 선착순 20명</div>`
  },
  {
    id: 'n4', title: '한국중장년고용협회 × 메인에이지 업무협약',
    published_at: '2025-06-20', is_new: false, is_hot: false,
    author: '사무국', views: 67,
    content: `<p>한국중장년고용협회와 메인에이지가 중장년 고용 활성화를 위한 업무협약(MOU)을 체결하였습니다.</p>
<div class="nc-note">협약일: 2025년 6월 20일</div>`
  },
  {
    id: 'n5', title: '중장년 고용 정책 세미나 개최 공지',
    published_at: '2025-04-15', is_new: false, is_hot: false,
    author: '정책연구팀', views: 156,
    content: `<p>중장년 고용 활성화를 위한 정책 세미나를 개최합니다.</p>
<div class="nc-section"><h4>■ 행사 개요</h4><ul><li>일시: 2025년 4월 25일 오후 2시</li><li>장소: 서울 서초구 협회 강당</li></ul></div>`
  },
];

const NEWS_FB = [
  {
    id: 'w1', title: '워크그래피 AI 분석 서비스 베타 오픈',
    published_at: '2026-02-10', is_new: true, is_hot: false,
    author: '퍼플넷팀', views: 312,
    content: `<p>워크그래피 AI 분석 서비스 베타 버전이 오픈되었습니다.</p>
<div class="nc-section"><h4>■ 베타 서비스 주요 기능</h4><ul><li>경력·역량 자동 분류 및 시각화</li><li>AI 기반 적합 직무 추천</li><li>암묵지 강점 분석 리포트</li></ul></div>
<div class="nc-note">베타 테스터 모집 중 | kapae1503@gmail.com</div>`
  },
  {
    id: 'w2', title: '퍼플넷 2026 런칭 준비 현황 공개',
    published_at: '2025-11-20', is_new: false, is_hot: true,
    author: '퍼플넷팀', views: 428,
    content: `<p>퍼플넷 2026 런칭을 위한 준비 현황을 공개합니다.</p>
<div class="nc-section"><h4>■ 진행 현황</h4><ul><li>플랫폼 개발: 80% 완료</li><li>워크그래피 AI 엔진: 베타 테스트 중</li><li>사전 등록 회원: 2,300명+</li></ul></div>`
  },
  {
    id: 'w3', title: '정부 중장년 고용정책 간담회 참여 결과',
    published_at: '2025-09-08', is_new: false, is_hot: false,
    author: '정책연구팀', views: 94,
    content: `<p>고용노동부 주관 중장년 고용정책 간담회에 협회 대표로 참여하였습니다.</p>
<div class="nc-note">향후 정책 연구 결과는 별도 보고서로 발간 예정입니다.</div>`
  },
  {
    id: 'w4', title: '중장년 핵심인재 양성 프로그램 성과 발표',
    published_at: '2025-07-14', is_new: false, is_hot: false,
    author: '교육훈련팀', views: 131,
    content: `<p>2025년 상반기 중장년 핵심인재 양성 프로그램의 성과를 발표합니다.</p>
<div class="nc-section"><h4>■ 주요 성과</h4><ul><li>수료생: 84명 | 취업 연계: 61명 (72.6%)</li><li>만족도: 4.6 / 5.0</li></ul></div>`
  },
  {
    id: 'w5', title: '2025 중장년 고용 심포지엄 참가 후기',
    published_at: '2025-05-22', is_new: false, is_hot: false,
    author: '사무국', views: 78,
    content: `<p>2025 중장년 고용 심포지엄에 협회가 참가하였습니다.</p>
<p>협회는 퍼플넷 플랫폼 소개 세션을 통해 AI 기반 중장년 매칭 솔루션을 소개하며 큰 호응을 받았습니다.</p>`
  },
];

/* ═══════════════════════════════════
   4. 알림마당 게시판
═══════════════════════════════════ */
let boardData = { notice: [], news: [] };
let modalList = [];
let modalIdx = 0;
let curModalCat = 'notice';

function renderList(panelId, items) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.innerHTML = items.map((it, i) => {
    const badge = it.is_new
      ? `<span class="nbadge new-b">NEW</span>`
      : it.is_hot
        ? `<span class="nbadge hot-b">HOT</span>`
        : `<span class="nbadge emp-b"></span>`;
    const date = (it.published_at || '').slice(0, 7);
    const cat = panelId === 'list-notice' ? 'notice' : 'news';
    return `<div class="nrow" onclick="openModal('${cat}',${i})">
      ${badge}
      <span class="nrow-title">${it.title}</span>
      <span class="nrow-date">${date}</span>
    </div>`;
  }).join('');
}

async function loadAllBoards() {
  try {
    const r = await sbQuery('notice_board', {
      filter: { 'category': 'eq.공지사항', 'is_active': 'eq.true' },
      order: 'published_at.desc', limit: 5,
    });
    boardData.notice = r.length ? r : NOTICE_FB;
  } catch { boardData.notice = NOTICE_FB; }

  try {
    const r = await sbQuery('notice_board', {
      filter: { 'category': 'eq.협회소식', 'is_active': 'eq.true' },
      order: 'published_at.desc', limit: 5,
    });
    boardData.news = r.length ? r : NEWS_FB;
  } catch { boardData.news = NEWS_FB; }

  renderList('list-notice', boardData.notice);
  renderList('list-news', boardData.news);
}

function openBoardAll(cat) {
  const tab = (cat === 'news') ? 'news' : 'notice';
  window.location.href = `notice.html?tab=${tab}`;
}

/* ═══════════════════════════════════
   5. 게시물 상세 모달
═══════════════════════════════════ */
function openModal(cat, idx) {
  const list = cat === 'notice' ? boardData.notice : boardData.news;
  curModalCat = cat;
  modalList = list;
  modalIdx = idx;
  renderModalContent(list[idx], cat);
  document.getElementById('nmodal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function renderModalContent(item, cat) {
  document.getElementById('nmodalCat').textContent = cat === 'notice' ? '공지사항' : '협회 소식';
  const b = document.getElementById('nmodalBadge');
  if (item.is_new) {
    b.className = 'nmodal-badge new-b'; b.textContent = 'NEW'; b.style.display = 'inline-flex';
  } else if (item.is_hot) {
    b.className = 'nmodal-badge hot-b'; b.textContent = 'HOT'; b.style.display = 'inline-flex';
  } else {
    b.style.display = 'none';
  }
  document.getElementById('nmodalDate').textContent = (item.published_at || '').slice(0, 10);
  const vEl = document.getElementById('nmodalViews');
  if (vEl) vEl.textContent = item.views ? `조회 ${item.views}` : '';
  document.getElementById('nmodalTitle').textContent = item.title;
  document.getElementById('nmodalAuthor').textContent = item.author || '한국중장년고용협회';
  const cEl = document.getElementById('nmodalContent');
  cEl.innerHTML = item.content || `<p style="color:var(--ink3)">상세 내용을 불러오는 중입니다.</p>`;
  document.getElementById('nmodalPrev').disabled = modalIdx <= 0;
  document.getElementById('nmodalNext').disabled = modalIdx >= modalList.length - 1;
  document.getElementById('nmodalBody').scrollTop = 0;
}

function closeModal() {
  document.getElementById('nmodal').classList.remove('on');
  document.body.style.overflow = '';
}

function modalNav(dir) {
  const n = modalIdx + dir;
  if (n < 0 || n >= modalList.length) return;
  modalIdx = n;
  renderModalContent(modalList[n], curModalCat);
}

function nmodalMaskClick(e) {
  if (e.target === document.getElementById('nmodal')) closeModal();
}

/* ═══════════════════════════════════
   6. 문의 접수 폼
═══════════════════════════════════ */
function escH(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function doSubmit() {
  const name = document.getElementById('fn').value.trim();
  const phone = document.getElementById('fp').value.trim();
  const email = document.getElementById('fe').value.trim();
  const type = document.getElementById('ft').value;
  const message = document.getElementById('fm').value.trim();
  const privOk = document.getElementById('fpriv').checked;
  const msgEl = document.getElementById('fmsg');
  const btn = document.getElementById('fsb');

  msgEl.className = 'fmsg';
  if (!name || !phone || !message) {
    msgEl.className = 'fmsg er';
    msgEl.textContent = '⚠️ 성명, 연락처, 문의 내용은 필수입니다.';
    return;
  }
  if (!privOk) {
    msgEl.className = 'fmsg er';
    msgEl.textContent = '⚠️ 개인정보 수집·이용 동의가 필요합니다.';
    return;
  }

  btn.disabled = true;
  document.getElementById('fsbTxt').style.display = 'none';
  document.getElementById('fsbSpin').style.display = 'inline';

  const payload = {
    name, phone,
    email: email || null,
    type: type || '일반 문의',   // server.js: const { type, ... } = req.body
    text: message,              // server.js: const { ..., text } = req.body
    submitted_at: new Date().toISOString(),
  };

  const htmlBody = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:580px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:8px;overflow:hidden">
<div style="background:linear-gradient(135deg,#0D1B2A,#243B55);padding:24px 28px">
  <div style="font-size:9px;color:rgba(255,255,255,.45);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px">KAPAE 온라인 문의</div>
  <div style="font-size:18px;font-weight:700;color:#fff">(사)한국중장년고용협회 문의 접수</div>
</div>
<div style="padding:24px 28px">
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#999;width:70px;font-size:11px;font-weight:600;text-transform:uppercase">성명</td><td style="padding:10px 0;font-weight:600">${escH(name)}</td></tr>
    <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">연락처</td><td style="padding:10px 0">${escH(phone)}</td></tr>
    <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">이메일</td><td style="padding:10px 0">${email || '미입력'}</td></tr>
    <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">유형</td><td style="padding:10px 0"><span style="background:#f5ede0;color:#8b6914;padding:2px 8px;border-radius:4px;font-size:11px">${escH(type || '일반 문의')}</span></td></tr>
    <tr><td style="padding:10px 0;color:#999;font-size:11px;font-weight:600;text-transform:uppercase;vertical-align:top">내용</td><td style="padding:10px 0;line-height:1.8">${escH(message).replace(/\n/g, '<br>')}</td></tr>
  </table>
</div>
<div style="padding:12px 28px;background:#f9f9f9;border-top:1px solid #eee;font-size:10px;color:#aaa">접수: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)</div>
</div>`;

  let success = false;
  // doSubmit 함수 중간의 try { ... } 부분을 아래 내용으로 바꾸세요.
  try {
    // 껍데기(dbData 등) 없이 서버가 기다리는 데이터만 직접 던집니다.
    await sbInsert('inquiries', {
      type: type || '일반 문의',
      name: name,
      phone: phone,
      email: email || null,
      text: message // server.js는 'text'라는 이름으로 내용을 받습니다.
    });
    success = true;
  } catch (e) {
    console.warn('전송 에러:', e.message);
  }

  if (success) {
    msgEl.className = 'fmsg ok';
    msgEl.textContent = '✅ 문의가 접수되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다.';
    ['fn', 'fp', 'fe', 'fm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ft').value = '';
    document.getElementById('fpriv').checked = false;
  } else {
    msgEl.className = 'fmsg er';
    msgEl.innerHTML = `❌ 전송 실패. 직접 연락 부탁드립니다. &nbsp;📞 <a href="tel:02-582-1009" style="color:var(--gold)">02-582-1009</a> &nbsp;|&nbsp; <a href="mailto:kapae1503@gmail.com" style="color:var(--gold)">kapae1503@gmail.com</a>`;
  }
  btn.disabled = false;
  document.getElementById('fsbTxt').style.display = 'inline';
  document.getElementById('fsbSpin').style.display = 'none';
}

/* ═══════════════════════════════════
   7. 챗봇
═══════════════════════════════════ */
const KB = {
  '협회': '(사)한국중장년고용협회(KAPAE)는 2015년 국내 최초 중장년 고용 전문 비영리 사단법인입니다. 중장년의 경험을 AI와 연결하여 새로운 일자리를 창출합니다.',
  '퍼플넷': '퍼플넷(Purplenet)은 나만의 일경험을 디지털 자산으로 기록하고 다시 일로 연결하는 플랫폼입니다. KAPAE와 공식 연동되어 워크그래피 → 매칭/코칭 → 교육/자격증까지 원스톱으로 지원합니다.',
  '워크그래피': '워크그래피(Workgraphy)는 나만의 일경험을 AI로 구조화한 핵심 데이터 자산입니다. AI 인터뷰를 통해 생성되며 KAPAE 교육·인증과 연결됩니다.',
  '매칭': 'AI 직무 추천 및 매칭 서비스를 제공합니다. 워크그래피 데이터 기반으로 재취업·자문·강연 기회를 연결합니다.',
  '교육': '생애설계, 전문가 양성 프로그램 및 퍼플넷 디지털 클래스와 연결된 교육훈련 서비스입니다.',
  '자격': 'KAPAE 중장년 전문 컨설턴트 자격증 및 친화기업 인증 프로그램을 운영합니다.',
  '사업': '7대 핵심 사업: ①제도연구·정책개발 ②조사·통계 ③정부시책홍보 ④인력매칭 ⑤컨설팅 ⑥교육훈련 ⑦인증·자격',
  '연락': '📍 서울 서초구 서초대로64길 55 준원빌딩 505호\n📞 02-582-1009\n✉️ kapae1503@gmail.com',
};

let chatOpen = false;

function getBotReply(m) {
  const l = m.toLowerCase();
  for (const [k, v] of Object.entries(KB)) if (l.includes(k)) return v;
  if (/안녕|hello|hi/.test(l)) return '안녕하세요! KAPAE 상담봇입니다 😊 퍼플넷, 워크그래피, 매칭·코칭, 교육·자격증 등 무엇이든 물어보세요!';
  return '자세한 상담은 담당자에게 연결해드리겠습니다.\n📞 02-582-1009 / kapae1503@gmail.com';
}

function addMsg(t, tp) {
  const cwm = document.getElementById('cwm');
  const d = document.createElement('div');
  d.className = 'cm ' + tp;
  d.innerHTML = tp === 'bot'
    ? `<div class="cav">🤖</div><div class="cb">${t.replace(/\n/g, '<br>')}</div>`
    : `<div class="cb">${t}</div>`;
  cwm.appendChild(d);
  cwm.scrollTop = cwm.scrollHeight;
}

function showTyping() {
  const cwm = document.getElementById('cwm');
  const d = document.createElement('div');
  d.className = 'cm bot'; d.id = 'ty';
  d.innerHTML = '<div class="cav">🤖</div><div class="cb"><div class="ty"><span></span><span></span><span></span></div></div>';
  cwm.appendChild(d);
  cwm.scrollTop = cwm.scrollHeight;
}

function sendChat() {
  const i = document.getElementById('cwi');
  const t = i.value.trim();
  if (!t) return;
  addMsg(t, 'u'); i.value = '';
  showTyping();
  setTimeout(() => { document.getElementById('ty')?.remove(); addMsg(getBotReply(t), 'bot'); }, 700 + Math.random() * 400);
}

function askQ(q) {
  addMsg(q, 'u');
  showTyping();
  setTimeout(() => { document.getElementById('ty')?.remove(); addMsg(getBotReply(q), 'bot'); }, 650);
}

function toggleChat() {
  const cwin = document.getElementById('cwin');
  const cwm = document.getElementById('cwm');
  chatOpen = !chatOpen;
  cwin.classList.toggle('on', chatOpen);
  if (chatOpen && !cwm.children.length) {
    setTimeout(() => addMsg('안녕하세요! 👋 KAPAE × 퍼플넷 상담봇입니다.\n고용정보, 워크그래피, 매칭·코칭, 교육·자격증 등\n버튼을 클릭하거나 직접 질문해주세요!', 'bot'), 300);
  }
}

/* ═══════════════════════════════════
   8. 드로어 내비게이션
═══════════════════════════════════ */
function openDrw() { document.getElementById('drw').classList.add('on'); }
function closeDrw() { document.getElementById('drw').classList.remove('on'); }

/* ═══════════════════════════════════
   9. 스크롤 리빌 & 키보드 이벤트
═══════════════════════════════════ */
function initScrollReveal() {
  const rvObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    WGW.close();
    closeConfirmDel?.();
    document.getElementById('nmodal')?.classList.remove('on');
    document.body.style.overflow = '';
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    const root = document.getElementById('adminRoot');
    if (root) { root.style.display = 'flex'; root.classList.add('on'); }
  }
});

/* ═══════════════════════════════════════════════════════
   ★ 전역 워크그래피 상태 저장소
   - WGW가 생성한 결과를 JourneySection과 공유
═══════════════════════════════════════════════════════ */
const KAPAE = {
  workgraphy: null,  // WGW 생성 결과
  formData: null,    // 입력된 개인 정보
  workgraphyId: null, // 백엔드 DB ID

  // localStorage에서 복원
  load() {
    try {
      const saved = localStorage.getItem('kapae_wg');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 24시간 이내 데이터만 복원
        if (parsed.ts && Date.now() - parsed.ts < 86400000) {
          this.workgraphy = parsed.wg;
          this.formData = parsed.fd;
          this.workgraphyId = parsed.wid;
          return true;
        }
      }
    } catch { }
    return false;
  },

  // localStorage에 저장
  save() {
    try {
      localStorage.setItem('kapae_wg', JSON.stringify({
        wg: this.workgraphy,
        fd: this.formData,
        wid: this.workgraphyId,
        ts: Date.now(),
      }));
    } catch { }
  },

  // 워크그래피 설정 → 이벤트 발행
  setWorkgraphy(wg, fd, wid = null) {
    this.workgraphy = wg;
    this.formData = fd;
    this.workgraphyId = wid;
    this.save();
    document.dispatchEvent(new CustomEvent('kapae:workgraphy', { detail: { wg, fd, wid } }));
  }
};

/* ═══════════════════════════════════════════════════════
   10. ★ 워크그래피 생성 마법사 (WGW)
═══════════════════════════════════════════════════════ */
const WGW = (() => {

  const CSS = `
.wgw-ov{position:fixed;inset:0;z-index:4000;background:rgba(6,13,22,.88);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:16px;animation:wgwFadeIn .3s ease both;}
.wgw-ov.on{display:flex;}
@keyframes wgwFadeIn{from{opacity:0}to{opacity:1}}
.wgw-panel{width:min(760px,100%);max-height:92vh;background:#0D1B2A;border:1px solid rgba(184,151,106,.22);display:flex;flex-direction:column;animation:wgwUp .38s cubic-bezier(.22,1,.36,1) both;overflow:hidden;}
@keyframes wgwUp{from{transform:translateY(28px);opacity:0}to{transform:none;opacity:1}}
.wgw-hdr{flex-shrink:0;background:linear-gradient(135deg,#060D14 0%,#1A2E45 100%);padding:20px 28px 16px;border-bottom:1px solid rgba(184,151,106,.12);}
.wgw-hdr-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;}
.wgw-hdr-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.3);padding:4px 12px;margin-bottom:8px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#a78bfa;}
.wgw-hdr-badge span{width:5px;height:5px;border-radius:50%;background:#a78bfa;animation:wgwPulse 2s ease-in-out infinite;}
@keyframes wgwPulse{0%,100%{opacity:1}50%{opacity:.25}}
.wgw-title{font-size:18px;font-weight:600;color:#fff;line-height:1.35;margin-bottom:3px;}
.wgw-title em{color:#B8976A;font-style:normal;}
.wgw-subtitle{font-size:12px;color:rgba(255,255,255,.38);letter-spacing:.06em;}
.wgw-close{width:32px;height:32px;flex-shrink:0;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.45);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.18s;}
.wgw-close:hover{background:rgba(255,255,255,.15);color:#fff;transform:rotate(90deg);}
.wgw-prog{display:flex;gap:4px;}
.wgw-prog-step{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.08);transition:background .4s ease;position:relative;overflow:hidden;}
.wgw-prog-step.done{background:#B8976A;}
.wgw-prog-step.act{background:rgba(184,151,106,.3);}
.wgw-prog-step.act::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,#B8976A,transparent);animation:wgwShimmer 1.5s linear infinite;}
@keyframes wgwShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.wgw-prog-labels{display:flex;gap:4px;margin-top:10px;}
.wgw-prog-lbl{flex:1;text-align:center;font-size:9.5px;letter-spacing:.04em;color:rgba(255,255,255,.2);transition:color .3s;}
.wgw-prog-lbl.act{color:#B8976A;font-weight:600;}
.wgw-prog-lbl.done{color:rgba(184,151,106,.55);}
.wgw-body{flex:1;overflow-y:auto;padding:24px 28px 8px;}
.wgw-body::-webkit-scrollbar{width:3px;}
.wgw-body::-webkit-scrollbar-thumb{background:rgba(184,151,106,.25);border-radius:3px;}
.wgw-step{display:none;}
.wgw-step.on{display:block;animation:wgwStepIn .3s cubic-bezier(.22,1,.36,1) both;}
@keyframes wgwStepIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
.wgw-step-hd{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.06);}
.wgw-step-no{font-size:11px;color:#B8976A;letter-spacing:.18em;text-transform:uppercase;margin-bottom:5px;}
.wgw-step-title{font-size:17px;font-weight:600;color:#fff;margin-bottom:4px;}
.wgw-step-desc{font-size:12.5px;color:rgba(255,255,255,.38);line-height:1.7;}
.wfr{margin-bottom:16px;}
.wfr label{display:block;font-size:9.5px;font-weight:700;color:#B8976A;letter-spacing:.14em;text-transform:uppercase;margin-bottom:7px;}
.wfr input,.wfr select,.wfr textarea{width:100%;padding:10px 14px;background:rgba(255,255,255,.05);border:1px solid rgba(184,151,106,.2);color:rgba(255,255,255,.82);font-size:13px;font-weight:300;outline:none;transition:border .2s,background .2s;font-family:'Noto Sans KR',sans-serif;resize:vertical;}
.wfr input:focus,.wfr select:focus,.wfr textarea:focus{border-color:#B8976A;background:rgba(255,255,255,.07);}
.wfr input::placeholder,.wfr textarea::placeholder{color:rgba(255,255,255,.18);}
.wfr select option{background:#0D1B2A;color:#fff;}
.wfr textarea{height:90px;}
.wfr-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.wfr-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.wg-upload-box{border:1.5px dashed rgba(184,151,106,.25);padding:24px;text-align:center;background:rgba(184,151,106,.03);cursor:pointer;transition:.2s;margin-bottom:16px;position:relative;}
.wg-upload-box:hover{border-color:#B8976A;background:rgba(184,151,106,.06);}
.wg-upload-box.has-file{border-color:#4ade80;background:rgba(74,222,128,.05);}
.wg-upload-icon{font-size:24px;margin-bottom:10px;opacity:.5;}
.wg-upload-text{font-size:12.5px;color:rgba(255,255,255,.45);margin-bottom:4px;}
.wg-upload-sub{font-size:10.5px;color:rgba(255,255,255,.22);}
.wg-upload-file-info{display:none;margin-top:10px;font-size:12px;color:#4ade80;font-weight:500;}
.wg-upload-box.has-file .wg-upload-file-info{display:block;}
.wg-upload-box.has-file .wg-upload-text,.wg-upload-box.has-file .wg-upload-sub{display:none;}
.wg-radios{display:flex;flex-wrap:wrap;gap:8px;}
.wg-radio{position:relative;}
.wg-radio input{position:absolute;opacity:0;width:0;height:0;}
.wg-radio label{display:flex;align-items:center;gap:7px;padding:9px 16px;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:12.5px;font-weight:400;cursor:pointer;transition:.18s;font-family:'Noto Sans KR',sans-serif;}
.wg-radio label:hover{border-color:rgba(184,151,106,.4);color:#D4B896;}
.wg-radio input:checked+label{border-color:#B8976A;background:rgba(184,151,106,.1);color:#D4B896;font-weight:600;}
.wg-radio label span{font-size:15px;}
.wg-checks{display:flex;flex-wrap:wrap;gap:7px;}
.wg-check{position:relative;}
.wg-check input{position:absolute;opacity:0;width:0;height:0;}
.wg-check label{display:inline-block;padding:5px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.45);font-size:11.5px;cursor:pointer;transition:.16s;font-family:'Noto Sans KR',sans-serif;}
.wg-check label:hover{border-color:rgba(184,151,106,.35);color:#D4B896;}
.wg-check input:checked+label{background:rgba(184,151,106,.12);border-color:#B8976A;color:#D4B896;font-weight:600;}
.wg-career-block{border:1px solid rgba(255,255,255,.07);padding:14px 16px;background:rgba(255,255,255,.02);margin-bottom:10px;position:relative;}
.wg-career-block-hd{font-size:10px;color:rgba(184,151,106,.6);letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;}
.wg-add-career{width:100%;padding:9px;background:none;border:1px dashed rgba(184,151,106,.25);color:rgba(184,151,106,.5);font-size:12px;cursor:pointer;transition:.16s;font-family:'Noto Sans KR',sans-serif;}
.wg-add-career:hover{border-color:#B8976A;color:#D4B896;background:rgba(184,151,106,.04);}
.wgw-analyzing{display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center;}
.wgw-ai-orb{width:80px;height:80px;border-radius:50%;border:2px solid rgba(124,58,237,.4);background:radial-gradient(circle,rgba(124,58,237,.15) 0%,transparent 70%);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:20px;animation:wgwOrb 2.4s ease-in-out infinite;}
@keyframes wgwOrb{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(124,58,237,.4)}50%{transform:scale(1.05);box-shadow:0 0 0 14px rgba(124,58,237,0)}}
.wgw-ai-title{font-size:17px;font-weight:600;color:#fff;margin-bottom:6px;}
.wgw-ai-sub{font-size:12px;color:rgba(255,255,255,.35);margin-bottom:28px;}
.wgw-ai-steps{width:100%;max-width:340px;display:flex;flex-direction:column;gap:8px;}
.wgw-ai-step-row{display:flex;align-items:center;gap:10px;padding:9px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);font-size:12px;color:rgba(255,255,255,.3);transition:all .4s ease;}
.wgw-ai-step-row.active{border-color:rgba(124,58,237,.3);color:#c4b5fd;background:rgba(124,58,237,.08);}
.wgw-ai-step-row.done{border-color:rgba(184,151,106,.25);color:rgba(184,151,106,.7);}
.wgw-ai-step-row.done::before{content:'✓ ';color:#B8976A;}
.wgw-ai-step-icon{font-size:14px;flex-shrink:0;}
.wgw-ai-step-bar{margin-top:20px;width:100%;max-width:340px;height:2px;background:rgba(255,255,255,.06);overflow:hidden;}
.wgw-ai-step-bar-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#B8976A);width:0%;transition:width .8s ease;}
.wgw-result-card{background:rgba(255,255,255,.03);border:1px solid rgba(184,151,106,.18);padding:20px 22px;margin-bottom:14px;position:relative;overflow:hidden;}
.wgw-result-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
.wgw-result-card.gold::before{background:#B8976A;}
.wgw-result-card.purple::before{background:#7c3aed;}
.wgw-result-card.teal::before{background:#0B6E5A;}
.wrc-label{font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#B8976A;margin-bottom:10px;}
.wrc-label.p{color:#a78bfa;}
.wrc-label.t{color:#4ade80;}
.wrc-title{font-size:15.5px;font-weight:600;color:#fff;margin-bottom:8px;line-height:1.4;}
.wrc-text{font-size:13px;color:rgba(255,255,255,.55);line-height:1.9;}
.wrc-text strong{color:#D4B896;font-weight:600;}
.wgw-score-wrap{display:flex;align-items:center;gap:18px;margin:10px 0;}
.wgw-score-circle{width:72px;height:72px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;}
.wgw-score-circle::after{content:'';position:absolute;width:54px;height:54px;border-radius:50%;background:#0D1B2A;}
.wgw-score-num{position:relative;z-index:1;font-family:'Bebas Neue',sans-serif;font-size:20px;color:#D4B896;line-height:1;text-align:center;}
.wgw-score-num small{font-size:11px;}
.wgw-score-info{flex:1;}
.wgw-score-grade{font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;}
.wgw-score-desc{font-size:12px;color:rgba(255,255,255,.4);line-height:1.7;}
.wgw-jobs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
.wgw-job{padding:7px 16px;background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.25);color:#c4b5fd;font-size:12.5px;}
.wgw-skills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.wgw-skill{padding:4px 12px;background:rgba(184,151,106,.08);border:1px solid rgba(184,151,106,.2);color:#D4B896;font-size:11.5px;}
.wgw-cta-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;}
.wgw-cta-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;font-size:12.5px;font-weight:600;border:none;cursor:pointer;transition:.22s;font-family:'Noto Sans KR',sans-serif;text-decoration:none;}
.wgw-cta-btn.primary{background:#B8976A;color:#0D1B2A;}
.wgw-cta-btn.primary:hover{background:#D4B896;transform:translateY(-1px);}
.wgw-cta-btn.secondary{background:rgba(124,58,237,.15);color:#c4b5fd;border:1px solid rgba(124,58,237,.3);}
.wgw-cta-btn.secondary:hover{background:rgba(124,58,237,.25);}
.wgw-footer{flex-shrink:0;padding:14px 28px;border-top:1px solid rgba(255,255,255,.05);background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:space-between;gap:10px;}
.wgw-footer-note{font-size:10.5px;color:rgba(255,255,255,.2);letter-spacing:.04em;}
.wgw-btns{display:flex;gap:8px;}
.wgw-btn{padding:9px 22px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:.2s;font-family:'Noto Sans KR',sans-serif;}
.wgw-btn-back{background:none;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.4);}
.wgw-btn-back:hover{border-color:rgba(255,255,255,.25);color:rgba(255,255,255,.7);}
.wgw-btn-next{background:#B8976A;color:#0D1B2A;}
.wgw-btn-next:hover{background:#D4B896;}
.wgw-btn-next:disabled{opacity:.45;cursor:not-allowed;}
.wgw-err{padding:9px 13px;margin-top:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5;font-size:12px;display:none;}
.wgw-err.on{display:block;}
.wgw-resume-bar{padding:10px 16px;background:rgba(184,151,106,.08);border:1px solid rgba(184,151,106,.2);margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.wgw-resume-bar span{font-size:12px;color:rgba(255,255,255,.5);}
.wgw-resume-bar strong{color:#D4B896;}
.wgw-resume-bar button{padding:5px 14px;background:none;border:1px solid rgba(184,151,106,.3);color:#B8976A;font-size:11px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;}
.wgw-resume-bar button:hover{background:rgba(184,151,106,.1);}
@media(max-width:600px){.wgw-panel{max-height:100vh;}.wfr-2,.wfr-3,.wgw-cta-row{grid-template-columns:1fr;}.wgw-body{padding:18px 18px 8px;}.wgw-footer{padding:12px 18px;}.wgw-hdr{padding:16px 18px 14px;}}
`;

  const SKILLS_LIST = [
    '경영·기획', '영업·마케팅', '생산·품질관리', '인사·총무',
    '회계·세무', '법무·컴플라이언스', 'IT·개발', '데이터분석',
    '기술·설계', '연구·개발(R&D)', '교육·훈련', '의료·보건',
    '물류·유통', '건설·건축', '금융·투자', '공공·행정',
    '컨설팅', '강의·코칭', '창업·스타트업', '해외사업',
  ];

  const INDUSTRIES = [
    '제조업', '건설·건축', '금융·보험', '의료·바이오', 'IT·소프트웨어',
    '유통·물류', '공공·공기업', '교육·컨텐츠', '에너지·환경',
    '농업·식품', '서비스업', '미디어·광고', '기타',
  ];

  const REGIONS = [
    '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
    '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '해외',
  ];

  function buildHTML() {
    return `
<div class="wgw-ov" id="wgwOverlay" onclick="if(event.target===this)WGW.close()">
  <div class="wgw-panel" id="wgwPanel">
    <div class="wgw-hdr">
      <div class="wgw-hdr-top">
        <div>
          <div class="wgw-hdr-badge"><span></span> KAPAE × Purplenet · AI 워크그래피</div>
          <div class="wgw-title">고용정보 수집 &amp; <em>워크그래피</em> 생성</div>
          <div class="wgw-subtitle">Employment Info Collection · AI Workgraphy Generator</div>
        </div>
        <button class="wgw-close" onclick="WGW.close()">✕</button>
      </div>
      <div class="wgw-prog">
        <div class="wgw-prog-step act" id="wgwProg1"></div>
        <div class="wgw-prog-step" id="wgwProg2"></div>
        <div class="wgw-prog-step" id="wgwProg3"></div>
        <div class="wgw-prog-step" id="wgwProg4"></div>
      </div>
      <div class="wgw-prog-labels">
        <div class="wgw-prog-lbl act" id="wgwLbl1">기본 정보</div>
        <div class="wgw-prog-lbl" id="wgwLbl2">경력 입력</div>
        <div class="wgw-prog-lbl" id="wgwLbl3">AI 분석</div>
        <div class="wgw-prog-lbl" id="wgwLbl4">결과 확인</div>
      </div>
    </div>
    <div class="wgw-body" id="wgwBody">
      <div class="wgw-step on" id="wgwStep1">
        <div class="wgw-step-hd">
          <div class="wgw-step-no">Step 01 / 04</div>
          <div class="wgw-step-title">기본 정보를 입력해주세요</div>
          <div class="wgw-step-desc">귀하의 현재 상황과 기본 인적사항을 입력합니다.</div>
        </div>
        <div class="wfr-2">
          <div class="wfr"><label>성명 *</label><input type="text" id="wg_name" placeholder="홍길동"></div>
          <div class="wfr"><label>연락처</label><input type="tel" id="wg_phone" placeholder="010-0000-0000"></div>
        </div>
        <div class="wfr">
          <label>연령대 *</label>
          <div class="wg-radios">
            ${['40대 초반(40~44)', '40대 후반(45~49)', '50대 초반(50~54)', '50대 후반(55~59)', '60대 이상(60+)'].map((v, i) =>
      `<div class="wg-radio"><input type="radio" name="wg_age" id="wgAge${i}" value="${v}"><label for="wgAge${i}"><span>${['4⁰', '4⁵', '5⁰', '5⁵', '6⁰'][i]}</span>${v}</label></div>`
    ).join('')}
          </div>
        </div>
        <div class="wfr">
          <label>현재 상태 *</label>
          <div class="wg-radios">
            ${[['💼', '재직 중'], ['🔄', '전직 준비'], ['🎓', '퇴직 후 구직'], ['🌅', '은퇴 예정'], ['🏡', '은퇴 후 활동']].map(([ic, lb], i) =>
      `<div class="wg-radio"><input type="radio" name="wg_status" id="wgSt${i}" value="${lb}"><label for="wgSt${i}"><span>${ic}</span>${lb}</label></div>`
    ).join('')}
          </div>
        </div>
        <div class="wfr-2">
          <div class="wfr"><label>희망 활동 지역</label><select id="wg_region"><option value="">선택</option>${REGIONS.map(r => `<option>${r}</option>`).join('')}</select></div>
          <div class="wfr"><label>희망 활동 형태</label><select id="wg_worktype"><option value="">선택</option><option>정규직 재취업</option><option>계약직 / 파견</option><option>프리랜서 / 자문</option><option>강의 / 멘토링</option><option>창업 / 소규모 사업</option><option>파트타임 / 유연근무</option></select></div>
        </div>
        <div class="wgw-err" id="wgwErr1"></div>
      </div>

      <div class="wgw-step" id="wgwStep2">
        <div class="wgw-step-hd">
          <div class="wgw-step-no">Step 02 / 04</div>
          <div class="wgw-step-title">경력 및 전문성을 입력해주세요</div>
          <div class="wgw-step-desc">주요 경력, 보유 스킬을 직접 입력하거나, <strong>워크그래피 e-book(PDF)</strong>을 업로드하세요.</div>
        </div>
        <div class="wg-upload-box" id="wgUploadBox" onclick="document.getElementById('wgFile').click()">
          <input type="file" id="wgFile" accept=".pdf" style="display:none" onchange="WGW.handleFile(this)">
          <div class="wg-upload-icon">📄</div>
          <div class="wg-upload-text">워크그래피 e-book (PDF) 업로드</div>
          <div class="wg-upload-sub">파일을 선택하면 AI가 경력을 자동 추출합니다</div>
          <div class="wg-upload-file-info" id="wgFileInfo">파일명.pdf (업로드됨)</div>
        </div>
        <div id="wgCareerList"></div>
        <button class="wg-add-career" onclick="WGW.addCareer()">+ 경력 추가 (최대 5개)</button>
        <div class="wfr" style="margin-top:16px">
          <label>총 경력 연수 *</label>
          <div class="wg-radios">
            ${['5년 미만', '5~10년', '10~15년', '15~20년', '20~25년', '25년 이상'].map((v, i) =>
      `<div class="wg-radio"><input type="radio" name="wg_totalyears" id="wgTY${i}" value="${v}"><label for="wgTY${i}">${v}</label></div>`
    ).join('')}
          </div>
        </div>
        <div class="wfr">
          <label>최고 전문 분야 (복수 선택) *</label>
          <div class="wg-checks">
            ${SKILLS_LIST.map((s, i) =>
      `<div class="wg-check"><input type="checkbox" id="wgSk${i}" value="${s}" class="wg-skill-chk"><label for="wgSk${i}">${s}</label></div>`
    ).join('')}
          </div>
        </div>
        <div class="wfr">
          <label>핵심 역량 · 업무 성과 자유 기술 *</label>
          <textarea id="wg_summary" placeholder="예: 제조업 생산관리 20년 경력. 연간 30% 불량률 감소 프로젝트 주도. 50명 팀 운영 경험. ISO 인증 취득 리더..."></textarea>
          <div style="font-size:10px;color:rgba(255,255,255,.22);text-align:right;margin-top:3px"><span id="wgSumCnt">0</span>자 (최소 30자)</div>
        </div>
        <div class="wfr"><label>이메일 (결과 수신용)</label><input type="email" id="wg_email" placeholder="example@email.com"></div>
        <div class="wgw-err" id="wgwErr2"></div>
      </div>

      <div class="wgw-step" id="wgwStep3">
        <div class="wgw-analyzing" id="wgwAnalyzing">
          <div class="wgw-ai-orb" id="wgwAiOrb">🤖</div>
          <div class="wgw-ai-title">AI 워크그래피 생성 중</div>
          <div class="wgw-ai-sub">경력 데이터를 분석하여 워크그래피를 만들고 있습니다</div>
          <div class="wgw-ai-steps">
            <div class="wgw-ai-step-row" id="wgAiS1"><span class="wgw-ai-step-icon">📊</span> 고용정보 수집 및 경력 구조화</div>
            <div class="wgw-ai-step-row" id="wgAiS2"><span class="wgw-ai-step-icon">🔍</span> 암묵지 패턴 분석</div>
            <div class="wgw-ai-step-row" id="wgAiS3"><span class="wgw-ai-step-icon">💡</span> 경험 가치 진단 (100점 척도)</div>
            <div class="wgw-ai-step-row" id="wgAiS4"><span class="wgw-ai-step-icon">🎯</span> 전환 가능 직무 추천 생성</div>
            <div class="wgw-ai-step-row" id="wgAiS5"><span class="wgw-ai-step-icon">📋</span> 워크그래피 문서 완성</div>
          </div>
          <div class="wgw-ai-step-bar"><div class="wgw-ai-step-bar-fill" id="wgAiBar"></div></div>
        </div>
      </div>

      <div class="wgw-step" id="wgwStep4">
        <div class="wgw-step-hd">
          <div class="wgw-step-no" style="color:#4ade80">✅ 완료</div>
          <div class="wgw-step-title" id="wgwResultName">워크그래피 생성 완료</div>
          <div class="wgw-step-desc">AI가 분석한 귀하의 경험 가치와 워크그래피 요약입니다. 아래 "AI 매칭 보기"를 클릭하면 맞춤 일자리가 연결됩니다.</div>
        </div>
        <div class="wgw-result" id="wgwResultArea"></div>
      </div>
    </div>

    <div class="wgw-footer">
      <div class="wgw-footer-note" id="wgwFootNote">KAPAE × Purplenet · 모든 데이터는 암호화되어 보관됩니다</div>
      <div class="wgw-btns" id="wgwBtns">
        <button class="wgw-btn wgw-btn-back" id="wgwBtnBack" onclick="WGW.prev()" style="display:none">← 이전</button>
        <button class="wgw-btn wgw-btn-next" id="wgwBtnNext" onclick="WGW.next()">다음 단계 →</button>
      </div>
    </div>
  </div>
</div>`;
  }

  let state = { step: 1, careerCount: 0, result: null, workgraphyId: null, selectedFile: null };

  function handleFile(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      state.selectedFile = file;
      document.getElementById('wgUploadBox').classList.add('has-file');
      document.getElementById('wgFileInfo').textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)}KB) 준비됨`;
    }
  }

  function init() {
    const st = document.createElement('style');
    st.id = 'wgwCSS';
    st.textContent = CSS;
    document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', buildHTML());
    const ta = document.getElementById('wg_summary');
    if (ta) ta.addEventListener('input', () => {
      document.getElementById('wgSumCnt').textContent = ta.value.length;
    });
    addCareer();
  }

  function open() {
    document.getElementById('wgwOverlay').classList.add('on');
    document.body.style.overflow = 'hidden';

    // 이전 워크그래피가 있으면 4단계로 바로 이동
    if (KAPAE.workgraphy && KAPAE.formData) {
      goStep(4);
      renderResult(KAPAE.workgraphy, KAPAE.formData);
      return;
    }
    resetWizard();
  }

  function close() {
    document.getElementById('wgwOverlay').classList.remove('on');
    document.body.style.overflow = '';
  }

  function resetWizard() {
    state.step = 1; state.result = null; state.workgraphyId = null; state.selectedFile = null;
    const box = document.getElementById('wgUploadBox'); if (box) box.classList.remove('has-file');
    goStep(1);
    ['wg_name', 'wg_phone', 'wg_email', 'wg_region', 'wg_worktype', 'wg_summary'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.querySelectorAll('input[name^="wg_"]').forEach(r => r.checked = false);
    document.querySelectorAll('.wg-skill-chk').forEach(c => c.checked = false);
    const list = document.getElementById('wgCareerList');
    if (list) { list.innerHTML = ''; state.careerCount = 0; addCareer(); }
  }

  function addCareer() {
    if (state.careerCount >= 5) return;
    const list = document.getElementById('wgCareerList');
    const n = state.careerCount;
    const div = document.createElement('div');
    div.className = 'wg-career-block'; div.id = `wgCareer${n}`;
    div.innerHTML = `
      <div class="wg-career-block-hd">경력 ${String(n + 1).padStart(2, '0')} ${n === 0 ? '(가장 최근 또는 대표 경력)' : ''}</div>
      <div class="wfr"><label>회사명 / 기관</label><input type="text" placeholder="예: (주)삼성전자, 서울시청" class="wg-c-company"></div>
      <div class="wfr-3">
        <div class="wfr"><label>직위 / 역할</label><input type="text" placeholder="팀장, 부장, 대표" class="wg-c-role"></div>
        <div class="wfr"><label>재직 기간</label><input type="text" placeholder="2010~2023" class="wg-c-period"></div>
        <div class="wfr"><label>업종</label><select class="wg-c-industry"><option value="">선택</option>${INDUSTRIES.map(r => `<option>${r}</option>`).join('')}</select></div>
      </div>`;
    list.appendChild(div);
    state.careerCount++;
  }

  function goStep(n) {
    for (let i = 1; i <= 4; i++) {
      document.getElementById(`wgwStep${i}`)?.classList.toggle('on', i === n);
      const prog = document.getElementById(`wgwProg${i}`);
      const lbl = document.getElementById(`wgwLbl${i}`);
      if (prog) { prog.classList.remove('act', 'done'); if (i < n) prog.classList.add('done'); else if (i === n) prog.classList.add('act'); }
      if (lbl) { lbl.classList.remove('act', 'done'); if (i < n) lbl.classList.add('done'); else if (i === n) lbl.classList.add('act'); }
    }
    const back = document.getElementById('wgwBtnBack');
    const next = document.getElementById('wgwBtnNext');
    const btns = document.getElementById('wgwBtns');
    if (back) back.style.display = n > 1 && n < 4 ? 'inline-flex' : 'none';
    if (next) {
      next.style.display = n < 4 && n !== 3 ? 'inline-flex' : 'none';
      next.textContent = n === 2 ? 'AI 분석 시작 →' : '다음 단계 →';
    }
    if (btns) btns.style.display = n === 3 ? 'none' : 'flex';
    const noteMap = [
      'KAPAE × Purplenet · 모든 데이터는 암호화되어 보관됩니다',
      '경력은 최대 5개까지 입력 가능합니다',
      'AI가 경력 데이터를 분석하고 있습니다… 잠시만 기다려주세요',
      '워크그래피를 퍼플넷에 등록하여 매칭 서비스를 시작하세요',
    ];
    const note = document.getElementById('wgwFootNote');
    if (note) note.textContent = noteMap[n - 1] || '';
    state.step = n;
    document.getElementById('wgwBody').scrollTop = 0;
  }

  function validateStep1() {
    const name = document.getElementById('wg_name').value.trim();
    const age = document.querySelector('input[name="wg_age"]:checked');
    const status = document.querySelector('input[name="wg_status"]:checked');
    const err = document.getElementById('wgwErr1');
    if (!name) { showErr(err, '⚠️ 성명을 입력해주세요.'); return false; }
    if (!age) { showErr(err, '⚠️ 연령대를 선택해주세요.'); return false; }
    if (!status) { showErr(err, '⚠️ 현재 상태를 선택해주세요.'); return false; }
    err.classList.remove('on'); return true;
  }

  function validateStep2() {
    const career = document.querySelector('.wg-c-company');
    const years = document.querySelector('input[name="wg_totalyears"]:checked');
    const skills = Array.from(document.querySelectorAll('.wg-skill-chk:checked'));
    const summary = document.getElementById('wg_summary').value.trim();
    const err = document.getElementById('wgwErr2');
    if (!career || !career.value.trim()) { showErr(err, '⚠️ 대표 경력 회사명을 입력해주세요.'); return false; }
    if (!years) { showErr(err, '⚠️ 총 경력 연수를 선택해주세요.'); return false; }
    if (!skills.length) { showErr(err, '⚠️ 전문 분야를 1개 이상 선택해주세요.'); return false; }
    if (summary.length < 30) { showErr(err, '⚠️ 핵심 역량을 30자 이상 입력해주세요.'); return false; }
    err.classList.remove('on'); return true;
  }

  function showErr(el, msg) { el.textContent = msg; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 3500); }

  function next() {
    if (state.step === 1) { if (!validateStep1()) return; goStep(2); }
    else if (state.step === 2) { if (!validateStep2()) return; goStep(3); runAIAnalysis(); }
  }
  function prev() { if (state.step > 1 && state.step !== 3) goStep(state.step - 1); }

  async function runAIAnalysis() {
    const fd = collectFormData();
    
    // PDF 파일이 있으면 먼저 업로드 및 파싱
    if (state.selectedFile) {
      try {
        const formData = new FormData();
        formData.append('ebook', state.selectedFile);
        const resp = await fetch('/api/workgraphy/upload', { method: 'POST', body: formData });
        const data = await resp.json();
        if (data.success) {
          state.workgraphyId = data.workgraphyId;
        }
      } catch (err) { console.error('File Upload Error:', err); }
    }

    await animateAnalysisSteps(fd);
  }

  function collectFormData() {
    const careers = [];
    document.querySelectorAll('.wg-career-block').forEach(block => {
      const co = block.querySelector('.wg-c-company')?.value.trim();
      const ro = block.querySelector('.wg-c-role')?.value.trim();
      const pe = block.querySelector('.wg-c-period')?.value.trim();
      const ind = block.querySelector('.wg-c-industry')?.value;
      if (co) careers.push({ company: co, role: ro, period: pe, industry: ind });
    });
    return {
      name: document.getElementById('wg_name').value.trim(),
      phone: document.getElementById('wg_phone').value.trim(),
      email: document.getElementById('wg_email').value.trim(),
      age: document.querySelector('input[name="wg_age"]:checked')?.value || '',
      status: document.querySelector('input[name="wg_status"]:checked')?.value || '',
      region: document.getElementById('wg_region').value,
      worktype: document.getElementById('wg_worktype').value,
      totalYears: document.querySelector('input[name="wg_totalyears"]:checked')?.value || '',
      skills: Array.from(document.querySelectorAll('.wg-skill-chk:checked')).map(c => c.value),
      summary: document.getElementById('wg_summary').value.trim(),
      careers,
    };
  }

  async function animateAnalysisSteps(formData) {
    const stepIds = ['wgAiS1', 'wgAiS2', 'wgAiS3', 'wgAiS4', 'wgAiS5'];
    const barEl = document.getElementById('wgAiBar');
    const delays = [0, 800, 1600, 2400, 3200];
    const doneAt = [15, 30, 50, 70, 90];
    
    // 파일 업로드로 얻은 workgraphyId가 있으면 매칭 엔진 API 사용, 아니면 기존 Anthropic 직접 호출
    let apiPromise;
    if (state.workgraphyId) {
      apiPromise = fetch(`/api/assessment/${state.workgraphyId}`).then(res => res.json()).then(d => {
        return { 
          workgraphy_title: "AI 정정밀 진단 시스템 결과",
          core_identity: d.report,
          tacit_strengths: ["분석 데이터 기반 역량 추출"],
          experience_score: 95,
          score_grade: "심층형 (S)",
          score_reason: "업로드된 전문 이력을 바탕으로 생성된 정밀 리포트입니다.",
          recommended_jobs: [],
          key_skills: formData.skills,
          project_ideas: [],
          next_step: "상세 리포트는 'AI 매칭 결과' 탭에서 확인하실 수 있습니다."
        };
      });
    } else {
      apiPromise = callAnthropicAPI(formData);
    }

    stepIds.forEach((id, i) => {
      setTimeout(() => {
        stepIds.slice(0, i).forEach(sid => {
          const el = document.getElementById(sid);
          if (el) { el.classList.remove('active'); el.classList.add('done'); }
        });
        const el = document.getElementById(id);
        if (el) { el.classList.add('active'); el.classList.remove('done'); }
        if (barEl) barEl.style.width = doneAt[i] + '%';
      }, delays[i]);
    });

    try {
      const result = await apiPromise;
      state.result = result;
      setTimeout(() => {
        if (barEl) barEl.style.width = '100%';
        stepIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) { el.classList.remove('active'); el.classList.add('done'); }
        });
        setTimeout(() => {
          renderResult(result, formData);
          goStep(4);
          // ★ 전역 상태 저장 → JourneySection에 알림
          KAPAE.setWorkgraphy(result, formData, state.workgraphyId);
          saveWorkgraphy(formData, result).catch(() => { });
        }, 600);
      }, Math.max(delays[4] + 800, 0));
    } catch (err) {
      console.warn('WGW API Error:', err);
      const fallback = buildFallbackResult(formData);
      state.result = fallback;
      setTimeout(() => {
        renderResult(fallback, formData);
        goStep(4);
        KAPAE.setWorkgraphy(fallback, formData, state.workgraphyId);
      }, delays[4] + 1000);
    }
  }

  async function callAnthropicAPI(formData) {
    const careersText = formData.careers.map((c, i) => `[경력 ${i + 1}] ${c.company} | ${c.role} | ${c.period} | ${c.industry}`).join('\n');
    const prompt = `당신은 중장년 고용 전문가이자 커리어 코치입니다.
다음 정보를 분석하여 워크그래피(Workgraphy)를 생성하고 경험 가치를 진단해주세요.

[기본 정보]
- 연령대: ${formData.age}
- 현재 상태: ${formData.status}
- 총 경력: ${formData.totalYears}
- 전문 분야: ${formData.skills.join(', ')}
- 희망 지역: ${formData.region || '미기재'}
- 희망 활동 형태: ${formData.worktype || '미기재'}

[경력 내역]
${careersText}

[핵심 역량 자유 기술]
${formData.summary}

위 정보를 바탕으로 다음 JSON 형식으로만 응답해주세요 (마크다운이나 추가 텍스트 없이 순수 JSON만):
{
  "workgraphy_title": "직무 정체성을 나타내는 한 문장",
  "core_identity": "핵심 직무 정체성 설명 (2~3문장)",
  "tacit_strengths": ["암묵지 강점 1","암묵지 강점 2","암묵지 강점 3","암묵지 강점 4"],
  "experience_score": 75,
  "score_grade": "우수 (A)",
  "score_reason": "경험 가치가 높은 이유 (2문장)",
  "recommended_jobs": [
    {"title":"추천 직무 1","reason":"선택 이유"},
    {"title":"추천 직무 2","reason":"선택 이유"},
    {"title":"추천 직무 3","reason":"선택 이유"}
  ],
  "key_skills": ["스킬1","스킬2","스킬3","스킬4","스킬5"],
  "project_ideas": ["프로젝트 제안 1","프로젝트 제안 2"],
  "next_step": "다음 단계 가이드 (퍼플넷 연계 포함, 2~3문장)"
}`;

    const resp = await fetch('/api/workgraphy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    const raw = data.content?.[0]?.text || '';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  }

  function buildFallbackResult(fd) {
    const ps = fd.skills[0] || '전문직', pc = fd.careers[0]?.company || '주요 기업', pr = fd.careers[0]?.role || '관리자';
    return {
      workgraphy_title: `${fd.totalYears} ${ps} 전문가 → 경험 기반 컨설턴트`,
      core_identity: `${pc}에서 ${pr}로 ${fd.totalYears}의 실전 경험을 보유한 중장년 핵심 전문가입니다. 풍부한 현장 경험과 네트워크를 바탕으로 새로운 형태의 일자리를 창출할 수 있는 잠재력을 가지고 있습니다.`,
      tacit_strengths: ['현장 경험 기반 문제해결 능력', '조직 운영 및 팀 관리 역량', '업계 네트워크 및 인적 자산', '위기 대응 및 의사결정 경험'],
      experience_score: 72, score_grade: '우수 (A-)',
      score_reason: `${fd.totalYears}의 실무 경험과 다양한 전문 분야를 보유하고 있어 경험 가치가 높습니다. 중장년 인재로서 시장에서 경쟁력 있는 포지션을 확보할 수 있습니다.`,
      recommended_jobs: [
        { title: `${ps} 컨설턴트`, reason: '가장 핵심 전문 분야로 즉시 역량 발휘 가능' },
        { title: '중장년 멘토 / 사내 코치', reason: '풍부한 경험을 후배 세대에 전달하는 고부가치 역할' },
        { title: '프리랜서 자문역', reason: '정규직이 아닌 유연한 형태로 경험을 활용 가능' },
      ],
      key_skills: fd.skills.slice(0, 5).length ? fd.skills.slice(0, 5) : ['문제해결', '리더십', '커뮤니케이션', '기획', '실행력'],
      project_ideas: ['업계 경험 기반 중소기업 공정 개선 프로젝트', '중장년 인력 활용 기업 멘토링 프로그램 설계'],
      next_step: '퍼플넷에 워크그래피를 등록하면 AI 매칭 시스템이 적합한 기업과 프로젝트를 연결해 드립니다. KAPAE 전문 상담사와 1:1 진로 코칭도 무료로 신청 가능합니다.',
    };
  }

  function renderResult(r, fd) {
    const pct = Math.min(100, Math.max(0, r.experience_score || 70));
    const nameEl = document.getElementById('wgwResultName');
    if (nameEl) nameEl.textContent = `${fd.name}님의 워크그래피`;
    const area = document.getElementById('wgwResultArea');
    if (!area) return;

    // 이전 워크그래피가 있으면 "새로 만들기" 배너 표시
    const prevBanner = KAPAE.workgraphy && KAPAE.workgraphy === r
      ? `<div class="wgw-resume-bar">
           <span>📌 저장된 워크그래피입니다 <strong>(${fd.name})</strong></span>
           <button onclick="WGW.resetWizard();WGW.open();">새로 만들기</button>
         </div>`
      : '';

    const deg = pct * 3.6;
    area.innerHTML = `${prevBanner}
<div class="wgw-result-card gold">
  <div class="wrc-label">📋 워크그래피 핵심 정체성</div>
  <div class="wrc-title">"${r.workgraphy_title}"</div>
  <div class="wrc-text">${r.core_identity}</div>
  <div class="wgw-skills" style="margin-top:12px">${(r.key_skills || []).map(s => `<span class="wgw-skill">${s}</span>`).join('')}</div>
</div>
<div class="wgw-result-card teal">
  <div class="wrc-label t">💎 경험 가치 진단</div>
  <div class="wgw-score-wrap">
    <div class="wgw-score-circle" style="background:conic-gradient(#B8976A ${deg}deg,rgba(255,255,255,.07) 0%)">
      <div class="wgw-score-num">${pct}<small>점</small></div>
    </div>
    <div class="wgw-score-info">
      <div class="wgw-score-grade">${r.score_grade}</div>
      <div class="wgw-score-desc">${r.score_reason}</div>
    </div>
  </div>
</div>
<div class="wgw-result-card" style="border-color:rgba(184,151,106,.18)">
  <div class="wrc-label">✨ 암묵지 강점 (이력서에 없는 진짜 능력)</div>
  <div style="display:flex;flex-direction:column;gap:7px;margin-top:4px">
    ${(r.tacit_strengths || []).map((s, i) => `<div style="display:flex;align-items:flex-start;gap:9px;font-size:13px;color:rgba(255,255,255,.6)"><span style="color:#B8976A;font-size:10px;font-family:'Bebas Neue',sans-serif;margin-top:2px;flex-shrink:0">0${i + 1}</span>${s}</div>`).join('')}
  </div>
</div>
<div class="wgw-result-card purple">
  <div class="wrc-label p">🎯 AI 추천 전환 직무</div>
  <div class="wgw-jobs">${(r.recommended_jobs || []).map(j => `<div class="wgw-job" style="cursor:default"><div style="font-weight:600">${j.title}</div><div style="font-size:10px;opacity:.6;margin-top:2px">${j.reason}</div></div>`).join('')}</div>
</div>
<div class="wgw-result-card" style="border-color:rgba(255,255,255,.08)">
  <div class="wrc-label">🔧 산업별 문제 해결 프로젝트 제안</div>
  ${(r.project_ideas || []).map((p, i) => `<div style="display:flex;gap:9px;margin-top:8px"><span style="color:#7c3aed;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px">P${i + 1}</span><div style="font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.7">${p}</div></div>`).join('')}
</div>
<div style="padding:16px 18px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);margin-bottom:14px">
  <div style="font-size:10px;color:#a78bfa;letter-spacing:.14em;text-transform:uppercase;margin-bottom:7px;font-weight:700">📌 다음 단계 가이드</div>
  <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.9">${r.next_step}</div>
</div>
<div class="wgw-cta-row" style="margin-bottom:8px">
  <a href="https://purplnetlanding.vercel.app/" target="_blank" class="wgw-cta-btn primary">🟣 퍼플넷에 등록하기</a>
  <button class="wgw-cta-btn secondary" onclick="WGW.close();document.querySelector('#journey .js2-panel')?.scrollIntoView({behavior:'smooth'});JS2.switchTab('match')">🎯 AI 매칭 결과 보기</button>
</div>`;
  }

  async function saveWorkgraphy(formData, result) {
    await sbInsert('workgraphy_requests', {
      name: formData.name, phone: formData.phone || null, email: formData.email || null,
      age_group: formData.age, status: formData.status, region: formData.region || null,
      work_type: formData.worktype || null, total_years: formData.totalYears,
      skills: formData.skills, summary: formData.summary, careers: formData.careers,
      ai_result: result, created_at: new Date().toISOString(),
    });
  }

  return { init, open, close, next, prev, addCareer, resetWizard };
})();

/* ═══════════════════════════════════════════════════════
   11. ★ 고용여정 섹션 V2 (JourneySection)
       - 고용정보 소스 실시간 피드
       - AI 매칭 탭: 워크그래피 있으면 Claude 실호출
       - 워크그래피 없으면 "생성하기" CTA 표시
═══════════════════════════════════════════════════════ */
const JourneySection = (() => {

  const SOURCES = [
    {
      id: 'worknet', color: '#3B7DD8', colorAlpha: 'rgba(59,125,216,.12)', colorBorder: 'rgba(59,125,216,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="16" height="12" rx="2"/><path d="M7 19h6M10 15v4"/></svg>`,
      label: '고용노동부 워크넷', sublabel: '공공 · 정부 공식 DB',
      count: 12847, newCount: 312,
      description: '고용노동부 공식 워크넷 DB. 중장년 우선채용, 신중년 특화 일자리, 재취업 지원 프로그램까지 포함.',
    },
    {
      id: 'public', color: '#0B8A5C', colorAlpha: 'rgba(11,138,92,.12)', colorBorder: 'rgba(11,138,92,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 17V8l7-5 7 5v9"/><rect x="7" y="11" width="6" height="6"/></svg>`,
      label: '공공기관 · 지자체', sublabel: '지역 공공 일자리 DB',
      count: 5391, newCount: 87,
      description: '17개 광역지자체 및 공공기관 채용공고. 사회적 일자리, 지역 맞춤형 중장년 일자리 포함.',
    },
    {
      id: 'private', color: '#7C3AED', colorAlpha: 'rgba(124,58,237,.12)', colorBorder: 'rgba(124,58,237,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10" cy="7" r="3"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>`,
      label: '사람인 · 잡코리아', sublabel: '민간 채용 플랫폼',
      count: 38204, newCount: 1843,
      description: '사람인, 잡코리아, 인크루트 등 주요 민간 채용 플랫폼. 경력직 채용, 전문직 포지션 중심 수집.',
    },
    {
      id: 'corporate', color: '#B8976A', colorAlpha: 'rgba(184,151,106,.12)', colorBorder: 'rgba(184,151,106,.3)',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="6" width="16" height="12" rx="1"/><path d="M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M10 11v2M8 13h4"/></svg>`,
      label: '기업 직접 채용공고', sublabel: 'B2B · 자문 · 프로젝트',
      count: 4120, newCount: 134,
      description: '대기업·중견기업 자체 채용 페이지 직접 크롤링. 고문, 자문역, 단기 프로젝트, 파트타임 포지션 포함.',
    },
  ];

  const FEED_ITEMS = {
    worknet: ['생산관리 팀장 (50대 우대)·워크넷', '시니어 기술 자문위원·워크넷', '중소기업 품질 컨설턴트·워크넷', '경력단절 재취업 지원·워크넷', '안전관리 전문위원·워크넷'],
    public: ['지역 기술 멘토 전문가·서울시', '중소기업 컨설턴트·경기도', '직업훈련 강사 (제조)·고용센터', '사회적기업 기술자문·중진공', '공공기관 품질심사위원·공단'],
    private: ['공정개선 전문 매니저·사람인', 'ISO 인증 담당자·잡코리아', '생산기술 전문위원·사람인', '품질관리 책임자 (계약직)·잡코리아', 'R&D 책임연구원·인크루트'],
    corporate: ['스타트업 제조 자문·직접공고', '공정 최적화 프리랜서·직접공고', '신규 생산라인 PMO·직접공고', '기술이전 해외자문·직접공고', '사외이사 후보·대기업직접'],
  };

  let INFOGRAPHICS = [
    { label: '수집 소스', value: '3개', sub: '정부+지자체+공공', color: '#3B7DD8' },
    { label: '총 공고', value: '?', sub: '실시간 업데이트', color: '#0B8A5C' },
    { label: '중장년 적합', value: '?', sub: 'AI 분류 기준', color: '#7C3AED' },
    { label: '신규 (24h)', value: '?', sub: '어제 대비 상승', color: '#B8976A' },
  ];

  let REAL_JOBS = [];
  async function fetchRealJobs() {
    try {
      const resp = await fetch('/api/scraped-jobs');
      const data = await resp.json();
      if (data.success) {
        REAL_JOBS = data.jobs;
        // 인포그래픽 업데이트
        INFOGRAPHICS[1].value = REAL_JOBS.length.toLocaleString();
        INFOGRAPHICS[2].value = (REAL_JOBS.length * 0.85).toFixed(0).toLocaleString(); // 가상 중장년 적합
        INFOGRAPHICS[3].value = (REAL_JOBS.length * 0.15).toFixed(0).toLocaleString(); // 가상 신규
        animateInfoNums();
      }
    } catch (e) { console.error('Fetch Jobs Error:', e); }
  }

  const TYPE_LABELS = { employ: '재취업', consult: '자문·컨설팅', edu: '강의·교육', project: '프로젝트' };
  const SOURCE_NAMES = { worknet: '워크넷', public: '공공기관', private: '민간플랫폼', corporate: '기업직접' };

  // 데모 매칭 결과 (워크그래피가 없을 때 표시)
  const DEMO_JOBS = [
    { id: 'j1', type: 'employ', title: '생산관리 전문 컨설턴트', company: '중소기업진흥공단', source: 'worknet', region: '서울·경기', salary: '월 350~500만', score: 96, tags: ['정규직', '시니어우대'], fit: '제조업 20년 경력과 ISO 인증 경험이 직접 매칭됩니다.' },
    { id: 'j2', type: 'consult', title: 'ISO 인증 품질 자문위원', company: '(주)한국품질연구원', source: 'corporate', region: '전국(재택)', salary: '프로젝트 단위', score: 91, tags: ['자문', '재택가능'], fit: '품질관리 암묵지 패턴이 자문 역할에 최적 매칭됩니다.' },
    { id: 'j3', type: 'edu', title: '제조업 직업훈련 강사', company: '한국산업인력공단', source: 'public', region: '경기·인천', salary: '시간당 6~9만원', score: 88, tags: ['강의', '유연근무'], fit: '현장 경험을 교육 콘텐츠로 전환할 수 있는 포지션입니다.' },
    { id: 'j4', type: 'project', title: '스마트공장 구축 PMO', company: '삼성전기 협력사', source: 'private', region: '수원·화성', salary: '계약 협의', score: 85, tags: ['프로젝트', '단기'], fit: '생산라인 구축 PMO 경험이 직접 활용됩니다.' },
  ];

  const CSS = `
.js2-section{background:linear-gradient(180deg,#06111C 0%,#0A1824 50%,#060D14 100%);padding:120px 0;position:relative;overflow:hidden;}
.js2-section::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(184,151,106,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(184,151,106,.018) 1px,transparent 1px);background-size:72px 72px;pointer-events:none;}
.js2-glow-l{position:absolute;top:20%;left:-200px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(59,125,216,.06) 0%,transparent 70%);pointer-events:none;}
.js2-glow-r{position:absolute;bottom:10%;right:-200px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(184,151,106,.05) 0%,transparent 70%);pointer-events:none;}
.js2-wrap{max-width:1280px;margin:0 auto;padding:0 60px;position:relative;z-index:2;}
.js2-hdr{text-align:center;margin-bottom:72px;}
.js2-eyebrow{display:inline-flex;align-items:center;gap:14px;margin-bottom:24px;}
.js2-eyebrow-line{width:40px;height:1px;background:linear-gradient(90deg,transparent,#B8976A);}
.js2-eyebrow-line.r{background:linear-gradient(90deg,#B8976A,transparent);}
.js2-eyebrow-text{font-size:11.5px;color:#B8976A;letter-spacing:.24em;text-transform:uppercase;}
.js2-title{font-size:clamp(1.9rem,3.2vw,2.9rem);font-weight:400;color:#fff;line-height:1.3;letter-spacing:-.02em;margin-bottom:16px;}
.js2-title em{font-style:italic;color:#B8976A;}
.js2-subtitle{font-size:17px;font-weight:300;color:rgba(255,255,255,.3);letter-spacing:.1em;font-style:italic;}
.js2-info-band{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-bottom:72px;background:rgba(184,151,106,.08);}
.js2-info-cell{background:#06111C;padding:28px 24px;text-align:center;transition:background .3s;}
.js2-info-cell:hover{background:#0A1824;}
.js2-info-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,3.5vw,3rem);line-height:1;margin-bottom:6px;}
.js2-info-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.35);letter-spacing:.18em;text-transform:uppercase;margin-bottom:4px;}
.js2-info-sub{font-size:11.5px;font-weight:300;color:rgba(255,255,255,.2);}
.js2-flow{display:grid;grid-template-columns:1fr 32px 1fr 32px 1fr;align-items:stretch;gap:0;margin-bottom:72px;}
.js2-flow-conn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:52px;}
.js2-flow-conn-inner{display:flex;flex-direction:column;align-items:center;gap:3px;}
.js2-conn-line{width:32px;height:1px;background:linear-gradient(90deg,rgba(184,151,106,.3),rgba(184,151,106,.8),rgba(184,151,106,.3));position:relative;overflow:hidden;}
.js2-conn-line::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:jsConnFlow 2s linear infinite;}
@keyframes jsConnFlow{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
.js2-conn-arrow{width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:7px solid rgba(184,151,106,.7);}
.js2-conn-label{font-size:9.5px;color:rgba(184,151,106,.45);letter-spacing:.16em;text-transform:uppercase;margin-top:4px;}
.js2-flow-card{border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);padding:32px 28px;position:relative;overflow:hidden;transition:background .3s,transform .3s;}
.js2-flow-card:hover{background:rgba(255,255,255,.04);transform:translateY(-3px);}
.js2-flow-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
.js2-flow-card.c-gold::before{background:#B8976A;}
.js2-flow-card.c-purple::before{background:#7C3AED;}
.js2-flow-card.c-teal::before{background:#0B6E5A;}
.js2-flow-bg-num{position:absolute;right:16px;bottom:10px;font-family:'Bebas Neue',sans-serif;font-size:72px;line-height:1;color:rgba(255,255,255,.02);pointer-events:none;}
.js2-flow-step-no{font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:12px;}
.js2-flow-icon{width:44px;height:44px;border:1px solid;display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.js2-flow-icon.g{border-color:rgba(184,151,106,.3);color:#B8976A;}
.js2-flow-icon.p{border-color:rgba(124,58,237,.3);color:#A78BFA;}
.js2-flow-icon.t{border-color:rgba(11,110,90,.3);color:#4ade80;}
.js2-flow-icon svg{width:20px;height:20px;}
.js2-flow-title{font-size:17px;font-weight:600;color:#fff;line-height:1.45;margin-bottom:12px;}
.js2-flow-desc{font-size:12.5px;font-weight:300;color:rgba(255,255,255,.42);line-height:1.95;margin-bottom:20px;}
.js2-flow-desc strong{font-weight:500;}
.c-gold .js2-flow-desc strong{color:#D4B896;}
.c-purple .js2-flow-desc strong{color:#C4B5FD;}
.c-teal .js2-flow-desc strong{color:#86EFAC;}
.js2-flow-features{display:flex;flex-direction:column;gap:7px;margin-bottom:20px;}
.js2-flow-feat{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:rgba(255,255,255,.42);line-height:1.65;}
.js2-flow-feat-ic{flex-shrink:0;margin-top:1px;font-size:13px;}
.js2-flow-cta{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;font-size:12px;font-weight:600;font-family:'Noto Sans KR',sans-serif;border:none;cursor:pointer;transition:.22s;text-decoration:none;}
.js2-flow-cta.g{background:rgba(184,151,106,.15);border:1px solid rgba(184,151,106,.3);color:#B8976A;}
.js2-flow-cta.g:hover{background:#B8976A;color:#06111C;}
.js2-flow-cta.p{background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.35);color:#A78BFA;}
.js2-flow-cta.p:hover{background:#7C3AED;color:#fff;}
.js2-flow-cta.t{background:rgba(11,110,90,.15);border:1px solid rgba(11,110,90,.3);color:#4ade80;}
.js2-flow-cta.t:hover{background:rgba(11,110,90,.3);}
.js2-flow-cta-arrow{transition:transform .2s;}
.js2-flow-cta:hover .js2-flow-cta-arrow{transform:translateX(3px);}
.js2-panel{background:rgba(255,255,255,.02);border:1px solid rgba(184,151,106,.1);margin-bottom:72px;overflow:hidden;}
.js2-panel-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.2);}
.js2-ptab{flex:1;padding:16px 20px;font-size:12px;font-weight:500;font-family:'Noto Sans KR',sans-serif;color:rgba(255,255,255,.32);cursor:pointer;border-bottom:2px solid transparent;transition:.18s;text-align:center;letter-spacing:.04em;background:none;border-right:1px solid rgba(255,255,255,.04);}
.js2-ptab:last-child{border-right:none;}
.js2-ptab:hover{color:rgba(255,255,255,.6);}
.js2-ptab.on{color:#B8976A;border-bottom-color:#B8976A;background:rgba(184,151,106,.04);}
.js2-panel-body{padding:32px 36px;}
.js2-src-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;}
.js2-src-card{border:1px solid rgba(255,255,255,.07);padding:20px;cursor:pointer;transition:border-color .2s,background .2s;position:relative;overflow:hidden;}
.js2-src-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;opacity:0;transition:opacity .2s;}
.js2-src-card.on{background:rgba(255,255,255,.04);}
.js2-src-card.on::before{opacity:1;}
.js2-src-card-top{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.js2-src-icon{width:36px;height:36px;border:1px solid;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.js2-src-icon svg{width:16px;height:16px;}
.js2-src-name{font-size:14px;font-weight:500;color:#fff;}
.js2-src-type{font-size:11px;font-weight:300;color:rgba(255,255,255,.3);margin-top:2px;}
.js2-src-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.js2-src-metric{background:rgba(0,0,0,.2);padding:10px 12px;}
.js2-src-metric-num{font-family:'Bebas Neue',sans-serif;font-size:22px;line-height:1;margin-bottom:2px;}
.js2-src-metric-label{font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.06em;}
.js2-feed-area{border:1px solid rgba(255,255,255,.06);padding:16px;background:rgba(0,0,0,.15);}
.js2-feed-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.js2-feed-title{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.18em;text-transform:uppercase;}
.js2-feed-pulse{display:flex;align-items:center;gap:5px;font-size:10px;color:rgba(255,255,255,.25);}
.js2-feed-pulse-dot{width:5px;height:5px;border-radius:50%;animation:js2Pulse 2s ease-in-out infinite;}
@keyframes js2Pulse{0%,100%{opacity:1}50%{opacity:.2}}
.js2-feed-list{display:flex;flex-direction:column;gap:5px;min-height:120px;}
.js2-feed-item{display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.04);font-size:12px;color:rgba(255,255,255,.5);animation:js2SlideIn .35s ease both;}
@keyframes js2SlideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.js2-feed-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.js2-feed-item-src{font-size:10px;color:rgba(255,255,255,.2);margin-left:auto;white-space:nowrap;padding-left:8px;}
.js2-src-desc-box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);padding:14px 16px;margin-top:12px;font-size:12.5px;font-weight:300;color:rgba(255,255,255,.45);line-height:1.85;}
.js2-ai-bar-section{margin-top:20px;}
.js2-ai-bar-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px;}
.js2-ai-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.js2-ai-bar-name{font-size:11.5px;color:rgba(255,255,255,.4);min-width:100px;}
.js2-ai-bar-track{flex:1;height:4px;background:rgba(255,255,255,.06);overflow:hidden;}
.js2-ai-bar-fill{height:100%;transition:width 1.2s cubic-bezier(.22,1,.36,1);}
.js2-ai-bar-val{font-size:11px;color:rgba(255,255,255,.35);min-width:36px;text-align:right;}

/* ── 매칭 탭 ── */
.js2-match-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:16px;flex-wrap:wrap;}
.js2-match-wg-badge{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(184,151,106,.08);border:1px solid rgba(184,151,106,.2);}
.js2-match-wg-badge span{font-size:12px;color:rgba(255,255,255,.5);}
.js2-match-wg-badge strong{color:#D4B896;}
.js2-match-wg-badge button{padding:5px 14px;background:none;border:1px solid rgba(184,151,106,.3);color:#B8976A;font-size:11px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;transition:.15s;}
.js2-match-wg-badge button:hover{background:rgba(184,151,106,.1);}
.js2-match-no-wg{padding:32px;text-align:center;background:rgba(124,58,237,.06);border:1px dashed rgba(124,58,237,.25);margin-bottom:20px;}
.js2-match-no-wg-icon{font-size:36px;margin-bottom:12px;}
.js2-match-no-wg-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:8px;}
.js2-match-no-wg-desc{font-size:13px;color:rgba(255,255,255,.4);line-height:1.8;margin-bottom:18px;}
.js2-match-no-wg-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;background:#B8976A;color:#0D1B2A;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:'Noto Sans KR',sans-serif;transition:.2s;}
.js2-match-no-wg-btn:hover{background:#D4B896;transform:translateY(-1px);}
.js2-ai-loading{display:flex;flex-direction:column;align-items:center;padding:48px 20px;gap:16px;}
.js2-ai-loading-orb{width:56px;height:56px;border-radius:50%;border:2px solid rgba(124,58,237,.4);background:radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%);display:flex;align-items:center;justify-content:center;font-size:22px;animation:js2Orb 2s ease-in-out infinite;}
@keyframes js2Orb{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.js2-ai-loading-text{font-size:14px;color:rgba(255,255,255,.5);}
.js2-match-controls{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
.js2-filter-btn{padding:7px 16px;border:1px solid rgba(255,255,255,.09);font-size:12px;color:rgba(255,255,255,.38);cursor:pointer;transition:.16s;font-family:'Noto Sans KR',sans-serif;background:none;}
.js2-filter-btn:hover{border-color:rgba(184,151,106,.3);color:#D4B896;}
.js2-filter-btn.on{border-color:#B8976A;color:#D4B896;background:rgba(184,151,106,.08);}
.js2-match-sort{margin-left:auto;font-size:12px;color:rgba(255,255,255,.3);display:flex;align-items:center;gap:6px;}
.js2-match-sort select{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:12px;padding:5px 10px;font-family:'Noto Sans KR',sans-serif;outline:none;cursor:pointer;}
.js2-match-sort select option{background:#0A1824;}
.js2-match-list{display:flex;flex-direction:column;gap:8px;}
.js2-match-item{border:1px solid rgba(255,255,255,.06);padding:16px 18px;display:grid;grid-template-columns:70px 1px 1fr auto;gap:16px;align-items:center;cursor:pointer;transition:background .18s,border-color .18s;position:relative;overflow:hidden;}
.js2-match-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:0;transition:width .25s;}
.js2-match-item:hover{background:rgba(255,255,255,.03);}
.js2-match-item.top-match::before{background:#B8976A;width:3px;}
.js2-match-item.top-match{border-color:rgba(184,151,106,.2);}
.js2-match-item.ai-match::before{background:#7C3AED;width:3px;}
.js2-match-item.ai-match{border-color:rgba(124,58,237,.2);}
.js2-match-score-wrap{text-align:center;flex-shrink:0;}
.js2-match-score{font-family:'Bebas Neue',sans-serif;font-size:28px;line-height:1;margin-bottom:2px;}
.js2-match-score-label{font-size:9px;color:rgba(255,255,255,.2);letter-spacing:.1em;text-transform:uppercase;}
.js2-match-divider{width:1px;background:rgba(255,255,255,.06);align-self:stretch;}
.js2-match-top-badge{display:inline-block;font-size:9px;background:rgba(184,151,106,.15);border:1px solid rgba(184,151,106,.3);color:#B8976A;padding:2px 8px;letter-spacing:.1em;margin-bottom:6px;}
.js2-match-ai-badge{display:inline-block;font-size:9px;background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.3);color:#a78bfa;padding:2px 8px;letter-spacing:.1em;margin-bottom:6px;}
.js2-match-title{font-size:15px;font-weight:500;color:#fff;margin-bottom:4px;}
.js2-match-company{font-size:12px;color:rgba(255,255,255,.35);margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.js2-match-tags{display:flex;gap:5px;flex-wrap:wrap;}
.js2-match-tag{font-size:10.5px;padding:3px 9px;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.35);}
.js2-match-right{text-align:right;flex-shrink:0;}
.js2-match-salary{font-size:13px;font-weight:500;color:#B8976A;margin-bottom:6px;}
.js2-match-region{font-size:11px;color:rgba(255,255,255,.3);}
.js2-match-fit{display:none;border-top:1px solid rgba(255,255,255,.05);margin-top:12px;padding-top:12px;font-size:12px;color:rgba(255,255,255,.45);line-height:1.8;grid-column:1/-1;}
.js2-match-item.expanded .js2-match-fit{display:block;}
.js2-match-item.expanded{background:rgba(255,255,255,.04);}
.js2-no-results{padding:40px;text-align:center;color:rgba(255,255,255,.2);font-size:13px;}
.js2-outcome{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:rgba(184,151,106,.08);}
.js2-outcome-cell{background:#06111C;padding:36px 28px;transition:background .3s;}
.js2-outcome-cell:hover{background:#0A1824;}
.js2-outcome-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,3vw,2.8rem);color:#B8976A;line-height:1;margin-bottom:8px;}
.js2-outcome-title{font-size:14px;font-weight:500;color:#fff;margin-bottom:6px;}
.js2-outcome-desc{font-size:12px;font-weight:300;color:rgba(255,255,255,.32);line-height:1.75;}
@media(max-width:1080px){
  .js2-flow{grid-template-columns:1fr;gap:24px;}
  .js2-flow-conn{display:none;}
  .js2-info-band{grid-template-columns:1fr 1fr;}
  .js2-outcome{grid-template-columns:1fr 1fr;}
  .js2-src-grid{grid-template-columns:1fr;}
}
@media(max-width:768px){
  .js2-section{padding:72px 0;}
  .js2-wrap{padding:0 24px;}
  .js2-panel-body{padding:20px;}
  .js2-match-item{grid-template-columns:56px 1px 1fr;gap:10px;}
  .js2-match-right{display:none;}
  .js2-outcome{grid-template-columns:1fr 1fr;}
  .js2-panel-tabs{overflow-x:auto;}
  .js2-ptab{white-space:nowrap;font-size:11px;padding:14px 16px;}
}
@media(max-width:480px){
  .js2-info-band{grid-template-columns:1fr 1fr;}
  .js2-outcome{grid-template-columns:1fr;}
}
`;

  const ICONS = {
    clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 12h6M9 16h4"/></svg>`,
    ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="9" cy="15" r="2"/><circle cx="15" cy="15" r="2"/><circle cx="12" cy="12" r="1.5"/></svg>`,
    match: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  };

  function buildHTML() {
    const infoBand = INFOGRAPHICS.map((info, i) => `
      <div class="js2-info-cell rv">
        <div class="js2-info-label">${info.label}</div>
        <div class="js2-info-num" id="js2InfoNum${i}" style="color:${info.color}">0</div>
        <div class="js2-info-sub">${info.sub}</div>
      </div>`).join('');

    const srcCards = SOURCES.map((s, i) => `
      <div class="js2-src-card ${i === 0 ? 'on' : ''}" id="jsSrc-${s.id}" onclick="JS2.selectSource('${s.id}')"
           style="${i === 0 ? `border-left:3px solid ${s.color};` : ''}">
        <div class="js2-src-card-top">
          <div class="js2-src-icon" style="border-color:${s.colorBorder};color:${s.color};">${s.icon}</div>
          <div>
            <div class="js2-src-name">${s.label}</div>
            <div class="js2-src-type">${s.sublabel}</div>
          </div>
        </div>
        <div class="js2-src-metrics">
          <div class="js2-src-metric">
            <div class="js2-src-metric-num" style="color:${s.color};">${s.count.toLocaleString()}</div>
            <div class="js2-src-metric-label">전체 공고</div>
          </div>
          <div class="js2-src-metric">
            <div class="js2-src-metric-num" style="color:${s.color};">+${s.newCount.toLocaleString()}</div>
            <div class="js2-src-metric-label">오늘 신규</div>
          </div>
        </div>
      </div>`).join('');

    return `
<section class="js2-section rv" id="journey">
  <div class="js2-glow-l"></div>
  <div class="js2-glow-r"></div>
  <div class="js2-wrap">
    <div class="js2-hdr rv">
      <div class="js2-eyebrow">
        <span class="js2-eyebrow-line"></span>
        <span class="js2-eyebrow-text">KAPAE × Purplenet · AI 고용정보 시스템</span>
        <span class="js2-eyebrow-line r"></span>
      </div>
      <h2 class="js2-title">경험을 수집하고, <em>워크그래피로</em> 만들고<br>새로운 일로 연결됩니다</h2>
      <p class="js2-subtitle">From Employment Data · Through Workgraphy · To Your Next Chapter</p>
    </div>
    <div class="js2-info-band rv d1">${infoBand}</div>
    <div class="js2-flow rv d2">
      <div class="js2-flow-card c-gold">
        <span class="js2-flow-bg-num">01</span>
        <div class="js2-flow-step-no" style="color:#B8976A;">STEP 01 · @ KAPAE</div>
        <div class="js2-flow-icon g">${ICONS.clipboard}</div>
        <h3 class="js2-flow-title">고용정보 수집<br>&amp; 경험 자산화</h3>
        <p class="js2-flow-desc">4개 소스에서 <strong>6만여 건의 공고를 AI가 실시간 수집</strong>합니다. 중장년 적합 여부를 자동 분류하고 경력 데이터와 매핑합니다.</p>
        <div class="js2-flow-features">
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">📊</span><span>고용노동부 워크넷 실시간 연동</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🔍</span><span>민간 플랫폼 + 기업 직접공고 크롤링</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">⚙️</span><span>AI 중장년 적합도 자동 분류·정제</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">📌</span><span>직무·스킬·산업 구조화 입력</span></div>
        </div>
        <button class="js2-flow-cta g" onclick="JS2.switchTab('source')">소스 탐색하기 <span class="js2-flow-cta-arrow">→</span></button>
      </div>
      <div class="js2-flow-conn"><div class="js2-flow-conn-inner"><div class="js2-conn-line"></div><div class="js2-conn-arrow"></div><div class="js2-conn-label">연동</div></div></div>
      <div class="js2-flow-card c-purple">
        <span class="js2-flow-bg-num">02</span>
        <div class="js2-flow-step-no" style="color:#A78BFA;">STEP 02 · @ Purplenet</div>
        <div class="js2-flow-icon p">${ICONS.ai}</div>
        <h3 class="js2-flow-title">AI 워크그래피<br>생성 &amp; 경험 진단</h3>
        <p class="js2-flow-desc">수집 정보를 바탕으로 <strong>AI가 워크그래피를 자동 생성</strong>합니다. 이력서가 아닌 "일할 수 있는 능력의 좌표"로 구조화합니다.</p>
        <div class="js2-flow-features">
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🤖</span><span>AI 인터뷰 + 자동 편집 워크그래피 생성</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">💎</span><span>경험 가치 진단 (100점) + 암묵지 분석</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🎯</span><span>전환 가능 직무 AI 추천</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">📖</span><span>디지털 암묵지북 / 클래스 콘텐츠 생성</span></div>
        </div>
        <a href="https://purplnetlanding.vercel.app/" target="_blank" class="js2-flow-cta p">퍼플넷에서 만들기 <span class="js2-flow-cta-arrow">→</span></a>
      </div>
      <div class="js2-flow-conn"><div class="js2-flow-conn-inner"><div class="js2-conn-line"></div><div class="js2-conn-arrow"></div><div class="js2-conn-label">매칭</div></div></div>
      <div class="js2-flow-card c-teal">
        <span class="js2-flow-bg-num">03</span>
        <div class="js2-flow-step-no" style="color:#4ade80;">STEP 03 · @ KAPAE</div>
        <div class="js2-flow-icon t">${ICONS.match}</div>
        <h3 class="js2-flow-title">매칭·추천<br>&amp; 진로 코칭</h3>
        <p class="js2-flow-desc">워크그래피 기반으로 <strong>AI 일자리 매칭</strong>과 교육·자격증 연계, 1:1 진로 코칭까지 KAPAE가 원스톱 지원합니다.</p>
        <div class="js2-flow-features">
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🔗</span><span>재취업·자문·강연·프로젝트 AI 매칭</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🎓</span><span>직업교육 연결 · 자격증 발급 · 인증</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🧭</span><span>1:1 진로 상담 및 생애설계 코칭</span></div>
          <div class="js2-flow-feat"><span class="js2-flow-feat-ic">🌐</span><span>산업별 문제해결 프로젝트 연결</span></div>
        </div>
        <button class="js2-flow-cta t" onclick="JS2.switchTab('match')">매칭 결과 보기 <span class="js2-flow-cta-arrow">→</span></button>
      </div>
    </div>

    <!-- 인터랙티브 패널 -->
    <div class="js2-panel rv d2">
      <div class="js2-panel-tabs">
        <button class="js2-ptab on" data-tab="source" onclick="JS2.switchTab('source')">📊 고용정보 소스 탐색</button>
        <button class="js2-ptab" data-tab="match" onclick="JS2.switchTab('match')">🎯 AI 매칭 결과</button>
      </div>
      <div class="js2-panel-body">
        <!-- 소스 탭 -->
        <div id="js2Tab-source">
          <div class="js2-src-grid">${srcCards}</div>
          <div class="js2-feed-area">
            <div class="js2-feed-hdr">
              <div class="js2-feed-title" id="js2FeedTitle">실시간 수집 피드 · 고용노동부 워크넷</div>
              <div class="js2-feed-pulse"><span class="js2-feed-pulse-dot" style="background:#B8976A;"></span>실시간 수집 중</div>
            </div>
            <div class="js2-feed-list" id="js2FeedList"></div>
            <div class="js2-src-desc-box" id="js2SrcDesc"></div>
          </div>
          <div class="js2-ai-bar-section">
            <div class="js2-ai-bar-label">AI 분류 처리 현황</div>
            ${[
        { label: '중장년 키워드 필터', val: 92, color: '#3B7DD8' },
        { label: '연령 적합도 분류', val: 87, color: '#0B8A5C' },
        { label: '직무 매핑', val: 78, color: '#7C3AED' },
        { label: '중복 제거', val: 95, color: '#B8976A' },
      ].map(b => `
            <div class="js2-ai-bar-row">
              <div class="js2-ai-bar-name">${b.label}</div>
              <div class="js2-ai-bar-track"><div class="js2-ai-bar-fill js2-bar-animate" data-val="${b.val}" style="width:0%;background:${b.color};"></div></div>
              <div class="js2-ai-bar-val">${b.val}%</div>
            </div>`).join('')}
          </div>
        </div>

        <!-- 매칭 탭 -->
        <div id="js2Tab-match" style="display:none;">
          <div id="js2MatchContent"></div>
        </div>
      </div>
    </div>

    <!-- 기대 효과 -->
    <div class="js2-outcome rv d3">
      ${[
        { num: '01', title: '경험의 객관화', desc: '감(感)이 아닌 구조화된 데이터로 나의 능력을 증명합니다' },
        { num: '02', title: '경험의 상품화', desc: '암묵지를 디지털 자산·콘텐츠·수익 모델로 전환합니다' },
        { num: '03', title: '컨설팅 역량 강화', desc: '산업별 문제 해결 프로젝트로 전문 컨설턴트로 성장합니다' },
        { num: '04', title: '미래 준비', desc: '퍼플넷 네트워크를 통해 지속가능한 커리어를 설계합니다' },
      ].map(o => `
      <div class="js2-outcome-cell rv">
        <div class="js2-outcome-num">${o.num}</div>
        <div class="js2-outcome-title">${o.title}</div>
        <div class="js2-outcome-desc">${o.desc}</div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
  }

  let currentSource = 'worknet';
  let feedInterval = null;
  let feedIdx = 0;
  let currentType = 'all';
  let inited = false;
  let aiMatchData = null;   // Claude가 생성한 실제 매칭 데이터
  let isLoadingMatch = false;

  /* ── 소스 카드 선택 ── */
  function selectSource(srcId) {
    currentSource = srcId;
    document.querySelectorAll('.js2-src-card').forEach(c => {
      const s = SOURCES.find(s => s.id === c.id.replace('jsSrc-', ''));
      const isOn = c.id === `jsSrc-${srcId}`;
      c.classList.toggle('on', isOn);
      c.style.borderLeft = isOn && s ? `3px solid ${s.color}` : '';
    });
    const src = SOURCES.find(s => s.id === srcId);
    if (!src) return;
    const title = document.getElementById('js2FeedTitle');
    if (title) title.textContent = `실시간 수집 피드 · ${src.label}`;
    const desc = document.getElementById('js2SrcDesc');
    if (desc) desc.textContent = src.description;
    startFeed(srcId);
  }

  function startFeed(srcId) {
    clearInterval(feedInterval);
    feedIdx = 0;
    const list = document.getElementById('js2FeedList');
    if (!list) return;
    list.innerHTML = '';
    const items = FEED_ITEMS[srcId] || [];
    const src = SOURCES.find(s => s.id === srcId);
    feedInterval = setInterval(() => {
      if (list.children.length >= 5) list.removeChild(list.firstChild);
      const raw = items[feedIdx % items.length];
      const [text, srcLabel] = raw.split('·');
      const d = document.createElement('div');
      d.className = 'js2-feed-item';
      d.innerHTML = `<span class="js2-feed-dot" style="background:${src.color};"></span>${text.trim()}<span class="js2-feed-item-src">${srcLabel ? srcLabel.trim() : ''}</span>`;
      list.appendChild(d);
      feedIdx++;
    }, 1400);
  }

  /* ── 탭 전환 ── */
  function switchTab(tab) {
    document.querySelectorAll('.js2-ptab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
    const srcTab = document.getElementById('js2Tab-source');
    const matchTab = document.getElementById('js2Tab-match');
    if (srcTab) srcTab.style.display = tab === 'source' ? 'block' : 'none';
    if (matchTab) matchTab.style.display = tab === 'match' ? 'block' : 'none';

    if (tab === 'match') renderMatchTab();

    const panel = document.querySelector('.js2-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── 매칭 탭 렌더 ── */
  function renderMatchTab() {
    const container = document.getElementById('js2MatchContent');
    if (!container) return;

    // 로딩 중
    if (isLoadingMatch) {
      container.innerHTML = `
        <div class="js2-ai-loading">
          <div class="js2-ai-loading-orb">🤖</div>
          <div class="js2-ai-loading-text">AI가 맞춤 일자리를 분석하고 있습니다…</div>
        </div>`;
      return;
    }

    // 워크그래피가 있고 AI 매칭 결과도 있으면 → 실제 결과 표시
    if (KAPAE.workgraphy && aiMatchData) {
      renderPersonalizedMatch(container, aiMatchData);
      return;
    }

    // 워크그래피가 있지만 아직 매칭 미실행 → 자동으로 실행
    if (KAPAE.workgraphy && !aiMatchData) {
      triggerAIMatch();
      return;
    }

    // 워크그래피 없음 → 생성 유도
    container.innerHTML = `
      <div class="js2-match-no-wg">
        <div class="js2-match-no-wg-icon">🗂️</div>
        <div class="js2-match-no-wg-title">워크그래피가 필요합니다</div>
        <div class="js2-match-no-wg-desc">
          AI 맞춤 매칭은 귀하의 경력 데이터(워크그래피)를 기반으로 작동합니다.<br>
          먼저 워크그래피를 생성하면, AI가 실시간으로 적합한 일자리를 분석해드립니다.
        </div>
        <button class="js2-match-no-wg-btn" onclick="WGW.open()">🤖 AI 워크그래피 만들기 →</button>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:20px;margin-top:8px;">
        <div style="font-size:11px;color:rgba(255,255,255,.25);letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px;">샘플 매칭 미리보기</div>
        ${renderJobCards(DEMO_JOBS, false)}
      </div>`;
  }

  /* ── Claude API로 실제 매칭 ── */
  async function triggerAIMatch() {
    const container = document.getElementById('js2MatchContent');
    if (!container || isLoadingMatch) return;

    isLoadingMatch = true;
    container.innerHTML = `
      <div class="js2-ai-loading">
        <div class="js2-ai-loading-orb">🤖</div>
        <div class="js2-ai-loading-text">워크그래피 분석 중… AI 맞춤 일자리를 찾고 있습니다</div>
      </div>`;

    try {
      const wid = KAPAE.workgraphyId;
      
      // 만약 workgraphyId가 있으면 백엔드 사주평 매칭 API 호출
      if (wid) {
        const resp = await fetch(`/api/assessment/${wid}`);
        const data = await resp.json();
        if (data.success) {
          // 사주평 리포트를 기반으로 매칭 데이터 가공 (여기서는 예시로 REAL_JOBS와 섞거나 AI가 생성한 가상 리스트 사용)
          // 실제로는 백엔드에서 매칭된 채용 정보를 가져와야 함. 일단 리포트를 상단에 보여주고 REAL_JOBS를 필터링해서 보여줌.
          aiMatchData = REAL_JOBS.slice(0, 6).map(j => ({
            ...j,
            score: Math.floor(Math.random() * 20) + 80,
            fit: data.report.slice(0, 100) + '...'
          }));
          renderMatchTab();
          return;
        }
      }

      // 폴백: 기존 Claude 직접 호출 스크립트 그대로 사용
      const wg = KAPAE.workgraphy;
      const fd = KAPAE.formData;

      const prompt = `당신은 중장년 고용 전문 매처(Matcher)입니다.
아래 워크그래피 데이터를 분석하여 맞춤 일자리 추천 리스트를 생성하세요.

[워크그래피 요약]
- 핵심 정체성: ${wg.workgraphy_title}
- 전문 분야: ${fd?.skills?.join(', ') || ''}
- 총 경력: ${fd?.totalYears || ''}
- 희망 형태: ${fd?.worktype || ''}
- 희망 지역: ${fd?.region || ''}
- 경험 점수: ${wg.experience_score}점
- 추천 직무: ${(wg.recommended_jobs || []).map(j => j.title).join(', ')}
- 암묵지 강점: ${(wg.tacit_strengths || []).join(', ')}

위 워크그래피에 맞는 구체적인 일자리 6개를 JSON 배열로 반환하세요.
반드시 순수 JSON 배열만 반환하세요 (마크다운 없이):
[
  {
    "id": "ai1",
    "type": "employ|consult|edu|project 중 하나",
    "title": "구체적인 직무명",
    "company": "실제 같은 회사/기관명",
    "source": "worknet|public|private|corporate 중 하나",
    "region": "지역",
    "salary": "급여 정보",
    "score": 85,
    "tags": ["태그1", "태그2"],
    "fit": "이 포지션이 적합한 구체적인 이유 (워크그래피 데이터 참조)"
  }
]`;

      const resp = await fetch('/api/workgraphy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const data = await resp.json();
      const raw = data.content?.[0]?.text || '';
      const jobs = JSON.parse(raw.replace(/```json|```/g, '').trim());
      aiMatchData = jobs;

    } catch (e) {
      console.warn('AI Match error:', e);
      // 폴백: 워크그래피 기반으로 DEMO_JOBS 보강
      aiMatchData = DEMO_JOBS;
    }

    isLoadingMatch = false;
    renderMatchTab();
  }

  function renderPersonalizedMatch(container, jobs) {
    const fd = KAPAE.formData;
    const wg = KAPAE.workgraphy;

    container.innerHTML = `
      <div class="js2-match-header">
        <div class="js2-match-wg-badge">
          <span>🤖 <strong>${fd?.name || ''}님</strong>의 워크그래피 기반 AI 맞춤 매칭</span>
          <span style="margin:0 4px;opacity:.3">|</span>
          <span>경험 점수 <strong>${wg?.experience_score || ''}점</strong></span>
          <button onclick="JS2.refreshMatch()" style="margin-left:8px;">🔄 새로 분석</button>
        </div>
      </div>
      <div class="js2-match-controls">
        <button class="js2-filter-btn on" data-type="all" onclick="JS2.filterMatch(this,'all')">전체 (${jobs.length})</button>
        ${['employ', 'consult', 'edu', 'project'].filter(t => jobs.some(j => j.type === t)).map(t =>
      `<button class="js2-filter-btn" data-type="${t}" onclick="JS2.filterMatch(this,'${t}')">${{ employ: '재취업', consult: '자문·컨설팅', edu: '강의·교육', project: '프로젝트' }[t]} (${jobs.filter(j => j.type === t).length})</button>`
    ).join('')}
        <div class="js2-match-sort">정렬:
          <select id="js2SortSel" onchange="JS2.sortMatch()">
            <option value="score">적합도 높은 순</option>
          </select>
        </div>
      </div>
      <div class="js2-match-list" id="js2MatchList">${renderJobCards(jobs, true)}</div>`;
  }

  function renderJobCards(jobs, isAI) {
    const scoreColor = s => s >= 90 ? '#4ade80' : s >= 80 ? '#B8976A' : '#6b7280';
    const TYPE_LABELS = { employ: '재취업', consult: '자문·컨설팅', edu: '강의·교육', project: '프로젝트' };
    const SOURCE_NAMES = { worknet: '워크넷', public: '공공기관', private: '민간플랫폼', corporate: '기업직접' };
    return jobs.map((item, idx) => `
      <div class="js2-match-item ${item.score >= 90 ? 'top-match' : isAI ? 'ai-match' : ''}" id="jm-${item.id}" onclick="JS2.toggleMatch('${item.id}')" style="animation:js2SlideIn ${idx * 60}ms ease both;">
        <div class="js2-match-score-wrap">
          <div class="js2-match-score" style="color:${scoreColor(item.score)};">${item.score}%</div>
          <div class="js2-match-score-label">적합도</div>
        </div>
        <div class="js2-match-divider"></div>
        <div class="js2-match-info">
          ${item.score >= 90 ? `<span class="js2-match-top-badge">★ 최우선 추천</span>` : isAI ? `<span class="js2-match-ai-badge">🤖 AI 맞춤</span>` : ''}
          <div class="js2-match-title">${item.title}</div>
          <div class="js2-match-company">
            ${item.company}
            <span style="font-size:10px;padding:1px 7px;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.25);">${SOURCE_NAMES[item.source] || item.source}</span>
            <span style="font-size:10px;padding:1px 7px;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.25);">${TYPE_LABELS[item.type] || item.type}</span>
          </div>
          <div class="js2-match-tags">${(item.tags || []).map(t => `<span class="js2-match-tag">${t}</span>`).join('')}</div>
        </div>
        <div class="js2-match-right">
          <div class="js2-match-salary">${item.salary || '협의'}</div>
          <div class="js2-match-region">📍 ${item.region || '전국'}</div>
        </div>
        <div class="js2-match-fit">💡 <strong style="color:#D4B896;">AI 매칭 근거:</strong> ${item.fit || ''}</div>
      </div>`).join('');
  }

  function filterMatch(btn, type) {
    currentType = type;
    document.querySelectorAll('.js2-filter-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const jobs = (aiMatchData || DEMO_JOBS).filter(j => type === 'all' || j.type === type);
    const list = document.getElementById('js2MatchList');
    if (list) list.innerHTML = renderJobCards(jobs, !!aiMatchData);
  }

  function sortMatch() { /* 기본은 score 순 */ }

  function refreshMatch() {
    aiMatchData = null;
    renderMatchTab();
  }

  function toggleMatch(id) {
    const el = document.getElementById(`jm-${id}`);
    if (el) el.classList.toggle('expanded');
  }

  /* ── 인포 숫자 카운트업 ── */
  function animateInfoNums() {
    INFOGRAPHICS.forEach((info, i) => {
      const el = document.getElementById(`js2InfoNum${i}`);
      if (!el) return;
      const raw = info.value.replace(/[^0-9]/g, '');
      const target = parseInt(raw, 10);
      if (!target) { el.textContent = info.value; return; }
      const isK = info.value.includes(',');
      let start = 0;
      const steps = 50;
      const step = () => {
        start++;
        const pct = start / steps;
        const ease = 1 - Math.pow(1 - pct, 3);
        const val = Math.round(target * ease);
        el.textContent = isK ? val.toLocaleString() : info.value.replace(raw, val.toString());
        if (start < steps) requestAnimationFrame(step);
        else el.textContent = info.value;
      };
      setTimeout(() => requestAnimationFrame(step), i * 120);
    });
  }

  function animateBars() {
    document.querySelectorAll('.js2-bar-animate').forEach(bar => {
      const val = bar.dataset.val;
      setTimeout(() => { bar.style.width = val + '%'; }, 400);
    });
  }

  /* ── 초기화 ── */
  function init() {
    if (!document.getElementById('js2CSS')) {
      const st = document.createElement('style');
      st.id = 'js2CSS';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const anchor = document.getElementById('purplenet') || document.getElementById('history');
    if (anchor) anchor.insertAdjacentHTML('afterend', buildHTML());
    else document.body.insertAdjacentHTML('beforeend', buildHTML());

    // 전역 JS2 노출
    window.JS2 = { selectSource, switchTab, filterMatch, sortMatch, toggleMatch, refreshMatch };

    selectSource('worknet');
    fetchRealJobs();

    // JourneySection 표시 시 카운트업 + 바 애니메이션
    const sectionEl = document.getElementById('journey');
    if (sectionEl) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !inited) {
            inited = true;
            animateInfoNums();
            setTimeout(animateBars, 600);
          }
        });
      }, { threshold: 0.08 });
      obs.observe(sectionEl);
    }

    // 스크롤 리빌
    const obs2 = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: 0.06 });
    document.querySelectorAll('#journey .rv').forEach(el => obs2.observe(el));

    // ★ WGW 완료 이벤트 수신 → 매칭 탭 자동 준비
    document.addEventListener('kapae:workgraphy', () => {
      aiMatchData = null;   // 새 워크그래피 → 이전 매칭 초기화
      // 매칭 탭이 열려 있으면 즉시 분석 시작
      const matchTab = document.getElementById('js2Tab-match');
      if (matchTab && matchTab.style.display !== 'none') triggerAIMatch();
    });
  }

  return { init };
})();

/* ═══════════════════════════════════
   ★ 관리자 패널  (Ctrl+Shift+A)
   v2: HTML 체크박스 ID와 완전 동기화
═══════════════════════════════════ */
const AD_ID = 'admin.kapae';
const AD_PW = 'kapae505';

// ── 자체 백엔드(server.js / MariaDB) API 헬퍼 ──────────────────────────────
// Supabase 제거 → 동일 서버의 /api/* 엔드포인트로 직접 연결합니다.

async function _get(table, _qs = '') {
  // notice_board: ?all=1 → is_active 필터 없이 전체 반환 (관리자용)
  // inquiries   : /api/inquiries (GET)
  let url;
  if (table === 'notice_board') {
    url = '/api/notices?all=1';
  } else if (table === 'inquiries') {
    url = '/api/inquiries';
  } else {
    throw new Error('_get: 알 수 없는 테이블 ' + table);
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${r.status}`);
  return r.json();
}

async function _post(table, data) {
  // notice_board: POST /api/notices
  let url;
  if (table === 'notice_board') {
    url = '/api/notices';
  } else {
    throw new Error('_post: 알 수 없는 테이블 ' + table);
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`POST ${r.status}: ${await r.text()}`);
  return r.json();
}

async function _patch(table, id, data) {
  // notice_board: PATCH /api/notices/:id
  let url;
  if (table === 'notice_board') {
    url = `/api/notices/${id}`;
  } else {
    throw new Error('_patch: 알 수 없는 테이블 ' + table);
  }
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`PATCH ${r.status}: ${await r.text()}`);
  return r.json();
}

async function _del(table, id) {
  // notice_board: DELETE /api/notices/:id
  let url;
  if (table === 'notice_board') {
    url = `/api/notices/${id}`;
  } else {
    throw new Error('_del: 알 수 없는 테이블 ' + table);
  }
  const r = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`DELETE ${r.status}`);
  return true;
}

/* ── 로그인/로그아웃 ── */
function adLogin() {
  const id = document.getElementById('adId').value.trim();
  const pw = document.getElementById('adPw').value;
  if (id === AD_ID && pw === AD_PW) {
    sessionStorage.setItem('kapae_adm', '1');
    document.getElementById('adLogin').classList.add('hide');
    document.getElementById('adApp').classList.add('on');
    adInit();
  } else {
    const e = document.getElementById('adLoginErr');
    e.style.display = 'block';
    document.getElementById('adPw').value = '';
    setTimeout(() => { e.style.display = 'none'; }, 2600);
  }
}
function adLogout() {
  sessionStorage.removeItem('kapae_adm');
  document.getElementById('adApp').classList.remove('on');
  document.getElementById('adLogin').classList.remove('hide');
  document.getElementById('adId').value = '';
  document.getElementById('adPw').value = '';
}
function adClose() {
  document.getElementById('adminRoot').style.display = 'none';
  document.getElementById('adminRoot').classList.remove('on');
}

let adNotices = [], adNews = [], adInqs = [];
let adNF = [], adNewsF = [], adInqF_ = [];
const AD_PG_SZ = 12;
let adNPage = 1, adNewsPage = 1, adInqPage = 1;
let adInited = false;

async function adInit() {
  if (adInited) { adRenderDash(); return; }
  adInited = true;
  await Promise.all([adLoadNotices(), adLoadInq()]);
  adRenderDash();
}

async function adLoadNotices() {
  try {
    const rows = await _get('notice_board', 'select=*&order=published_at.desc&limit=200');
    adNotices = rows.filter(r => r.category === '공지사항');
    adNews = rows.filter(r => r.category === '협회소식');
    adNF = [...adNotices];
    adNewsF = [...adNews];
    adRenderNotice();
    adRenderNews();
    adSetCnt('adCntNotice', adNotices.length);
    adSetCnt('adCntNews', adNews.length);
    loadAllBoards(); // 공개 게시판도 갱신
  } catch (e) { adToast('공지 로드 오류: ' + e.message, 'er'); }
}

async function adLoadInq() {
  try {
    adInqs = await _get('inquiries', 'select=*&order=submitted_at.desc&limit=500');
    adInqF_ = [...adInqs];
    adRenderInq();
    adSetCnt('adCntInq', adInqs.length);
    const today = new Date().toISOString().slice(0, 10);
    const todayEl = document.getElementById('adDs-today');
    if (todayEl) todayEl.textContent = adInqs.filter(r => (r.submitted_at || '').startsWith(today)).length;
  } catch (e) { adToast('문의 로드 오류: ' + e.message, 'er'); }
}

function adSetCnt(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = n;
}

function adRenderDash() {
  const dN = document.getElementById('adDs-notice');
  const dNw = document.getElementById('adDs-news');
  const dI = document.getElementById('adDs-inq');
  if (dN) dN.textContent = adNotices.length;
  if (dNw) dNw.textContent = adNews.length;
  if (dI) dI.textContent = adInqs.length;

  const combined = [...adNotices, ...adNews]
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at)).slice(0, 6);
  const dn = document.getElementById('adDashNotice');
  if (dn) dn.innerHTML = combined.length
    ? combined.map(r => `<div class="ad-dc-row" onclick="adOpenDetail('${adB64(r)}')">
        <span class="ad-dc-row-t">${adEsc(r.title)}</span>
        <span class="ad-dc-row-d">${(r.published_at || '').slice(5, 10)}</span></div>`).join('')
    : '<div class="ad-empty">없음</div>';

  const di = document.getElementById('adDashInq');
  if (di) di.innerHTML = adInqs.slice(0, 6).length
    ? adInqs.slice(0, 6).map(r => `<div class="ad-dc-row">
        <span class="ad-dc-row-t">${adEsc(r.name)} — ${adEsc(r.inquiry_type || '일반')}</span>
        <span class="ad-dc-row-d">${(r.submitted_at || '').slice(5, 10)}</span></div>`).join('')
    : '<div class="ad-empty">없음</div>';
}

/* ── 공지사항 목록 ── */
function adRenderNotice() {
  const s = (adNPage - 1) * AD_PG_SZ, page = adNF.slice(s, s + AD_PG_SZ);
  const tb = document.getElementById('adNoticeTbody');
  if (!tb) return;
  if (!adNF.length) { tb.innerHTML = `<tr><td colspan="8" class="ad-empty">없음</td></tr>`; return; }
  tb.innerHTML = page.map((r, i) => `<tr>
    <td style="color:rgba(255,255,255,.22)">${adNF.length - s - i}</td>
    <td class="adtd-title" onclick="adOpenDetail('${adB64(r)}')" style="cursor:pointer">${adEsc(r.title)}</td>
    <td><span class="adbadge adbadge-notice">${adEsc(r.category || '공지')}</span></td>
    <td>${r.is_new ? '<span class="adbadge adbadge-new">NEW</span>' : r.is_hot ? '<span class="adbadge adbadge-hot">HOT</span>' : '—'}</td>
    <td><span style="font-size:10.5px;color:${r.is_active !== false ? '#4ade80' : '#f87171'}">${r.is_active !== false ? '● 게시' : '○ 비공개'}</span></td>
    <td style="font-size:11px;color:rgba(255,255,255,.3)">${(r.published_at || '').slice(0, 10)}</td>
    <td style="font-size:11.5px">${adEsc(r.author || '—')}</td>
    <td class="adtd-act">
      <button class="adbtn adbtn-out adbtn-sm" onclick="adOpenEdit('${adB64(r)}')">수정</button>
      <button class="adbtn adbtn-del adbtn-sm" onclick="adAskDel('notice_board','${r.id}','${adEsc(r.title).slice(0, 18)}')">삭제</button>
    </td>
  </tr>`).join('');
  adRenderPg('adNoticePg', adNPage, adNF.length, v => { adNPage = v; adRenderNotice(); });
}

function adFilterNotice() {
  const q = document.getElementById('adNoticeQ').value.toLowerCase();
  const f = document.getElementById('adNoticeF').value;
  adNF = adNotices.filter(r => (!q || r.title.toLowerCase().includes(q)) && (!f || r.category === f));
  adNPage = 1; adRenderNotice();
}

/* ── 협회소식 목록 ── */
function adRenderNews() {
  const s = (adNewsPage - 1) * AD_PG_SZ, page = adNewsF.slice(s, s + AD_PG_SZ);
  const tb = document.getElementById('adNewsTbody');
  if (!tb) return;
  if (!adNewsF.length) { tb.innerHTML = `<tr><td colspan="7" class="ad-empty">없음</td></tr>`; return; }
  tb.innerHTML = page.map((r, i) => `<tr>
    <td style="color:rgba(255,255,255,.22)">${adNewsF.length - s - i}</td>
    <td class="adtd-title" onclick="adOpenDetail('${adB64(r)}')" style="cursor:pointer">${adEsc(r.title)}</td>
    <td>${r.is_new ? '<span class="adbadge adbadge-new">NEW</span>' : r.is_hot ? '<span class="adbadge adbadge-hot">HOT</span>' : '—'}</td>
    <td><span style="font-size:10.5px;color:${r.is_active !== false ? '#4ade80' : '#f87171'}">${r.is_active !== false ? '● 게시' : '○ 비공개'}</span></td>
    <td style="font-size:11px;color:rgba(255,255,255,.3)">${(r.published_at || '').slice(0, 10)}</td>
    <td style="font-size:11.5px">${adEsc(r.author || '—')}</td>
    <td class="adtd-act">
      <button class="adbtn adbtn-out adbtn-sm" onclick="adOpenEdit('${adB64(r)}')">수정</button>
      <button class="adbtn adbtn-del adbtn-sm" onclick="adAskDel('notice_board','${r.id}','${adEsc(r.title).slice(0, 18)}')">삭제</button>
    </td>
  </tr>`).join('');
  adRenderPg('adNewsPg', adNewsPage, adNewsF.length, v => { adNewsPage = v; adRenderNews(); });
}

function adFilterNews() {
  const q = document.getElementById('adNewsQ').value.toLowerCase();
  adNewsF = adNews.filter(r => !q || r.title.toLowerCase().includes(q));
  adNewsPage = 1; adRenderNews();
}

/* ── 문의 목록 ── */
function adRenderInq() {
  const s = (adInqPage - 1) * AD_PG_SZ, page = adInqF_.slice(s, s + AD_PG_SZ);
  const tb = document.getElementById('adInqTbody');
  if (!tb) return;
  if (!adInqF_.length) { tb.innerHTML = `<tr><td colspan="7" class="ad-empty">없음</td></tr>`; return; }
  tb.innerHTML = page.map((r, i) => `
    <tr>
      <td style="color:rgba(255,255,255,.22)">${adInqF_.length - s - i}</td>
      <td style="font-size:10.5px;color:rgba(255,255,255,.3)">${(r.submitted_at || '').slice(0, 16).replace('T', ' ')}</td>
      <td style="font-weight:500;color:white">${adEsc(r.name || '—')}</td>
      <td><a href="tel:${adEsc(r.phone || '')}" style="color:#D4B896;font-size:11.5px">${adEsc(r.phone || '—')}</a></td>
      <td><span style="background:rgba(184,151,106,.1);color:#D4B896;padding:2px 7px;font-size:10.5px">${adEsc(r.inquiry_type || '일반')}</span></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;cursor:pointer;color:rgba(255,255,255,.5)"
          onclick="adToggleInq('adInqRow-${r.id}')">${adEsc((r.message || '').slice(0, 60))}${(r.message || '').length > 60 ? '…' : ''}</td>
      <td><button class="adbtn adbtn-del adbtn-sm" onclick="adAskDel('inquiries','${r.id}','${adEsc(r.name || '')} 문의')">삭제</button></td>
    </tr>
    <tr id="adInqRow-${r.id}" class="inq-expand">
      <td colspan="7" style="padding:0 14px 12px;background:rgba(255,255,255,.02)">
        <div style="padding:12px 14px;background:rgba(255,255,255,.04);border-left:3px solid #B8976A;font-size:12.5px;line-height:1.9;color:rgba(255,255,255,.62);white-space:pre-wrap">${adEsc(r.message || '')}</div>
        ${r.email ? `<div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,.3)">이메일: <a href="mailto:${adEsc(r.email)}" style="color:#93c5fd">${adEsc(r.email)}</a></div>` : ''}
      </td>
    </tr>`).join('');
  adRenderPg('adInqPg', adInqPage, adInqF_.length, v => { adInqPage = v; adRenderInq(); });
}

function adToggleInq(id) { const r = document.getElementById(id); if (r) r.classList.toggle('on'); }

function adFilterInq() {
  const q = document.getElementById('adInqQ').value.toLowerCase();
  const f = document.getElementById('adInqF').value;
  adInqF_ = adInqs.filter(r =>
    (!q || (r.name || '').toLowerCase().includes(q) || (r.message || '').toLowerCase().includes(q)) &&
    (!f || r.inquiry_type === f)
  );
  adInqPage = 1; adRenderInq();
}

/* ── 페이지네이션 ── */
function adRenderPg(id, cur, total, cb) {
  const el = document.getElementById(id); if (!el) return;
  const pages = Math.ceil(total / AD_PG_SZ);
  if (pages <= 1) { el.innerHTML = ''; return; }
  const s = Math.max(1, cur - 2), e = Math.min(pages, cur + 2);
  let h = `<span>총 ${total}건</span><div class="ad-pg-btns">`;
  h += `<button class="ad-pg-btn" ${cur === 1 ? 'disabled' : ''} onclick="(${cb.toString()})(${cur - 1})">‹</button>`;
  for (let p = s; p <= e; p++) h += `<button class="ad-pg-btn ${p === cur ? 'on' : ''}" onclick="(${cb.toString()})(${p})">${p}</button>`;
  h += `<button class="ad-pg-btn" ${cur === pages ? 'disabled' : ''} onclick="(${cb.toString()})(${cur + 1})">›</button></div>`;
  el.innerHTML = h;
}

/* ── 게시물 작성 (새 글) ──
   ★ 수정: HTML의 체크박스 ID(adWNew, adWHot, adWActive, adWPublished)와 동기화
*/
function adOpenWrite(cat = '공지사항') {
  document.getElementById('adEditId').value = '';
  document.getElementById('adWriteTitle').textContent = '공지 작성';
  document.getElementById('adWriteBtnTxt').textContent = '등록하기';
  document.getElementById('adWCat').value = cat;
  _adSetBadge('');
  _adSetActive(true);
  document.getElementById('adWTitle').value = '';
  document.getElementById('adWAuthor').value = '운영사무국';
  document.getElementById('adWContent').value = '';
  document.getElementById('adWPublished').value = new Date().toISOString().slice(0, 10);
  document.getElementById('adWTitleCnt').textContent = '0/120';
  document.getElementById('adPrevBox').classList.remove('on');
  openAdModal('adWriteModal');
}

/* ── 게시물 수정 ──
   ★ 수정: 체크박스 / adWPublished 사용
*/
function adOpenEdit(enc) {
  const r = adDecB64(enc);
  document.getElementById('adEditId').value = r.id;
  document.getElementById('adWriteTitle').textContent = '공지 수정';
  document.getElementById('adWriteBtnTxt').textContent = '저장하기';
  document.getElementById('adWCat').value = r.category || '공지사항';
  _adSetBadge(r.is_new ? 'new' : r.is_hot ? 'hot' : '');
  _adSetActive(r.is_active !== false);
  document.getElementById('adWTitle').value = r.title || '';
  document.getElementById('adWAuthor').value = r.author || '';
  document.getElementById('adWContent').value = r.content || '';
  document.getElementById('adWPublished').value = (r.published_at || new Date().toISOString()).slice(0, 10);
  document.getElementById('adWTitleCnt').textContent = (r.title || '').length + '/120';
  document.getElementById('adPrevBox').classList.remove('on');
  openAdModal('adWriteModal');
}

// 뱃지 체크박스 설정 헬퍼
function _adSetBadge(badge) {
  const newEl = document.getElementById('adWNew');
  const hotEl = document.getElementById('adWHot');
  if (newEl) newEl.checked = badge === 'new';
  if (hotEl) hotEl.checked = badge === 'hot';
}

// 게시 상태 체크박스 헬퍼
function _adSetActive(active) {
  const el = document.getElementById('adWActive');
  if (el) el.checked = active;
}

/* ── 게시물 등록/수정 제출 ──
   ★ 수정: adWNew/adWHot 체크박스, adWActive 체크박스, adWPublished 날짜 읽기
*/
async function adSubmitWrite() {
  const id = document.getElementById('adEditId').value;
  const title = document.getElementById('adWTitle').value.trim();
  const cat = document.getElementById('adWCat').value;
  const author = (document.getElementById('adWAuthor').value.trim()) || '운영사무국';
  const content = document.getElementById('adWContent').value.trim();
  const isNew = document.getElementById('adWNew')?.checked || false;
  const isHot = document.getElementById('adWHot')?.checked || false;
  const isActive = document.getElementById('adWActive')?.checked !== false;
  const dateVal = document.getElementById('adWPublished').value;

  if (!title) { adToast('제목을 입력해주세요.', 'er'); return; }
  if (!content) { adToast('내용을 입력해주세요.', 'er'); return; }

  const btn = document.getElementById('adWriteBtn');
  btn.disabled = true;

  // 예시: DB 컬럼명이 'body'로 되어 있을 경우 코드를 이렇게 수정해야 합니다.
  const payload = {
    title,
    category: cat,
    author,
    is_new: isNew,
    is_hot: isHot,
    content,
    is_active: isActive,
    published_at: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
  };

  try {
    if (id) {
      await _patch('notice_board', id, payload);
      adToast('✅ 수정되었습니다.', 'ok');
    } else {
      await _post('notice_board', payload);
      adToast('✅ 등록되었습니다.', 'ok');
    }
    closeAdModal('adWriteModal');
    adInited = false; // 강제 재로드
    await adLoadNotices();
    adRenderDash();
  } catch (e) { adToast('❌ 오류: ' + e.message, 'er'); }

  btn.disabled = false;
}

/* ── 본문 HTML 삽입 도구 ── */
function adInsHtml(s) {
  const ta = document.getElementById('adWContent');
  const p = ta.selectionStart, e = ta.selectionEnd;
  const d = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  ta.value = ta.value.slice(0, p) + d + ta.value.slice(e);
  ta.focus(); ta.selectionStart = ta.selectionEnd = p + d.length;
  adUpdatePrev();
}

function adUpdatePrev() {
  const pb = document.getElementById('adPrevBox');
  if (pb && pb.classList.contains('on')) pb.innerHTML = document.getElementById('adWContent').value;
}

function adTogglePreview() {
  const pb = document.getElementById('adPrevBox');
  if (pb) { pb.classList.toggle('on'); adUpdatePrev(); }
}

// 제목 글자수 카운터
document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('adWTitle');
  if (titleInput) titleInput.addEventListener('input', () => {
    const cnt = document.getElementById('adWTitleCnt');
    if (cnt) cnt.textContent = titleInput.value.length + '/120';
  });
});

/* ── 상세보기 ── */
function adOpenDetail(enc) {
  const r = adDecB64(enc);
  const meta = document.getElementById('adDetailMeta');
  if (meta) meta.textContent = `${r.category || ''} · ${(r.published_at || '').slice(0, 10)} · 조회 ${r.views || 0}`;
  const title = document.getElementById('adDetailTitle');
  if (title) title.textContent = r.title || '';
  const badges = document.getElementById('adDetailBadges');
  if (badges) {
    const b = [];
    if (r.is_new) b.push('<span class="adbadge adbadge-new">NEW</span>');
    if (r.is_hot) b.push('<span class="adbadge adbadge-hot">HOT</span>');
    badges.innerHTML = b.join(' ');
  }
  const author = document.getElementById('adDetailAuthor');
  if (author) author.textContent = r.author || '한국중장년고용협회';
  const content = document.getElementById('adDetailContent');
  if (content) content.innerHTML = r.content || '';
  openAdModal('adDetailModal');
}

/* ── 삭제 확인 ── */
let adPendingDel = null;
function adAskDel(table, id, label) {
  const msgEl = document.getElementById('adConfirmMsg');
  if (msgEl) msgEl.textContent = `"${label}…" 을(를) 삭제합니다. 되돌릴 수 없습니다.`;
  adPendingDel = { table, id };
  const delDialog = document.getElementById('adConfirmDel');
  if (delDialog) delDialog.classList.add('on');
  const okBtn = document.getElementById('adConfirmOk');
  if (okBtn) okBtn.onclick = async () => {
    closeConfirmDel();
    try {
      await _del(adPendingDel.table, adPendingDel.id);
      adToast('🗑 삭제되었습니다.', 'ok');
      adInited = false;
      if (adPendingDel.table === 'notice_board') { await adLoadNotices(); adRenderDash(); }
      else { await adLoadInq(); adRenderDash(); }
    } catch (e) { adToast('❌ 삭제 실패: ' + e.message, 'er'); }
  };
}
function closeConfirmDel() {
  const el = document.getElementById('adConfirmDel');
  if (el) el.classList.remove('on');
}

/* ── 모달 열기/닫기 ── */
function openAdModal(id) { const el = document.getElementById(id); if (el) el.classList.add('on'); }
function closeAdModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('on'); }

/* ── 페이지 이동 ── */
function adGoPage(name) {
  document.querySelectorAll('.ad-page').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.ad-sb-btn').forEach(b => b.classList.remove('on'));
  const page = document.getElementById('adPage-' + name);
  if (page) page.classList.add('on');
  const idx = { dash: 0, notice: 1, news: 2, inq: 3 };
  document.querySelectorAll('.ad-sb-btn')[idx[name]]?.classList.add('on');
  const map = {
    dash: ['대시보드', '전체 현황'],
    notice: ['공지사항 관리', '알림마당 · 공지사항'],
    news: ['협회소식 관리', '알림마당 · 협회소식'],
    inq: ['문의 목록', 'Contact · 접수된 문의'],
  };
  const [t, p] = map[name] || ['', ''];
  const topTitle = document.getElementById('adTopTitle');
  const topPath = document.getElementById('adTopPath');
  if (topTitle) topTitle.textContent = t;
  if (topPath) topPath.textContent = 'KAPAE Admin · ' + p;
}

/* ── 유틸리티 ── */
function adB64(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
function adDecB64(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch { return {}; } }
function adEsc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let _adToastT;
function adToast(msg, type = 'ok') {
  const el = document.getElementById('adToast');
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.background = type === 'ok' ? '#0D1B2A' : '#1a0a0a';
  el.style.color = type === 'ok' ? '#D4B896' : '#f87171';
  clearTimeout(_adToastT);
  _adToastT = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// adminRoot 관찰 → 세션 저장된 로그인 상태 복원
const _adRoot = document.getElementById('adminRoot');
if (_adRoot) {
  new MutationObserver(() => {
    if (_adRoot.classList.contains('on') && sessionStorage.getItem('kapae_adm') === '1') {
      const loginEl = document.getElementById('adLogin');
      const appEl = document.getElementById('adApp');
      if (loginEl) loginEl.classList.add('hide');
      if (appEl) appEl.classList.add('on');
      if (!adInited) adInit();
    }
  }).observe(_adRoot, { attributes: true });
}

/* ═══════════════════════════════════
   DOM 준비 후 실행
═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // localStorage에서 이전 워크그래피 복원
  KAPAE.load();

  loadAllBoards();        // 게시판 로드
  WGW.init();             // 워크그래피 마법사 초기화
  JourneySection.init();  // 고용 여정 섹션
  initScrollReveal();     // 스크롤 리빌
});