import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://izkoncmjtevgzhkvjxjo.supabase.co";
const supabaseKey = "sb_publishable_ADuhyroHDg6pDq170WrBGA_i-KJUhDu";

const supabase = createClient(supabaseUrl, supabaseKey);

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
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error("getUser error:", error);
      return null;
    }

    return user;
  } catch (err) {
    console.error("Unexpected getUser error:", err);
    return null;
  }
}

async function updateUI() {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
    }

    if (session) {
      openAuth.textContent = session.user.email;
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
  } catch (err) {
    console.error("updateUI error:", err);
  }
}

openAuth.addEventListener("click", (e) => {
  e.preventDefault();
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

  try {
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message, true);
      return;
    }

    setMessage("Account created. You can log in now.");
    signupForm.reset();
  } catch (err) {
    console.error("Signup error:", err);
    setMessage("Signup failed.", true);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message, true);
      return;
    }

    loginForm.reset();
    authModal.style.display = "none";
    setMessage("");
    await updateUI();
  } catch (err) {
    console.error("Login error:", err);
    setMessage("Login failed.", true);
  }
});

logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message, true);
      return;
    }

    setMessage("");
    await updateUI();
  } catch (err) {
    console.error("Logout error:", err);
    setMessage("Logout failed.", true);
  }
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

supabase.auth.onAuthStateChange(() => {
  updateUI();
});

updateUI();  if (e.target === authModal) {
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
