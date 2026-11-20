// 공스코어 통합 모던 UI 스크립트 (네비게이션 드롭다운·모바일 서랍·자동 목차·읽기 진행바)
(function () {
  // 1. 드롭다운 & 모바일 서랍 제어
  const drop = document.querySelector('.gs-drop');
  const dropBtn = document.querySelector('.gs-drop-btn');
  if (drop && dropBtn) {
    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = drop.classList.toggle('open');
      dropBtn.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', function (e) {
      if (!drop.contains(e.target)) {
        drop.classList.remove('open');
        dropBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        drop.classList.remove('open');
        dropBtn.setAttribute('aria-expanded', 'false');
      }
    });
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
        // 앞의 숫자 뱃지 텍스트 정리
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

    // 읽기 진행 바
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

  // 3. 맨 위로 버튼
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
