import { supabase, getCurrentUser } from "./script.js";

const openAuth = document.getElementById("openAuth");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authMessage = document.getElementById("authMessage");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

console.log("main.js loaded");
console.log({ openAuth, logoutBtn, authModal, closeAuth, authMessage, signupForm, loginForm });

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
  if (authModal) authModal.style.display = "flex";
  setMessage("");
});

closeAuth?.addEventListener("click", () => {
  if (authModal) authModal.style.display = "none";
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
    setMessage("Fill in all fields.", true);
    return;
  }

  setMessage("Creating account...");

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: data.user.id });

    if (profileError) {
      setMessage(profileError.message, true);
      return;
    }
  }

  setMessage("Account created. You can log in now.");
  signupForm.reset();
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("Login button clicked");

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    setMessage("Fill in all fields.", true);
    return;
  }

  setMessage("Logging in...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  console.log("Login success:", data);

  setMessage("Login successful.");

  if (authModal) authModal.style.display = "none";
  loginForm.reset();

  await updateNav();

  setTimeout(() => {
    window.location.reload();
  }, 300);
});

logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  const { error } = await supabase.auth.signOut();

  if (error) {
    setMessage(error.message, true);
    return;
  }

  await updateNav();
  window.location.reload();
});

supabase.auth.onAuthStateChange(() => {
  updateNav();
});

updateNav();    setMessage(error.message, true);
    return;
  }

  authModal.style.display = "none";
  loginForm.reset();
  setMessage("");
  await updateNav();
});

logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  const { error } = await supabase.auth.signOut();

  if (error) {
    setMessage(error.message, true);
    return;
  }

  await updateNav();
});

supabase.auth.onAuthStateChange(() => updateNav());
updateNav();
logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  await supabase.auth.signOut();
  await updateNav();
});

supabase.auth.onAuthStateChange(() => updateNav());
updateNav();
