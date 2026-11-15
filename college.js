let data = [];
let currentCollegeData = [];
let currentCourses = [];
let activeCourse = '';

const GENDER_LABEL = { Gents: 'Gents', Ladies: 'Ladies', G_PWD: 'PWD', G_DEF: 'Defence', G_OF: 'Orphan' };
const SEAT_LABEL = { HOME: 'Home University', OTHER: 'Other University', STATE: 'State Level' };
const FIELD_LABEL = { branch: 'All branches', course: 'All courses', district: 'All districts', category: 'All categories', gender: 'All genders' };
const canHover = window.matchMedia('(hover: hover)').matches;

// Branch families, checked in order against the lowercase course name
const BRANCHES = [
  ['Computer & IT', /^(computer|cloud|cyber|information technology|internet of things|industrial iot)/],
  ['AI & Data Science', /^(artificial intelligence|data science)/],
  ['Robotics & Automation', /^(robotics|automation|mechatronics)/],
  ['Electronics & Telecom', /^electronics/],
  ['Electrical & Instrumentation', /^(electrical|instrumentation)/],
  ['Mechanical & Production', /^(mechanical|production|manufacturing|automobile|aeronautical)/],
  ['Civil & Structural', /^(civil|structural)/],
  ['Textile & Fashion', /(textile|^fashion|^fibres|^man made)/],
  ['Chemical, Petro & Polymer', /^(chemical|petro|oil|paint|dyestuff|surface coating|plastic|polymer|paper|printing|pharma)/],
  ['Food, Bio & Agriculture', /^(food|bio|agricultural)/],
  ['Metallurgy & Mining', /^(metallurg|mining)/]
];
const OTHER_BRANCH = 'Other Engineering';
const branchOf = c => (BRANCHES.find(([, re]) => re.test(c)) || [OTHER_BRANCH])[0];
const BRANCH_ORDER = [...BRANCHES.map(b => b[0]), OTHER_BRANCH];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const capitalize = s => s.replace(/\b\w/g, c => c.toUpperCase());
const normalize = s => s.toLowerCase().trim();
const normalizeCollege = s => s.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
const gLabel = g => GENDER_LABEL[g] || g;

function toggleFilters() {
  const f = document.querySelector('.filters');
  if (f) f.classList.toggle('active');
}

// -------------------------
// Load data
// -------------------------
async function loadData() {
  try {
    const res = await fetch('Assets/data_2026.json');
    data = (await res.json()).map(item => ({
      ...item,
      course: normalize(item.course),
      branch: branchOf(normalize(item.course)),
      district: normalize(item.district),
      category: item.category.trim(),
      gender: item.gender.trim(),
      normalizedCollege: normalizeCollege(item.college_name)
    }));
    populateFilters();
    applyUrl();
  } catch (e) {
    document.getElementById('results').innerHTML =
      '<p class="empty">Cutoff data could not be loaded. Check that Assets/data_2026.json exists, then reload.</p>';
  }
}

const getUnique = f => [...new Set(data.map(i => i[f]))].sort();

function populateSelect(id, values) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">${FIELD_LABEL[id]}</option>` +
    values.map(v => `<option value="${esc(v)}">${esc(id === 'gender' ? gLabel(v) : id === 'category' ? v : capitalize(v))}</option>`).join('');
}

function populateBranches() {
  const counts = {};
  data.forEach(i => { (counts[i.branch] = counts[i.branch] || new Set()).add(i.course); });
  const sel = document.getElementById('branch');
  sel.innerHTML = `<option value="">${FIELD_LABEL.branch}</option>` +
    BRANCH_ORDER.filter(b => counts[b]).map(b => `<option value="${esc(b)}">${esc(b)} (${counts[b].size})</option>`).join('');
}

// Course list follows the chosen branch; with no branch it is grouped by branch
function populateCourses() {
  const branch = document.getElementById('branch').value;
  const sel = document.getElementById('course');
  const opt = c => `<option value="${esc(c)}">${esc(capitalize(c))}</option>`;
  let html = `<option value="">${FIELD_LABEL.course}</option>`;
  if (branch) {
    html += getUnique('course').filter(c => branchOf(c) === branch).map(opt).join('');
  } else {
    BRANCH_ORDER.forEach(b => {
      const list = getUnique('course').filter(c => branchOf(c) === b);
      if (list.length) html += `<optgroup label="${esc(b)}">${list.map(opt).join('')}</optgroup>`;
    });
  }
  sel.innerHTML = html;
}

