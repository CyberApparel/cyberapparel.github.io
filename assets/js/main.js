/* ================================================
   CYBER APPAREL CO. — MAIN JS v2
   ================================================ */

'use strict';

/* ---- UNIVERSAL TEXT CASCADE ---- */
(function initUniversalCascade() {
  if (!document.body.classList.contains('cascade-page')) return;

  // Animate the actual text-bearing elements across the entire document, including
  // navigation, Home hero copy, page content, buttons, tables, galleries, and footer copy.
  // Structural containers are intentionally skipped so nested content can animate cleanly.
  const textTags = new Set([
    'A','BUTTON','H1','H2','H3','H4','H5','H6','P','LI','TD','TH','LABEL',
    'SPAN','STRONG','EM','SMALL','TIME','SUMMARY','DT','DD','CODE','PRE','CAPTION'
  ]);
  const skipTags = new Set(['SCRIPT','STYLE','NOSCRIPT','TITLE','META','LINK','SVG','PATH','IMG','VIDEO','AUDIO','SOURCE']);
  const selected = new Set();

  const hasDirectText = (el) => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length);
  const hasVisibleText = (el) => !!el && !skipTags.has(el.tagName) && (hasDirectText(el) || [...el.children].some(hasVisibleText));

  // Preserve existing bespoke Home cascade lines; everything else gets the universal load cascade.
  const isExistingHeroCascade = (el) => el.matches('.hero .cascade-line') || el.matches('.hero .hero-sub .cascade-line');

  // Pick one animation host per visible text cluster. We select semantic text elements,
  // plus inline-style/div text clusters that have no block-level descendants carrying text.
  const candidates = [...document.body.querySelectorAll('*')].filter(el => {
    if (skipTags.has(el.tagName) || el.closest('script,style,noscript,svg')) return false;
    if (!hasDirectText(el) || isExistingHeroCascade(el)) return false;
    if (el.classList.contains('ticker-inner')) return false;
    if (textTags.has(el.tagName)) return true;
    if (el.tagName === 'DIV') {
      return [...el.children].every(child => !hasVisibleText(child) || ['SPAN','STRONG','EM','SMALL','CODE'].includes(child.tagName));
    }
    return false;
  });

  let index = 0;
  for (const el of candidates) {
    // If a selected ancestor already owns this text cluster, do not double-animate it.
    if ([...selected].some(parent => parent !== el && parent.contains(el))) continue;
    selected.add(el);
    el.classList.add('cascade-text');
    el.style.setProperty('--cascade-index', Math.min(index, 24));
    index += 1;
  }

  // Scroll-reveal wrappers can otherwise keep a text cluster hidden until scrolled into view.
  // Only release wrappers that contain a universal cascade target; image-only reveals remain unchanged.
  selected.forEach(el => {
    el.parentElement?.closest('.reveal')?.classList.add('cascade-reveal-parent');
  });
})();

/* ---- ALL PAGES: SLOW TERMINAL LINE CASCADE ---- */
(function initTerminalCascade() {
  if (!document.body.classList.contains('cascade-page')) return;

  const skipTags = new Set(['SCRIPT','STYLE','NOSCRIPT','TITLE','META','LINK','SVG','PATH','IMG','VIDEO','AUDIO','SOURCE']);
  const lineStepMs = 125;

  const preserveHomeHero = !!document.querySelector('.hero');

  function wrapAllHomeText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (skipTags.has(parent.tagName) || parent.closest('script,style,noscript,svg')) return NodeFilter.FILTER_REJECT;
        if (preserveHomeHero && parent.closest('.hero .cascade')) return NodeFilter.FILTER_REJECT; // preserve Home hero lines
        if (parent.closest('.cursor-dot, .cursor-ring')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.home-terminal-token')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    const tokens = [];
    for (const textNode of nodes) {
      const parts = textNode.nodeValue.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          continue;
        }
        const span = document.createElement('span');
        span.className = 'home-terminal-token';
        span.textContent = part;
        frag.appendChild(span);
        tokens.push(span);
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }
    return tokens;
  }

  function groupByRenderedLine(tokens) {
    const groups = [];
    const tolerance = 4;
    for (const token of tokens) {
      const rect = token.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      let group = groups.find(g => Math.abs(g.top - rect.top) <= tolerance);
      if (!group) {
        group = { top: rect.top, tokens: [] };
        groups.push(group);
      }
      group.tokens.push(token);
      group.top = (group.top * (group.tokens.length - 1) + rect.top) / group.tokens.length;
    }
    return groups.sort((a, b) => a.top - b.top);
  }

  function init() {
    // Release reveal wrappers so the line-level terminal timing controls text on every webpage.
    // Home's bespoke hero cascade is preserved as the first sequence of lines.
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('home-terminal-cascade-parent'));

    const tokens = wrapAllHomeText();
    const lines = groupByRenderedLine(tokens);

    let lineIndex = preserveHomeHero ? 8 : 0;
    for (const line of lines) {
      const delay = `${lineIndex * lineStepMs}ms`;
      line.tokens.forEach(token => token.style.setProperty('--home-cascade-delay', delay));
      lineIndex += 1;
    }
    document.body.classList.add('terminal-cascade-ready');
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(init));
  } else {
    window.addEventListener('load', () => requestAnimationFrame(init), { once: true });
  }
})();

