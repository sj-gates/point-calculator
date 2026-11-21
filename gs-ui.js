// 공스코어 통합 모던 UI 스크립트 (네비게이션·자동 목차·프로필 로컬 연동·결과 복사/공유)
(function () {
  // 1. 다중 드롭다운 & 모바일 서랍 제어
  const drops = Array.from(document.querySelectorAll('.gs-drop'));
  drops.forEach(function (drop) {
    const btn = drop.querySelector('.gs-drop-btn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const willOpen = !drop.classList.contains('open');
      drops.forEach(function (other) {
        other.classList.remove('open');
        const ob = other.querySelector('.gs-drop-btn');
        if (ob) ob.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        drop.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  if (drops.length) {
    document.addEventListener('click', function (e) {
      drops.forEach(function (drop) {
        if (!drop.contains(e.target)) {
          drop.classList.remove('open');
          const btn = drop.querySelector('.gs-drop-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        drops.forEach(function (drop) {
          drop.classList.remove('open');
          const btn = drop.querySelector('.gs-drop-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // URL ?year=2027 활성 시 2027 메뉴 버튼 하이라이트
  if (new URLSearchParams(window.location.search).get('year') === '2027') {
    const b27 = document.querySelector('.gs-drop-btn-2027');
    const bSal = document.querySelector('.gs-drop-btn:not(.gs-drop-btn-2027)');
    if (b27) b27.classList.add('on');
    if (bSal) bSal.classList.remove('on');
  }

  const mobBtn = document.querySelector('.gs-mobile-btn');
  const mobDrawer = document.querySelector('.gs-mobile-drawer');
  if (mobBtn && mobDrawer) {
    mobBtn.addEventListener('click', function () {
      const isOpen = mobDrawer.classList.toggle('open');
      mobBtn.setAttribute('aria-expanded', String(isOpen));
      mobBtn.textContent = isOpen ? '✕ 닫기' : '☰ 전체 메뉴';
    });
  }

  // 2. 가이드 페이지 자동 목차(TOC) + 읽기 진행 바
  const isGuide = document.body.classList.contains('gs-page-guide');
  if (isGuide) {
    const main = document.querySelector('main');
    const hero = main && (main.querySelector('.article-hero') || main.querySelector('.intro'));
    const headings = main
      ? Array.from(main.querySelectorAll('h2')).filter(function (h) {
          if (h.closest('.related-links') || h.closest('.cta-box') || h.closest('.article-hero') || h.closest('.intro')) return false;
          const txt = h.textContent.trim();
          return txt.length > 0 && !txt.includes('함께 읽으면') && !txt.includes('함께 보면');
        })
      : [];

    if (hero && headings.length >= 3 && !document.querySelector('.gs-toc')) {
      const toc = document.createElement('nav');
      toc.className = 'gs-toc';
      toc.setAttribute('aria-label', '이 글의 목차');

      const head = document.createElement('div');
      head.className = 'gs-toc-head';
      head.innerHTML = '<span>📑 이 글의 목차</span><span class="toc-toggle">접기</span>';

      const ol = document.createElement('ol');
      headings.forEach(function (h, idx) {
        if (!h.id) h.id = 'sec-' + (idx + 1);
        h.style.scrollMarginTop = '76px';
        const clone = h.cloneNode(true);
        clone.querySelectorAll('.num, .sn').forEach(function (el) { el.remove(); });
        const label = clone.textContent.trim();

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.innerHTML = '<span class="toc-n">' + String(idx + 1).padStart(2, '0') + '</span><span></span>';
        a.querySelector('span:last-child').textContent = label;
        li.appendChild(a);
        ol.appendChild(li);
      });

      head.addEventListener('click', function () {
        const collapsed = toc.classList.toggle('collapsed');
        head.querySelector('.toc-toggle').textContent = collapsed ? '펼치기' : '접기';
      });

      toc.appendChild(head);
      toc.appendChild(ol);
      hero.insertAdjacentElement('afterend', toc);
    }

    const bar = document.createElement('div');
    bar.className = 'gs-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    const updateBar = function () {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = max > 0 ? Math.min(100, (scrollTop / max) * 100) + '%' : '0%';
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    updateBar();
  }

  // 3. 계산기 간 기본 프로필(계급·호봉·근무연수·임용일) 브라우저 내 자동 연동 및 원클릭 초기화
  const PROFILE_KEY = 'gs_profile_v1';
  const gradeEl = document.getElementById('grade') || document.getElementById('simGrade');
  const stepEl = document.getElementById('step') || document.getElementById('simStep');
  const yearsEl = document.getElementById('years');
  const hireEl = document.getElementById('hire');
  const birthEl = document.getElementById('birth');

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveProfile(patch) {
    try {
      const cur = loadProfile();
      const next = Object.assign({}, cur, patch);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      updateProfileBarText(next);
    } catch (e) {}
  }

  function runSilentCalculate() {
    if (typeof window.calculate !== 'function') return;
    // salary-calculator 등 calculate(true)를 지원하는 경우
    if (window.calculate.length >= 1) {
      try { window.calculate(true); return; } catch (e) {}
    }
    // scrollIntoView를 일시 억제하여 초기 로드 시 화면 스크롤 점프 방지
    const origScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {};
    try {
      window.calculate();
    } catch (e) {}
    setTimeout(function () {
      Element.prototype.scrollIntoView = origScroll;
    }, 120);
  }

  let profileBarStatusEl = null;
  function updateProfileBarText(p) {
    if (!profileBarStatusEl) return;
    const parts = [];
    const gVal = (gradeEl && gradeEl.value) || p.grade;
    const sVal = (stepEl && stepEl.value) || p.step;
    if (gVal) parts.push(gVal + '급');
    if (sVal) parts.push(sVal + '호봉');
    if ((yearsEl && yearsEl.value) || p.years) parts.push('근무 ' + ((yearsEl && yearsEl.value) || p.years) + '년');
    const summary = parts.length ? ' (' + parts.join(' · ') + ')' : '';
    profileBarStatusEl.innerHTML = '🔄 <strong>내 직급·호봉 브라우저 자동 연동</strong>' + summary + ' <span class="gs-prof-sub">· 서버 전송 없음</span>';
  }

  if (gradeEl || stepEl || yearsEl || hireEl) {
    const saved = loadProfile();
    let changed = false;

    if (gradeEl && saved.grade) {
      const hasOpt = Array.from(gradeEl.options || []).some(function (o) { return o.value === String(saved.grade); });
      if (hasOpt && gradeEl.value !== String(saved.grade)) {
        gradeEl.value = String(saved.grade);
        changed = true;
        if (typeof window.buildSteps === 'function') {
          try { window.buildSteps(); } catch (e) {}
        }
        if (typeof window.onGradeChange === 'function' && gradeEl.id === 'grade') {
          try { window.onGradeChange(); } catch (e) {}
        } else if (typeof window.onGrade === 'function') {
          try { window.onGrade(); } catch (e) {}
        }
      }
    }

    if (stepEl && saved.step) {
      const maxOpt = (stepEl.options && stepEl.options.length) || 32;
      const targetStep = String(Math.min(Number(saved.step) || 1, maxOpt));
      const hasStep = Array.from(stepEl.options || []).some(function (o) { return o.value === targetStep; });
      if (hasStep && stepEl.value !== targetStep) {
        stepEl.value = targetStep;
        changed = true;
        if (typeof window.onStep === 'function') {
          try { window.onStep(); } catch (e) {}
        }
      }
    }

    if (typeof window.onPayChange === 'function' && changed) {
      try { window.onPayChange(); } catch (e) {}
    }
    if (typeof window.updateSim === 'function' && changed) {
      try { window.updateSim(); } catch (e) {}
    }

    if (yearsEl && saved.years !== undefined && saved.years !== '') {
      yearsEl.value = saved.years;
    }
    if (hireEl && saved.hire && /^\d{4}-\d{2}-\d{2}$/.test(saved.hire)) {
      hireEl.value = saved.hire;
    }
    if (birthEl && saved.birth && /^\d{4}-\d{2}-\d{2}$/.test(saved.birth)) {
      birthEl.value = saved.birth;
    }

    // 프로필 연동 상태 & 지우기 바 삽입
    const anchor = document.querySelector('.gs-year-bar') || document.querySelector('main .article-hero') || document.querySelector('main .card');
    if (anchor && anchor.parentNode && !document.querySelector('.gs-profile-bar')) {
      const pBar = document.createElement('div');
      pBar.className = 'gs-profile-bar';
      pBar.setAttribute('aria-label', '계산기 입력값 브라우저 연동 상태');
      pBar.innerHTML =
        '<span class="gs-prof-txt"></span>' +
        '<button type="button" class="gs-prof-reset" title="브라우저에 임시 저장된 직급·호봉·임용일 정보를 즉시 삭제합니다">저장값 지우기</button>';
      profileBarStatusEl = pBar.querySelector('.gs-prof-txt');
      updateProfileBarText(saved);

      const resetBtn = pBar.querySelector('.gs-prof-reset');
      resetBtn.addEventListener('click', function () {
        try {
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem('gongscore_profile');
        } catch (e) {}
        profileBarStatusEl.innerHTML = '✓ <strong>브라우저 내 저장된 직급·호봉·임용일 정보가 삭제되었습니다.</strong>';
      });

      if (anchor.classList.contains('card')) {
        anchor.insertAdjacentElement('beforebegin', pBar);
      } else {
        anchor.insertAdjacentElement('afterend', pBar);
      }
    }

    // 입력 변경 시 localStorage 저장
    if (gradeEl) {
      gradeEl.addEventListener('change', function () {
        saveProfile({ grade: gradeEl.value, step: stepEl ? stepEl.value : undefined });
      });
    }
    if (stepEl) {
      stepEl.addEventListener('change', function () {
        saveProfile({ grade: gradeEl ? gradeEl.value : undefined, step: stepEl.value });
      });
    }
    if (yearsEl) {
      yearsEl.addEventListener('change', function () {
        saveProfile({ years: yearsEl.value });
      });
    }
    if (hireEl) {
      hireEl.addEventListener('change', function () {
        if (/^\d{4}-\d{2}-\d{2}$/.test(hireEl.value)) saveProfile({ hire: hireEl.value });
      });
    }
    if (birthEl) {
      birthEl.addEventListener('change', function () {
        if (/^\d{4}-\d{2}-\d{2}$/.test(birthEl.value)) saveProfile({ birth: birthEl.value });
      });
    }
  }

  // 4. 계산기 초기 자동 계산 (월급·초과근무·육아휴직·연가보상비 결과 카드 즉시 표시)
  const path = window.location.pathname;
  if (
    path.indexOf('salary-calculator') !== -1 ||
    path.indexOf('overtime-pay-calculator') !== -1 ||
    path.indexOf('parental-leave-calculator') !== -1 ||
    path.indexOf('leave-compensation-calculator') !== -1
  ) {
    runSilentCalculate();
  }

  // 5. 계산 결과 카드 내 [📋 결과 복사] · [🔗 계산기 공유] 버튼 자동 추가
  const resCard = document.getElementById('resultCard');
  if (resCard && !resCard.querySelector('.btn-row') && !resCard.querySelector('.gs-res-actions')) {
    const actWrap = document.createElement('div');
    actWrap.className = 'gs-res-actions';
    actWrap.innerHTML =
      '<button type="button" class="gs-res-btn" data-act="copy">📋 계산 결과 텍스트 복사</button>' +
      '<button type="button" class="gs-res-btn" data-act="share">🔗 계산기 링크 복사</button>';
    resCard.appendChild(actWrap);

    const copyBtn = actWrap.querySelector('[data-act="copy"]');
    const shareBtn = actWrap.querySelector('[data-act="share"]');

    copyBtn.addEventListener('click', function () {
      const h2 = resCard.querySelector('h2');
      const title = h2 ? h2.textContent.replace(/^▪\s*/, '').trim() : document.title;
      const lines = ['[' + title + '] — 공스코어'];
      resCard.querySelectorAll('.score-item').forEach(function (item) {
        const lbl = item.querySelector('.s-label');
        const val = item.querySelector('.s-val');
        if (lbl && val) lines.push('• ' + lbl.textContent.trim() + ': ' + val.textContent.trim());
      });
      const tLbl = resCard.querySelector('.total-score .t-label');
      const tVal = resCard.querySelector('.total-score .t-val');
      const tSub = resCard.querySelector('.total-score .t-sub');
      if (tLbl && tVal) {
        lines.push('▶ ' + tLbl.textContent.trim() + ': ' + tVal.textContent.replace(/\s+/g, ' ').trim());
      }
      if (tSub && tSub.textContent.trim()) {
        lines.push('  (' + tSub.textContent.replace(/\s+/g, ' ').trim() + ')');
      }
      lines.push('출처: ' + window.location.href);
      const txt = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () {
          copyBtn.textContent = '✓ 결과가 복사되었습니다';
          setTimeout(function () { copyBtn.textContent = '📋 계산 결과 텍스트 복사'; }, 2200);
        }).catch(function () {});
      }
    });

    shareBtn.addEventListener('click', function () {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          shareBtn.textContent = '✓ 링크가 복사되었습니다';
          setTimeout(function () { shareBtn.textContent = '🔗 계산기 링크 복사'; }, 2200);
        }).catch(function () {});
      }
    });
  }

  // 6. 맨 위로 버튼
  const topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'gs-top-btn';
  topBtn.setAttribute('aria-label', '맨 위로 이동');
  topBtn.textContent = '↑';
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(topBtn);

  window.addEventListener(
    'scroll',
    function () {
      topBtn.classList.toggle('show', window.scrollY > 420);
    },
    { passive: true }
  );
})();
