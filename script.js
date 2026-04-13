import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://izkoncmjtevgzhkvjxjo.supabase.co";
const supabaseAnonKey = "sb_publishable_ADuhyroHDg6pDq170WrBGA_i-KJUhDu";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const openAuth = document.getElementById("openAuth");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authMessage = document.getElementById("authMessage");

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const protectedButtons = document.querySelectorAll(".protected-btn");

function setMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#9b1c1c" : "green";
}

async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
}

async function updateUI() {
  const user = await getCurrentUser();

  if (user) {
    openAuth.textContent = user.email;
    logoutBtn.style.display = "inline-block";

    protectedButtons.forEach((button) => {
      button.classList.remove("locked");
      button.textContent = "View Product";
    });
  } else {
    openAuth.textContent = "Login";
    logoutBtn.style.display = "none";

    protectedButtons.forEach((button) => {
      button.classList.add("locked");
      button.textContent = "Login to View";
    });
  }
}

openAuth.addEventListener("click", async (e) => {
  e.preventDefault();

  const user = await getCurrentUser();
  if (user) return;

  authModal.style.display = "flex";
  setMessage("");
});

closeAuth.addEventListener("click", () => {
  authModal.style.display = "none";
  setMessage("");
});

window.addEventListener("click", (e) => {
  if (e.target === authModal) {
    authModal.style.display = "none";
    setMessage("");
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  setMessage("Account created. You can log in now.");
  signupForm.reset();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  loginForm.reset();
  authModal.style.display = "none";
  setMessage("");
  await updateUI();
});

logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const { error } = await supabase.auth.signOut();

  if (error) {
    setMessage(error.message, true);
    return;
  }

  await updateUI();
});

protectedButtons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const user = await getCurrentUser();

    if (!user) {
      e.preventDefault();
      authModal.style.display = "flex";
      setMessage("You must log in first.", true);
      return;
    }

    alert("Open product page here.");
  });
});

supabase.auth.onAuthStateChange(async () => {
  await updateUI();
});

await updateUI();
