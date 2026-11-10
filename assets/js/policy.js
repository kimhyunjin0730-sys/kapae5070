/* ==========================================================================
   개인정보처리방침 · 이용약관 (policy.html)
   - policy.html#privacy / policy.html#terms 로 해당 문서를 열고, 바꾸면 주소의 # 도 바꿈
   - 이 페이지에 있는 동안 푸터 등의 '개인정보처리방침' '이용약관' 링크를 눌러도 바로 바뀜
   - 페이지 안에 id="privacy" / id="terms" 요소를 두지 않아 주소의 # 때문에 화면이 저절로 내려가지 않음
   ========================================================================== */
(function () {
  'use strict';

  var LABEL = { privacy: '개인정보처리방침', terms: '이용약관' };
  var SITE = ' | (사)한국중장년고용협회';
  var buttons = document.querySelectorAll('[data-pol-tab]');
  var sections = { privacy: document.getElementById('pol-privacy'), terms: document.getElementById('pol-terms') };
  var crumb = document.querySelector('[data-pol-crumb]');
  var tabsBox = document.querySelector('.pol-tabs');
  if (!buttons.length || !sections.privacy || !sections.terms) return;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function keyFromHash(hash) {
    var k = String(hash || '').replace(/^#/, '');
    return Object.prototype.hasOwnProperty.call(LABEL, k) ? k : null;
  }

  function show(key) {
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-pol-tab') === key ? 'true' : 'false');
    }
    sections.privacy.hidden = key !== 'privacy';
    sections.terms.hidden = key !== 'terms';
    if (crumb) crumb.textContent = LABEL[key];
    document.title = LABEL[key] + SITE;
  }

  // 주소의 # 만 바꿈 (기록을 늘리지 않고, 화면도 움직이지 않음)
  function setHash(key) {
    if (window.history && window.history.replaceState) {
      try { window.history.replaceState(window.history.state, '', '#' + key); } catch (e) { /* 주소를 못 바꾸는 환경이면 화면만 바꿈 */ }
    }
  }

  // 페이지의 다른 곳(푸터 등)에서 바꿨을 때: 문서 선택 버튼이 보이게 올리고 문서 제목으로 초점을 옮김
  function reveal(key) {
    var heading = sections[key].querySelector('h2');
    if (heading) {
      try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); }
    }
    if (tabsBox) tabsBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () {
      var key = this.getAttribute('data-pol-tab');
      show(key);
      setHash(key);
    });
  }

  // 이 페이지로 오는 링크(policy.html#terms 등)는 새로 읽지 않고 바로 바꿈 (같은 # 을 다시 눌러도 동작)
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self')) return;
    if (a.pathname !== window.location.pathname || a.search !== window.location.search) return;
    var key = keyFromHash(a.hash);
    if (!key) return;
    e.preventDefault();
    show(key);
    setHash(key);
    reveal(key);
  });

  // 주소창에서 # 을 직접 바꾼 경우
  window.addEventListener('hashchange', function () {
    var key = keyFromHash(window.location.hash);
    if (key) { show(key); reveal(key); }
  });

  show(keyFromHash(window.location.hash) || 'privacy');
})();
