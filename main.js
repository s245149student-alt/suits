import { supabase, getCurrentUser } from "./script.js";

const openAuth = document.getElementById("openAuth");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authMessage = document.getElementById("authMessage");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

function setMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#9b1c1c" : "green";
}

async function updateNav() {
  const user = await getCurrentUser();
  if (user) {
    openAuth.textContent = user.email;
    logoutBtn.style.display = "inline-block";
  } else {
    openAuth.textContent = "Login";
    logoutBtn.style.display = "none";
  }
}

openAuth?.addEventListener("click", (e) => {
  e.preventDefault();
  authModal.style.display = "flex";
  setMessage("");
});

closeAuth?.addEventListener("click", () => {
  authModal.style.display = "none";
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
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    setMessage(error.message, true);
    return;
  }

  if (data.user) {
    await supabase.from("profiles").upsert({ id: data.user.id });
  }

  setMessage("Account created. You can log in now.");
  signupForm.reset();
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(error.message, true);
    return;
  }

  authModal.style.display = "none";
  loginForm.reset();
  await updateNav();
});

logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  await supabase.auth.signOut();
  await updateNav();
});

supabase.auth.onAuthStateChange(() => updateNav());
updateNav();
