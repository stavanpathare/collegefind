document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    const resultsDiv = document.getElementById('results');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const percentile = parseFloat(document.getElementById('percentile').value);
      const branch = document.getElementById('branch').value.trim().toLowerCase();
      const city = document.getElementById('city').value.trim().toLowerCase();
      const college = document.getElementById('college').value.trim().toLowerCase();

      try {
        const response = await fetch('Assets/colleges.json');
        if (!response.ok) throw new Error('Could not load college data.');

        const colleges = await response.json();

        const filtered = colleges
          .filter(c =>
            c.percentile <= percentile &&
            (!branch || c.branch.toLowerCase().includes(branch)) &&
            (!city || c.city.toLowerCase().includes(city)) &&
            (!college || c.college.toLowerCase().includes(college))
          )
          .sort((a, b) => b.percentile - a.percentile);

        showResults(filtered);
      } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = '<p>Error loading college data.</p>';
      }
    });

    function showResults(colleges) {
      resultsDiv.innerHTML = '';

      if (colleges.length === 0) {
        resultsDiv.innerHTML = '<p>No colleges found matching your criteria.</p>';
        return;
      }

      colleges.forEach(c => {
        const div = document.createElement('div');
        div.innerHTML = `
          <strong class="college-name" style="cursor:pointer; color:#007bff;" data-college='${JSON.stringify(c)}'>
            ${c.college}
          </strong><br>
          Branch: ${c.branch}<br>
          Percentile: ${c.percentile}%<br>
          City: ${c.city}<hr>
        `;
        resultsDiv.appendChild(div);
      });

      document.querySelectorAll('.college-name').forEach(el => {
        el.addEventListener('click', () => {
          const data = JSON.parse(el.getAttribute('data-college'));
          showCollegeModal(data);
        });
      });
    }

    function showCollegeModal(c) {
      const modal = document.getElementById('collegeModal');
      const details = `
        <h2>${c.college}</h2>
        <p><strong>Branch:</strong> ${c.branch}</p>
        <p><strong>Percentile:</strong> ${c.percentile}%</p>
        <p><strong>City:</strong> ${c.city}</p>
      `;
      document.getElementById('collegeDetails').innerHTML = details;
      modal.style.display = 'flex';
    }

    document.getElementById('collegeModal').addEventListener('click', (e) => {
      if (e.target.id === 'collegeModal' || e.target.classList.contains('close-modal')) {
        document.getElementById('collegeModal').style.display = 'none';
      }
    });
  });