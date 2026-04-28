/* ============================================================
   InkMatch — app.js
   ============================================================ */

// ── STATE ────────────────────────────────────────────────────
const APP = {
  user:      null,
  role:      'client',
  modalMode: 'register',
  booking:   {},
  calDay:    null,
  calTime:   null,
};

// ── ARTISTS DATA ─────────────────────────────────────────────
const ARTISTS = [
  {
    id: 1, name: 'Karolína Nováková', emoji: '🌸', cover: 'c1',
    city: 'Praha 2', studio: 'Studio BlackLine',
    tags: ['Fine Line', 'Watercolor', 'Geometric', 'Botanical'],
    rating: 4.9, reviews: 23, price: '1 500',
    styles: 'Fine Line, Watercolor, Geometric, Botanical — jemné linie, organické tvary, příroda'
  },
  {
    id: 2, name: 'Tomáš Kratochvíl', emoji: '🐍', cover: 'c2',
    city: 'Praha 6', studio: 'Ink & Soul',
    tags: ['Blackwork', 'Geometric', 'Fine Line', 'Dark'],
    rating: 4.8, reviews: 41, price: '1 200',
    styles: 'Blackwork, Geometric, Dark art — tučné linky, kontrastní vzory, abstraktní geometrie'
  },
  {
    id: 3, name: 'Nika Sedlářová', emoji: '🦋', cover: 'c3',
    city: 'Brno', studio: 'Studio Lotus',
    tags: ['Watercolor', 'Neo-traditional', 'Floral'],
    rating: 4.7, reviews: 18, price: '1 100',
    styles: 'Watercolor, Neo-traditional — barevné přechody, volné tahy, emotivní motivy'
  },
  {
    id: 4, name: 'Martin Vlček', emoji: '🗡️', cover: 'c4',
    city: 'Praha 5', studio: 'Old Bones Tattoo',
    tags: ['Traditional', 'American Traditional', 'Bold'],
    rating: 4.9, reviews: 67, price: '1 300',
    styles: 'Traditional, American Traditional — tučné obrysy, klasické motivy, námořnická tématika'
  },
  {
    id: 5, name: 'Simona Horáčková', emoji: '🌙', cover: 'c5',
    city: 'Praha 1', studio: 'Moon Ink',
    tags: ['Dotwork', 'Fine Line', 'Mandala'],
    rating: 4.8, reviews: 29, price: '1 400',
    styles: 'Dotwork, Fine Line, Mandala — body na body, symetrie, meditativní vzory'
  },
];

const AVAIL_DAYS = [3, 5, 6, 8, 9, 12, 13, 14, 16, 19, 22, 23, 26, 27];

// ── NAVIGATION ───────────────────────────────────────────────
function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function logout() {
  APP.user = null;
  go('s-landing');
  toast('Odhlášení proběhlo úspěšně');
}

// ── DEMO LOGIN ───────────────────────────────────────────────
function demoLogin(role) {
  APP.role = role;
  if (role === 'artist') {
    APP.user = { name: 'Karolína', surname: 'Nováková', email: 'demo@inkmatch.cz', role: 'artist', city: 'Praha 2' };
  } else {
    APP.user = { name: 'Demo', surname: 'Klient', email: 'klient@inkmatch.cz', role: 'client', city: 'Praha' };
  }
  enterApp();
}