/* ---- CURSOR ---- */
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function loop() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  })();
})();

/* ---- NAV: active link + mobile hamburger ---- */
(function initNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === path) a.classList.add('active');
  });

  const burger  = document.getElementById('hamburger');
  const mobMenu = document.getElementById('mobile-menu');
  if (!burger || !mobMenu) return;

  const setMenu = (open) => {
    const isOpen = !!open;
    mobMenu.classList.toggle('open', isOpen);
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen && window.matchMedia('(max-width: 900px)').matches ? 'hidden' : '';
  };

  // Keep the button's state authoritative rather than relying on class inspection.
  burger.setAttribute('type', 'button');
  burger.setAttribute('aria-controls', 'mobile-menu');
  burger.setAttribute('aria-expanded', 'false');

  burger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu(!mobMenu.classList.contains('open'));
  });

  mobMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobMenu.classList.contains('open')) setMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (!mobMenu.classList.contains('open')) return;
    if (!mobMenu.contains(event.target) && !burger.contains(event.target)) setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 900px)').matches) setMenu(false);
  });
})();

/* ---- SCROLL REVEAL ---- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

/* ---- GALLERY (product page) ----
 * Thumbnails are NOT hardcoded here. They're built from whatever image
 * filenames are listed in window.GALLERY_MANIFESTS[<folder name>], which
 * is set by <gallery-folder>/manifest.js — generated by
 * tools/generate-gallery-manifest.js by scanning the actual folder
 * contents. Drop a new image into the folder, regenerate the manifest,
 * and it shows up here automatically — any filename works.
 *
 * manifest.js must be included via a <script> tag BEFORE this file, e.g.:
 *   <script src="../assets/img/gallery/drop001/manifest.js"></script>
 *   <script src="../assets/js/main.js"></script>
 * A plain script tag (rather than fetching a .json file) is what lets
 * this work both on a real web server AND when the HTML file is opened
 * directly by double-clicking it — browsers block fetch() of local files.
 */
