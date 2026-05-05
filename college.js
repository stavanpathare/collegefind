let data = [];


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
    gender: item.gender.trim()
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
  const percentile = parseFloat(document.getElementById("percentile").value);
  const course = normalize(document.getElementById("course").value);
  const district = normalize(document.getElementById("district").value);
  const category = document.getElementById("category").value;
  const gender = document.getElementById("gender").value;

  let results = data.filter(item => {
    return (
      (!percentile || item.percentile <= percentile) &&
      (!course || item.course.includes(course)) &&
      (!district || item.district.includes(district)) &&
      (!category || item.category === category) &&
      (!gender || item.gender === gender)
    );
  });

  // Sort by highest percentile (better UX)
  results.sort((a, b) => b.percentile - a.percentile);

  // Limit results (performance)
  results = results.slice(0, 50);

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
}

// -------------------------
loadData();