// ── MODAL ────────────────────────────────────────────────────
function openModal(who) {
  APP.role      = (who === 'artist') ? 'artist' : 'client';
  APP.modalMode = (who === 'login')  ? 'login'  : 'register';
  updateModal();
  document.getElementById('overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
}

function updateModal() {
  const isLogin = APP.modalMode === 'login';
  document.getElementById('modal-title').textContent   = isLogin ? 'Přihlásit se' : 'Vítejte v InkMatch';
  document.getElementById('modal-sub').textContent     = isLogin ? 'Pokračujte ve svém účtu' : 'Vytvořte si účet zdarma';
  document.getElementById('register-fields').style.display = isLogin ? 'none'  : 'block';
  document.getElementById('login-fields').style.display    = isLogin ? 'block' : 'none';
  document.getElementById('role-toggle').style.display     = isLogin ? 'none'  : 'flex';
  document.getElementById('modal-btn').textContent         = isLogin ? 'Přihlásit se' : 'Zaregistrovat se';
  document.getElementById('modal-footer').innerHTML = isLogin
    ? 'Nemáte účet? <a onclick="switchToRegister()">Zaregistrovat se</a>'
    : 'Máte účet? <a onclick="switchToLogin()">Přihlásit se</a>';
  document.getElementById('err-msg').style.display = 'none';
  document.getElementById('rb-client').classList.toggle('on', APP.role === 'client');
  document.getElementById('rb-artist').classList.toggle('on', APP.role === 'artist');
}

function switchToLogin()    { APP.modalMode = 'login';    updateModal(); }
function switchToRegister() { APP.modalMode = 'register'; updateModal(); }
function setRole(r)         { APP.role = r; updateModal(); }

function showErr(msg) {
  const el = document.getElementById('err-msg');
  el.textContent   = msg;
  el.style.display = 'block';
}

function doAuth() {
  const isLogin = APP.modalMode === 'login';

  if (isLogin) {
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-pass').value;
    if (!email || !pass) { showErr('Vyplňte email a heslo.'); return; }
    const saved = localStorage.getItem('inkmatch_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.email === email) {
        APP.user = u;
        APP.role = u.role;
        closeModal();
        enterApp();
        return;
      }
    }
    APP.user = { name: 'Demo', surname: 'Uživatel', email, role: APP.role, city: 'Praha' };
    closeModal();
    enterApp();
    return;
  }

  // Register
  const name    = document.getElementById('r-name').value.trim();
  const surname = document.getElementById('r-surname').value.trim();
  const email   = document.getElementById('r-email').value.trim();
  const pass    = document.getElementById('r-pass').value;
  const city    = document.getElementById('r-city').value.trim();
  if (!name || !surname || !email || !pass) { showErr('Vyplňte prosím všechna pole.'); return; }

  APP.user = { name, surname, email, role: APP.role, city };
  localStorage.setItem('inkmatch_user', JSON.stringify(APP.user));
  closeModal();
  enterApp();
}

function enterApp() {
  const u        = APP.user;
  const fullName = u.name + ' ' + u.surname;
  toast('Vítejte, ' + u.name + '! 👋');

  if (APP.role === 'artist') {
    document.getElementById('nav-artist-name').textContent   = fullName;
    document.getElementById('dash-greeting').textContent     = 'Dobrý den, ' + u.name + ' ✦';
    document.getElementById('prof-name').value               = fullName;
    document.getElementById('prof-city').value               = u.city || '';
    document.getElementById('prof-display-name').textContent = fullName;
    document.getElementById('prof-display-city').textContent = u.city || '';
    go('s-artist');
  } else {
    document.getElementById('nav-client-name').textContent = fullName;
    go('s-client');
    resetSearch();
  }
}

// ── ARTIST DASHBOARD TABS ────────────────────────────────────
function switchTab(btn, tabId) {
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('on'));
  document.getElementById(tabId).classList.add('on');
}

function saveProfile() {
  const name = document.getElementById('prof-name').value;
  const city = document.getElementById('prof-city').value;
  document.getElementById('prof-display-name').textContent = name;
  document.getElementById('prof-display-city').textContent = city;
  toast('✓ Profil byl uložen');
}

// ── CLIENT SEARCH + AI ───────────────────────────────────────
function resetSearch() {
  document.getElementById('tattoo-desc').value = '';
  document.getElementById('style-sel').value   = '';
  document.getElementById('city-sel').value    = '';
  document.getElementById('ai-loading').classList.remove('on');
  document.getElementById('results-area').classList.remove('on');
  document.getElementById('ai-resp').classList.remove('on');
  document.getElementById('ai-resp').textContent = '';
}

