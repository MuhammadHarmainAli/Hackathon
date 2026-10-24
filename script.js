"use strict";

/*
  HCM Lite — Login & First-Time Setup

  localStorage keys:
  hcm_company
  hcm_users
  hcm_session

  NOTE:
  This is a hackathon/demo implementation.
  Do not use plain-text passwords in a real application.
*/

// ---------- 1. LocalStorage keys ----------

const STORAGE_KEYS = {
  company: "hcm_company",
  users: "hcm_users",
  session: "hcm_session",
};

// ---------- 2. Select HTML elements ----------

const setupSection = document.querySelector("#setup-section");
const loginSection = document.querySelector("#login-section");

const setupForm = document.querySelector("#setup-form");
const loginForm = document.querySelector("#login-form");

const companyNameInput = document.querySelector("#company-name");
const adminUsernameInput = document.querySelector("#admin-username");
const adminPasswordInput = document.querySelector("#admin-password");

const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");

const setupMessage = document.querySelector("#setup-message");
const loginMessage = document.querySelector("#login-message");

// ---------- 3. LocalStorage helper functions ----------

function readData(key, fallback = null) {
  try {
    const savedData = localStorage.getItem(key);

    if (savedData === null) {
      return fallback;
    }

    return JSON.parse(savedData);
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key}:`, error);
    return false;
  }
}

// ---------- 4. Get current data ----------

function getCompany() {
  return readData(STORAGE_KEYS.company);
}

function getUsers() {
  const users = readData(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

function getSession() {
  return readData(STORAGE_KEYS.session);
}

// ---------- 5. Display messages ----------

function showMessage(element, message, type = "") {
  if (!element) return;

  element.textContent = message;
  element.className = "form-message";

  if (type) {
    element.classList.add(type);
  }
}

function clearMessages() {
  showMessage(setupMessage, "");
  showMessage(loginMessage, "");
}

// ---------- 6. Switch between forms ----------

function showSetupForm() {
  setupSection.hidden = false;
  loginSection.hidden = true;
}

function showLoginForm() {
  setupSection.hidden = true;
  loginSection.hidden = false;
}

// ---------- 7. Check initial setup ----------

function isSetupComplete() {
  const company = getCompany();
  const users = getUsers();

  return Boolean(
    company &&
    company.name &&
    Array.isArray(users) &&
    users.some((user) => user.role === "admin"),
  );
}

// ---------- 8. Normalize usernames ----------

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

// ---------- 9. First-time company setup ----------

function handleSetup(event) {
  event.preventDefault();

  clearMessages();

  // Do not overwrite an existing setup.
  if (isSetupComplete()) {
    showLoginForm();

    showMessage(loginMessage, "Company setup already exists. Please log in.");

    return;
  }

  const companyName = companyNameInput.value.trim();
  const adminUsername = adminUsernameInput.value.trim();
  const adminPassword = adminPasswordInput.value;

  // Validate inputs.
  if (!companyName || !adminUsername || !adminPassword) {
    showMessage(setupMessage, "Please fill in all required fields.", "error");

    return;
  }

  if (adminUsername.length < 3) {
    showMessage(
      setupMessage,
      "Username must contain at least 3 characters.",
      "error",
    );

    return;
  }

  if (adminPassword.length < 8) {
    showMessage(
      setupMessage,
      "Password must contain at least 8 characters.",
      "error",
    );

    return;
  }

  // Create company data.
  const company = {
    name: companyName,
    officeStart: "09:00",
    officeEnd: "17:00",
    graceMinutes: 15,
    leaveQuota: 12,
    createdAt: new Date().toISOString(),
  };

  // Create the first admin user.
  const adminUser = {
    id: crypto.randomUUID(),
    username: adminUsername,
    password: adminPassword,
    role: "admin",
    department: "Administration",
    salary: 0,
    createdAt: new Date().toISOString(),
  };

  // Save company and admin data.
  const companySaved = saveData(STORAGE_KEYS.company, company);

  const usersSaved = companySaved && saveData(STORAGE_KEYS.users, [adminUser]);

  if (!usersSaved) {
    showMessage(
      setupMessage,
      "Could not save your setup. Please check browser storage.",
      "error",
    );

    return;
  }

  // Move to the normal login screen.
  setupForm.reset();
  showLoginForm();

  showMessage(
    loginMessage,
    "Company created successfully! Please log in.",
    "success",
  );

  usernameInput.value = adminUsername;
  passwordInput.focus();
}

// ---------- 10. Login ----------

function handleLogin(event) {
  event.preventDefault();

  showMessage(loginMessage, "");

  if (!isSetupComplete()) {
    showSetupForm();

    showMessage(
      setupMessage,
      "Please complete the company setup first.",
      "error",
    );

    return;
  }

  const username = normalizeUsername(usernameInput.value);
  const password = passwordInput.value;

  if (!username || !password) {
    showMessage(
      loginMessage,
      "Please enter your username and password.",
      "error",
    );

    return;
  }

  const users = getUsers();

  // Find the account using the username.
  const user = users.find(
    (account) => normalizeUsername(account.username) === username,
  );

  // Verify both username and password.
  if (!user || user.password !== password) {
    showMessage(loginMessage, "Incorrect username or password.", "error");

    return;
  }

  // Save the current login session.
  const session = {
    userId: user.id,
    username: user.username,
    role: user.role,
    loginAt: new Date().toISOString(),
  };

  const sessionSaved = saveData(STORAGE_KEYS.session, session);

  if (!sessionSaved) {
    showMessage(
      loginMessage,
      "Could not save your session. Please try again.",
      "error",
    );

    return;
  }

  // Redirect according to the user's role.
  redirectToDashboard(user.role);
}

// ---------- 11. Dashboard redirection ----------

function redirectToDashboard(role) {
  const dashboards = {
    admin: "admin.html",
    employee: "employee.html",
  };

  const destination = dashboards[role];

  if (!destination) {
    showMessage(loginMessage, "This account has an invalid role.", "error");

    return;
  }

  window.location.href = destination;
}

// ---------- 12. Logout helper ----------

function logoutHCM() {
  localStorage.removeItem(STORAGE_KEYS.session);
  window.location.href = "index.html";
}

// Allow dashboard pages to use logoutHCM().
window.logoutHCM = logoutHCM;

// ---------- 13. Initialize the application ----------

function initializeApp() {
  clearMessages();

  if (!isSetupComplete()) {
    // No company/admin setup exists yet.
    showSetupForm();
    return;
  }

  // Setup exists; show login.
  showLoginForm();

  // Restore a previous session if one exists.
  const session = getSession();

  if (!session) {
    return;
  }

  const users = getUsers();

  const currentUser = users.find(
    (user) => user.id === session.userId && user.role === session.role,
  );

  if (currentUser) {
    redirectToDashboard(currentUser.role);
  } else {
    // Session no longer matches an existing account.
    localStorage.removeItem(STORAGE_KEYS.session);
  }
}

// ---------- 14. Attach event listeners ----------

setupForm.addEventListener("submit", handleSetup);
loginForm.addEventListener("submit", handleLogin);

// Start the app.
initializeApp();
