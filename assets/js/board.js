/* ==========================================================================
   알림마당 데이터 (메인·알림마당 목록·게시글 보기에서 함께 사용)
   - 서버 /api/notices 에서 공지사항·협회소식을 받아 같은 모양으로 정리
   - 서버가 응답하지 않을 때만 아래 FALLBACK 글을 보여줌
   ========================================================================== */
(function () {
  'use strict';

  var CATEGORY = { notice: '공지사항', news: '협회소식' };

  // 서버를 쓸 수 없을 때 보여줄 기본 글 (예전 사이트에 들어 있던 글)
  var FALLBACK = [
    // 게시일은 사용자 요청으로 월까지만 표시 (2026.11)
    { id: 'n1', category: '공지사항', title: '퍼플넷 워크그래피(WorkGraphy) 베타 오픈 안내', published_at: '2026-11', is_new: true, is_hot: false, author: '운영사무국', views: 142, content: '<p>안녕하세요. (사)한국중장년고용협회입니다.</p><p>2026년 11월, 퍼플넷 워크그래피(WorkGraphy) 베타 서비스를 오픈합니다.</p><div class="nc-section"><h4>■ 퍼플넷이란?</h4><ul><li>워크그래피 기반 AI 매칭 플랫폼</li><li>중장년의 경험·암묵지를 구조화하여 재취업·자문·강연·교육을 연결</li><li>2026년 1월 정식 런칭</li></ul></div><div class="nc-note">문의: kapae1503@gmail.com | 02-582-1009</div>' },
    { id: 'n2', category: '공지사항', title: '중장년 친화기업 인증 신청 접수 안내', published_at: '2025-12-10', is_new: false, is_hot: false, author: '인증사업팀', views: 89, content: '<p>중장년 친화기업 인증 신청을 2025년 12월부터 상시 접수합니다.</p><div class="nc-section"><h4>■ 신청 자격</h4><ul><li>상시 근로자 10인 이상 기업</li><li>중장년(50~69세) 고용비율 일정 기준 이상</li></ul></div><div class="nc-note">접수: 상시 접수 | 문의: kapae1503@gmail.com</div>' },
    { id: 'n3', category: '공지사항', title: '2025년 하반기 재취업 지원 교육 훈련 모집', published_at: '2025-10-05', is_new: false, is_hot: false, author: '교육훈련팀', views: 203, content: '<p>2025년 하반기 재취업 지원 교육 훈련 과정 수강생을 모집합니다.</p><div class="nc-section"><h4>■ 교육 과정</h4><ul><li>생애설계 전문가 과정 (4주)</li><li>중장년 전직 지원 컨설턴트 과정 (6주)</li></ul></div><div class="nc-note">마감: 선착순 20명</div>' },
    { id: 'n4', category: '공지사항', title: '한국중장년고용협회 × 메인에이지 업무협약', published_at: '2025-06-20', is_new: false, is_hot: false, author: '사무국', views: 67, content: '<p>한국중장년고용협회와 메인에이지가 중장년 고용 활성화를 위한 업무협약(MOU)을 체결하였습니다.</p><div class="nc-note">협약일: 2025년 6월 20일</div>' },
    { id: 'n5', category: '공지사항', title: '중장년 고용 정책 세미나 개최 공지', published_at: '2025-04-15', is_new: false, is_hot: false, author: '정책연구팀', views: 156, content: '<p>중장년 고용 활성화를 위한 정책 세미나를 개최합니다.</p><div class="nc-section"><h4>■ 행사 개요</h4><ul><li>일시: 2025년 4월 25일 오후 2시</li><li>장소: 서울 서초구 협회 강당</li></ul></div>' },
    { id: 'w1', category: '협회소식', title: '워크그래피 AI 분석 서비스 베타 오픈', published_at: '2026-11', is_new: true, is_hot: false, author: '퍼플넷팀', views: 312, content: '<p>워크그래피 AI 분석 서비스 베타 버전이 오픈되었습니다.</p><div class="nc-section"><h4>■ 베타 서비스 주요 기능</h4><ul><li>경력·역량 자동 분류 및 시각화</li><li>AI 기반 적합 직무 추천</li><li>암묵지 강점 분석 리포트</li></ul></div><div class="nc-note">베타 테스터 모집 중 | kapae1503@gmail.com</div>' },
    // '퍼플넷 2026 런칭 준비 현황 공개'(2025.11.20) 글은 사실 확인이 안 되어 뺐음
    { id: 'w3', category: '협회소식', title: '정부 중장년 고용정책 간담회 참여 결과', published_at: '2025-09-08', is_new: false, is_hot: false, author: '정책연구팀', views: 94, content: '<p>고용노동부 주관 중장년 고용정책 간담회에 협회 대표로 참여하였습니다.</p><div class="nc-note">향후 정책 연구 결과는 별도 보고서로 발간 예정입니다.</div>' },
    { id: 'w4', category: '협회소식', title: '중장년 핵심인재 양성 프로그램 성과 발표', published_at: '2025-07-14', is_new: false, is_hot: false, author: '교육훈련팀', views: 131, content: '<p>2025년 상반기 중장년 핵심인재 양성 프로그램의 성과를 발표합니다.</p><div class="nc-section"><h4>■ 주요 성과</h4><ul><li>수료생: 84명 | 취업 연계: 61명 (72.6%)</li><li>만족도: 4.6 / 5.0</li></ul></div>' },
    { id: 'w5', category: '협회소식', title: '2025 중장년 고용 심포지엄 참가 후기', published_at: '2025-05-22', is_new: false, is_hot: false, author: '사무국', views: 78, content: '<p>2025 중장년 고용 심포지엄에 협회가 참가하였습니다.</p><p>협회는 퍼플넷 플랫폼 소개 세션을 통해 AI 기반 중장년 매칭 솔루션을 소개하며 큰 호응을 받았습니다.</p>' }
  ];

  // DB의 DATE 값은 서버 시간대에 따라 하루 밀려 보일 수 있어 한국 시간 기준으로 맞춤
  function formatDate(raw) {
    if (!raw) return '';
    var s = String(raw);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return m[1] + '.' + m[2] + '.' + m[3];
    var ym = /^(\d{4})-(\d{2})$/.exec(s);           // 월까지만 아는 글 (예: 2026.11)
    if (ym) return ym[1] + '.' + ym[2];
    var d = new Date(s);
    if (isNaN(d.getTime())) return s.slice(0, 10).replace(/-/g, '.');
    var parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ''; };
    return get('year') + '.' + get('month') + '.' + get('day');
  }

  function normalize(row) {
    return {
      id: String(row.id),
      category: row.category === '협회소식' ? '협회소식' : '공지사항',
      title: String(row.title || ''),
      date: formatDate(row.published_at || row.created_at),
      author: row.author || '운영자',
      views: Number(row.views || 0),
      isNew: !!Number(row.is_new) || row.is_new === true,
      isHot: !!Number(row.is_hot) || row.is_hot === true,
      content: String(row.content || '')
    };
  }

  function byDateDesc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  }

  var cache = null;
  function load() {
    if (cache) return cache;
    cache = fetch('/api/notices', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows)) throw new Error('bad data');
        // DB에 글이 하나도 없을 때도 빈 화면 대신 기본 글을 보여줌 (관리자 화면은 DB 그대로 보여줌)
        if (rows.length === 0) throw new Error('empty');
        return { items: rows.map(normalize).sort(byDateDesc), fromFallback: false };
      })
      .catch(function () {
        return { items: FALLBACK.map(normalize).sort(byDateDesc), fromFallback: true };
      });
    return cache;
  }

  function byCategory(items, tab) {
    var cat = CATEGORY[tab] || tab;
    return items.filter(function (it) { return it.category === cat; });
  }

  function find(items, id) {
    for (var i = 0; i < items.length; i++) if (items[i].id === String(id)) return items[i];
    return null;
  }

  window.KAPAE_BOARD = { load: load, byCategory: byCategory, find: find, formatDate: formatDate, CATEGORY: CATEGORY };
})();
