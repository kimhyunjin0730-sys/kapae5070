/* ==========================================================================
   알림마당 게시글 보기 (notice-view.html?id=글번호)
   - 데이터: KAPAE_BOARD.load() → KAPAE_BOARD.find(items, id)
   - 제목·작성 부서·날짜 등 글자는 모두 KAPAE.esc()로 넣고, 본문(content)만 HTML로 넣음
     (본문은 관리자만 쓸 수 있음)
   - 이전 글 = 같은 게시판에서 바로 아래(더 오래된) 글, 다음 글 = 바로 위(더 새로운) 글
   ========================================================================== */
(function () {
  'use strict';

  var SITE = '(사)한국중장년고용협회';
  var TAB = { '공지사항': 'notice', '협회소식': 'news' };
  var LABEL = { notice: '공지사항', news: '협회 소식' };

  var esc = (window.KAPAE && window.KAPAE.esc) || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var board = window.KAPAE_BOARD;

  var root = document.getElementById('post-root');
  if (!root) return;

  function svg(path, size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }
  var ICON = {
    up: '<path d="M6 15l6-6 6 6"></path>',
    down: '<path d="M6 9l6 6 6-6"></path>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"></path>'
  };

  function formatNumber(n) {
    var v = Number(n) || 0;
    try { return v.toLocaleString('ko-KR'); } catch (e) { return String(v); }
  }

  // 본문 소제목은 디자인처럼 앞의 '■ ' 표시 없이 보여줌 (저장된 원문은 그대로)
  function tidyContent(box) {
    var heads = box.querySelectorAll('.nc-section h4');
    for (var i = 0; i < heads.length; i++) {
      var t = heads[i].firstChild;
      if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(/^\s*■\s*/, '');
    }
  }

  function navRow(label, icon, item, noneText) {
    return '<div class="post-nav__row">' +
      '<span class="post-nav__label" aria-hidden="true">' + svg(icon, 16) + label + '</span>' +
      (item
        ? '<a class="post-nav__link" href="notice-view.html?id=' + esc(encodeURIComponent(item.id)) + '"><span class="sr-only">' + label + ': </span>' + esc(item.title) + '</a>' +
          '<span class="post-nav__date">' + esc(item.date) + '</span>'
        : '<span class="post-nav__none">' + noneText + '</span>') +
      '</div>';
  }

  function renderPost(item, items) {
    var tab = TAB[item.category] || 'notice';
    var label = LABEL[tab];
    var list = board.byCategory(items, tab);
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === item.id) { idx = i; break; }
    var older = idx >= 0 ? list[idx + 1] || null : null;
    var newer = idx > 0 ? list[idx - 1] : null;

    var badges = (item.isNew ? '<span class="badge badge--new">NEW</span>' : '') +
      (item.isHot ? '<span class="badge badge--hot">HOT</span>' : '');

    root.innerHTML =
      '<article class="post" aria-labelledby="post-title">' +
        '<header class="post__head">' +
          '<p class="post__tags"><span class="chip post__cat">' + esc(label) + '</span>' + badges + '</p>' +
          '<h1 class="post__title" id="post-title">' + esc(item.title) + '</h1>' +
          '<dl class="post__meta">' +
            '<div><dt>작성 부서</dt><dd>' + esc(item.author) + '</dd></div>' +
            '<div><dt>등록일</dt><dd class="nowrap">' + esc(item.date) + '</dd></div>' +
            '<div><dt>조회</dt><dd class="nowrap">' + esc(formatNumber(item.views)) + '</dd></div>' +
          '</dl>' +
        '</header>' +
        '<div class="post-body" id="post-body"></div>' +
      '</article>' +
      '<nav class="post-nav" aria-label="이전 글과 다음 글">' +
        navRow('이전 글', ICON.up, older, '이전 글이 없습니다') +
        navRow('다음 글', ICON.down, newer, '다음 글이 없습니다') +
      '</nav>' +
      '<div class="post-actions">' +
        '<a class="btn btn--primary btn--lg" href="notice.html?tab=' + tab + '">' + svg(ICON.list, 20) + '목록</a>' +
      '</div>';

    var body = document.getElementById('post-body');
    body.innerHTML = item.content; // 관리자가 작성한 본문 HTML
    tidyContent(body);

    // 위치 표시: 빵부스러기 3단계와 왼쪽 메뉴
    document.getElementById('post-crumb').textContent = label;
    document.getElementById('post-crumb-sep').hidden = false;
    document.getElementById('post-crumb-item').hidden = false;
    var side = document.querySelector('.side-nav__link[data-side="' + tab + '"]');
    if (side) side.setAttribute('aria-current', 'true');

    document.title = item.title + ' | 알림마당 | ' + SITE;
  }

  function renderMissing(loadFailed) {
    root.innerHTML =
      '<section class="post-missing" aria-labelledby="post-missing-title">' +
        '<h1 class="post-missing__title" id="post-missing-title">글을 찾을 수 없습니다</h1>' +
        '<p class="post-missing__text">' +
          (loadFailed
            ? '지금은 게시글을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.'
            : '삭제되었거나 주소가 잘못된 글일 수 있습니다.') +
        '</p>' +
        '<a class="btn btn--primary btn--lg" href="notice.html">' + svg(ICON.list, 20) + '알림마당 목록으로</a>' +
      '</section>';
    document.title = '글을 찾을 수 없습니다 | 알림마당 | ' + SITE;
  }

  var id = new URLSearchParams(window.location.search).get('id');

  if (!board) {
    renderMissing(true);
    return;
  }
  board.load().then(function (res) {
    var items = (res && res.items) || [];
    var item = id ? board.find(items, id) : null;
    if (item) renderPost(item, items);
    // 서버에 연결하지 못해 기본 글만 있는 상태라면 '못 불러옴'으로 안내
    else renderMissing(!!(res && res.fromFallback) && !!id);
  });
})();
