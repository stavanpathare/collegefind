import { getToken, removeToken, parseJwt, showToast } from "./utils.js";

export function initAuth() {
  const token = getToken();
  const navAuth = document.querySelector("#nav-auth");
  const navToggle = document.querySelector("#navToggle");
  const mainNav = document.querySelector("#mainNav");

  if (navAuth) {
    if (token) {
      navAuth.innerHTML = `
        <button id="themeToggle" class="btn btn-ghost" aria-label="Toggle theme">🌙</button>
        <a href="profile.html">Profile</a>
        <button id="logoutBtn" class="btn btn-ghost">Logout</button>
      `;
      const logoutBtn = document.querySelector("#logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          removeToken();
          showToast("Logged out successfully", "success");
          window.location.href = "login.html";
        });
      }
    } else {
      navAuth.innerHTML = `
        <button id="themeToggle" class="btn btn-ghost" aria-label="Toggle theme">🌙</button>
        <a href="login.html">Login</a>
        <a href="register.html">Register</a>
      `;
    }
  }

}

function toggleNav() {
  const mainNav = document.querySelector("#mainNav");
  const navAuth = document.querySelector("#nav-auth");
  if (mainNav) mainNav.classList.toggle("nav-open");
  if (navAuth) navAuth.classList.toggle("nav-open");
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#navToggle")) {
    event.preventDefault();
    toggleNav();
  }
});

export function requireAuth() {
  if (!getToken()) {
    showToast("Please login to access this page", "warning");
    window.location.href = "login.html";
  }
}

export function getCurrentUser() {
  const token = getToken();
  return token ? parseJwt(token) : null;
}

// Theme toggle functionality
function applyTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark");
  const themeToggle = document.querySelector("#themeToggle");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
  applyTheme(currentTheme);
}

export function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);
  const themeToggle = document.querySelector("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
});
