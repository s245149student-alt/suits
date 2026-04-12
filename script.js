const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const protectedButtons = document.querySelectorAll(".protected-btn");

const DEMO_EMAIL = "test@nordisk.dk";
const DEMO_PASSWORD = "1234";

function isLoggedIn() {
  return localStorage.getItem("loggedIn") === "true";
}

function updateUI() {
  if (isLoggedIn()) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    protectedButtons.forEach((button) => {
      button.classList.remove("disabled");
      button.disabled = false;
      button.textContent = "View Product";
    });
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    protectedButtons.forEach((button) => {
      button.classList.add("disabled");
      button.disabled = false;
      button.textContent = "Login to View";
    });
  }
}

loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  loginModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  loginModal.style.display = "none";
  loginMessage.textContent = "";
});

window.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    loginModal.style.display = "none";
    loginMessage.textContent = "";
  }
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    localStorage.setItem("loggedIn", "true");
    loginMessage.style.color = "green";
    loginMessage.textContent = "Login successful.";

    setTimeout(() => {
      loginModal.style.display = "none";
      loginMessage.textContent = "";
      loginForm.reset();
      updateUI();
    }, 700);
  } else {
    loginMessage.style.color = "#9b1c1c";
    loginMessage.textContent = "Wrong email or password.";
  }
});

logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("loggedIn");
  updateUI();
});

protectedButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    if (!isLoggedIn()) {
      e.preventDefault();
      loginModal.style.display = "flex";
      loginMessage.style.color = "#9b1c1c";
      loginMessage.textContent = "You must log in first.";
    } else {
      alert("Product page can open here.");
    }
  });
});

updateUI();
