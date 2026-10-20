// 공스코어 앱 설치 지원: 서비스 워커 등록 + "앱 설치" 버튼
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }

  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var deferred = null;
  var ga = function (name, params) { if (typeof gtag === 'function') gtag('event', name, params || {}); };

  function buttons() { return document.querySelectorAll('[data-install]'); }
  function show(on) {
    buttons().forEach(function (b) {
      var wrap = b.closest('[data-install-wrap]') || b;
      if (on) wrap.removeAttribute('hidden'); else wrap.setAttribute('hidden', '');
    });
  }

  function iosGuide() {
    if (document.getElementById('gs-ios-guide')) return;
    var box = document.createElement('div');
    box.id = 'gs-ios-guide';
    box.setAttribute('role', 'dialog');
    box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:16px;z-index:200;background:#0f2340;color:#fff;border:1px solid #c8a84b;border-radius:12px;padding:16px 18px;font-size:.88rem;line-height:1.7;box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:inherit;';
    box.innerHTML = '<b style="color:#f0dfa0">아이폰에서 공스코어 설치하기</b><br>1. Safari 아래쪽 <b>공유 버튼(□↑)</b>을 누르세요.<br>2. <b>"홈 화면에 추가"</b>를 누르면 설치됩니다.<br><span style="opacity:.7;font-size:.8rem">카카오톡·네이버 앱 안에서 열었다면 먼저 Safari로 열어 주세요.</span>' +
      '<button type="button" style="display:block;margin-top:10px;margin-left:auto;background:#c8a84b;color:#0f2340;border:0;border-radius:7px;padding:7px 16px;font-weight:700;font-family:inherit;cursor:pointer">확인</button>';
    box.querySelector('button').onclick = function () { box.remove(); };
    document.body.appendChild(box);
  }

  function onClick(e) {
    e.preventDefault();
    ga('pwa_install_click', { ios: isIOS ? 'yes' : 'no' });
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function (r) { ga('pwa_install_choice', { outcome: r.outcome }); deferred = null; if (r.outcome === 'accepted') show(false); });
    } else if (isIOS) {
      iosGuide();
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
    if (isIOS) show(true);
  });
})();
