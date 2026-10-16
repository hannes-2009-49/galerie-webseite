const data = JSON.parse(document.getElementById('events-data').textContent || '[]');

const refs = {
  homeSection: document.getElementById('homeSection'),
  eventGrid: document.getElementById('eventGrid'),
  viewerSection: document.getElementById('viewerSection'),
  evTitle: document.getElementById('evTitle'),
  evMeta: document.getElementById('evMeta'),
  backBtn: document.getElementById('backBtn'),
  slideshow: document.getElementById('slideshow'),
  playPauseBtn: document.getElementById('playPauseBtn'),
  openFsBtn: document.getElementById('openFsBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  speedRange: document.getElementById('speedRange'),
  shuffleChk: document.getElementById('shuffleChk'),
  gallery: document.getElementById('gallery'),
  fsModal: document.getElementById('fsModal'),
  fsInner: document.getElementById('fsInner'),
  fsClose: document.getElementById('fsClose'),
  fsPrev: document.getElementById('fsPrev'),
  fsNext: document.getElementById('fsNext'),
  fsSlides: document.getElementById('fsSlides')
};

const state = {
  events: data,
  currentEvent: null,
  slideOrder: [],
  slidePos: 0,
  slideTimer: null,
  isPlaying: false,
  fsPos: 0,
  fsTimer: null,
  preFsPlaying: false
};

function qEscape(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

function renderHome(){
  refs.eventGrid.innerHTML = '';
  state.events.forEach(ev => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.addEventListener('click', ()=> openEvent(ev.slug));
    const thumbSrc = `bilder/${ev.slug}/${ev.bilder[0] ? ev.bilder[0].datei : ''}`;
    card.innerHTML = `
      <div class="thumb"><img src="${qEscape(thumbSrc)}" alt="${qEscape(ev.titel)}" loading="lazy"></div>
      <div class="card-body">
        <h3>${qEscape(ev.titel)}</h3>
        <div class="meta">${qEscape(ev.datum)} · ${qEscape(ev.ort)}</div>
      </div>`;
    refs.eventGrid.appendChild(card);
  });
}

function openEvent(slug){
  const ev = state.events.find(e=>e.slug === slug);
  if(!ev) return;
  state.currentEvent = ev;

  buildSlideOrder();

  refs.homeSection.style.display = 'none';
  refs.viewerSection.classList.add('visible');
  refs.viewerSection.setAttribute('aria-hidden','false');

  refs.evTitle.textContent = ev.titel;
  refs.evMeta.textContent = `${ev.datum} · ${ev.ort}`;

  renderSlides();
  renderGallery();

  startSlides();
}

refs.backBtn.addEventListener('click', goHome);
function goHome(){
  stopSlides();
  closeFs();
  refs.viewerSection.classList.remove('visible');
  refs.viewerSection.setAttribute('aria-hidden','true');
  refs.homeSection.style.display = '';
  state.currentEvent = null;
  refs.slideshow.querySelectorAll('.slide').forEach(n=>n.remove());
  refs.gallery.innerHTML = '';
}

function buildSlideOrder(){
  const n = (state.currentEvent && state.currentEvent.bilder) ? state.currentEvent.bilder.length : 0;
  state.slideOrder = Array.from({length:n}, (_,i)=>i);
  if(refs.shuffleChk.checked){
    for(let i = state.slideOrder.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [state.slideOrder[i], state.slideOrder[j]] = [state.slideOrder[j], state.slideOrder[i]];
    }
  }
  state.slidePos = 0;
}

function renderSlides(){
  const container = refs.slideshow;
  container.querySelectorAll('.slide').forEach(n=>n.remove());
  const imgs = state.currentEvent.bilder;
  imgs.forEach((b, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.innerHTML = `
      <img src="${qEscape('bilder/'+state.currentEvent.slug+'/'+b.datei)}" alt="${qEscape(b.text||b.datei)}" loading="lazy">
      <div class="caption">${qEscape(b.text||'')}</div>`;
    slide.addEventListener('dblclick', ()=> openFs(idx, 'slideshow'));
    container.appendChild(slide);
  });
  showCurrentSlide();
}

function showCurrentSlide(){
  const slides = Array.from(refs.slideshow.querySelectorAll('.slide'));
  if(slides.length === 0) return;
  const abs = state.slideOrder[state.slidePos] ?? 0;
  slides.forEach((s, idx)=> s.classList.toggle('active', idx === abs));
}

refs.prevBtn.addEventListener('click', ()=> { prevSlide(); pauseThenResume(); });
refs.nextBtn.addEventListener('click', ()=> { nextSlide(); pauseThenResume(); });
refs.playPauseBtn.addEventListener('click', ()=> togglePlay());
refs.speedRange.addEventListener('input', ()=> {
  if(state.slideTimer) {
    startSlides();
  }
});
refs.shuffleChk.addEventListener('change', ()=> {
  buildSlideOrder();
  showCurrentSlide();
});

function nextSlide(){
  if(!state.slideOrder.length) return;
  state.slidePos = (state.slidePos + 1) % state.slideOrder.length;
  showCurrentSlide();
}
function prevSlide(){
  if(!state.slideOrder.length) return;
  state.slidePos = (state.slidePos - 1 + state.slideOrder.length) % state.slideOrder.length;
  showCurrentSlide();
}

function startSlides(){
  stopSlides();
  const sec = Math.max(1, Number(refs.speedRange.value || 3));
  state.slideTimer = setInterval(()=> nextSlide(), sec * 1000);
  state.isPlaying = true;
  refs.playPauseBtn.textContent = '❚❚';
}
function stopSlides(){
  if(state.slideTimer){ clearInterval(state.slideTimer); state.slideTimer = null; }
  state.isPlaying = false;
  refs.playPauseBtn.textContent = '►';
}
function togglePlay(){ if(state.slideTimer) stopSlides(); else startSlides(); }

let _pauseTimeout = null;
function pauseThenResume(){
  stopSlides();
  if(_pauseTimeout) clearTimeout(_pauseTimeout);
  _pauseTimeout = setTimeout(()=> {
    _pauseTimeout = null;
    startSlides();
  }, 3000);
}

document.addEventListener('keydown', (e)=>{
  if(!state.currentEvent) return;
  if(refs.fsModal.classList.contains('open')) return;
  if(e.key === 'ArrowRight'){ nextSlide(); pauseThenResume(); }
  if(e.key === 'ArrowLeft'){ prevSlide(); pauseThenResume(); }
  if(e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); togglePlay(); }
});

