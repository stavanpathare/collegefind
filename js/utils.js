import { API_URL } from "./config.js";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(decodeURIComponent(atob(payload).split("").map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join("")));
  } catch (error) {
    return null;
  }
}

export function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
}

export function showToast(message, type = "success") {
  const container = document.querySelector("#toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
  }, 2200);
  setTimeout(() => {
    toast.remove();
  }, 2600);
}

export function showLoader() {
  const loader = document.querySelector("#globalLoader");
  if (loader) loader.classList.remove("hidden");
}

export function hideLoader() {
  const loader = document.querySelector("#globalLoader");
  if (loader) loader.classList.add("hidden");
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    throw new Error(data.message || response.statusText || "Request failed");
  }
  return data;
}

export function getItemImageUrl(imagePath) {
  if (!imagePath) return "";
  if (typeof imagePath !== "string") {
    return "";
  }

  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.includes("/uploads/")) {
    return `${API_URL.replace(/\/api$/, "")}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  }
  return `${API_URL.replace(/\/api$/, "")}/uploads/${imagePath.replace(/^\/+/, "")}`;
}

export function resolveItemImage(item) {
  if (!item) return "";
  const imageValue = item.image?.filename || item.image?.path || item.image || item.imageUrl || item.photo || item.photoUrl || item.imagePath;
  return getItemImageUrl(imageValue);
}

export function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

export function redirectToLogin() {
  window.location.href = "login.html";
}

export function redirectToHome() {
  window.location.href = "index.html";
}
