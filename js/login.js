import { API_URL } from "./config.js";
import { fetchJson, setToken, showToast, showLoader, hideLoader } from "./utils.js";
import { initAuth, initTheme } from "./auth.js";

const form = document.querySelector("#loginForm");
const messageBox = document.querySelector("#formMessage");

async function handleLogin(event) {
  event.preventDefault();
  messageBox.textContent = "";

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  if (!email || !password) {
    messageBox.textContent = "Please enter email and password.";
    return;
  }

  try {
    showLoader();
    const data = await fetchJson(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setToken(data.token);
      showToast("Login successful", "success");
      window.location.href = "index.html";
    } else {
      throw new Error(data.message || "Login failed");
    }
  } catch (error) {
    messageBox.textContent = error.message;
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
}

if (form) {
  form.addEventListener("submit", handleLogin);
}

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
});
