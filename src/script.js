const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


const routes = ['home', 'work', 'about', 'contact'];
const routeLabels = { home: 'Home', work: 'Selected work', about: 'About ROGUE', contact: 'Start something' };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = $('.loader');
const counter = $('#load-count');
const progressBar = $('.loader__line b');
const curtain = $('.curtain');
const routeName = $('#route-name');
const routeNextIndex = $('#route-next-index');
const routeIndex = $('#route-index');
const menuPanel = $('.menu-panel');
const menuButton = $('.menu');
const cursor = $('.cursor');
const scrollMeter = $('.scroll-meter');
const soundButton = $('.sound');
const reel = $('video');
let current = routes.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
let transitioning = false;


document.body.classList.add('is-locked');


// Start directly on the requested deep-link while the cinematic loader hides the swap.
$$('[data-page-view]').forEach(page => page.classList.toggle('is-active', page.dataset.pageView === current));
updateRouteUI();


function updateRouteUI() {
  const index = routes.indexOf(current);
  routeIndex.textContent = String(index + 1).padStart(2, '0');
  $$('.menu-panel [data-page]').forEach(link => link.toggleAttribute('aria-current', link.dataset.page === current));
}


function runLoader() {
  const start = performance.now();
  const duration = prefersReducedMotion ? 100 : 1400;
  const cells = $$('.loader__grid i');


  function tick(now) {
    const elapsed = Math.min((now - start) / duration, 1);
    const amount = Math.min(100, Math.floor(elapsed * 100));


    counter.textContent = String(amount).padStart(3, '0');
    progressBar.style.width = `${amount}%`;
    const lit = Math.floor(elapsed * cells.length);
    cells.forEach((cell, index) => cell.classList.toggle('is-lit', index < lit));


    if (elapsed < 1) {
      requestAnimationFrame(tick);
    } else {
      finishIntro();
    }
  }


  requestAnimationFrame(tick);
}


async function finishIntro() {
  const source = $('.loader__center strong');
  const destination = $('.brand');
  const start = source.getBoundingClientRect();
  const end = destination.getBoundingClientRect();
  const ghost = source.cloneNode(true);
  ghost.className = 'intro-wordmark';
  Object.assign(ghost.style, {
    position: 'fixed', left: `${start.left}px`, top: `${start.top}px`,
    width: `${start.width}px`, height: `${start.height}px`,
    font: getComputedStyle(source).font,
    letterSpacing: getComputedStyle(source).letterSpacing,
    textIndent: getComputedStyle(source).textIndent,
    lineHeight: getComputedStyle(source).lineHeight
  });
  document.body.appendChild(ghost);
  document.body.classList.add('intro-flight');
  loader.classList.add('is-closing');


  if (!prefersReducedMotion && start.width && end.width) {
    const scale = end.width / start.width;
    const flight = ghost.animate([
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
      { transform: `translate3d(${(end.left - start.left) * .45}px,${(end.top - start.top) * .25}px,0) scale(.88)`, opacity: 1, offset: .36 },
      { transform: `translate3d(${end.left - start.left}px,${end.top - start.top}px,0) scale(${scale})`, opacity: 1 }
    ], { duration: 1200, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'forwards' });
    await flight.finished.catch(() => { });
  }


  ghost.remove();
  loader.classList.add('is-done');
  document.body.classList.remove('intro-flight', 'is-locked');
  document.body.classList.add('intro-revealed');
  revealVisibleElements();
}


function buildGrid(selector, columns, rows) {
  const grid = $(selector);
  grid.style.setProperty('--columns', columns);
  grid.style.setProperty('--rows', rows);
  const cells = document.createDocumentFragment();
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = document.createElement('i');
      const distance = Math.abs(column - (columns - 1) / 2) + Math.abs(row - (rows - 1) / 2);
      cell.style.setProperty('--order', (distance * 25 + ((column * 7 + row * 11) % 5) * 14) + 'ms');
      cells.appendChild(cell);
    }
  }
  grid.appendChild(cells);
}


buildGrid('.loader__grid', 12, 7);
buildGrid('.curtain__grid', 12, 7);


function closeMenu() {
  menuPanel.classList.remove('is-open');
  menuButton.classList.remove('is-open');
  menuPanel.setAttribute('aria-hidden', 'true');
  menuButton.setAttribute('aria-expanded', 'false');
}