(function initGallery() {
  const main = document.getElementById('gallery-main-img');
  const thumbsContainer = document.getElementById('gallery-thumbs');
  if (!main || !thumbsContainer) return;

  const galleryDir = thumbsContainer.dataset.galleryDir || '../assets/img/gallery/drop001';
  const galleryKey = galleryDir.split('/').filter(Boolean).pop();

  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('gallery-lightbox-img');
  const zoomIn = document.getElementById('gallery-zoom-in');
  const zoomOut = document.getElementById('gallery-zoom-out');
  const zoomReset = document.getElementById('gallery-zoom-reset');
  let zoom = 1;

  function applyZoom() {
    if (!lightboxImg) return;
    lightboxImg.style.transform = `scale(${zoom})`;
    if (zoomReset) zoomReset.textContent = `${zoom % 1 === 0 ? zoom : zoom.toFixed(1)}×`;
  }

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    zoom = 1;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxImg.onload = () => applyZoom();
    applyZoom();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    zoom = 1;
  }

  function changeMain(src, alt, openExpanded) {
    if (main.src.endsWith(src)) {
      if (openExpanded) openLightbox(src, alt);
      return;
    }
    main.classList.add('switching');
    const next = new Image();
    next.onload = () => {
      main.src = src;
      main.alt = alt || main.alt;
      main.classList.remove('switching');
      if (openExpanded) openLightbox(src, alt);
    };
    next.onerror = () => main.classList.remove('switching');
    next.src = src;
  }

  // Turn "shirt-folded-alt.png" into "Shirt Folded Alt" for alt text /
  // aria-labels, since there's no hardcoded label list to draw from.
  function labelFromFilename(filename) {
    const base = filename.replace(/\.[^./]+$/, '');
    return base
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Gallery image';
  }

  function buildThumbs(files) {
    thumbsContainer.innerHTML = '';
    const thumbs = [];
    files.forEach((filename, i) => {
      const src = `${galleryDir}/${filename}`;
      const label = labelFromFilename(filename);

      const btn = document.createElement('button');
      btn.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
      btn.dataset.src = src;
      btn.setAttribute('aria-label', label);

      const img = document.createElement('img');
      img.src = src;
      img.alt = label;
      img.loading = 'lazy';
      btn.appendChild(img);

      btn.addEventListener('click', () => {
        changeMain(src, label, false);
        thumbs.forEach((t) => t.classList.remove('active'));
        btn.classList.add('active');
      });

      thumbsContainer.appendChild(btn);
      thumbs.push(btn);
    });
    return thumbs;
  }

  // Lightbox / zoom / main-image-click controls are wired unconditionally,
  // whether or not gallery data was found.
  main.addEventListener('click', () => openLightbox(main.currentSrc || main.src, main.alt));

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target === lightboxImg) closeLightbox();
    });
    zoomIn?.addEventListener('click', (event) => {
      event.stopPropagation();
      zoom = Math.min(4, +(zoom + 0.25).toFixed(2));
      applyZoom();
    });
    zoomOut?.addEventListener('click', (event) => {
      event.stopPropagation();
      zoom = Math.max(0.5, +(zoom - 0.25).toFixed(2));
      applyZoom();
    });
    zoomReset?.addEventListener('click', (event) => {
      event.stopPropagation();
      zoom = 1;
      applyZoom();
    });
    lightbox.addEventListener('wheel', (event) => {
      event.preventDefault();
      zoom += event.deltaY < 0 ? 0.2 : -0.2;
      zoom = Math.min(4, Math.max(0.5, +zoom.toFixed(2)));
      applyZoom();
    }, { passive: false });
    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === '+') { zoom = Math.min(4, +(zoom + 0.25).toFixed(2)); applyZoom(); }
      if (event.key === '-') { zoom = Math.max(0.5, +(zoom - 0.25).toFixed(2)); applyZoom(); }
      if (event.key === '0') { zoom = 1; applyZoom(); }
    });
  }

  const files = window.GALLERY_MANIFESTS && window.GALLERY_MANIFESTS[galleryKey];
  if (Array.isArray(files) && files.length) {
    const thumbs = buildThumbs(files);
    const first = thumbs[0];
    if (first) {
      main.src = first.dataset.src;
      main.alt = first.querySelector('img').alt;
    }
  } else {
    console.warn(
      `Gallery manifest for "${galleryKey}" not found — showing default image only. ` +
      `Make sure ${galleryDir}/manifest.js is included via a <script> tag before main.js, ` +
      `and run: node tools/generate-gallery-manifest.js ${galleryDir.replace('../', '')}`
    );
  }
})();

