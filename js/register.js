import { API_URL } from "./config.js";
import { fetchJson, showToast, showLoader, hideLoader } from "./utils.js";
import { initAuth, initTheme } from "./auth.js";

const form = document.querySelector("#registerForm");
const messageBox = document.querySelector("#formMessage");

async function handleRegister(event) {
  event.preventDefault();
  messageBox.textContent = "";

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const password = form.password.value.trim();

  if (!name || !email || !phone || !password) {
    messageBox.textContent = "Please complete all fields.";
    return;
  }

  try {
    showLoader();
    const data = await fetchJson(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    showToast(data.message || "Account created successfully", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (error) {
    messageBox.textContent = error.message;
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
}

if (form) {
  form.addEventListener("submit", handleRegister);
}

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
});
