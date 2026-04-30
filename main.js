import { getCurrentUser } from "./script.js";

const openAuth = document.getElementById("openAuth");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authMessage = document.getElementById("authMessage");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

function setMessage(message, isError = false) {
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.style.color = isError ? "#9b1c1c" : "green";
}

async function updateNav() {
  const user = await getCurrentUser();

  if (user) {
    if (openAuth) openAuth.textContent = user.email;
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    if (openAuth) openAuth.textContent = "Login";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

openAuth?.addEventListener("click", (e) => {
  e.preventDefault();

  if (authModal) {
    authModal.style.display = "flex";
  }

  setMessage("");
});

closeAuth?.addEventListener("click", () => {
  if (authModal) {
    authModal.style.display = "none";
  }

  setMessage("");
});

window.addEventListener("click", (e) => {
  if (e.target === authModal) {
    authModal.style.display = "none";
    setMessage("");
  }
});

signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value.trim();

  if (!email || !password) {
    setMessage("Fill in all signup fields.", true);
    return;
  }

  setMessage("Creating account...");

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      setMessage(result.error || "Signup failed.", true);
      return;
    }

    setMessage("Account created. You can log in now.");
    signupForm.reset();

  } catch (error) {
    console.error("Signup failed:", error);
    setMessage("Signup failed. Check console.", true);
  }
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    setMessage("Fill in all login fields.", true);
    return;
  }

  setMessage("Logging in...");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      setMessage(result.error || "Login failed.", true);
      return;
    }

    setMessage("Login successful.");
    loginForm.reset();

    await updateNav();

    if (authModal) {
      authModal.style.display = "none";
    }

    window.location.reload();

  } catch (error) {
    console.error("Login failed:", error);
    setMessage("Login failed. Check console.", true);
  }
});

logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("/api/logout", {
      method: "POST"
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      setMessage(result.error || "Logout failed.", true);
      return;
    }

    await updateNav();
    window.location.reload();

  } catch (error) {
    console.error("Logout failed:", error);
    setMessage("Logout failed. Check console.", true);
  }
});

updateNav();