/* ---- SHIRT FLIP (hero) ---- */
(function initShirtFlip() {
  const btn  = document.getElementById('shirt-flip-btn');
  const img  = document.getElementById('hero-shirt-img');
  if (!btn || !img) return;

  const front = img.dataset.front;
  const back  = img.dataset.back;
  let showingFront = true;

  btn.addEventListener('click', () => {
    img.style.opacity = '0';
    img.style.transform = 'scale(0.95)';
    setTimeout(() => {
      showingFront = !showingFront;
      img.src = showingFront ? front : back;
      btn.textContent = showingFront ? 'View Back →' : 'View Front →';
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 250);
  });
  img.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
})();

/* ---- SIZE SELECTOR ---- */
(function initSizes() {
  const btns = document.querySelectorAll('.size-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
})();

/* ---- HASH REVEAL ---- */
(function initHashReveal() {
  const block = document.getElementById('hash-reveal');
  if (!block) return;
  const header = block.querySelector('.hash-header');
  header.addEventListener('click', () => block.classList.toggle('open'));
})();

/* ---- VERIFY LOGIC ---- */
(function initVerify() {
  const form = document.getElementById('verify-form');
  if (!form) return;

  // Embedded fallback data so it works with file://
  const FALLBACK = {
    artifacts: [
      {
        id: 'CA-AI-CHUNK-0001',
        title: 'AI Gits Better By The Chunk',
        drop: 'Drop 001',
        release_date: '2025-06-01',
        creator_mark: 'Cyber Apparel Co. / CAC-MARK-001',
        copyright: '© 2025 Cyber Apparel Co. All rights reserved.',
        claimed_marks: ['CYBER APPAREL CO.','CAC','AI GITS BETTER BY THE CHUNK','AI .CHUNK','DROP 001'],
        sha256_garment:  'a3f8c2e1d94b76f05a2c3e8d1f94b76f05a2c3e8d1f94b76f05a2c3e8d1f94b',
        sha256_artwork:  'b7d2f1a0e83c65d14b3f2a1e83c65d14b3f2a1e83c65d14b3f2a1e83c65d147',
        sha256_metadata: 'c9e4d3b2f17a08e25c4d3b2f17a08e25c4d3b2f17a08e25c4d3b2f17a08e259',
        qr_destination: 'https://cyberapparel.co/verify?id=CA-AI-CHUNK-0001',
        status: 'AUTHENTIC',
        edition: 'Limited — 001 of 500',
        price: '$42.00'
      }
    ]
  };

  async function loadArtifacts() {
    try {
      const r = await fetch('../data/artifacts.json');
      return (await r.json()).artifacts;
    } catch {
      return FALLBACK.artifacts;
    }
  }

  function renderResult(artifact) {
    const wrap = document.getElementById('verify-result');
    const card = document.getElementById('result-card');
    wrap.classList.add('visible');

    if (!artifact) {
      card.className = 'result-card not-found';
      card.innerHTML = `
        <div class="result-status">
          <span class="status-pip err"></span>
          <span class="result-status-text" style="color:var(--rose);">Artifact Not Found</span>
        </div>
        <p style="font-size:0.78rem;color:var(--dim);line-height:1.8;">
          No record matching that ID exists in the Cyber Apparel Co. registry.<br/>
          Check the ID printed on your garment's interior label.
        </p>`;
      return;
    }

    const marks = artifact.claimed_marks.map(m => `<span class="result-badge">${m}</span>`).join(' ');

    card.className = 'result-card authentic';
    card.innerHTML = `
      <div class="result-status">
        <span class="status-pip ok"></span>
        <span class="result-status-text" style="color:var(--mint);">Authentic — ${artifact.status}</span>
        <span style="margin-left:auto;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--dim);">${artifact.edition}</span>
      </div>

      <div class="result-row">
        <span class="result-key">Artifact ID</span>
        <span class="result-val mono">${artifact.id}</span>
      </div>
      <div class="result-row">
        <span class="result-key">Drop</span>
        <span class="result-val">${artifact.drop}</span>
      </div>
      <div class="result-row">
        <span class="result-key">Title</span>
        <span class="result-val">${artifact.title}</span>
      </div>
      <div class="result-row">
        <span class="result-key">Release Date</span>
        <span class="result-val mono">${artifact.release_date}</span>
      </div>
      <div class="result-row">
        <span class="result-key">Creator Mark</span>
        <span class="result-val mono" style="font-size:0.62rem;">${artifact.creator_mark}</span>
      </div>
      <div class="result-row">
        <span class="result-key">Copyright</span>
        <span class="result-val" style="font-size:0.72rem;">${artifact.copyright}</span>
      </div>
      <div class="result-row">
        <span class="result-key">Claimed Marks</span>
        <span class="result-val">${marks}</span>
      </div>
      <div class="result-row">
        <span class="result-key">SHA-256 Garment</span>
        <div class="result-hash">${artifact.sha256_garment}</div>
      </div>
      <div class="result-row">
        <span class="result-key">SHA-256 Artwork</span>
        <div class="result-hash">${artifact.sha256_artwork}</div>
      </div>
      <div class="result-row">
        <span class="result-key">SHA-256 Metadata</span>
        <div class="result-hash">${artifact.sha256_metadata}</div>
      </div>
      <div class="result-row">
        <span class="result-key">QR Destination</span>
        <span class="result-val" style="font-size:0.68rem;">
          <a href="${artifact.qr_destination}" style="color:var(--mint);">${artifact.qr_destination}</a>
        </span>
      </div>`;

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('artifact-id-input').value.trim().toUpperCase();
    const btn   = document.getElementById('verify-submit-btn');
    btn.textContent = 'SCANNING...';
    btn.disabled = true;
    try {
      const list = await loadArtifacts();
      renderResult(list.find(a => a.id === input) || null);
    } finally {
      btn.textContent = 'VERIFY';
      btn.disabled = false;
    }
  });

  // Auto-verify from ?id=
  const param = new URLSearchParams(window.location.search).get('id');
  if (param) {
    const inp = document.getElementById('artifact-id-input');
    if (inp) {
      inp.value = param;
      form.dispatchEvent(new Event('submit'));
    }
  }
})();