async function runSearch() {
  const desc  = document.getElementById('tattoo-desc').value.trim();
  const style = document.getElementById('style-sel').value;
  const city  = document.getElementById('city-sel').value;
  if (!desc && !style) { toast('Popište prosím tetování nebo vyberte styl'); return; }

  document.getElementById('ai-loading').classList.add('on');
  document.getElementById('results-area').classList.remove('on');
  document.getElementById('ai-resp').classList.remove('on');

  const artistList = ARTISTS.map(a =>
    `- ${a.name} (ID:${a.id}): ${a.styles} | Hodnocení: ${a.rating} | Město: ${a.city}`
  ).join('\n');

  const prompt = `Jsi asistent tattoo matching platformy InkMatch. Klient hledá tatéra.

Popis klienta: "${desc || 'Neurčeno'}"
Preferovaný styl: "${style || 'Jakýkoliv'}"
Město: "${city || 'Celá ČR'}"

Dostupní tatéři:
${artistList}

Úkol:
1. Stručně (2-3 věty) analyzuj poptávku klienta česky.
2. Vrať JSON s klíčem "matches" — pole objektů: { "id": number, "score": number (0-100), "reason": string (1 věta česky) }
3. Seřaď sestupně podle score.
4. Odpověz POUZE ve formátu:
ANALYSIS: [tvoje analýza]
JSON: {"matches":[...]}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    const raw  = data.content?.[0]?.text || '';
    parseAndShowResults(raw);
  } catch (e) {
    showResultsFallback();
  }
}

function parseAndShowResults(raw) {
  document.getElementById('ai-loading').classList.remove('on');
  let analysis = '';
  let matches  = [];

  try {
    const aMatch = raw.match(/ANALYSIS:\s*(.+?)(?=JSON:|$)/s);
    const jMatch = raw.match(/JSON:\s*(\{[\s\S]*\})/);
    if (aMatch) analysis = aMatch[1].trim();
    if (jMatch) matches  = JSON.parse(jMatch[1]).matches || [];
  } catch (e) {
    showResultsFallback();
    return;
  }

  if (analysis) {
    const el = document.getElementById('ai-resp');
    el.textContent = '✦ ' + analysis;
    el.classList.add('on');
  }

  const grid = document.getElementById('artist-grid');
  grid.innerHTML = '';

  if (!matches.length) { showResultsFallback(); return; }

  document.getElementById('ai-summary').innerHTML =
    `<strong>AI analýza:</strong> ${analysis || 'Na základě vašeho popisu jsem vyhodnotil nejlepší shody.'}`;

  matches.forEach(m => {
    const a = ARTISTS.find(x => x.id === m.id);
    if (!a) return;
    grid.innerHTML += buildArtistCard(a, m.score, m.reason);
  });

  document.getElementById('results-sub').textContent = `${matches.length} tatérů nalezeno · seřazeno AI`;
  document.getElementById('results-area').classList.add('on');
}

function showResultsFallback() {
  document.getElementById('ai-loading').classList.remove('on');
  const scores  = [96, 89, 81, 74, 68];
  const reasons = [
    'Vynikající shoda stylu a zkušeností s požadovanou technikou.',
    'Bohaté portfolio odpovídá požadovanému stylu.',
    'Specialista na tento typ motivů s výbornými recenzemi.',
    'Vhodný tatér s podobnými pracemi v portfoliu.',
    'Zkušený umělec který pracuje v požadovaném stylu.'
  ];
  const grid = document.getElementById('artist-grid');
  grid.innerHTML = '';
  document.getElementById('ai-summary').innerHTML =
    `<strong>Výsledky hledání:</strong> Nalezeno ${ARTISTS.length} tatérů odpovídajících vašemu dotazu.`;
  ARTISTS.forEach((a, i) => { grid.innerHTML += buildArtistCard(a, scores[i], reasons[i]); });
  document.getElementById('results-sub').textContent = `${ARTISTS.length} tatérů nalezeno`;
  document.getElementById('results-area').classList.add('on');
}

function buildArtistCard(a, score, reason) {
  return `
  <div class="artist-card" onclick="goBooking(${a.id})">
    <div class="ac-cover ${a.cover}">
      ${a.emoji}
      <div class="ac-match">${score}% shoda</div>
    </div>
    <div class="ac-body">
      <div class="ac-name">${a.name}</div>
      <div class="ac-loc">📍 ${a.city} · ${a.studio}</div>
      <div class="ac-tags">${a.tags.map(t => `<span class="ac-tag">${t}</span>`).join('')}</div>
      <div class="ac-reason">${reason}</div>
      <div class="ac-foot">
        <div class="ac-rating">★ ${a.rating} <span style="color:var(--muted)">(${a.reviews})</span></div>
        <div class="ac-price">od ${a.price} Kč/hod</div>
      </div>
    </div>
  </div>`;
}

// ── BOOKING ──────────────────────────────────────────────────
function goBooking(artistId) {
  const a = ARTISTS.find(x => x.id === artistId);
  if (!a) return;
  APP.booking.artist = a;
  APP.calDay  = null;
  APP.calTime = null;

  document.getElementById('bk-av').textContent   = a.emoji;
  document.getElementById('bk-name').textContent = a.name;
  document.getElementById('bk-sub').textContent  = `${a.city} · ${a.studio}`;
  document.getElementById('sum-artist').textContent = a.name;
  document.getElementById('sum-loc').textContent    = `${a.studio}, ${a.city}`;
  document.getElementById('time-section').style.display = 'none';
  document.getElementById('summary-box').classList.remove('on');

  buildCal();
  go('s-booking');
}

function buildCal() {
  const grid = document.getElementById('cal-grid');
  const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  grid.innerHTML = days.map(d => `<div class="cal-hd">${d}</div>`).join('');

  // Květen 2025 začíná čtvrtkem → offset 3 (Po=0)
  for (let i = 0; i < 3; i++) grid.innerHTML += `<div></div>`;

  for (let d = 1; d <= 31; d++) {
    const avail = AVAIL_DAYS.includes(d);
    const past  = d < 6;
    let cls     = 'cal-day';
    if (past)        cls += ' off';
    else if (avail)  cls += ' avail';
    const click = (avail && !past) ? `onclick="pickDay(this,${d})"` : '';
    grid.innerHTML += `<div class="${cls}" ${click}>${d}</div>`;
  }
}

function pickDay(el, d) {
  document.querySelectorAll('.cal-day').forEach(x => x.classList.remove('sel'));
  el.classList.add('sel');
  APP.calDay  = d;
  APP.calTime = null;
  document.getElementById('sum-date').textContent = `${d}. května 2025`;
  buildTimes();
  document.getElementById('time-section').style.display = 'block';
  document.getElementById('summary-box').classList.remove('on');
}

function buildTimes() {
  const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  document.getElementById('time-grid').innerHTML = slots
    .map(t => `<button class="time-btn" onclick="pickTime(this,'${t}')">${t}</button>`)
    .join('');
}

function pickTime(el, t) {
  document.querySelectorAll('.time-btn').forEach(x => x.classList.remove('sel'));
  el.classList.add('sel');
  APP.calTime = t;
  document.getElementById('sum-time').textContent = t;
  document.getElementById('summary-box').classList.add('on');
}

function confirmBooking() {
  go('s-success');
  toast('🎉 Rezervace přidána do kalendáře!');
}

// ── TOAST ────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast-el');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}

// ── EVENT LISTENERS ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Zavření modalu kliknutím mimo
  document.getElementById('overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
});
