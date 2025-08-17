// Theme state: default dark (OFF). ON = light.
const body = document.body;
const saved = localStorage.getItem('theme');
const switchEl = document.getElementById('themeSwitch');
if (saved === 'light') { body.classList.add('light'); switchEl.checked = true; switchEl.setAttribute('aria-checked','true'); }
switchEl.addEventListener('change', () => {
  const light = switchEl.checked;
  body.classList.toggle('light', light);
  switchEl.setAttribute('aria-checked', String(light));
  localStorage.setItem('theme', light ? 'light' : 'dark');
});

// ------- Search (single implementation) -------
const search = document.getElementById('search');
const wfCards = Array.from(document.querySelectorAll('.content .wf-card'));
const sections = Array.from(document.querySelectorAll('.content section'));
const noResultsEl = document.getElementById('noResults');

function filter(term) {
  const q = term.trim().toLowerCase();

  // cards (match by card title only)
  wfCards.forEach(card => {
    const title = (card.dataset.title || card.querySelector('.wf-title')?.textContent || '').toLowerCase();
    const match = q === '' || title.includes(q);
    card.style.display = match ? '' : 'none';
  });

  // sections (hide when they have no visible cards, without shifting layout)
  let visibleCount = 0;
  sections.forEach(section => {
    const hasVisible = Array.from(section.querySelectorAll('.wf-card'))
      .some(c => c.style.display !== 'none');
    section.style.visibility = hasVisible ? 'visible' : 'hidden';
    section.style.height = hasVisible ? '' : '0';
    section.style.margin = hasVisible ? '' : '0';
    section.style.padding = hasVisible ? '' : '0';
    if (hasVisible) visibleCount++;
  });

  // optional "no results" badge
  if (noResultsEl) noResultsEl.hidden = (q === '' || visibleCount > 0);
}
search.addEventListener('input', e => filter(e.target.value));
filter(search.value || ''); // initialize

// ------- PDF viewer flags (hide toolbar/print/download in iframe) -------
const PDF_FLAGS = 'toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&zoom=page-width';
function withViewerFlags(url) {
  if (!url) return '';
  return url + (url.includes('#') ? '&' : '#') + PDF_FLAGS;
}

// ------- Website embedding rules -------
const NO_IFRAME = [/chatgpt\.com/i, /chat\.openai\.com/i]; // add more if needed
function isEmbeddable(url = '') {
  return url && !NO_IFRAME.some(rx => rx.test(url));
}

// Decide what to load in the iframe (or not)
function getCardSrc(card) {
  const web = card.dataset.web;
  if (web && isEmbeddable(web)) return web;     // OK to embed websites that allow it

  const pdf = card.dataset.pdf;
  if (pdf) return withViewerFlags(pdf);         // Always embed PDFs (with flags)

  return '';                                     // nothing embeddable
}

// ------- Toggle/open card -------
function toggleCard(card) {
  const isOpen = card.classList.toggle('open');
  const iframe = card.querySelector('iframe');

  if (isOpen && iframe && !iframe.src) {
    const src = getCardSrc(card);

    if (src) {
      iframe.src = src;
      const title = card.dataset.title || 'Sisu';
      iframe.title = title;
      iframe.setAttribute('aria-label', title);
    } else {
      // Not embeddable: open best available link in a new tab
      const link = card.dataset.link || card.dataset.web || card.dataset.pdf;
      if (link) window.open(link, '_blank', 'noopener');
      card.classList.remove('open'); // collapse back since there's nothing to show inside
    }
  }
}
wfCards.forEach(card => {
  const head = card.querySelector('.wf-head');
  if (head) head.addEventListener('click', () => toggleCard(card));
});
/* --- Sidebar collapse toggle (LEFT sidebar) --- */
const pageEl = document.querySelector('.page');
const sideToggle = document.querySelector('.side-toggle');

function applySidebarCollapsed(collapsed) {
  pageEl.classList.toggle('sidebar-collapsed', collapsed);
  if (sideToggle) sideToggle.setAttribute('aria-expanded', String(!collapsed));
  localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
}

// Initialize from localStorage on desktop only
const savedSidebar = localStorage.getItem('sidebarCollapsed');
const isNarrow = window.matchMedia('(max-width: 1024px)').matches;
if (savedSidebar === '1' && !isNarrow) applySidebarCollapsed(true);

// Toggle on click
if (sideToggle) {
  sideToggle.addEventListener('click', () => {
    const nowCollapsed = !pageEl.classList.contains('sidebar-collapsed');
    applySidebarCollapsed(nowCollapsed);
  });
}

// Keep behavior sensible across breakpoint changes
window.addEventListener('resize', () => {
  const narrow = window.matchMedia('(max-width: 1024px)').matches;
  if (narrow) {
    applySidebarCollapsed(false); // always expanded on narrow screens
  } else {
    const saved = localStorage.getItem('sidebarCollapsed') === '1';
    applySidebarCollapsed(saved);
  }
});