function goTo(pageName, updateHash = true) {
  const next = $(`[data-page-view="${pageName}"]`);
  const outgoing = $(`[data-page-view="${current}"]`);
  if (!next || transitioning) return;
  closeMenu();


  if (pageName === current) {
    window.scrollTo(0, 0);
    return;
  }


  transitioning = true;
  routeName.textContent = routeLabels[pageName];
  routeNextIndex.textContent = routes.indexOf(pageName) + 1;
  curtain.classList.remove('is-covering');
  void curtain.offsetWidth;
  curtain.classList.add('is-covering');
  outgoing.classList.add('is-leaving');


  setTimeout(() => {
    outgoing.classList.remove('is-active', 'is-leaving');
    next.classList.add('is-active', 'is-entering');
    current = pageName;
    window.scrollTo(0, 0);
    updateRouteUI();
    resetPageReveals(next);
    if (updateHash) history.pushState(null, '', `#${pageName}`);
  }, prefersReducedMotion ? 1 : 550);


  setTimeout(() => {
    curtain.classList.remove('is-covering');
    next.classList.remove('is-entering');
    transitioning = false;
    revealVisibleElements();
  }, prefersReducedMotion ? 20 : 1400);
}


$$('[data-page]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  goTo(link.dataset.page);
}));


menuButton.setAttribute('aria-expanded', 'false');
menuButton.addEventListener('click', () => {
  const open = menuPanel.classList.toggle('is-open');
  menuButton.classList.toggle('is-open', open);
  menuPanel.setAttribute('aria-hidden', String(!open));
  menuButton.setAttribute('aria-expanded', String(open));
});


soundButton.addEventListener('click', () => {
  const active = soundButton.getAttribute('aria-pressed') === 'true';
  soundButton.setAttribute('aria-pressed', String(!active));
  soundButton.lastElementChild.textContent = active ? 'Sound off' : 'Sound on';
  if (reel) {
    reel.muted = active;
    if (!active) reel.play().catch(() => { });
  }
});


$('.to-top').addEventListener('click', () => window.scrollTo(0, 0));
window.addEventListener('popstate', () => goTo(location.hash.slice(1) || 'home', false));


// Reveal choreography: sections arrive as a sequence, not one generic page fade.
const revealSelectors = [
  '.manifesto__label', '.manifesto p', '.manifesto__foot',
  '.section-head', '.card-caption', '.page-intro > *', '.project__info',
  '.about-title > *', '.about-copy p', '.services > p', '.services li',
  '.contact-grid > *', 'footer > *'
];


revealSelectors.forEach(selector => {
  $$(selector).forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--delay', `${Math.min(index % 4, 3) * .08}s`);
  });
});


// Keep media visible independently of the text reveal observer.


const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-inview');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -7% 0px' });


function observePage(page = $(`[data-page-view="${current}"]`)) {
  $$('.reveal:not(.is-inview), .reveal-image:not(.is-inview)', page).forEach(element => revealObserver.observe(element));
}


function revealVisibleElements() {
  observePage();
  const activePage = $(`[data-page-view="${current}"]`);
  $$('.reveal, .reveal-image', activePage).forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < innerHeight * .93 && rect.bottom > 0) element.classList.add('is-inview');
  });
}


function resetPageReveals(page) {
  $$('.reveal, .reveal-image', page).forEach(element => {
    element.classList.remove('is-inview');
    revealObserver.observe(element);
  });
}


// Scroll telemetry and subtle velocity response.
let lastScroll = window.scrollY;
let velocityTimer;
function updateScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const percent = Math.max(0, Math.min(100, (scrollY / max) * 100));
  scrollMeter.style.setProperty('--progress', `${percent}%`);
  $('span', scrollMeter).textContent = String(Math.round(percent)).padStart(2, '0');


  const velocity = Math.max(-7, Math.min(7, (scrollY - lastScroll) * .08));
  document.documentElement.style.setProperty('--scroll-skew', `${velocity}deg`);
  lastScroll = scrollY;
  clearTimeout(velocityTimer);
  velocityTimer = setTimeout(() => document.documentElement.style.setProperty('--scroll-skew', '0deg'), 90);
}
window.addEventListener('scroll', updateScroll, { passive: true });


// Magnetic pointer, project label and a slower hero image plane.
if (matchMedia('(pointer:fine)').matches && !prefersReducedMotion) {
  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;


  window.addEventListener('mousemove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.classList.add('is-visible');
    const hero = $('.hero-image');
    if (hero && current === 'home') {
      const moveX = (event.clientX / innerWidth - .5) * 20;
      const moveY = (event.clientY / innerHeight - .5) * 14;
      hero.style.transform = `translate3d(${moveX}px,${moveY}px,0)`;
    }
  });


  function renderCursor() {
    cursorX += (mouseX - cursorX) * .16;
    cursorY += (mouseY - cursorY) * .16;
    cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(renderCursor);
  }
  renderCursor();


  $$('.project, .featured-card, .about-image').forEach(element => {
    element.addEventListener('mouseenter', () => cursor.classList.add('is-view'));
    element.addEventListener('mouseleave', () => cursor.classList.remove('is-view'));
  });
}


updateScroll();
runLoader();