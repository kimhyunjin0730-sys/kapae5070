/* ==========================================================================
   KAPAE 5070 공통 스크립트
   - 페이지 맨 위 <div id="site-header" data-current="about"></div> 바로 다음에 이 파일을 넣으면
     헤더를 그 자리에서 바로 그리고(깜빡임 없음), 문서가 다 읽히면 <div id="site-footer">에 푸터를 그림
   - 글자 크기(16/18/20px)는 브라우저에 기억해서 모든 페이지에 똑같이 적용
   - 메뉴 구조를 바꿀 때는 아래 MENU 하나만 고치면 헤더·펼침 메뉴가 함께 바뀜
   ========================================================================== */
(function () {
  'use strict';

  var FONT_KEY = 'kapae_font';
  var PURPLENET = 'https://purplenet.kr/';
  var WORKGRAPHY_WEB = 'https://workgraphy.purplenet.kr';
  // 아이폰(App Store) 앱은 2026년 11월 현재 심사 중 — 출시되면 APP_STORE에 주소를 넣으면 버튼이 생김
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=kr.purplenet.workgraphy';
  var APP_STORE = '';
  var YOUTUBE = 'https://www.youtube.com/channel/UClZsiie0UHyhBgsmyaoA_0w';
  var FACEBOOK = 'https://facebook.com/kapae2015';
  var PHONE = '02-582-1009';
  var EMAIL = 'kapae1503@gmail.com';

  /* ---------- 글자 크기: 그리기 전에 먼저 적용 ---------- */
  function readFont() {
    try {
      var v = localStorage.getItem(FONT_KEY);
      return v === '16' || v === '20' ? v : '18';
    } catch (e) { return '18'; }
  }
  function applyFont(v) {
    document.documentElement.setAttribute('data-font', v);
    try { localStorage.setItem(FONT_KEY, v); } catch (e) { /* 저장 불가 시 이번 페이지에만 적용 */ }
    var btns = document.querySelectorAll('.fontsize__btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-size') === v ? 'true' : 'false');
    }
  }
  document.documentElement.setAttribute('data-font', readFont());

  /* ---------- 아이콘 ---------- */
  function svg(path, size) {
    var s = size || 18;
    return '<svg class="icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }
  var ICON = {
    ext: '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"></path>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"></rect><path d="M10 9.5v5l4.5-2.5z"></path>',
    facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>'
  };
  var LOGO = function (bg) {
    return '<svg class="brand__mark" viewBox="0 0 44 44" aria-hidden="true"><rect width="44" height="44" rx="10" fill="' + bg + '"></rect><path d="M10 31h8v-7h8v-7h8" fill="none" stroke="#D9BE8F" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  };

  /* ---------- 메뉴 구조 (헤더·펼침 메뉴 공통) ---------- */
  var MENU = [
    { id: 'about', label: '협회소개', href: 'about.html', items: [
      { label: '설립 목적과 비전', href: 'about.html' },
      { label: '조직 안내', href: 'organization.html' },
      { label: '연혁', href: 'history.html' },
      { label: '오시는 길', href: 'contact.html#location' }
    ] },
    { id: 'business', label: '핵심사업', href: 'business.html', items: [
      { label: '7대 핵심사업 한눈에', href: 'business.html', strong: true },
      { label: '제도 연구·정책 개발', href: 'business-detail.html?id=1' },
      { label: '조사 및 통계', href: 'business-detail.html?id=2' },
      { label: '정부 시책 홍보', href: 'business-detail.html?id=3' },
      { label: '인력 매칭 지원', href: 'business-detail.html?id=4' },
      { label: '컨설팅 지원', href: 'business-detail.html?id=5' },
      { label: '교육 훈련', href: 'business-detail.html?id=6' },
      { label: '인증 및 자격', href: 'business-detail.html?id=7' }
    ] },
    { id: 'purplenet', label: '퍼플넷 연계', href: 'purplenet.html', items: [
      { label: '퍼플넷 연계 안내', href: 'purplenet.html' },
      { label: '퍼플넷 바로가기', href: PURPLENET, ext: true, pn: true },
      { label: '워크그래피 AI 웹으로 보기', href: WORKGRAPHY_WEB, ext: true, pn: true }
    ] },
    { id: 'notice', label: '알림마당', href: 'notice.html', items: [
      { label: '공지사항', href: 'notice.html?tab=notice' },
      { label: '협회 소식', href: 'notice.html?tab=news' },
      { label: '유튜브 채널', href: YOUTUBE, ext: true }
    ] },
    { id: 'contact', label: '상담 신청', href: 'contact.html', items: [
      { label: '상담 신청', href: 'contact.html' },
      { label: '오시는 길', href: 'contact.html#location' }
    ] }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function extAttrs(isExt) { return isExt ? ' target="_blank" rel="noopener" title="새 창 열림"' : ''; }

  /* ---------- 헤더 ---------- */
  function headerHTML(cur) {
    var size = readFont();
    var sizeBtn = function (v, label) {
      return '<button type="button" class="fontsize__btn" data-size="' + v + '" aria-pressed="' + (size === v ? 'true' : 'false') + '" aria-label="글자 크기 ' + label + '"><span>가</span></button>';
    };
    var gnb = MENU.map(function (m) {
      return '<a class="gnb__link" href="' + m.href + '"' + (m.id === cur ? ' aria-current="page"' : '') + '>' + m.label + '</a>';
    }).join('');
    var cols = MENU.map(function (m) {
      var items = m.items.map(function (it) {
        var cls = 'mega__link' + (it.strong ? ' mega__link--strong' : '') + (it.pn ? ' mega__link--pn' : '');
        return '<li><a class="' + cls + '" href="' + it.href + '"' + extAttrs(it.ext) + '>' + it.label + (it.ext ? svg(ICON.ext, 14) : '') + '</a></li>';
      }).join('');
      return '<div class="mega__col' + (m.id === cur ? ' is-current' : '') + '"><p class="mega__title">' + m.label + '</p><ul class="mega__list">' + items + '</ul></div>';
    }).join('');

    return '' +
      '<header class="site-header">' +
        '<div class="util"><div class="container util__in">' +
          '<p class="util__tag">중장년 고용 전문 비영리 사단법인</p>' +
          '<div class="util__links">' +
            '<a class="util__link util__link--pn" href="' + PURPLENET + '"' + extAttrs(true) + '>퍼플넷 바로가기' + svg(ICON.ext, 14) + '</a>' +
            '<a class="util__link" href="' + YOUTUBE + '"' + extAttrs(true) + '>유튜브 채널</a>' +
            '<a class="util__link" href="contact.html#location">오시는 길</a>' +
            '<div class="fontsize" role="group" aria-label="글자 크기"><span class="fontsize__label">글자 크기</span>' +
              sizeBtn('16', '작게') + sizeBtn('18', '보통') + sizeBtn('20', '크게') +
            '</div>' +
          '</div>' +
        '</div></div>' +
        '<div class="container brand-row">' +
          '<a class="brand" href="index.html">' + LOGO('#0B2545') +
            '<span class="brand__text"><span class="brand__name">(사)한국중장년고용협회</span><span class="brand__en">Korea Association of Prime Aged Employment</span></span>' +
          '</a>' +
          '<div class="brand-row__aside">' +
            '<a class="tel-link" href="tel:' + PHONE + '">' + svg(ICON.phone, 22) + '<span class="tel-link__label">전화 상담</span><span class="tel-link__num">' + PHONE + '</span></a>' +
            '<a class="btn btn--primary" href="contact.html">상담 신청</a>' +
          '</div>' +
          // 모바일 전용: 전화 + 메뉴 버튼 (넓은 화면에서는 숨김)
          '<div class="m-actions">' +
            '<a class="m-btn" href="tel:' + PHONE + '" aria-label="전화 상담 ' + PHONE + '">' + svg(ICON.phone, 22) + '<span>전화</span></a>' +
            '<button type="button" class="m-btn m-menu-btn" aria-expanded="false" aria-controls="mega-menu">' + svg(ICON.menu, 24) + '<span>메뉴</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="gnb-zone">' +
          '<div class="gnb-bar"><div class="container">' +
            '<nav class="gnb" aria-label="주 메뉴">' + gnb +
              '<button type="button" class="gnb__all" aria-expanded="false" aria-controls="mega-menu">' + svg(ICON.menu, 20) + '전체메뉴</button>' +
            '</nav>' +
          '</div></div>' +
          '<div class="mega" id="mega-menu" hidden>' +
            '<nav class="container" aria-label="전체메뉴">' +
              // 모바일 메뉴 맨 위: 상담·전화·글자 크기
              '<div class="mega__mobile">' +
                '<div class="mega__mobile-row">' +
                  '<a class="btn btn--primary" href="contact.html">상담 신청</a>' +
                  '<a class="btn btn--outline" href="tel:' + PHONE + '">' + svg(ICON.phone, 18) + PHONE + '</a>' +
                '</div>' +
                '<div class="fontsize" role="group" aria-label="글자 크기"><span class="fontsize__label">글자 크기</span>' +
                  sizeBtn('16', '작게') + sizeBtn('18', '보통') + sizeBtn('20', '크게') +
                '</div>' +
              '</div>' +
              '<div class="mega__cols">' + cols +
              '<div class="mega__aside"><p class="mega__title">전체메뉴</p>' +
                '<a class="mega__link mega__link--strong" href="sitemap.html">사이트맵 전체 보기' + svg(ICON.arrow, 16) + '</a>' +
                '<button type="button" class="btn btn--line btn--sm mega__close">' + svg(ICON.close, 16) + '메뉴 닫기</button>' +
              '</div>' +
            '</div></nav>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function initHeader(root) {
    // 글자 크기 버튼
    var sizeBtns = root.querySelectorAll('.fontsize__btn');
    for (var i = 0; i < sizeBtns.length; i++) {
      sizeBtns[i].addEventListener('click', function () { applyFont(this.getAttribute('data-size')); });
    }

    // 펼침 메뉴: 넓은 화면에서는 메뉴 줄에 마우스를 올리거나 키보드로 들어오면 열림
    var zone = root.querySelector('.gnb-zone');
    var panel = root.querySelector('.mega');
    var toggle = root.querySelector('.gnb__all');
    var mToggle = root.querySelector('.m-menu-btn');
    var closeBtn = root.querySelector('.mega__close');
    var wide = window.matchMedia('(min-width: 901px) and (hover: hover)');
    var narrow = window.matchMedia('(max-width: 900px)');
    var openedAt = 0;
    var closeTimer = null;

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      // 모바일에서 메뉴가 열려 있는 동안 뒤 화면이 스크롤되지 않게
      document.documentElement.classList.toggle('menu-open', open && narrow.matches);
    }
    mToggle.setAttribute('aria-label', '메뉴 열기');
    mToggle.addEventListener('click', function () { setOpen(panel.hidden); });
    function isOpen() { return !panel.hidden; }

    zone.addEventListener('mouseenter', function () {
      if (!wide.matches) return;
      clearTimeout(closeTimer);
      if (!isOpen()) { openedAt = Date.now(); setOpen(true); }
    });
    zone.addEventListener('mouseleave', function () {
      if (!wide.matches) return;
      closeTimer = setTimeout(function () { setOpen(false); }, 150);
    });
    var links = root.querySelectorAll('.gnb__link');
    for (var j = 0; j < links.length; j++) {
      links[j].addEventListener('focus', function () { if (wide.matches) setOpen(true); });
    }
    zone.addEventListener('focusout', function (e) {
      if (!zone.contains(e.relatedTarget)) setOpen(false);
    });
    toggle.addEventListener('click', function () {
      // 마우스를 올려 막 열린 직후의 클릭은 닫지 않음
      if (isOpen() && Date.now() - openedAt < 600) return;
      setOpen(!isOpen());
    });
    function focusToggle() { (narrow.matches ? mToggle : toggle).focus(); }
    closeBtn.addEventListener('click', function () { setOpen(false); focusToggle(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); focusToggle(); }
    });
    document.addEventListener('click', function (e) {
      if (isOpen() && !zone.contains(e.target) && !mToggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- 워크그래피 AI 앱 안내 팝업 ----------
     - 처음 들어온 페이지에서 한 번 보여주고, '닫기'는 이번 방문 동안, '오늘 하루 보지 않기'는 자정까지 숨김
     - 모바일: 아래에서 올라오는 시트 / 넓은 화면: 오른쪽 아래 카드
     - 관리자 화면(body[data-no-promo])에서는 보이지 않음 */
  var PROMO_TODAY_KEY = 'kapae_promo_hide_until';
  var PROMO_SESSION_KEY = 'kapae_promo_closed';

  function promoHidden() {
    try {
      if (sessionStorage.getItem(PROMO_SESSION_KEY) === '1') return true;
      var until = parseInt(localStorage.getItem(PROMO_TODAY_KEY) || '0', 10);
      return until > Date.now();
    } catch (e) { return false; }
  }

  function promoHTML(isIOS) {
    var play = '<a class="btn btn--purple btn--lg app-promo__main" href="' + PLAY_STORE + '"' + extAttrs(true) + '>Google Play에서 다운로드</a>';
    var appStore = APP_STORE
      ? '<a class="btn btn--purple btn--lg app-promo__main" href="' + APP_STORE + '"' + extAttrs(true) + '>App Store에서 다운로드</a>'
      : '<p class="app-promo__note">아이폰(App Store) 앱은 심사 중이에요.' + (isIOS ? '<br>지금은 웹으로 이용해 주세요.' : '') + '</p>';
    var web = isIOS && !APP_STORE
      ? '<a class="btn btn--purple btn--lg app-promo__main" href="' + WORKGRAPHY_WEB + '"' + extAttrs(true) + '>웹으로 보기</a>'
      : '<a class="app-promo__web" href="' + WORKGRAPHY_WEB + '"' + extAttrs(true) + '><span class="app-promo__web-label">웹으로 보기' + svg(ICON.ext, 14) + '</span><span class="app-promo__url">workgraphy.purplenet.kr</span></a>';
    var actions = isIOS ? (appStore + web) : (play + appStore + web);
    return '' +
      '<div class="app-promo__backdrop" data-promo-close></div>' +
      '<div class="app-promo__card">' +
        '<button type="button" class="app-promo__x" data-promo-close aria-label="워크그래피 앱 안내 닫기">' + svg(ICON.close, 22) + '</button>' +
        '<div class="app-promo__head">' +
          '<span class="app-promo__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3"></rect><path d="M9.5 15l2-3 2 1.5 2-3.5"></path><path d="M11 18.5h2"></path></svg></span>' +
          '<span><span class="app-promo__eyebrow">퍼플넷 앱</span><span class="app-promo__title" id="app-promo-title">워크그래피 AI</span></span>' +
        '</div>' +
        '<p class="app-promo__desc">질문을 따라 답하면 한 사람의 일 경험이 <span class="nowrap">한 장의 브리프로</span> 남습니다.</p>' +
        '<div class="app-promo__actions">' + actions + '</div>' +
        '<div class="app-promo__foot">' +
          '<button type="button" data-promo-today>오늘 하루 보지 않기</button>' +
          '<button type="button" data-promo-close>닫기</button>' +
        '</div>' +
      '</div>';
  }

  function initPromo() {
    if (document.body.hasAttribute('data-no-promo') || promoHidden()) return;
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var box = document.createElement('div');
    box.className = 'app-promo';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'app-promo-title');
    box.hidden = true;
    box.innerHTML = promoHTML(isIOS);
    document.body.appendChild(box);

    function close(today) {
      box.hidden = true;
      try {
        if (today) {
          var midnight = new Date(); midnight.setHours(24, 0, 0, 0);
          localStorage.setItem(PROMO_TODAY_KEY, String(midnight.getTime()));
        }
        sessionStorage.setItem(PROMO_SESSION_KEY, '1');
      } catch (e) { /* 저장 불가 시 이번에만 닫힘 */ }
    }
    var closers = box.querySelectorAll('[data-promo-close]');
    for (var i = 0; i < closers.length; i++) closers[i].addEventListener('click', function () { close(false); });
    box.querySelector('[data-promo-today]').addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(false); });

    // 첫 화면을 다 그린 뒤 잠시 후에 띄움
    setTimeout(function () { box.hidden = false; }, 800);
  }

  /* ---------- 푸터 ---------- */
  function footerHTML() {
    return '' +
      '<footer class="site-footer">' +
        '<div class="footer-top"><div class="container footer-top__in">' +
          '<nav class="footer-nav" aria-label="이용 안내">' +
            '<a href="policy.html#privacy">개인정보처리방침</a>' +
            '<a href="policy.html#terms">이용약관</a>' +
            '<a href="contact.html#location">오시는 길</a>' +
            '<a href="sitemap.html">사이트맵</a>' +
          '</nav>' +
          '<div class="footer-tools">' +
            '<div class="footer-sns">' +
              '<a href="' + YOUTUBE + '"' + extAttrs(true) + '>' + svg(ICON.youtube, 20) + '유튜브</a>' +
              '<a href="' + FACEBOOK + '"' + extAttrs(true) + '>' + svg(ICON.facebook, 20) + '페이스북</a>' +
            '</div>' +
            '<div class="footer-related">' +
              '<label for="footer-related">관련 사이트</label>' +
              '<select id="footer-related">' +
                '<option value="https://www.work24.go.kr">고용24</option>' +
                '<option value="https://www.moel.go.kr">고용노동부</option>' +
                '<option value="https://www.seniorro.or.kr">노인일자리 여기</option>' +
              '</select>' +
              '<a class="btn btn--gold btn--sm" id="footer-related-go" href="https://www.work24.go.kr"' + extAttrs(true) + '>이동</a>' +
            '</div>' +
          '</div>' +
        '</div></div>' +
        '<div class="container footer-main">' +
          '<div class="footer-info">' +
            '<p class="footer-brand">' + LOGO('#1B3A63').replace('brand__mark', 'brand__mark') +
              '<span class="brand__text"><span class="footer-brand__name">(사)한국중장년고용협회</span><span class="footer-brand__en">Korea Association of Prime Aged Employment · KAPAE 5070</span></span>' +
            '</p>' +
            '<p class="footer-desc">중장년 고용시스템을 구축하여 고령화 문제를 풀어가며 국가 일자리 창출에 초석을 다지는 비영리 사단법인입니다.</p>' +
            '<address class="footer-address">' +
              '<span>주소 서울 서초구 서초대로64길 55 준원빌딩 505호 <span class="nowrap">(06636)</span></span>' +
              '<span>전화 <a class="nowrap" href="tel:' + PHONE + '">' + PHONE + '</a></span>' +
              '<span>이메일 <a href="mailto:' + EMAIL + '">' + EMAIL + '</a></span>' +
              '<span>사업자등록번호 <span class="nowrap">516-82-00011</span></span>' +
            '</address>' +
            '<p class="footer-copy">© 2015–2026 (사)한국중장년고용협회 KAPAE. All rights reserved. · Partnership: 주식회사 퍼플넷</p>' +
          '</div>' +
          '<div class="footer-call">' +
            '<p class="footer-call__label">상담 전화</p>' +
            '<a class="footer-call__num" href="tel:' + PHONE + '">' + PHONE + '</a>' +
            '<a class="footer-call__mail" href="mailto:' + EMAIL + '">' + EMAIL + '</a>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function initFooter(root) {
    var sel = root.querySelector('#footer-related');
    var go = root.querySelector('#footer-related-go');
    if (sel && go) sel.addEventListener('change', function () { go.href = sel.value; });
  }

  /* ---------- 슬라이드(캐러셀) ----------
     <div class="carousel" data-carousel data-autoplay="6000">
       <div class="carousel__viewport"><div class="carousel__track">
         <div class="carousel__slide">…</div> …
       </div></div>
       <button data-prev>…</button> <span data-status></span> <button data-toggle>…</button> <button data-next>…</button>
       (선택) <button data-dot="0">…</button> …
     </div> */
  function initCarousel(el) {
    var track = el.querySelector('.carousel__track');
    var slides = el.querySelectorAll('.carousel__slide');
    var n = slides.length;
    if (!track || n === 0) return;
    var idx = 0;
    var paused = false;
    var hovering = false;
    var delay = parseInt(el.getAttribute('data-autoplay') || '0', 10);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var status = el.querySelector('[data-status]');
    var toggle = el.querySelector('[data-toggle]');
    var dots = el.querySelectorAll('[data-dot]');

    function render() {
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      for (var i = 0; i < n; i++) {
        var on = i === idx;
        slides[i].setAttribute('aria-hidden', on ? 'false' : 'true');
        var focusables = slides[i].querySelectorAll('a, button, input, select, textarea');
        for (var k = 0; k < focusables.length; k++) {
          if (on) focusables[k].removeAttribute('tabindex'); else focusables[k].setAttribute('tabindex', '-1');
        }
      }
      if (status) status.textContent = (idx + 1) + ' / ' + n;
      for (var d = 0; d < dots.length; d++) {
        dots[d].setAttribute('aria-pressed', String(parseInt(dots[d].getAttribute('data-dot'), 10) === idx));
      }
      if (toggle) {
        toggle.setAttribute('aria-label', paused ? '자동 넘김 시작' : '자동 넘김 멈춤');
        toggle.setAttribute('data-paused', paused ? 'true' : 'false');
        var label = toggle.querySelector('[data-toggle-label]');
        if (label) label.textContent = paused ? '재생' : '멈춤';
      }
    }
    function go(i) { idx = (i + n) % n; render(); }

    var prev = el.querySelector('[data-prev]');
    var next = el.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
    if (toggle) toggle.addEventListener('click', function () { paused = !paused; render(); });
    for (var d = 0; d < dots.length; d++) {
      dots[d].addEventListener('click', function () { go(parseInt(this.getAttribute('data-dot'), 10)); });
    }
    // 마우스를 올리거나 안쪽에 키보드 초점이 있으면 잠시 멈춤
    el.addEventListener('mouseenter', function () { hovering = true; });
    el.addEventListener('mouseleave', function () { hovering = false; });
    el.addEventListener('focusin', function () { hovering = true; });
    el.addEventListener('focusout', function (e) { if (!el.contains(e.relatedTarget)) hovering = false; });

    if (delay > 0 && !reduce && n > 1) {
      setInterval(function () { if (!paused && !hovering && !document.hidden) go(idx + 1); }, delay);
    } else if (reduce) {
      paused = true;
    }
    render();
  }

  /* ---------- 닫기 버튼: <button data-dismiss="#target"> ---------- */
  function initDismiss(btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-dismiss'));
      if (!target) return;
      target.hidden = true;
      var group = target.closest('[data-dismiss-group]');
      if (group) {
        var visible = group.querySelectorAll('[data-dismissable]:not([hidden])');
        if (visible.length === 0) group.hidden = true;
      }
    });
  }

  /* ---------- 그리기 ---------- */
  var headerSlot = document.getElementById('site-header');
  if (headerSlot) {
    headerSlot.innerHTML = headerHTML(headerSlot.getAttribute('data-current') || '');
    initHeader(headerSlot);
  }

  function onReady() {
    var footerSlot = document.getElementById('site-footer');
    if (footerSlot) {
      footerSlot.innerHTML = footerHTML();
      initFooter(footerSlot);
    }
    var cs = document.querySelectorAll('[data-carousel]');
    for (var i = 0; i < cs.length; i++) initCarousel(cs[i]);
    var ds = document.querySelectorAll('[data-dismiss]');
    for (var j = 0; j < ds.length; j++) initDismiss(ds[j]);
    initPromo();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();

  // 관리자 화면 바로가기 (예전 사이트와 같은 단축키)
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
  });

  window.KAPAE = {
    esc: esc,
    svg: svg,
    ICON: ICON,
    PURPLENET: PURPLENET,
    WORKGRAPHY_WEB: WORKGRAPHY_WEB,
    PLAY_STORE: PLAY_STORE,
    YOUTUBE: YOUTUBE,
    PHONE: PHONE,
    EMAIL: EMAIL,
    initCarousel: initCarousel
  };
})();
