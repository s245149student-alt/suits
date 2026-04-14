import { supabase, getCurrentUser } from "./script.js";

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
    setMessage("Fill in all signup fields.", true);
    return;
  }

  setMessage("Creating account...");

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

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
  } catch (err) {
    console.error("Signup failed:", err);
    setMessage("Signup failed. Check console.", true);
  }
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("LOGIN SUBMIT FIRED");

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    setMessage("Fill in all login fields.", true);
    return;
  }

  setMessage("Logging in...");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log("LOGIN RESPONSE:", { data, error });

    if (error) {
      setMessage(error.message, true);
      return;
    }

    setMessage("Login successful.");
    loginForm.reset();

    await updateNav();

    if (authModal) authModal.style.display = "none";

    setTimeout(() => {
      window.location.reload();
    }, 300);
  } catch (err) {
    console.error("Login failed:", err);
    setMessage("Login failed. Check console.", true);
  }
});

logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message, true);
      return;
    }

    await updateNav();
    window.location.reload();
  } catch (err) {
    console.error("Logout failed:", err);
    setMessage("Logout failed. Check console.", true);
  }
});

supabase.auth.onAuthStateChange(() => {
  updateNav();
});

updateNav();
