let data = [];

// Modal state
let currentCollegeData = [];
let currentCourses = [];
let activeCourse = '';


function capitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}
function toggleFilters() {
  const filters = document.querySelector(".filters");
  if (!filters) return;

  filters.classList.toggle("active");
}
// -------------------------
// Load Data
// -------------------------
async function loadData() {
  const res = await fetch("Assets/data_2025.json");
  data = await res.json();

  // Clean data once
  data = data.map(item => ({
    ...item,
    course: normalize(item.course),
    district: normalize(item.district),
    category: item.category.trim(),
    gender: item.gender.trim(),
    normalizedCollege: normalizeCollege(item.college_name)
  }));

  populateFilters();
}

// -------------------------
// Normalize (VERY IMPORTANT)
// -------------------------
function normalize(str) {
  return str.toLowerCase().trim();
}

// -------------------------
// Normalize College Name for Search
// -------------------------
function normalizeCollege(str) {
  return str.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
}

// -------------------------
// Get Unique Values
// -------------------------
function getUnique(field) {
  return [...new Set(data.map(item => item[field]))].sort();
}

// -------------------------
// Populate Dropdowns
// -------------------------
function populateSelect(id, values) {
  const select = document.getElementById(id);

  select.innerHTML = `<option value="">Select ${id}</option>`;

  values.forEach(val => {
    select.innerHTML += `<option value="${val}">${val}</option>`;
  });
}

function populateFilters() {
  populateSelect("course", getUnique("course"));
  populateSelect("district", getUnique("district"));
  populateSelect("category", getUnique("category"));
  populateSelect("gender", getUnique("gender"));
}

// -------------------------
// Filter Logic
// -------------------------
function filterData() {

  // -------------------------
  // Get Input Values
  // -------------------------
  const percentileInput = document.getElementById("percentile").value;

  const percentile = percentileInput
    ? parseFloat(percentileInput)
    : null;

  const collegeSearch = document.getElementById("collegeSearch").value;

  const course = normalize(
    document.getElementById("course").value
  );

  const district = normalize(
    document.getElementById("district").value
  );

  const category =
    document.getElementById("category").value;

  const gender =
    document.getElementById("gender").value;

  const normalizedSearch =
    normalizeCollege(collegeSearch);

  // -------------------------
  // Filter Data
  // -------------------------
  let results = data.filter(item => {

    // Convert percentile safely
    const itemPercentile = Number(item.percentile);

    // Percentile Logic
    let percentileMatch = true;

    if (percentile !== null && !isNaN(percentile)) {

      // Example:
      // Input 90
      // Shows 91 down to 75
      percentileMatch =
        itemPercentile <= percentile + 1 &&
        itemPercentile >= Math.max(0, percentile - 15);
    }

    return (
      percentileMatch &&

      (!collegeSearch ||
        item.normalizedCollege.includes(normalizedSearch)) &&

      (!course ||
        item.course.includes(course)) &&

      (!district ||
        item.district.includes(district)) &&

      (!category ||
        item.category === category) &&

      (!gender ||
        item.gender === gender)
    );
  });

  // -------------------------
  // Sort Highest to Lowest
  // -------------------------
  results.sort((a, b) => b.percentile - a.percentile);

  // -------------------------
  // Limit Results
  // -------------------------
  results = results.slice(0, 100);

  // -------------------------
  // Display
  // -------------------------
  displayResults(results);
}

// -------------------------
// Display Results
// -------------------------
function displayResults(results) {
  const container = document.getElementById("results");

  if (results.length === 0) {
    container.innerHTML = "<p>No colleges found</p>";
    return;
  }

  container.innerHTML = results.map(item => `
    <div class="card">
      <h3>${item.college_name}</h3>
      <p><b>${capitalize(item.course)}</b></p>
      <p>${capitalize(item.district)}</p>
      <p>${item.category} • ${item.gender}</p>
      <div class="percentile">Cutoff: ${item.percentile}</div>
    </div>
  `).join("");

  // Add click listeners to cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openCollegeModal(card));
  });
}

