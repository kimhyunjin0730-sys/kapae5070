/* ==========================================================================
   관리자 화면 (admin.html)
   - 로그인: POST /api/admin/login {id, password} → 토큰을 sessionStorage['kapae_adm_token']에 보관
   - 게시글: GET /api/notices?all=1(비공개 글 포함) · POST /api/notices
             PATCH /api/notices/:id · DELETE /api/notices/:id  (모두 Authorization: Bearer 토큰)
   - 401이면 로그인이 풀린 것으로 보고 로그인 화면으로. 글을 저장하다 풀렸으면 쓰던 내용은 남겨 둠
   - 오류는 서버가 준 error 문구를 그대로 보여줌
   - 삭제는 확인 대화상자 대신 그 글 바로 아래에 확인 줄을 펼침
   ========================================================================== */
(function () {
  'use strict';

  var TOKEN_KEY = 'kapae_adm_token';
  var LABEL = { notice: '공지사항', news: '협회소식' };
  var DEFAULT_AUTHOR = '운영사무국'; // 새 글의 작성 부서 기본값 (예전 관리자 화면과 같음)
  var SNIPPETS = { // '|' 자리에 커서(선택한 글자가 있으면 그 글자)가 들어감
    p: '<p>|</p>',
    section: '<div class="nc-section"><h4>■ |</h4><ul><li></li></ul></div>',
    note: '<div class="nc-note">|</div>'
  };

  var esc = (window.KAPAE && window.KAPAE.esc) || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var board = window.KAPAE_BOARD;
  function $(id) { return document.getElementById(id); }

  var el = {
    login: $('adm-login'), loginForm: $('adm-login-form'), loginId: $('adm-id'), loginPw: $('adm-pw'),
    loginBtn: $('adm-login-btn'), loginMsg: $('adm-login-msg'),
    app: $('adm-app'), appTitle: $('adm-app-title'), newBtn: $('adm-new'), logoutBtn: $('adm-logout'), msg: $('adm-msg'),
    list: $('adm-list'), tabs: document.querySelectorAll('[data-adm-tab]'), caption: $('adm-caption'),
    rows: $('adm-rows'), empty: $('adm-empty'),
    editor: $('adm-editor'), editorTitle: $('adm-editor-title'), form: $('adm-form'),
    cat: $('adm-cat'), date: $('adm-date'), title: $('adm-title'), titleErr: $('adm-title-err'), author: $('adm-author'),
    active: $('adm-active'), isNew: $('adm-isnew'), isHot: $('adm-ishot'),
    content: $('adm-content'), contentErr: $('adm-content-err'), preview: $('adm-preview'),
    formMsg: $('adm-form-msg'), save: $('adm-save'), cancel: $('adm-cancel')
  };
  if (!el.login || !el.app) return;

  var memToken = ''; // 저장소를 쓸 수 없는 브라우저용
  var state = {
    rows: [],
    tab: 'notice',
    loading: false,
    loaded: false,
    editingId: null,     // null이면 새 글
    pendingDelete: null, // 삭제 확인 줄을 펼친 글 id
    deleting: false,
    saving: false,
    loggingIn: false,
    dirty: false,        // 편집 중 저장하지 않은 변경이 있음
    armed: '',           // 저장하지 않은 내용이 있을 때 한 번 더 눌러야 하는 동작 ('cancel' | 'logout')
    armedBox: null,
    returnFocus: null
  };

  /* ---------- 토큰 ---------- */
  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || memToken; } catch (e) { return memToken; }
  }
  function setToken(token) {
    memToken = token || '';
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* 저장소 차단 시 메모리에만 둠 */ }
  }
  // 만료 시각만 미리 확인 (진짜 검증은 서버가 함)
  function tokenAlive(token) {
    if (!token) return false;
    try {
      var b64 = String(token).split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var payload = JSON.parse(atob(b64));
      return typeof payload.exp === 'number' && Date.now() < payload.exp;
    } catch (e) { return false; }
  }

  /* ---------- 서버 요청 ---------- */
  function readJson(r) {
    return r.json()
      .catch(function () { return null; })
      .then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
  }

  function api(method, url, body) {
    var headers = { Accept: 'application/json' };
    var token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    return fetch(url, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      credentials: 'same-origin'
    }).then(readJson, function () {
      var err = new Error('서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
      err.status = 0;
      throw err;
    }).then(function (res) {
      if (res.ok) return res.data;
      var msg = res.data && typeof res.data.error === 'string' && res.data.error;
      var err = new Error(msg || (res.status === 401 ? '관리자 로그인이 필요합니다.' : '요청을 처리하지 못했습니다. (오류 코드 ' + res.status + ')'));
      err.status = res.status;
      throw err;
    });
  }

  /* ---------- 알림 문구 ---------- */
  function setMsg(box, type, text) {
    box.innerHTML = text ? '<p class="form-msg form-msg--' + (type === 'ok' ? 'ok' : 'error') + '">' + esc(text) + '</p>' : '';
  }
  function showFieldError(input, errEl, msg) {
    errEl.textContent = msg;
    errEl.hidden = !msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /* ---------- 화면 전환 ---------- */
  function showLogin(message, type) {
    el.app.hidden = true;
    el.login.hidden = false;
    setMsg(el.loginMsg, type || 'error', message || '');
  }

  function enterApp(afterLogin) {
    el.login.hidden = true;
    el.app.hidden = false;
    setMsg(el.loginMsg, '', '');
    loadList();
    if (!el.editor.hidden) {
      // 저장하다 로그인이 풀렸던 경우: 쓰던 글을 그대로 이어서 저장할 수 있게
      setMsg(el.formMsg, 'ok', '다시 로그인했습니다. 내용을 확인한 뒤 저장 버튼을 눌러 주세요.');
      el.editorTitle.focus();
    } else if (afterLogin) {
      el.appTitle.focus();
    }
  }

  function logout(message, type, keepDraft) {
    setToken('');
    state.pendingDelete = null;
    disarm();
    if (!keepDraft) {
      closeEditor(true);
      state.rows = [];
      state.loaded = false;
      el.rows.innerHTML = '';
      setMsg(el.msg, '', '');
    }
    el.loginPw.value = '';
    showLogin(message, type);
    el.loginId.focus();
  }

  function handleError(err, box, keepDraft) {
    if (err && err.status === 401) {
      logout(keepDraft
        ? '로그인이 만료되었습니다. 다시 로그인하면 작성 중인 내용을 이어서 저장할 수 있습니다.'
        : '로그인이 만료되었습니다. 다시 로그인해 주세요.', 'error', keepDraft);
      return;
    }
    setMsg(box || el.msg, 'error', (err && err.message) || '요청을 처리하지 못했습니다.');
  }

  /* ---------- 목록 ---------- */
  function isOn(v) { return v === true || v === 1 || v === '1'; }
  function tabOf(row) { return row && row.category === '협회소식' ? 'news' : 'notice'; }
  function findRow(id) {
    for (var i = 0; i < state.rows.length; i++) if (String(state.rows[i].id) === String(id)) return state.rows[i];
    return null;
  }
  // DB 날짜는 서버 시간대에 따라 하루 밀려 보일 수 있어 board.js와 같은 방식(한국 시간)으로 맞춤
  function dateText(raw) {
    if (board && board.formatDate) return board.formatDate(raw);
    return String(raw || '').slice(0, 10).replace(/-/g, '.');
  }
  function dateInputValue(raw) { return dateText(raw).replace(/\./g, '-'); }
  function todayValue() { return dateInputValue(new Date().toISOString()); }

  function flagCell(on, text, cls) {
    return on
      ? '<span class="badge ' + cls + '">' + text + '</span>'
      : '<span aria-hidden="true">–</span><span class="sr-only">표시 안 함</span>';
  }

  function rowHTML(r) {
    var id = String(r.id);
    var active = isOn(r.is_active);
    var title = esc(r.title || '(제목 없음)');
    var pending = state.pendingDelete === id;
    var titleCell = active
      ? '<a href="notice-view.html?id=' + esc(encodeURIComponent(id)) + '" target="_blank" rel="noopener" title="새 창 열림">' + title + '</a>'
      : title;
    var html = '<tr' + (pending ? ' class="adm-row--pending"' : '') + '>' +
      '<td class="adm-table__title">' + titleCell + '</td>' +
      '<td class="adm-c">' + esc(r.category || '') + '</td>' +
      '<td class="adm-c">' + esc(dateText(r.published_at)) + '</td>' +
      '<td class="adm-c">' + (active ? '<span class="adm-state adm-state--on">공개</span>' : '<span class="adm-state adm-state--off">비공개</span>') + '</td>' +
      '<td class="adm-c">' + flagCell(isOn(r.is_new), 'NEW', 'badge--new') + '</td>' +
      '<td class="adm-c">' + flagCell(isOn(r.is_hot), 'HOT', 'badge--hot') + '</td>' +
      '<td class="adm-c adm-table__act">' +
        '<button type="button" class="btn btn--line btn--sm" data-edit="' + esc(id) + '">수정<span class="sr-only">: ' + title + '</span></button>' +
        '<button type="button" class="btn btn--line btn--sm" data-del="' + esc(id) + '" aria-expanded="' + (pending ? 'true' : 'false') + '">삭제<span class="sr-only">: ' + title + '</span></button>' +
      '</td>' +
      '</tr>';
    if (pending) {
      html += '<tr class="adm-confirm-row"><td colspan="7">' +
        '<div class="adm-confirm" id="adm-confirm" tabindex="-1" role="group" aria-labelledby="adm-confirm-text">' +
          '<p class="adm-confirm__text" id="adm-confirm-text">‘' + title + '’ 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.</p>' +
          '<div class="adm-confirm__actions">' +
            '<button type="button" class="btn btn--sm adm-btn-danger" data-confirm-del="' + esc(id) + '">삭제하기</button>' +
            '<button type="button" class="btn btn--line btn--sm" data-cancel-del>취소</button>' +
          '</div>' +
        '</div>' +
        '</td></tr>';
    }
    return html;
  }

  function renderList() {
    var counts = { notice: 0, news: 0 };
    for (var i = 0; i < state.rows.length; i++) counts[tabOf(state.rows[i])]++;
    for (var j = 0; j < el.tabs.length; j++) {
      var t = el.tabs[j].getAttribute('data-adm-tab');
      el.tabs[j].setAttribute('aria-pressed', t === state.tab ? 'true' : 'false');
      var c = el.tabs[j].querySelector('[data-count]');
      if (c) c.textContent = state.loaded ? '(' + counts[t] + ')' : '';
    }
    el.caption.textContent = LABEL[state.tab] + ' 게시글 목록';

    if (!state.loaded) {
      el.rows.innerHTML = '';
      el.empty.textContent = state.loading ? '게시글을 불러오는 중입니다.' : '게시글을 불러오지 못했습니다.';
      el.empty.hidden = false;
      return;
    }
    var list = state.rows.filter(function (r) { return tabOf(r) === state.tab; });
    el.rows.innerHTML = list.map(rowHTML).join('');
    if (list.length) {
      el.empty.hidden = true;
      el.empty.textContent = '';
    } else {
      el.empty.textContent = '등록된 글이 없습니다.';
      el.empty.hidden = false;
    }
  }

  function loadList() {
    state.loading = true;
    renderList();
    return api('GET', '/api/notices?all=1').then(function (rows) {
      state.rows = Array.isArray(rows) ? rows : [];
      state.loading = false;
      state.loaded = true;
      if (state.pendingDelete && !findRow(state.pendingDelete)) state.pendingDelete = null;
      renderList();
    }, function (err) {
      state.loading = false;
      renderList();
      handleError(err, el.msg);
    });
  }

  function focusRowButton(attr, id) {
    if (id == null) return false;
    var btns = el.rows.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute(attr) === String(id)) { btns[i].focus(); return true; }
    }
    return false;
  }
  function focusCurrentTab() {
    for (var i = 0; i < el.tabs.length; i++) {
      if (el.tabs[i].getAttribute('aria-pressed') === 'true') { el.tabs[i].focus(); return; }
    }
  }

  /* ---------- 삭제 (화면 안 확인 줄) ---------- */
  function askDelete(id) {
    state.pendingDelete = id;
    setMsg(el.msg, '', '');
    renderList();
    var box = $('adm-confirm');
    if (box) box.focus();
  }
  function cancelDelete() {
    var id = state.pendingDelete;
    state.pendingDelete = null;
    renderList();
    focusRowButton('data-del', id);
  }
  function doDelete(id, btn) {
    if (state.deleting) return;
    state.deleting = true;
    btn.disabled = true;
    api('DELETE', '/api/notices/' + encodeURIComponent(id)).then(function () {
      state.deleting = false;
      state.pendingDelete = null;
      state.rows = state.rows.filter(function (r) { return String(r.id) !== String(id); });
      renderList();
      setMsg(el.msg, 'ok', '글을 삭제했습니다.');
      focusCurrentTab();
      loadList();
    }, function (err) {
      state.deleting = false;
      btn.disabled = false;
      handleError(err, el.msg);
    });
  }

  for (var t = 0; t < el.tabs.length; t++) {
    el.tabs[t].addEventListener('click', function () {
      state.tab = this.getAttribute('data-adm-tab') === 'news' ? 'news' : 'notice';
      state.pendingDelete = null;
      renderList();
    });
  }

  el.rows.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-edit')) {
      var row = findRow(b.getAttribute('data-edit'));
      if (row) openEditor(row, b);
    } else if (b.hasAttribute('data-del')) {
      var id = b.getAttribute('data-del');
      if (state.pendingDelete === id) cancelDelete();
      else askDelete(id);
    } else if (b.hasAttribute('data-confirm-del')) {
      doDelete(b.getAttribute('data-confirm-del'), b);
    } else if (b.hasAttribute('data-cancel-del')) {
      cancelDelete();
    }
  });
  el.rows.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && state.pendingDelete && !state.deleting) {
      e.preventDefault();
      cancelDelete();
    }
  });

  /* ---------- 글쓰기·수정 ---------- */
  // 게시글 보기 화면과 같게: 본문 소제목 앞의 '■ ' 표시는 빼고 보여줌
  function tidyContent(box) {
    var heads = box.querySelectorAll('.nc-section h4');
    for (var i = 0; i < heads.length; i++) {
      var n = heads[i].firstChild;
      if (n && n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/^\s*■\s*/, '');
    }
  }

  function updatePreview() {
    var html = el.content.value;
    if (html.trim()) {
      el.preview.innerHTML = html; // 관리자가 입력한 HTML을 실제 화면처럼 보여줌
      tidyContent(el.preview);
    } else {
      el.preview.innerHTML = '<p class="adm-preview__empty">본문을 입력하면 이곳에 게시글 보기 화면과 같은 모양으로 보입니다.</p>';
    }
  }

  function disarm() {
    if (state.armed && state.armedBox) setMsg(state.armedBox, '', '');
    state.armed = '';
    state.armedBox = null;
  }
  // 저장하지 않은 내용이 있으면 첫 번째 누름에는 안내만 하고, 한 번 더 누르면 진행
  function confirmDiscard(action, box, text) {
    if (el.editor.hidden || !state.dirty || state.armed === action) return true;
    disarm();
    state.armed = action;
    state.armedBox = box;
    setMsg(box, 'error', '저장하지 않은 내용이 있습니다. ' + text);
    return false;
  }

  function openEditor(row, opener) {
    state.editingId = row ? String(row.id) : null;
    state.pendingDelete = null;
    state.returnFocus = opener || el.newBtn;
    disarm();
    el.editorTitle.textContent = row ? '글 수정' : '새 글 쓰기';
    el.save.textContent = row ? '수정 내용 저장' : '등록하기';
    el.cat.value = (row ? tabOf(row) : state.tab) === 'news' ? '협회소식' : '공지사항';
    el.date.value = row ? dateInputValue(row.published_at) : todayValue();
    el.title.value = row ? String(row.title || '') : '';
    el.author.value = row ? String(row.author || '') : DEFAULT_AUTHOR;
    el.active.checked = row ? isOn(row.is_active) : true;
    el.isNew.checked = row ? isOn(row.is_new) : false;
    el.isHot.checked = row ? isOn(row.is_hot) : false;
    el.content.value = row ? String(row.content || '') : '';
    showFieldError(el.title, el.titleErr, '');
    showFieldError(el.content, el.contentErr, '');
    setMsg(el.formMsg, '', '');
    setMsg(el.msg, '', '');
    updatePreview();
    state.dirty = false;
    el.list.hidden = true;
    el.newBtn.hidden = true;
    el.editor.hidden = false;
    el.editorTitle.focus();
  }

  function closeEditor(silent) {
    state.editingId = null;
    state.dirty = false;
    disarm();
    el.editor.hidden = true;
    el.list.hidden = false;
    el.newBtn.hidden = false;
    setMsg(el.formMsg, '', '');
    renderList();
    if (!silent) {
      var f = state.returnFocus;
      if (f && document.body.contains(f)) f.focus();
      else el.newBtn.focus();
    }
  }

  function insertSnippet(key) {
    var tpl = SNIPPETS[key];
    if (!tpl) return;
    var ta = el.content;
    var start = typeof ta.selectionStart === 'number' ? ta.selectionStart : ta.value.length;
    var end = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : start;
    var parts = tpl.split('|');
    var picked = ta.value.slice(start, end);
    ta.value = ta.value.slice(0, start) + parts[0] + picked + parts[1] + ta.value.slice(end);
    var caret = start + parts[0].length + picked.length;
    ta.focus();
    try { ta.setSelectionRange(caret, caret); } catch (e) { /* 일부 브라우저 */ }
    state.dirty = true;
    disarm();
    if (ta.getAttribute('aria-invalid') === 'true') showFieldError(ta, el.contentErr, '');
    updatePreview();
  }

  el.editor.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-snippet]') : null;
    if (b) insertSnippet(b.getAttribute('data-snippet'));
  });

  el.form.addEventListener('input', function (e) {
    state.dirty = true;
    disarm();
    if (e.target === el.content) updatePreview();
    if (e.target === el.title && el.title.getAttribute('aria-invalid') === 'true') {
      showFieldError(el.title, el.titleErr, el.title.value.trim() ? '' : '제목을 입력해 주세요.');
    }
    if (e.target === el.content && el.content.getAttribute('aria-invalid') === 'true') {
      showFieldError(el.content, el.contentErr, el.content.value.trim() ? '' : '본문을 입력해 주세요.');
    }
  });
  el.form.addEventListener('change', function () {
    state.dirty = true;
    disarm();
  });

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.saving) return;
    var title = el.title.value.trim();
    var content = el.content.value.trim();
    showFieldError(el.title, el.titleErr, title ? '' : '제목을 입력해 주세요.');
    showFieldError(el.content, el.contentErr, content ? '' : '본문을 입력해 주세요.');
    if (!title) { el.title.focus(); return; }
    if (!content) { el.content.focus(); return; }

    var payload = {
      title: title,
      category: el.cat.value === '협회소식' ? '협회소식' : '공지사항',
      content: content,
      author: el.author.value.trim(),
      published_at: el.date.value || todayValue(),
      is_active: el.active.checked,
      is_new: el.isNew.checked,
      is_hot: el.isHot.checked
    };
    var id = state.editingId;
    state.saving = true;
    el.save.disabled = true;
    disarm();
    setMsg(el.formMsg, '', '');

    var request = id
      ? api('PATCH', '/api/notices/' + encodeURIComponent(id), payload)
      : api('POST', '/api/notices', payload);
    request.then(function (res) {
      state.saving = false;
      el.save.disabled = false;
      var savedId = id || (Array.isArray(res) && res[0] && res[0].id != null ? String(res[0].id) : null);
      state.tab = payload.category === '협회소식' ? 'news' : 'notice';
      closeEditor(true);
      setMsg(el.msg, 'ok', id ? '수정한 내용을 저장했습니다.' : '새 글을 등록했습니다.');
      return loadList().then(function () {
        if (!focusRowButton('data-edit', savedId)) el.newBtn.focus();
      });
    }, function (err) {
      state.saving = false;
      el.save.disabled = false;
      handleError(err, el.formMsg, true);
    });
  });

  el.cancel.addEventListener('click', function () {
    if (!confirmDiscard('cancel', el.formMsg, '작성한 내용을 버리고 닫으려면 ‘취소’를 한 번 더 눌러 주세요.')) return;
    closeEditor(false);
  });

  el.newBtn.addEventListener('click', function () { openEditor(null, el.newBtn); });

  el.logoutBtn.addEventListener('click', function () {
    if (!confirmDiscard('logout', el.msg, '작성한 내용을 버리고 로그아웃하려면 ‘로그아웃’을 한 번 더 눌러 주세요.')) return;
    logout('로그아웃했습니다.', 'ok', false);
  });

  // 쓰던 글이 있는데 페이지를 떠나려 하면 브라우저가 한 번 묻게 함
  window.addEventListener('beforeunload', function (e) {
    if (state.dirty && !el.editor.hidden) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ---------- 로그인 ---------- */
  function loginFailed(msg) {
    setMsg(el.loginMsg, 'error', msg);
    el.loginPw.value = '';
    el.loginPw.focus();
  }

  el.loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.loggingIn) return;
    var id = el.loginId.value.trim();
    var pw = el.loginPw.value;
    if (!id || !pw) {
      setMsg(el.loginMsg, 'error', '아이디와 비밀번호를 모두 입력해 주세요.');
      (id ? el.loginPw : el.loginId).focus();
      return;
    }
    state.loggingIn = true;
    el.loginBtn.disabled = true;
    setMsg(el.loginMsg, '', '');

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: id, password: pw }),
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(readJson)
      .then(function (res) {
        if (res.ok && res.data && typeof res.data.token === 'string' && res.data.token) {
          setToken(res.data.token);
          el.loginPw.value = '';
          enterApp(true);
          return;
        }
        var msg = res.data && typeof res.data.error === 'string' && res.data.error;
        if (!msg) {
          if (res.status === 401) msg = '아이디 또는 비밀번호가 올바르지 않습니다.';
          else if (res.status === 429) msg = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
          else if (res.status === 503) msg = '서버에 관리자 계정이 설정되지 않았습니다.';
          else msg = '로그인하지 못했습니다. (오류 코드 ' + res.status + ')';
        }
        loginFailed(msg);
      }, function () {
        loginFailed('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      })
      .then(function () {
        state.loggingIn = false;
        el.loginBtn.disabled = false;
      });
  });

  /* ---------- 시작 ---------- */
  var saved = getToken();
  if (tokenAlive(saved)) {
    enterApp(false);
  } else {
    setToken('');
    showLogin(saved ? '로그인이 만료되었습니다. 다시 로그인해 주세요.' : '', 'error');
  }
})();