function renderGallery(){
  const g = refs.gallery;
  g.innerHTML = '';
  const imgs = state.currentEvent.bilder || [];
  imgs.forEach((b, idx) => {
    const wrap = document.createElement('a');
    const cls = (idx % 7 === 0) ? 'large' : (idx % 5 === 0) ? 'medium' : 'small';
    wrap.className = `gitem ${cls}`;
    wrap.href = 'javascript:void(0)';
    const imgEl = document.createElement('img');
    imgEl.src = `bilder/${state.currentEvent.slug}/${b.datei}`;
    imgEl.alt = b.text || b.datei;
    imgEl.loading = 'lazy';
    wrap.appendChild(imgEl);
    wrap.addEventListener('click', (ev) => { ev.preventDefault(); openFs(idx, 'gallery'); });
    g.appendChild(wrap);
  });
}

refs.openFsBtn.addEventListener('click', ()=> {
  const absIndex = state.slideOrder[state.slidePos] ?? 0;
  openFs(absIndex, 'slideshow');
});
refs.fsPrev.addEventListener('click', ()=> { fsPrev(); });
refs.fsNext.addEventListener('click', ()=> { fsNext(); });

refs.fsClose.addEventListener('click', ()=> {
  closeFs();
});

function openFs(startIndex = 0, source = 'slideshow'){
  refs.fsSlides.querySelectorAll('.fs-slide').forEach(n=>n.remove());
  const imgs = state.currentEvent.bilder || [];
  imgs.forEach((b, idx) => {
    const s = document.createElement('div');
    s.className = 'fs-slide' + (idx === startIndex ? ' active' : '');
    s.innerHTML = `<img src="bilder/${state.currentEvent.slug}/${b.datei}" alt="${qEscape(b.text||b.datei)}">`;
    refs.fsSlides.appendChild(s);
  });
  state.fsPos = startIndex;

  if(source === 'slideshow'){
    state.preFsPlaying = !!state.slideTimer;
    stopSlides();
    if(state.preFsPlaying){
      startFsAuto();
    } else {
      stopFsAuto();
    }
  } else {
    state.preFsPlaying = false;
    stopSlides();
    stopFsAuto();
  }

  refs.fsModal.classList.add('open');
  refs.fsModal.setAttribute('aria-hidden','false');

  document.addEventListener('keydown', fsKeyHandler);

}

