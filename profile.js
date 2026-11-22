// 공스코어 입력값 기억 (별도 배너 없이 계산기 간 자동 연동)
// 계산기 하나에서 고른 직급·호봉·근무연수·임용일(평정 계산기는 지역·직렬도)을 기억해 두었다가
// 다른 계산기를 열면 같은 칸에 자동으로 채운다.
// 이 기기의 브라우저 저장소(localStorage)에만 저장하고 서버로는 보내지 않는다.
(function () {
  var KEY = 'gs.profile';
  var SELECTS = ['region', 'district', 'series', 'grade', 'step']; // 이 순서대로 채워야 하위 목록이 맞게 바뀐다
  var $ = function (id) { return document.getElementById(id); };
  var DATE = /^\d{4}-\d{2}-\d{2}$/;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function fire(el, types) { types.forEach(function (t) { el.dispatchEvent(new Event(t, { bubbles: true })); }); }
  function hasOpt(sel, v) { return Array.prototype.some.call(sel.options, function (o) { return o.value === String(v); }); }

  function collect() {
    var p = load();
    SELECTS.forEach(function (id) {
      var el = $(id);
      if (el && el.tagName === 'SELECT' && el.value && !el.closest('[hidden]') && el.offsetParent !== null) p[id] = el.value;
    });
    var h = $('hire');
    if (h && DATE.test(h.value)) p.hire = h.value;
    var b = $('birth');
    if (b && DATE.test(b.value)) p.birth = b.value;
    var y = $('years');
    if (y && y.value !== '') p.years = y.value;
    save(p);
  }

  function apply() {
    var p = load(), used = [];
    SELECTS.forEach(function (id) {
      var el = $(id), v = p[id];
      if (!el || v == null || !hasOpt(el, v)) return;
      if (el.value !== String(v)) { el.value = String(v); fire(el, ['change']); }
      if (id === 'grade') used.push(el.options[el.selectedIndex].text);
      if (id === 'step') used.push(v + '호봉');
    });
    var h = $('hire');
    if (h && p.hire && DATE.test(p.hire)) {
      h.value = p.hire; fire(h, ['input', 'change', 'blur']);
      used.push('임용일 ' + p.hire);
    }
    var b = $('birth');
    if (b && p.birth && DATE.test(p.birth)) {
      b.value = p.birth; fire(b, ['input', 'change', 'blur']);
    }
    var y = $('years');
    if (y) {
      if (p.years !== undefined && p.years !== '') {
        y.value = p.years; fire(y, ['input', 'change']);
      } else if (!h && p.hire && DATE.test(p.hire)) {
        var d = new Date(p.hire + 'T00:00:00'), now = new Date();
        var yrs = now.getFullYear() - d.getFullYear() - ((now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) ? 1 : 0);
        if (yrs >= 0 && yrs <= 45) { y.value = yrs; fire(y, ['input', 'change']); used.push('근무연수 ' + yrs + '년'); }
      }
    }
    if (used.length && typeof gtag === 'function') {
      gtag('event', 'profile_autofill', { fields: used.length });
    }
  }

  document.addEventListener('change', function (e) {
    if (e.isTrusted && e.target && (SELECTS.indexOf(e.target.id) >= 0 || e.target.id === 'hire' || e.target.id === 'birth' || e.target.id === 'years')) collect();
  });
  document.addEventListener('focusout', function (e) {
    if (e.target && (e.target.id === 'hire' || e.target.id === 'birth' || e.target.id === 'years')) collect();
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.btn-primary')) collect();
  });

  function start() { setTimeout(apply, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
