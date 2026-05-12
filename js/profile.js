import { API_URL } from "./config.js";
import { fetchJson, showToast, showLoader, hideLoader, resolveItemImage, formatDate, authHeaders } from "./utils.js";
import { requireAuth, getCurrentUser, initAuth, initTheme } from "./auth.js";

const profileName = document.querySelector("#userName");
const profileEmail = document.querySelector("#userEmail");
const profileItems = document.querySelector("#profileItems");
const profileEmpty = document.querySelector("#profileEmpty");

function createProfileCard(item) {
  const card = document.createElement("article");
  card.className = "item-card card-shadow";
  const imageUrl = resolveItemImage(item);
  const contact = item.contact || item.contactInfo || "Contact owner";
  const category = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Other";

  card.innerHTML = `
    <div class="item-image" style="background-image: url('${imageUrl || "https://via.placeholder.com/520x320?text=No+Image"}')"></div>
    <div class="item-card-body">
      <span class="item-tag">${category}</span>
      <h3>${item.title || "Untitled"}</h3>
      <p class="muted">${item.location || "Unknown location"}</p>
      <div class="card-meta">
        <span>${formatDate(item.createdAt)}</span>
        <span>${contact}</span>
      </div>
    </div>
    <div class="item-card-actions">
      <a href="item-details.html?id=${item._id || item.id}" class="btn btn-secondary btn-sm">View</a>
      <button class="btn btn-warn btn-sm" data-action="done" data-id="${item._id || item.id}">Handed Over</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item._id || item.id}">Delete</button>
    </div>
  `;

  const doneBtn = card.querySelector('[data-action="done"]');
  const deleteBtn = card.querySelector('[data-action="delete"]');

  if (doneBtn) {
    doneBtn.addEventListener("click", () => handleMarkAsDone(item._id || item.id, card));
  }
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => handleDeleteItem(item._id || item.id, card));
  }

  return card;
}

function renderProfile(items) {
  profileItems.innerHTML = "";
  if (!items.length) {
    profileEmpty.classList.remove("hidden");
    return;
  }
  profileEmpty.classList.add("hidden");
  items.forEach((item) => profileItems.appendChild(createProfileCard(item)));
}

function extractUserId(createdByValue) {
  if (!createdByValue) return null;
  if (typeof createdByValue === "string") return createdByValue;
  if (typeof createdByValue === "object") {
    return createdByValue._id || createdByValue.id || createdByValue.$oid || null;
  }
  return null;
}

function filterMyItems(items, userId) {
  if (!userId) return [];
  const userIdStr = String(userId).trim();
  
  return items.filter((item) => {
    const ownerId = extractUserId(item.createdBy);
    if (!ownerId) return false;
    return String(ownerId).trim() === userIdStr;
  });
}

async function handleDeleteItem(itemId, cardElement) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  
  try {
    showLoader();
    const headers = authHeaders();
    
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete item");
    }

    cardElement.style.opacity = "0";
    cardElement.style.transition = "opacity 0.3s ease";
    setTimeout(() => cardElement.remove(), 300);
    showToast("Item deleted successfully", "success");

    const allCards = profileItems.querySelectorAll(".item-card");
    if (allCards.length === 1) {
      setTimeout(() => loadProfile(), 500);
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
}

async function handleMarkAsDone(itemId, cardElement) {
  if (!confirm("Mark this item as handed over? It will be removed from the listing.")) return;
  
  try {
    showLoader();
    const headers = authHeaders();
    
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to mark as done");
    }

    cardElement.style.opacity = "0";
    cardElement.style.transition = "opacity 0.3s ease";
    setTimeout(() => cardElement.remove(), 300);
    showToast("Item marked as handed over", "success");

    const allCards = profileItems.querySelectorAll(".item-card");
    if (allCards.length === 1) {
      setTimeout(() => loadProfile(), 500);
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
}

async function loadProfile() {
  requireAuth();
  const user = getCurrentUser();
  if (!user) {
    showToast("Unable to load user profile", "error");
    return;
  }

  const userId = user.id || user._id || user.userId;
  
  profileName.textContent = user.name || user.fullName || "Campus Member";
  profileEmail.textContent = user.email || "No email available";

  try {
    showLoader();
    const items = await fetchJson(`${API_URL}/items`);
    const itemList = Array.isArray(items) ? items : items.items || [];
    const userItems = filterMyItems(itemList, userId);
    renderProfile(userItems);
  } catch (error) {
    showToast(error.message, "error");
    profileEmpty.classList.remove("hidden");
  } finally {
    hideLoader();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
  loadProfile();
});
