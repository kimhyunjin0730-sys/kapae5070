/* ==========================================================================
   상담 신청 (contact.html)
   - 보내기 전에 확인: 성명·연락처·문의 내용·개인정보 동의는 꼭 필요, 이메일은 적었다면 형식 확인
     (오류는 각 칸 아래 글로 알리고, 첫 오류 칸으로 초점을 옮김)
   - POST /api/inquiry {type, name, phone, email, text} → 성공하면 contact-done.html
   - 400/429/500·연결 실패: 서버가 준 오류 문구(없으면 기본 문구) + 전화·이메일 안내
   - 보내는 동안 버튼을 잠금
   ========================================================================== */
(function () {
  'use strict';

  var PHONE = '02-582-1009';
  var EMAIL = 'kapae1503@gmail.com';
  // 서버(server.js)가 회신 주소로 받아 주는 형식과 같은 규칙
  var EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  var TIMEOUT_MS = 20000;

  var esc = (window.KAPAE && window.KAPAE.esc) || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function $(id) { return document.getElementById(id); }

  var form = $('contact-form');
  if (!form) return;
  var btn = $('contact-submit');
  var btnLabel = btn.querySelector('[data-label]');
  var btnText = btnLabel.textContent;
  var alertBox = $('contact-alert');
  var agree = $('cf-agree');
  var sending = false;

  var fields = [
    { el: $('cf-name'), err: $('cf-name-err'), check: function (v) {
      return v.trim() ? '' : '성명을 입력해 주세요.';
    } },
    { el: $('cf-phone'), err: $('cf-phone-err'), check: function (v) {
      v = v.trim();
      if (!v) return '연락처를 입력해 주세요.';
      if (v.replace(/\D/g, '').length < 7) return '연락처를 숫자로 정확히 입력해 주세요. (예: 010-0000-0000)';
      return '';
    } },
    { el: $('cf-email'), err: $('cf-email-err'), check: function (v) {
      v = v.trim();
      return !v || EMAIL_RE.test(v) ? '' : '이메일 주소 형식을 확인해 주세요. 이메일은 비워 두셔도 됩니다.';
    } },
    { el: $('cf-message'), err: $('cf-message-err'), check: function (v) {
      return v.trim() ? '' : '문의 내용을 입력해 주세요.';
    } },
    { el: agree, err: $('cf-agree-err'), check: function () {
      return agree.checked ? '' : '개인정보 수집 및 이용에 동의해 주세요. 동의하셔야 상담을 신청할 수 있습니다.';
    } }
  ];

  function showFieldError(f, msg) {
    f.err.textContent = msg;
    f.err.hidden = !msg;
    if (msg) f.el.setAttribute('aria-invalid', 'true');
    else f.el.removeAttribute('aria-invalid');
  }

  // 모든 칸을 확인하고, 첫 번째 오류 칸을 돌려줌 (없으면 null)
  function validateAll() {
    var first = null;
    for (var i = 0; i < fields.length; i++) {
      var msg = fields[i].check(fields[i].el.value);
      showFieldError(fields[i], msg);
      if (msg && !first) first = fields[i].el;
    }
    return first;
  }

  // 오류가 표시된 칸은 고치는 즉시 다시 확인해서 문구를 지움
  function recheck(e) {
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].el === e.target && fields[i].el.getAttribute('aria-invalid') === 'true') {
        showFieldError(fields[i], fields[i].check(fields[i].el.value));
      }
    }
  }
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  function setBusy(on) {
    btn.disabled = on;
    btnLabel.textContent = on ? '보내는 중입니다' : btnText; // 좁은 화면에서도 한 줄에 들어가는 길이
  }

  function clearAlert() { alertBox.innerHTML = ''; }

  function showFailure(status, serverMsg, timedOut) {
    var msg = serverMsg;
    if (!msg) {
      if (status === 429) msg = '짧은 시간에 신청이 많아 잠시 받을 수 없습니다. 잠시 후 다시 시도해 주세요.';
      else if (status >= 500) msg = '서버 오류로 신청을 보내지 못했습니다.';
      else if (timedOut) msg = '서버 응답이 늦어 신청을 보내지 못했습니다.';
      else if (status === 0) msg = '인터넷 연결이 원활하지 않아 신청을 보내지 못했습니다.';
      else msg = '신청을 보내지 못했습니다.';
    }
    alertBox.innerHTML = '<p class="form-msg form-msg--error">' + esc(msg) +
      ' 전화(<a class="nowrap" href="tel:' + PHONE + '">' + PHONE + '</a>)나 이메일(<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>)로도 상담을 신청하실 수 있습니다.</p>';
  }

  function finishWithError(status, serverMsg, timedOut) {
    var hadFocus = document.activeElement === btn || document.activeElement === document.body || !document.activeElement;
    sending = false;
    setBusy(false);
    showFailure(status, serverMsg, timedOut);
    if (hadFocus) btn.focus(); // 잠긴 버튼에서 빠진 초점을 되돌려 바로 다시 보낼 수 있게
  }

  function send() {
    sending = true;
    setBusy(true);

    var payload = {
      type: $('cf-type').value,
      name: $('cf-name').value.trim(),
      phone: $('cf-phone').value.trim(),
      email: $('cf-email').value.trim(),
      text: $('cf-message').value.trim()
    };
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timedOut = false;
    var timer = ctrl ? setTimeout(function () { timedOut = true; ctrl.abort(); }, TIMEOUT_MS) : 0;

    fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        return r.json()
          .catch(function () { return null; })
          .then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
      })
      .then(function (res) {
        clearTimeout(timer);
        if (res.ok && res.data && res.data.success) {
          // 뒤로 가기로 돌아와도 입력 내용이 남아 다시 보내지 않도록 비우고 이동 (버튼은 잠근 채로)
          form.reset();
          window.location.href = 'contact-done.html';
          return;
        }
        var serverMsg = res.data && typeof res.data.error === 'string' ? res.data.error : '';
        finishWithError(res.status, serverMsg, false);
      }, function () {
        clearTimeout(timer);
        finishWithError(0, '', timedOut);
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    clearAlert();
    var first = validateAll();
    if (first) {
      first.focus();
      return;
    }
    send();
  });

  // 뒤로 가기 캐시로 다시 보일 때 잠긴 버튼을 풀어 줌
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      sending = false;
      setBusy(false);
      clearAlert();
    }
  });
})();
