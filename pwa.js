// 공스코어 앱 설치 지원: 서비스 워커 등록 + "앱 설치" 버튼
// 안드로이드는 크롬으로 설치해야 Play 프로텍트 경고 없이 설치되므로,
// 크롬이 아닌 브라우저·앱 안 브라우저에서는 크롬으로 열도록 안내한다.
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }

  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var notChrome = /SamsungBrowser|Whale|EdgA|OPR|YaBrowser|MiuiBrowser|HuaweiBrowser|UCBrowser|Firefox|; wv\)|KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(ua);
  var isAndroidChrome = isAndroid && /Chrome\/\d/.test(ua) && !notChrome;
  var deferred = null;
  var ga = function (name, params) { if (typeof gtag === 'function') gtag('event', name, params || {}); };

  function buttons() { return document.querySelectorAll('[data-install]'); }
  function show(on) {
    buttons().forEach(function (b) {
      var wrap = b.closest('[data-install-wrap]') || b;
      if (on) wrap.removeAttribute('hidden'); else wrap.setAttribute('hidden', '');
    });
  }

  function guide(html, actions) {
    var old = document.getElementById('gs-install-guide');
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'gs-install-guide';
    box.setAttribute('role', 'dialog');
    box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:16px;z-index:200;max-width:520px;margin:0 auto;background:#0f2340;color:#fff;border:1px solid #c8a84b;border-radius:12px;padding:16px 18px;font-size:.88rem;line-height:1.7;box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:inherit;';
    box.innerHTML = html + '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px"></div>';
    var row = box.lastChild;
    actions.concat([{ label: '닫기', ghost: true }]).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      b.style.cssText = a.ghost
        ? 'background:none;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.3);border-radius:7px;padding:7px 14px;font-family:inherit;cursor:pointer'
        : 'background:#c8a84b;color:#0f2340;border:0;border-radius:7px;padding:7px 16px;font-weight:700;font-family:inherit;cursor:pointer';
      b.onclick = function () { box.remove(); if (a.run) a.run(); };
      row.appendChild(b);
    });
    document.body.appendChild(box);
  }

  function openInChrome() {
    ga('pwa_open_chrome');
    var target = location.host + location.pathname + location.search;
    location.href = 'intent://' + target + '#Intent;scheme=https;package=com.android.chrome;end';
  }

  function onClick(e) {
    e.preventDefault();
    ga('pwa_install_click', { ios: isIOS ? 'yes' : 'no', chrome: isAndroidChrome ? 'yes' : 'no' });
    if (isAndroid && !isAndroidChrome) {
      guide('<b style="color:#f0dfa0">크롬에서 설치해 주세요</b><br>지금 브라우저로 설치하면 휴대폰 보안 경고(Play 프로텍트)가 뜰 수 있습니다. <b>크롬</b>에서 설치하면 경고 없이 바로 설치됩니다.<br><span style="opacity:.7;font-size:.8rem">크롬으로 열린 뒤 다시 "앱으로 설치"를 눌러 주세요.</span>',
        [{ label: '크롬으로 열기', run: openInChrome }]);
      return;
    }
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function (r) { ga('pwa_install_choice', { outcome: r.outcome }); deferred = null; if (r.outcome === 'accepted') show(false); });
    } else if (isIOS) {
      guide('<b style="color:#f0dfa0">아이폰에서 공스코어 설치하기</b><br>1. Safari 아래쪽 <b>공유 버튼(□↑)</b>을 누르세요.<br>2. <b>"홈 화면에 추가"</b>를 누르면 설치됩니다.<br><span style="opacity:.7;font-size:.8rem">카카오톡·네이버 앱 안에서 열었다면 먼저 Safari로 열어 주세요.</span>', []);
    } else {
      guide('<b style="color:#f0dfa0">공스코어 설치하기</b><br>브라우저 주소창 오른쪽의 <b>설치 아이콘</b>이나 메뉴의 <b>"앱 설치"</b>를 눌러 주세요.', []);
    }
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (!standalone) show(true);
  });
  window.addEventListener('appinstalled', function () { ga('pwa_installed'); deferred = null; show(false); });

  document.addEventListener('DOMContentLoaded', function () {
    buttons().forEach(function (b) { b.addEventListener('click', onClick); });
    if (standalone) { show(false); return; }
    if (isIOS || (isAndroid && !isAndroidChrome)) show(true);
  });
})();
