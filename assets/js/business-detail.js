/* ==========================================================================
   사업별 안내 (business-detail.html)
   - 7개 사업을 한 화면에서 바꿔 보여줌. 사업별 문구는 HTML의 [data-biz="번호"] 블록에 있음
   - business-detail.html?id=1~7 로 해당 사업을 열고, 바꾸면 주소의 id도 바꿈(history.replaceState)
   - 이전/다음 버튼은 1 ↔ 7 사이를 돌아감 (7 다음은 1, 1 이전은 7)
   ========================================================================== */
(function () {
  'use strict';

  var card = document.getElementById('bd-card');
  var tabs = document.querySelectorAll('.bd-tab[data-id]');
  if (!card || !tabs.length) return;

  var total = tabs.length;
  var blocks = card.querySelectorAll('[data-biz]');
  var prevBtn = card.querySelector('[data-step="-1"]');
  var nextBtn = card.querySelector('[data-step="1"]');
  var status = document.getElementById('bd-status');
  var baseTitle = document.title; // "사업별 안내 | (사)한국중장년고용협회"
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var current = 1;

  // 0 → 7, 8 → 1
  function wrap(n) { return (((n - 1) % total) + total) % total + 1; }

  function tabOf(n) { return tabs[n - 1]; }
  function numberOf(n) { return tabOf(n).querySelector('.bd-tab__no').textContent; }
  function nameOf(n) {
    var h = card.querySelector('[data-biz="' + n + '"] .bd-name');
    return h ? h.textContent : '';
  }
  // 이전/다음 버튼 글자 "07 인증 및 자격": 탭의 번호와 이름(줄바꿈 표시 포함)을 그대로 씀
  function labelHTML(n) {
    return numberOf(n) + '&nbsp;' + tabOf(n).querySelector('.bd-tab__name').innerHTML;
  }

  function show(n, byUser) {
    current = wrap(n);
    var id = String(current);
    var i;
    for (i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute('aria-pressed', tabs[i].getAttribute('data-id') === id ? 'true' : 'false');
    }
    for (i = 0; i < blocks.length; i++) {
      blocks[i].hidden = blocks[i].getAttribute('data-biz') !== id;
    }
    if (prevBtn) prevBtn.querySelector('.bd-pager__label').innerHTML = labelHTML(wrap(current - 1));
    if (nextBtn) nextBtn.querySelector('.bd-pager__label').innerHTML = labelHTML(wrap(current + 1));
    document.title = nameOf(current) + ' · ' + baseTitle;

    if (byUser) {
      if (window.history && window.history.replaceState) {
        try { window.history.replaceState(window.history.state, '', '?id=' + id); } catch (e) { /* 주소를 못 바꾸는 환경이면 화면만 바꿈 */ }
      }
      // 화면 읽기 프로그램에 바뀐 사업을 알림
      if (status) status.textContent = '사업 ' + numberOf(current) + ' ' + nameOf(current);
    }
  }

  function idFromAddress() {
    var m = /[?&]id=(\d+)/.exec(window.location.search);
    var n = m ? parseInt(m[1], 10) : 1;
    return n >= 1 && n <= total ? n : 1;
  }

  // 이전/다음으로 바꿨을 때 글 머리가 화면 위로 지나가 있으면 다시 보이게 올림
  function revealCard() {
    if (card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function () {
      show(parseInt(this.getAttribute('data-id'), 10), true);
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1, true); revealCard(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1, true); revealCard(); });

  show(idFromAddress(), false);
})();