function populateFilters() {
  populateBranches();
  populateCourses();
  ['district', 'category', 'gender'].forEach(id => populateSelect(id, getUnique(id)));
}

// -------------------------
// Filter logic (unchanged behaviour)
// -------------------------
const PAGE = 24;
let lastResults = [], shown = 0;
let shortlist = [];
try { shortlist = JSON.parse(localStorage.getItem('cf_shortlist') || '[]'); } catch (e) {}

const entryKey = it => [it.college_name, it.course, it.category, it.gender, it.seat_type].join('|');
const isSaved = it => shortlist.some(s => s.k === entryKey(it));
const gv = id => document.getElementById(id).value;

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

// ----- Filters <-> URL -----
function readFilters() {
  return { p: gv('percentile'), q: gv('collegeSearch'), branch: gv('branch'), course: gv('course'),
    district: gv('district'), category: gv('category'), gender: gv('gender'), sort: gv('sort') };
}
function writeUrl(f) {
  const u = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'high')) u.set(k, v); });
  const qs = u.toString();
  try { history.replaceState(null, '', qs ? '?' + qs : location.pathname); } catch (e) {}
}
function applyUrl() {
  const u = new URLSearchParams(location.search);
  if (![...u.keys()].length) return;
  const set = (id, v) => { if (v != null) document.getElementById(id).value = v; };
  set('percentile', u.get('p')); set('collegeSearch', u.get('q')); set('branch', u.get('branch'));
  populateCourses();
  set('course', u.get('course')); set('district', u.get('district'));
  set('category', u.get('category')); set('gender', u.get('gender')); set('sort', u.get('sort') || 'high');
  filterData(true);
}
function copySearchLink() {
  writeUrl(readFilters());
  const done = () => toast('Search link copied');
  if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, () => prompt('Copy this link', location.href));
  else prompt('Copy this link', location.href);
}

