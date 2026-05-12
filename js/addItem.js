import { API_URL } from "./config.js";
import { authHeaders, fetchJson, showToast, showLoader, hideLoader } from "./utils.js";
import { requireAuth } from "./auth.js";

const form = document.querySelector("#addItemForm");
const imageInput = document.querySelector("#image");
const imagePreview = document.querySelector("#imagePreview");
const messageBox = document.querySelector("#formMessage");

function previewImage() {
  const file = imageInput.files[0];
  if (!file) {
    imagePreview.textContent = "Preview will appear here";
    imagePreview.style.backgroundImage = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.textContent = "";
    imagePreview.style.backgroundImage = `url('${reader.result}')`;
  };
  reader.readAsDataURL(file);
}

async function handleSubmit(event) {
  event.preventDefault();
  messageBox.textContent = "";

  if (!form.title.value.trim() || !form.description.value.trim() || !form.category.value || !form.location.value.trim() || !form.contact.value.trim() || !imageInput.files.length) {
    messageBox.textContent = "Please complete every field before submitting.";
    return;
  }

  const formData = new FormData();
  formData.append("title", form.title.value.trim());
  formData.append("description", form.description.value.trim());
  formData.append("category", form.category.value);
  formData.append("location", form.location.value.trim());
  formData.append("contact", form.contact.value.trim());
  formData.append("image", imageInput.files[0]);

  try {
    showLoader();
    const response = await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit item");
    }
    showToast("Item submitted successfully", "success");
    form.reset();
    previewImage();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 900);
  } catch (error) {
    messageBox.textContent = error.message;
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
}

requireAuth();
if (imageInput) {
  imageInput.addEventListener("change", previewImage);
}
if (form) {
  form.addEventListener("submit", handleSubmit);
}
