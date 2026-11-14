let data = [];
let currentCollegeData = [];
let currentCourses = [];
let activeCourse = '';

const GENDER_LABEL = { Gents: 'Gents', Ladies: 'Ladies', G_PWD: 'PWD', G_DEF: 'Defence', G_OF: 'Orphan' };
const SEAT_LABEL = { HOME: 'Home University', OTHER: 'Other University', STATE: 'State Level' };
const FIELD_LABEL = { course: 'All courses', district: 'All districts', category: 'All categories', gender: 'All genders' };
const canHover = window.matchMedia('(hover: hover)').matches;

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
      district: normalize(item.district),
      category: item.category.trim(),
      gender: item.gender.trim(),
      normalizedCollege: normalizeCollege(item.college_name)
    }));
    populateFilters();
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

function populateFilters() {
  ['course', 'district', 'category', 'gender'].forEach(id => populateSelect(id, getUnique(id)));
}

// -------------------------
// Filter logic (unchanged behaviour)
// -------------------------
function filterData() {
  const pInput = document.getElementById('percentile').value;
  const percentile = pInput ? parseFloat(pInput) : null;
  const search = normalizeCollege(document.getElementById('collegeSearch').value);
  const course = normalize(document.getElementById('course').value);
  const district = normalize(document.getElementById('district').value);
  const category = document.getElementById('category').value;
  const gender = document.getElementById('gender').value;

  let results = data.filter(item => {
    const p = Number(item.percentile);
    const pMatch = percentile === null || isNaN(percentile) ||
      (p <= percentile + 1 && p >= Math.max(0, percentile - 15));
    return pMatch &&
      (!search || item.normalizedCollege.includes(search)) &&
      (!course || item.course.includes(course)) &&
      (!district || item.district.includes(district)) &&
      (!category || item.category === category) &&
      (!gender || item.gender === gender);
  });

  results.sort((a, b) => b.percentile - a.percentile);
  displayResults(results.slice(0, 100));

  if (window.innerWidth <= 1000) {
    document.querySelector('.filters').classList.remove('active');
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// -------------------------
// Results
// -------------------------
function displayResults(results) {
  const box = document.getElementById('results');
  if (!results.length) {
    box.innerHTML = '<p class="empty">No colleges matched. Try a wider district or course, or lower the percentile.</p>';
    return;
  }
  box.innerHTML = results.map((it, i) => `
    <article class="card" style="--i:${Math.min(i, 14)}" data-college="${esc(it.college_name)}" tabindex="0">
      <h3>${esc(it.college_name)}</h3>
      <p class="course">${esc(capitalize(it.course))}</p>
      <p class="loc">${esc(capitalize(it.district))}</p>
      <div class="chips">
        <span class="chip">${esc(it.category)}</span>
        <span class="chip">${esc(gLabel(it.gender))}</span>
        <span class="chip">${esc(SEAT_LABEL[it.seat_type] || it.seat_type)}</span>
      </div>
      <div class="percentile">Cutoff <b>${it.percentile}</b></div>
    </article>`).join('');

  box.querySelectorAll('.card').forEach(card => {
    const open = () => openCollegeModal(card.dataset.college);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    if (canHover) {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    }
  });
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