// -------------------------
// Modal Functions
// -------------------------
function openCollegeModal(card) {
  const collegeName = card.querySelector('h3').textContent;
  currentCollegeData = data.filter(item => item.college_name === collegeName);
  currentCourses = [...new Set(currentCollegeData.map(item => item.course))].sort();
  activeCourse = currentCourses[0] || '';

  // Calculate overall stats
  const allPercentiles = currentCollegeData.map(item => item.percentile);
  const highestOverall = Math.max(...allPercentiles);
  const lowestOverall = Math.min(...allPercentiles);
  const highestItem = currentCollegeData.find(item => item.percentile === highestOverall);
  const lowestItem = currentCollegeData.find(item => item.percentile === lowestOverall);
  const highestBranch = highestItem ? highestItem.course : 'N/A';
  const lowestBranch = lowestItem ? lowestItem.course : 'N/A';

  const modalBody = document.getElementById('modalBody');

  // Section A: College Info
  const district = currentCollegeData[0].district;
  const totalCourses = currentCourses.length;
  const totalEntries = currentCollegeData.length;

  modalBody.innerHTML = `
    <div id="collegeInfo" class="modal-section">
      <h2>${collegeName}</h2>
      <p><strong>District:</strong> ${capitalize(district)}</p>
      <p><strong>Total Courses:</strong> ${totalCourses}</p>
      <p><strong>Total Cutoff Entries:</strong> ${totalEntries}</p>
    </div>
    <div id="courseTabs" class="modal-section"></div>
    <div id="courseDetails" class="modal-section"></div>
    <div id="collegeStats" class="modal-section">
      <h3>College Statistics</h3>
      <p><strong>Highest Cutoff:</strong> ${highestOverall} (${capitalize(highestBranch)})</p>
      <p><strong>Lowest Cutoff:</strong> ${lowestOverall} (${capitalize(lowestBranch)})</p>
    </div>
  `;

  renderCourseTabs();
  if (activeCourse) {
    renderCourseDetails(activeCourse);
  }

  // Show modal
  const modal = document.getElementById('collegeModal');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeCollegeModal() {
  const modal = document.getElementById('collegeModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  // Reset modal state
  currentCollegeData = [];
  currentCourses = [];
  activeCourse = '';
}

// -------------------------
// Course Rendering Functions
// -------------------------
function renderCourseTabs() {
  const tabsContainer = document.getElementById('courseTabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = `
    <h3>Select Course</h3>
    <div class="course-pills">
      ${currentCourses.map(course => `
        <button class="course-pill ${course === activeCourse ? 'active' : ''}" onclick="setActiveCourse('${course}')">
          ${capitalize(course)}
        </button>
      `).join('')}
    </div>
  `;
}

function renderCourseDetails(course) {
  const detailsContainer = document.getElementById('courseDetails');
  if (!detailsContainer) return;

  const courseData = currentCollegeData.filter(item => item.course === course);

  if (courseData.length === 0) {
    detailsContainer.innerHTML = '<p>No data available for this course.</p>';
    return;
  }

  // Sort by percentile descending
  courseData.sort((a, b) => b.percentile - a.percentile);

  const tableRows = courseData.map(item => `
    <tr>
      <td>${item.category}</td>
      <td>${item.gender}</td>
      <td>${item.percentile}</td>
      <td>${item.seat_type}</td>
    </tr>
  `).join('');

  // Stats for this course
  const percentiles = courseData.map(item => item.percentile);
  const highestCutoff = Math.max(...percentiles);
  const lowestCutoff = Math.min(...percentiles);
  const totalCategories = new Set(courseData.map(item => item.category)).size;

  detailsContainer.innerHTML = `
    <h3>${capitalize(course)} Details</h3>
    <div class="course-stats">
      <p><strong>Highest Cutoff:</strong> ${highestCutoff}</p>
      <p><strong>Lowest Cutoff:</strong> ${lowestCutoff}</p>
      <p><strong>Total Categories:</strong> ${totalCategories}</p>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Gender</th>
            <th>Percentile</th>
            <th>Seat Type</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

function setActiveCourse(course) {
  activeCourse = course;
  renderCourseTabs(); // Re-render to update active class
  renderCourseDetails(course);
}

// -------------------------
// Event Listeners for Modal
// -------------------------
function setupModalListeners() {
  // Close button
  document.querySelector('.close').addEventListener('click', closeCollegeModal);

  // Click outside modal
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('collegeModal');
    if (event.target === modal) {
      closeCollegeModal();
    }
  });

  // Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCollegeModal();
    }
  });
}

// -------------------------
loadData();
setupModalListeners();