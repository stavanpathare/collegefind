import { API_URL } from "./config.js";
import {
  showToast,
  showLoader,
  hideLoader,
  resolveItemImage,
  formatDate,
} from "./utils.js";
import { initAuth, initTheme } from "./auth.js";

const detailsContainer = document.querySelector("#itemDetails");

const params = new URLSearchParams(window.location.search);

const itemId = params.get("id");

/**
 * Render Item Details UI
 */
function buildDetailCard(item) {
  if (!item) {
    detailsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Item Not Found</h3>
        <p>The requested item does not exist.</p>
      </div>
    `;
    return;
  }

  // Safe values
  const imageUrl =
    resolveItemImage(item) ||
    "https://via.placeholder.com/1200x600?text=No+Image";

  const title = item.title || "Untitled Item";

  const category = item.category || "Unknown";

  const location = item.location || "Unknown Location";

  const description =
    item.description || "No description provided";

  const contact =
    item.contact ||
    item.contactInfo ||
    "No contact information";

  const createdDate = formatDate(item.createdAt);

  detailsContainer.innerHTML = `
    <div class="details-hero">
      <img src="${imageUrl}" alt="${title}" class="details-image" />
    </div>

    <div class="details-content">

      <span class="eyebrow">${category}</span>

      <h1>${title}</h1>

      <p class="muted">
        Found at <strong>${location}</strong>
      </p>

      <div class="details-meta">
        <span>📅 ${createdDate}</span>
        <span>📞 ${contact}</span>
      </div>

      <div class="details-section">
        <h3>Description</h3>
        <p class="details-description">
          ${description}
        </p>
      </div>

      <div class="details-actions">

        <a
          href="tel:${String(contact).replace(/\D/g, "")}"
          class="btn btn-primary"
        >
          Call Owner
        </a>

        <a
          href="index.html"
          class="btn btn-secondary"
        >
          Back to Home
        </a>

      </div>

    </div>
  `;
}

/**
 * Load Single Item
 */
async function loadItem() {
  // Validate ID
  if (!itemId) {
    detailsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Invalid Item</h3>
        <p>No item ID provided.</p>
      </div>
    `;

    return;
  }

  try {
    showLoader();

    const response = await fetch(
      `${API_URL}/items/${itemId}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load item (${response.status})`
      );
    }

    // API Response
    const responseData = await response.json();

    console.log("API Response:", responseData);

    /**
     * Handle multiple response formats
     * Example:
     * { item: {...} }
     * { data: {...} }
     * {...}
     */
    const item =
      responseData.item ||
      responseData.data ||
      responseData;

    console.log("Final Item:", item);

    buildDetailCard(item);

  } catch (error) {

    console.error(error);

    detailsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Error Loading Item</h3>
        <p>${error.message}</p>

        <a href="index.html" class="btn btn-primary">
          Go Back
        </a>
      </div>
    `;

    showToast(error.message, "error");

  } finally {

    hideLoader();
  }
}

// Init
window.addEventListener(
  "DOMContentLoaded",
  () => {
    initAuth();
    initTheme();
    loadItem();
  }
);