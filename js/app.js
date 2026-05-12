import { API_URL } from "./config.js";
import { fetchJson, showToast, showLoader, hideLoader, resolveItemImage, formatDate } from "./utils.js";
import { initAuth, initTheme } from "./auth.js";

const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const itemsGrid = document.querySelector("#itemsGrid");
const recentItems = document.querySelector("#recentItems");
const emptyState = document.querySelector("#emptyState");
let loadTimer;

function createItemCard(item) {
  const container = document.createElement("article");
  container.className = "item-card card-shadow";
  const imageUrl = resolveItemImage(item);
  const contactLabel = item.contact || item.contactInfo || "Contact owner";
  const subtype = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Unknown";

  container.innerHTML = `
    <div class="item-image" style="background-image: url('${imageUrl || "https://via.placeholder.com/520x320?text=No+Image"}')"></div>
    <div class="item-card-body">
      <span class="item-tag">${subtype}</span>
      <h3>${item.title || "Untitled item"}</h3>
      <p class="muted">${item.location || "Unknown location"}</p>
      <div class="card-meta">
        <span>${formatDate(item.createdAt)}</span>
        <span>${contactLabel}</span>
      </div>
    </div>
    <div class="item-card-actions">
      <a href="mailto:${contactLabel}" class="btn btn-secondary">Contact</a>
      <a href="item-details.html?id=${item._id || item.id}" class="btn btn-primary">View Details</a>
    </div>
  `;

  return container;
}

function createRecentCard(item) {
  const card = document.createElement("div");
  card.className = "recent-card";
  card.innerHTML = `
    <h3>${item.title || "Lost Item"}</h3>
    <p>${item.location || "Campus location"}</p>
    <span>${formatDate(item.createdAt)}</span>
  `;
  return card;
}

function renderItems(items) {
  itemsGrid.innerHTML = "";
  if (!items.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  items.forEach((item) => itemsGrid.appendChild(createItemCard(item)));
}

function renderRecent(items) {
  recentItems.innerHTML = "";
  const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  sorted.slice(0, 3).forEach((item) => recentItems.appendChild(createRecentCard(item)));
  
  // Update latest reports card with the most recent item
  if (sorted.length > 0) {
    const latestItem = sorted[0];
    const heroContent = document.querySelector(".hero-card-content");
    if (heroContent) {
      heroContent.innerHTML = `
        <p><strong>${latestItem.title || "Lost Item"}</strong> found at <strong>${latestItem.location || "Campus location"}</strong></p>
        <p class="muted">${latestItem.description || "Easy contact and updated daily."}</p>
      `;
    }
  }
}

async function fetchItems(query = "") {
  const endpoint = query ? `${API_URL}/items/search/${encodeURIComponent(query)}` : `${API_URL}/items`;
  const data = await fetchJson(endpoint);
  return Array.isArray(data) ? data : data.items || [];
}

function applyFilters(items) {
  const category = categoryFilter.value;
  if (category === "all") return items;
  return items.filter((item) => item.category?.toLowerCase() === category.toLowerCase());
}

async function loadItems() {
  try {
    showLoader();
    const query = searchInput.value.trim();
    const items = await fetchItems(query);
    const filtered = applyFilters(items);
    renderItems(filtered);
    renderRecent(filtered);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
}

function handleSearchChange() {
  clearTimeout(loadTimer);
  loadTimer = setTimeout(loadItems, 350);
}

if (searchInput) {
  searchInput.addEventListener("input", handleSearchChange);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", loadItems);
}

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
  loadItems();
});