// ----- Filter, sort, paginate -----
function filterData(fromUrl) {
  const f = readFilters();
  const percentile = f.p ? parseFloat(f.p) : null;
  const search = normalizeCollege(f.q), course = normalize(f.course), district = normalize(f.district);

  const results = data.filter(item => {
    const p = Number(item.percentile);
    const pMatch = percentile === null || isNaN(percentile) ||
      (p <= percentile + 1 && p >= Math.max(0, percentile - 15));
    return pMatch &&
      (!search || item.normalizedCollege.includes(search)) &&
      (!f.branch || item.branch === f.branch) &&
      (!course || item.course === course) &&
      (!district || item.district.includes(district)) &&
      (!f.category || item.category === f.category) &&
      (!f.gender || item.gender === f.gender);
  });

  const sorters = {
    high: (a, b) => b.percentile - a.percentile,
    low: (a, b) => a.percentile - b.percentile,
    az: (a, b) => a.college_name.localeCompare(b.college_name) || b.percentile - a.percentile
  };
  results.sort(sorters[f.sort] || sorters.high);
  lastResults = results; shown = 0;
  writeUrl(f);

  const box = document.getElementById('results');
  if (!results.length) {
    box.innerHTML = '<p class="empty">No colleges matched. Try a wider district or course, or lower the percentile.</p>';
    return;
  }
  box.innerHTML = `<p class="count">${results.length} matching entries</p><button class="more" id="moreBtn"></button>`;
  renderBatch();

  if (fromUrl !== true && window.innerWidth <= 1000) {
    document.querySelector('.filters').classList.remove('active');
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function cardHtml(it, i) {
  return `
    <article class="card" style="--i:${Math.min(i, 14)}" data-college="${esc(it.college_name)}" tabindex="0">
      <button class="heart ${isSaved(it) ? 'on' : ''}" data-key="${esc(entryKey(it))}" aria-label="Save to shortlist" aria-pressed="${isSaved(it)}">♥</button>
      <h3>${esc(it.college_name)}</h3>
      <p class="course">${esc(capitalize(it.course))}</p>
      <p class="loc">${esc(capitalize(it.district))}</p>
      <div class="chips">
        <span class="chip">${esc(it.category)}</span>
        <span class="chip">${esc(gLabel(it.gender))}</span>
        <span class="chip">${esc(SEAT_LABEL[it.seat_type] || it.seat_type)}</span>
      </div>
      <div class="percentile">Cutoff <b>${it.percentile}</b></div>
    </article>`;
}

function renderBatch() {
  const box = document.getElementById('results'), more = document.getElementById('moreBtn');
  const batch = lastResults.slice(shown, shown + PAGE);
  more.insertAdjacentHTML('beforebegin', batch.map(cardHtml).join(''));
  const cards = [...box.querySelectorAll('.card')].slice(shown);
  shown += batch.length;
  bindCards(cards);
  const left = lastResults.length - shown;
  more.style.display = left > 0 ? '' : 'none';
  more.textContent = `Show ${Math.min(PAGE, left)} more (${left} left)`;
  more.onclick = renderBatch;
}

function bindCards(cards) {
  cards.forEach(card => {
    const open = () => openCollegeModal(card.dataset.college);
    card.addEventListener('click', e => {
      const heart = e.target.closest('.heart');
      if (heart) { toggleSave(heart.dataset.key); return; }
      open();
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === card) open(); });
    if (canHover) {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    }
  });
}

// ----- Shortlist -----
function persistShortlist() {
  try { localStorage.setItem('cf_shortlist', JSON.stringify(shortlist)); } catch (e) {}
  document.getElementById('shortCount').textContent = shortlist.length;
  document.querySelectorAll('.heart').forEach(b => {
    const on = shortlist.some(s => s.k === b.dataset.key);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  });
}
function toggleSave(key) {
  const i = shortlist.findIndex(s => s.k === key);
  if (i >= 0) { shortlist.splice(i, 1); }
  else {
    const it = lastResults.find(x => entryKey(x) === key);
    if (!it) return;
    shortlist.push({ k: key, college_name: it.college_name, course: it.course, district: it.district,
      category: it.category, gender: it.gender, seat_type: it.seat_type, percentile: it.percentile });
    toast('Saved to shortlist');
  }
  persistShortlist();
}
const shortLine = s => `${s.college_name} - ${capitalize(s.course)} (${s.category}, ${gLabel(s.gender)}, ${SEAT_LABEL[s.seat_type] || s.seat_type}) cutoff ${s.percentile}`;
const shortText = () => 'My college shortlist (MHT CET 2026 Round 1 cutoffs)\n' +
  shortlist.map((s, i) => `${i + 1}. ${shortLine(s)}`).join('\n') + '\n' + location.origin + location.pathname;

function openShortlist() {
  const body = document.getElementById('modalBody');
  if (!shortlist.length) {
    body.innerHTML = '<div class="modal-section"><h2>Your shortlist</h2><p>Nothing saved yet. Tap the heart on any card to add it here.</p></div>';
  } else {
    body.innerHTML = `
      <div class="modal-section"><h2>Your shortlist</h2>
        <p>Order colleges by preference, then share or print them as a helper for your CAP option form.</p>
        <ol class="short-list">${shortlist.map((s, i) => `
          <li><span>${i + 1}.</span>
            <div class="info"><b>${esc(s.college_name)}</b>${esc(capitalize(s.course))} · ${esc(s.category)} · ${esc(gLabel(s.gender))} · ${esc(SEAT_LABEL[s.seat_type] || s.seat_type)} · cutoff ${s.percentile}</div>
            <button data-act="up" data-i="${i}" aria-label="Move up">↑</button>
            <button data-act="down" data-i="${i}" aria-label="Move down">↓</button>
            <button data-act="del" data-i="${i}" aria-label="Remove">✕</button>
          </li>`).join('')}</ol>
        <div class="short-actions">
          <button class="wa" data-act="wa">Share on WhatsApp</button>
          <button data-act="copy">Copy list</button>
          <button data-act="print">Print</button>
        </div>
      </div>`;
  }
  document.getElementById('collegeModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function shortlistAction(e) {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const act = b.dataset.act, i = +b.dataset.i;
  if (act === 'up' && i > 0) [shortlist[i - 1], shortlist[i]] = [shortlist[i], shortlist[i - 1]];
  else if (act === 'down' && i < shortlist.length - 1) [shortlist[i + 1], shortlist[i]] = [shortlist[i], shortlist[i + 1]];
  else if (act === 'del') shortlist.splice(i, 1);
  else if (act === 'wa') { window.open('https://wa.me/?text=' + encodeURIComponent(shortText()), '_blank', 'noopener'); return; }
  else if (act === 'copy') {
    if (navigator.clipboard) navigator.clipboard.writeText(shortText()).then(() => toast('List copied'));
    return;
  }
  else if (act === 'print') {
    document.getElementById('printArea').innerHTML = `<h2>College shortlist - MHT CET 2026 CAP Round 1 cutoffs</h2>
      <table><thead><tr><th>#</th><th>College</th><th>District</th><th>Course</th><th>Category</th><th>Gender</th><th>Seat</th><th>Cutoff</th><th>Choice code</th></tr></thead><tbody>${
      shortlist.map((s, n) => `<tr><td>${n + 1}</td><td>${esc(s.college_name)}</td><td>${esc(capitalize(s.district))}</td><td>${esc(capitalize(s.course))}</td><td>${esc(s.category)}</td><td>${esc(gLabel(s.gender))}</td><td>${esc(SEAT_LABEL[s.seat_type] || s.seat_type)}</td><td>${s.percentile}</td><td></td></tr>`).join('')}</tbody></table>`;
    window.print();
    return;
  }
  persistShortlist();
  openShortlist();
}

// -------------------------
// Modal
// -------------------------
function openCollegeModal(collegeName) {
  currentCollegeData = data.filter(i => i.college_name === collegeName);
  currentCourses = [...new Set(currentCollegeData.map(i => i.course))].sort();
  activeCourse = currentCourses[0] || '';

  const ps = currentCollegeData.map(i => i.percentile);
  const hi = Math.max(...ps), lo = Math.min(...ps);
  const hiB = currentCollegeData.find(i => i.percentile === hi).course;
  const loB = currentCollegeData.find(i => i.percentile === lo).course;

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-section">
      <h2>${esc(collegeName)}</h2>
      <p><strong>District:</strong> ${esc(capitalize(currentCollegeData[0].district))}</p>
      <p><strong>Courses:</strong> ${currentCourses.length} &nbsp; <strong>Cutoff entries:</strong> ${currentCollegeData.length}</p>
      <p><strong>Highest cutoff:</strong> ${hi} (${esc(capitalize(hiB))}) &nbsp; <strong>Lowest:</strong> ${lo} (${esc(capitalize(loB))})</p>
    </div>
    <div id="courseTabs" class="modal-section"></div>
    <div id="courseDetails" class="modal-section"></div>`;

  renderCourseTabs();
  if (activeCourse) renderCourseDetails(activeCourse);
  document.getElementById('collegeModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeCollegeModal() {
  document.getElementById('collegeModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  currentCollegeData = []; currentCourses = []; activeCourse = '';
}

function renderCourseTabs() {
  const box = document.getElementById('courseTabs');
  if (!box) return;
  box.innerHTML = `<h3>Choose a course</h3><div class="course-pills">${currentCourses.map(c =>
    `<button class="course-pill ${c === activeCourse ? 'active' : ''}" data-course="${esc(c)}">${esc(capitalize(c))}</button>`).join('')}</div>`;
  box.querySelectorAll('.course-pill').forEach(b => b.addEventListener('click', () => setActiveCourse(b.dataset.course)));
}

function renderCourseDetails(course) {
  const box = document.getElementById('courseDetails');
  if (!box) return;
  const rows = currentCollegeData.filter(i => i.course === course).sort((a, b) => b.percentile - a.percentile);
  if (!rows.length) { box.innerHTML = '<p>No data available for this course.</p>'; return; }
  const ps = rows.map(i => i.percentile);
  box.innerHTML = `
    <h3>${esc(capitalize(course))}</h3>
    <div class="course-stats">
      <p><strong>Highest:</strong> ${Math.max(...ps)}</p>
      <p><strong>Lowest:</strong> ${Math.min(...ps)}</p>
      <p><strong>Categories:</strong> ${new Set(rows.map(i => i.category)).size}</p>
    </div>
    <div class="table-container"><table>
      <thead><tr><th>Category</th><th>Gender</th><th>Percentile</th><th>Seat type</th></tr></thead>
      <tbody>${rows.map(i => `<tr><td>${esc(i.category)}</td><td>${esc(gLabel(i.gender))}</td><td>${i.percentile}</td><td>${esc(SEAT_LABEL[i.seat_type] || i.seat_type)}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

function setActiveCourse(course) {
  activeCourse = course;
  renderCourseTabs();
  renderCourseDetails(course);
}

// -------------------------
// Listeners
// -------------------------
function setupListeners() {
  document.getElementById('modalBody').addEventListener('click', shortlistAction);
  document.getElementById('shortCount').textContent = shortlist.length;
  document.getElementById('branch').addEventListener('change', populateCourses);
  document.querySelector('.close').addEventListener('click', closeCollegeModal);
  document.getElementById('collegeModal').addEventListener('click', e => {
    if (e.target.id === 'collegeModal') closeCollegeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCollegeModal(); });
  document.querySelectorAll('.filters input').forEach(i =>
    i.addEventListener('keydown', e => { if (e.key === 'Enter') filterData(); }));

}

loadData();
setupListeners();