function closeFs(){
  stopFsAuto();

  refs.fsModal.classList.remove('open');
  refs.fsModal.setAttribute('aria-hidden','true');
  refs.fsSlides.querySelectorAll('.fs-slide').forEach(n=>n.remove());

  document.removeEventListener('keydown', fsKeyHandler);

  const abs = state.fsPos;
  const posInOrder = state.slideOrder.indexOf(abs);
  if(posInOrder >= 0){
    state.slidePos = posInOrder;
  } else {
    state.slidePos = 0;
  }
  showCurrentSlide();

  if(state.preFsPlaying){
    startSlides();
  }
  state.preFsPlaying = false;
}

function startFsAuto(){
  stopFsAuto();
  const sec = Math.max(1, Number(refs.speedRange.value || 3));
  state.fsTimer = setInterval(()=> {
    fsNext();
  }, sec * 1000);
}
function stopFsAuto(){
  if(state.fsTimer){ clearInterval(state.fsTimer); state.fsTimer = null; }
}

function fsShow(pos){
  const slides = Array.from(refs.fsSlides.querySelectorAll('.fs-slide'));
  if(!slides.length) return;
  slides.forEach((s, idx) => s.classList.toggle('active', idx === pos));
  state.fsPos = pos;
}

function fsNext(){
  const n = (state.currentEvent.bilder || []).length;
  if(n === 0) return;
  const next = (state.fsPos + 1) % n;
  fsShow(next);
}
function fsPrev(){
  const n = (state.currentEvent.bilder || []).length;
  if(n === 0) return;
  const prev = (state.fsPos - 1 + n) % n;
  fsShow(prev);
}

function fsKeyHandler(e){
  if(!refs.fsModal.classList.contains('open')) return;
  if(e.key === 'Escape'){ closeFs(); }
  if(e.key === 'ArrowRight'){ fsNext(); }
  if(e.key === 'ArrowLeft'){ fsPrev(); }
}

refs.fsModal.addEventListener('click', (ev) => {
  if(ev.target === refs.fsModal) closeFs();
});

(function init(){
  renderHome();
  refs.viewerSection.classList.remove('visible');
  refs.viewerSection.setAttribute('aria-hidden','true');
})();

firebase.initializeApp({
  apiKey: "AIzaSyB5lzlZti7rj-9ZZxDrs-0sTXY1CrI4Ptk",
  authDomain: "unsere-zeit.firebaseapp.com",
  projectId: "unsere-zeit",
  appId: "1:299622851652:web:86101fd400cade7626c811"
});

const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
  }
});

document.querySelectorAll('.logout-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn('Fehler beim SignOut', err);
    } finally {
      window.location.href = "index.html";
    }
  });
});