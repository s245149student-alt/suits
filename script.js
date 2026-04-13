import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://izkoncmjtevgzhkvjxjo.supabase.co";
const supabaseKey = "REPLACE_WITH_YOUR_NEW_PUBLISHABLE_KEY";
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getSession() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export function formatPrice(price) {
  return `${price.toLocaleString("da-DK")} DKK`;
}  }
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
