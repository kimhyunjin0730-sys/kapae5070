/* ==========================================================================
   알림마당 목록 (notice.html)
   - 데이터: KAPAE_BOARD.load() (board.js, 서버 /api/notices)
   - 공지사항 / 협회 소식: ?tab=notice|news 로 선택, 바꾸면 주소도 history.replaceState로 바꿈
   - 제목 검색은 입력하는 대로 걸러냄. 10개가 넘으면 10개씩 쪽을 나눔(?page=2 …)
   - 번호는 그 게시판 전체에서의 순번(최신 글이 가장 큰 번호). 검색해도 번호는 그대로
   ========================================================================== */
(function () {
  'use strict';

  var PER_PAGE = 10;
  var SITE = '(사)한국중장년고용협회';
  var LABEL = { notice: '공지사항', news: '협회 소식' };

  var esc = (window.KAPAE && window.KAPAE.esc) || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var board = window.KAPAE_BOARD;

  var root = document.getElementById('notice-board');
  if (!root) return;
  var tabBtns = document.querySelectorAll('button[data-tab]'); // 왼쪽 메뉴와 목록 위 탭, 둘 다
  var crumb = document.getElementById('notice-crumb');
  var caption = document.getElementById('notice-caption');
  var countEl = document.getElementById('notice-count');
  var input = document.getElementById('notice-q');
  var table = document.getElementById('notice-table');
  var tbody = document.getElementById('notice-rows');
  var emptyEl = document.getElementById('notice-empty');
  var pager = document.getElementById('notice-pager');

  function svg(path) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }
  var ICON_PREV = svg('<path d="M15 6l-6 6 6 6"></path>');
  var ICON_NEXT = svg('<path d="M9 6l6 6-6 6"></path>');

  var params = new URLSearchParams(window.location.search);
  var state = {
    tab: params.get('tab') === 'news' ? 'news' : 'notice',
    page: Math.max(1, parseInt(params.get('page'), 10) || 1),
    items: null // 불러오기 전에는 null
  };

  /* ---------- 주소 (?tab=…&page=…) ---------- */
  function writeUrl() {
    var p = new URLSearchParams(window.location.search);
    p.set('tab', state.tab);
    if (state.page > 1) p.set('page', String(state.page));
    else p.delete('page');
    try {
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    } catch (e) { /* 주소를 못 바꿔도 화면은 그대로 동작 */ }
  }

  /* ---------- 그리기 ---------- */
  function renderTabs() {
    var label = LABEL[state.tab];
    for (var i = 0; i < tabBtns.length; i++) {
      tabBtns[i].setAttribute('aria-pressed', tabBtns[i].getAttribute('data-tab') === state.tab ? 'true' : 'false');
    }
    crumb.textContent = label;
    caption.textContent = label + ' 목록';
    document.title = label + ' | 알림마당 | ' + SITE;
  }

  function formatNumber(n) {
    var v = Number(n) || 0;
    try { return v.toLocaleString('ko-KR'); } catch (e) { return String(v); }
  }

  function rowHTML(r) {
    var it = r.item;
    var badges = (it.isNew ? '<span class="badge badge--new">NEW</span>' : '') +
      (it.isHot ? '<span class="badge badge--hot">HOT</span>' : '');
    return '<tr>' +
      '<td class="notice-table__no">' + r.no + '</td>' +
      '<td class="notice-table__title"><a class="notice-table__link" href="notice-view.html?id=' + esc(encodeURIComponent(it.id)) + '">' +
        badges + '<span>' + esc(it.title) + '</span></a></td>' +
      '<td class="notice-table__dept">' + esc(it.author) + '</td>' +
      '<td class="notice-table__date">' + esc(it.date) + '</td>' +
      '<td class="notice-table__views">' + esc(formatNumber(it.views)) + '</td>' +
      '</tr>';
  }

  function pageBtn(page, label, icon, disabled) {
    return '<button type="button" class="pager__btn" aria-label="' + label + '"' +
      (disabled ? ' disabled' : ' data-page="' + page + '"') + '>' + icon + '</button>';
  }

  function renderPager(pages, total) {
    if (!total) {
      pager.hidden = true;
      pager.innerHTML = '';
      return;
    }
    var cur = state.page;
    // 번호는 최대 5개까지: 지금 쪽을 가운데에 두고 앞뒤로
    var first = Math.max(1, Math.min(cur - 2, pages - 4));
    var last = Math.min(pages, first + 4);
    var html = pageBtn(cur - 1, '이전 페이지', ICON_PREV, cur <= 1);
    for (var p = first; p <= last; p++) {
      html += '<button type="button" class="pager__btn" data-page="' + p + '" aria-label="' + p + '페이지"' +
        (p === cur ? ' aria-current="page"' : '') + '>' + p + '</button>';
    }
    html += pageBtn(cur + 1, '다음 페이지', ICON_NEXT, cur >= pages);
    pager.innerHTML = html;
    pager.hidden = false;
  }

  function renderList() {
    if (!state.items) return;
    var all = board.byCategory(state.items, state.tab);
    var q = input.value.trim().toLowerCase();
    var rows = [];
    for (var i = 0; i < all.length; i++) {
      if (!q || all[i].title.toLowerCase().indexOf(q) !== -1) rows.push({ no: all.length - i, item: all[i] });
    }

    var pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PER_PAGE;

    tbody.innerHTML = rows.slice(start, start + PER_PAGE).map(rowHTML).join('');
    countEl.textContent = String(rows.length);

    if (rows.length) {
      emptyEl.hidden = true;
      emptyEl.textContent = '';
    } else {
      emptyEl.textContent = q ? '검색 결과가 없습니다. 다른 검색어를 입력해 주세요.' : '등록된 게시글이 없습니다.';
      emptyEl.hidden = false;
    }
    renderPager(pages, rows.length);
  }

  /* ---------- 동작 ---------- */
  for (var i = 0; i < tabBtns.length; i++) {
    tabBtns[i].addEventListener('click', function () {
      var tab = this.getAttribute('data-tab');
      if (tab !== 'notice' && tab !== 'news') return;
      state.tab = tab;
      state.page = 1;
      renderTabs();
      renderList();
      writeUrl();
    });
  }

  var lastQuery = input.value.trim().toLowerCase();
  function onSearch() {
    var q = input.value.trim().toLowerCase();
    if (q === lastQuery) return; // Enter 등으로 같은 검색어가 다시 들어오면 쪽을 그대로 둠
    lastQuery = q;
    var before = state.page;
    state.page = 1;
    renderList();
    if (before !== 1) writeUrl();
  }
  input.addEventListener('input', onSearch);
  input.addEventListener('search', onSearch);

  pager.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-page]') : null;
    if (!btn || btn.disabled) return;
    var page = parseInt(btn.getAttribute('data-page'), 10);
    if (!page || page === state.page) return;
    state.page = page;
    renderList();
    writeUrl();
    // 새 쪽의 맨 위(표)로 초점과 화면을 옮김
    try { table.focus({ preventScroll: true }); } catch (err) { table.focus(); }
    if (root.getBoundingClientRect().top < 0) {
      var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      root.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    }
  });

  /* ---------- 시작 ---------- */
  renderTabs();

  if (!board) {
    emptyEl.textContent = '게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    return;
  }
  board.load().then(function (res) {
    state.items = (res && res.items) || [];
    var asked = state.page;
    root.classList.remove('is-loading');
    renderList();
    if (asked !== state.page) writeUrl(); // 없는 쪽 번호로 들어오면 마지막 쪽으로 맞춤
  });
})();
