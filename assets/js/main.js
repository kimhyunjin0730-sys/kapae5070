/* ==========================================================================
   메인(index.html) 전용 스크립트 — board.js 다음에 읽음
   - 공지사항 상자·협회 소식 카드: KAPAE_BOARD.load()로 최신 글을 4개씩 채움
     (받기 전에는 index.html에 넣어 둔 옅은 자리표시가 보임. 소식 사진은 자리 순서대로 고정)
   - 주요 사업 분류 탭(전체/연구·정책/매칭·컨설팅/교육·인증), 대상별 서비스(중장년 개인/기업) 전환
   - 슬라이드 번호: 공통 슬라이드(site.js)가 바꾸는 aria-hidden을 지켜보고 굵은 숫자만 갱신
   - 퀵 배너를 닫으면 키보드 초점을 남은 배너의 닫기 버튼이나 ‘자주 찾는 서비스’ 제목으로 옮김
   ========================================================================== */
(function () {
  'use strict';

  var esc = (window.KAPAE && window.KAPAE.esc) || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B2545" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  /* ---------- 슬라이드 번호 (<strong data-count>1</strong> / 3) ---------- */
  function initCount(root) {
    if (!root || !('MutationObserver' in window)) return;
    var num = root.querySelector('[data-count]');
    var slides = root.querySelectorAll('.carousel__slide');
    if (!num || !slides.length) return;
    function update() {
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].getAttribute('aria-hidden') === 'false') {
          num.textContent = String(i + 1);
          return;
        }
      }
    }
    var mo = new MutationObserver(update);
    each(slides, function (s) { mo.observe(s, { attributes: true, attributeFilter: ['aria-hidden'] }); });
    update();
  }

  /* ---------- 주요 사업 분류 탭 ---------- */
  function initFilter() {
    var btns = document.querySelectorAll('.main-filter__btn[data-filter]');
    var cards = document.querySelectorAll('#main-biz-list > [data-cat]');
    if (!btns.length || !cards.length) return;
    function apply(cat) {
      each(btns, function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-filter') === cat ? 'true' : 'false');
      });
      // ‘전체’에서만 퍼플넷 연계 카드까지 보임
      each(cards, function (c) {
        c.hidden = !(cat === 'all' || c.getAttribute('data-cat') === cat);
      });
    }
    each(btns, function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
    });
  }

  /* ---------- 대상별 서비스: 중장년 개인 / 기업 ---------- */
  function initAudience() {
    var btns = document.querySelectorAll('.main-aud__btn[data-aud]');
    var panels = document.querySelectorAll('[data-aud-panel]');
    if (!btns.length || !panels.length) return;
    function apply(who) {
      each(btns, function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-aud') === who ? 'true' : 'false');
      });
      each(panels, function (p) {
        p.hidden = p.getAttribute('data-aud-panel') !== who;
      });
    }
    each(btns, function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-aud')); });
    });
  }

  /* ---------- 퀵 배너를 닫은 뒤 초점 옮기기 (닫기 자체는 site.js의 data-dismiss) ---------- */
  function initBannerFocus() {
    var group = document.querySelector('.main-qbs');
    if (!group) return;
    group.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-dismiss]') : null;
      if (!btn) return;
      setTimeout(function () {
        if (!btn.closest('[hidden]')) return; // 닫히지 않았으면 그대로
        var next = group.hidden ? null : group.querySelector('[data-dismissable]:not([hidden]) [data-dismiss]');
        var target = next || document.getElementById('quick-title');
        if (target) target.focus();
      }, 0);
    });
  }

  /* ---------- 공지사항 상자·협회 소식 카드 ---------- */
  function badges(it) {
    return (it.isNew ? '<span class="badge badge--new">NEW</span>' : '') +
      (it.isHot ? '<span class="badge badge--hot">HOT</span>' : '');
  }

  function viewHref(it) {
    return 'notice-view.html?id=' + encodeURIComponent(it.id);
  }

  function dateHTML(cls, d) {
    var iso = /^\d{4}\.\d{2}\.\d{2}$/.test(d) ? d.replace(/\./g, '-') : '';
    return iso
      ? '<time class="' + cls + '" datetime="' + iso + '">' + esc(d) + '</time>'
      : '<span class="' + cls + '">' + esc(d) + '</span>';
  }

  function message(list, text) {
    list.innerHTML = '<li class="main-empty">' + esc(text) + '</li>';
  }

  function renderNotices(list, items) {
    if (!items.length) { message(list, '등록된 공지사항이 없습니다.'); return; }
    list.innerHTML = items.map(function (it) {
      return '<li class="main-notice__item"><a class="main-notice__link" href="' + viewHref(it) + '">' +
          '<span class="main-notice__row">' + badges(it) + '<span class="main-notice__subject">' + esc(it.title) + '</span></span>' +
          dateHTML('main-notice__date nowrap', it.date) +
        '</a></li>';
    }).join('');
  }

  // 자리표시 카드의 사진은 그대로 두고(다시 받지 않게) 주소와 글만 채움
  function renderNews(list, items) {
    if (!items.length) { message(list, '등록된 협회 소식이 없습니다.'); return; }
    each(list.querySelectorAll('.main-news__item'), function (li, i) {
      var it = items[i];
      if (!it) { li.parentNode.removeChild(li); return; }
      var card = li.querySelector('.main-news__card');
      var body = li.querySelector('.main-news__body');
      card.setAttribute('href', viewHref(it));
      body.innerHTML =
        '<span class="main-news__meta">' + badges(it) + '<span class="main-news__author">' + esc(it.author) + '</span></span>' +
        '<span class="main-news__title">' + esc(it.title) + '</span>' +
        '<span class="main-news__foot">' + dateHTML('nowrap', it.date) + ARROW + '</span>';
    });
  }

  function initBoard() {
    var noticeList = document.getElementById('main-notice-list');
    var newsList = document.getElementById('main-news-list');
    if (!noticeList && !newsList) return;
    var board = window.KAPAE_BOARD;

    function finish() {
      if (noticeList) noticeList.removeAttribute('aria-busy');
      if (newsList) newsList.removeAttribute('aria-busy');
    }
    function fail() {
      if (noticeList) message(noticeList, '공지사항을 불러오지 못했습니다.');
      if (newsList) message(newsList, '협회 소식을 불러오지 못했습니다.');
      finish();
    }

    if (!board || typeof board.load !== 'function') { fail(); return; }
    board.load().then(function (res) {
      var items = (res && res.items) || [];
      if (noticeList) renderNotices(noticeList, board.byCategory(items, 'notice').slice(0, 4));
      if (newsList) renderNews(newsList, board.byCategory(items, 'news').slice(0, 4));
      finish();
    })['catch'](fail);
  }

  initCount(document.querySelector('.main-hero'));
  initCount(document.querySelector('.main-sites'));
  initFilter();
  initAudience();
  initBannerFocus();
  initBoard();
})();
