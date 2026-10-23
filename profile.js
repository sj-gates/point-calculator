// 공스코어 입력값 기억
// 계산기 하나에서 고른 직급·호봉·임용일(평정 계산기는 지역·직렬도)을 기억해 두었다가
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
    if (h && !h.value && p.hire && DATE.test(p.hire)) {
      h.value = p.hire; fire(h, ['input', 'change', 'blur']);
      used.push('임용일 ' + p.hire);
    }
    // 월급 계산기: 임용일을 알면 근무연수 칸을 채워 준다
    var y = $('years');
    if (y && !h && p.hire && DATE.test(p.hire)) {
      var d = new Date(p.hire + 'T00:00:00'), now = new Date();
      var yrs = now.getFullYear() - d.getFullYear() - ((now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) ? 1 : 0);
      if (yrs >= 0 && yrs <= 45) { y.value = yrs; fire(y, ['input', 'change']); used.push('근무연수 ' + yrs + '년'); }
    }
    if (used.length) {
      notice(used.join(' · '));
      if (typeof gtag === 'function') gtag('event', 'profile_autofill', { fields: used.length });
    }
  }

  function notice(text) {
    var g = $('grade'), card = g && (g.closest('.card') || g.closest('section'));
    if (!card) return;
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;padding:8px 12px;border:1px dashed var(--border,#d8d0be);border-radius:8px;font-size:.8rem;line-height:1.5;color:var(--muted,#6b6b7a);background:rgba(200,168,75,.08);';
    var msg = document.createElement('span');
    msg.style.flex = '1';
    msg.textContent = '💾 지난번 입력값을 채웠어요: ' + text;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '지우기';
    btn.title = '이 기기에 기억된 입력값을 지우고 처음 상태로 돌아갑니다';
    btn.style.cssText = 'background:none;border:1px solid var(--border,#d8d0be);border-radius:6px;padding:3px 10px;font:inherit;color:inherit;cursor:pointer;';
    btn.onclick = function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
    bar.appendChild(msg); bar.appendChild(btn);
    card.parentNode.insertBefore(bar, card);
  }

  document.addEventListener('change', function (e) {
    if (e.isTrusted && e.target && (SELECTS.indexOf(e.target.id) >= 0 || e.target.id === 'hire')) collect();
  });
  document.addEventListener('focusout', function (e) { if (e.target && e.target.id === 'hire') collect(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.btn-primary')) collect();
  });

  function start() { setTimeout(apply, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
