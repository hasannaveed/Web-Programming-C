// ── Form State (controlled inputs) ──

const state = { name: "", email: "", message: "" };

// ── Router ──

function navigate() {
  const route = window.location.hash.slice(1) || "/";
  const routeMap = { "/": "page-home", "/about": "page-about", "/contact": "page-contact" };

  // Show correct page
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(routeMap[route] || "page-home");
  if (target) target.classList.add("active");

  // Highlight active nav link
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href").slice(1);
    link.classList.toggle("active", href === route);
  });
}

window.addEventListener("hashchange", navigate);
window.addEventListener("DOMContentLoaded", () => {
  navigate();

  // ── Controlled Form Setup ──

  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const msgEl = document.getElementById("message");
  const btn = document.getElementById("submit-btn");
  const formWrapper = document.getElementById("form-wrapper");
  const successMsg = document.getElementById("success-msg");

  // onChange handlers — keep state in sync with inputs
  nameEl.addEventListener("input", e => { state.name = e.target.value; });
  emailEl.addEventListener("input", e => { state.email = e.target.value; });
  msgEl.addEventListener("input", e => { state.message = e.target.value; });

  // Submit
  btn.addEventListener("click", e => {
    e.preventDefault();
    console.log("Form Data:", { name: state.name, email: state.email, message: state.message });

    // Show success, hide form
    formWrapper.classList.add("hidden");
    successMsg.classList.remove("hidden");

    // Clear state and fields after 2 seconds
    setTimeout(() => {
      state.name = "";
      state.email = "";
      state.message = "";
      nameEl.value = "";
      emailEl.value = "";
      msgEl.value = "";

      successMsg.classList.add("hidden");
      formWrapper.classList.remove("hidden");
    }, 2000);
  });
});