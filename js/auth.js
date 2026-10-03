// Auth page: tab switching, login, register

const tabs = document.querySelectorAll(".tab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const which = tab.dataset.tab;
    if (which === "login") {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    } else {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    }
  });
});

// If already logged in, redirect
if (getToken()) {
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "/";
  location.href = next;
}

function setMsg(el, text, type = "error") {
  el.textContent = text;
  el.className = "form-msg " + type;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("loginMsg");
  setMsg(msg, "");
  const identifier = document.getElementById("loginIdentifier").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    setToken(data.token);
    setUser(data.user);
    setMsg(msg, "সফল! রিডাইরেক্ট হচ্ছে...", "success");
    const params = new URLSearchParams(location.search);
    const next = params.get("next") || "/";
    setTimeout(() => (location.href = next), 500);
  } catch (err) {
    setMsg(msg, err.message || "লগইন ব্যর্থ");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("registerMsg");
  setMsg(msg, "");
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  try {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    setMsg(msg, "অ্যাকাউন্ট তৈরি হয়েছে! রিডাইরেক্ট হচ্ছে...", "success");
    setTimeout(() => (location.href = "/"), 600);
  } catch (err) {
    setMsg(msg, err.message || "রেজিস্ট্রেশন ব্যর্থ");
  }
});