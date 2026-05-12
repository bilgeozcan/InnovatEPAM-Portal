import {
  CATEGORIES,
  DEMO_CREDENTIALS,
  ROLES,
  STATUSES,
  STATUS_META,
  STORAGE_KEY,
  createIdea,
  createSeedState,
  getPortalMetrics,
  getUserById,
  getVisibleIdeas,
  loginUser,
  publicUser,
  registerUser,
  updateIdeaStatus
} from "./portal-core.js";

/* Driver.js loaded lazily so a CDN miss never breaks the rest of the app */
let _driverFn = null;
async function loadDriver() {
  if (_driverFn) return _driverFn;
  try {
    const mod = await import("https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.esm.js");
    _driverFn = mod.driver;
  } catch {
    /* CDN unavailable — tour silently disabled */
  }
  return _driverFn;
}

/* ─── Constants ─────────────────────────────────────────────── */
const SESSION_KEY    = "innovatepam.session.userId";
const ONBOARDING_KEY = "innovatepam.onboarding.v1";
const guideKey       = (role) => `innovatepam.guide.${role}`;
const WELCOME_KEY    = "innovatepam.welcomed";
const THEME_KEY      = "innovatepam.theme";
const MAX_ATTACHMENT = 2 * 1024 * 1024;

/* ─── Theme ──────────────────────────────────────────────────── */
function applyTheme(theme) {
  // Inject a temporary global transition so every element animates smoothly
  const prev = document.getElementById("__theme-tx");
  if (prev) prev.remove();
  const tx = document.createElement("style");
  tx.id = "__theme-tx";
  tx.textContent = `*, *::before, *::after {
    transition: background 0.32s ease, background-color 0.32s ease,
                border-color 0.32s ease, color 0.22s ease,
                box-shadow 0.32s ease !important; }`;
  document.head.appendChild(tx);
  setTimeout(() => tx.remove(), 420);

  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  const isDark = theme === "dark";
  const label  = isDark ? "☀ Light" : "☾ Dark";
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.textContent = label;
    btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  });
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
}

/* ─── Role-specific guide steps ─────────────────────────────── */
const SUBMITTER_STEPS = [
  { icon: "💡", text: "Go to <strong>Submit Idea</strong> in the top navigation" },
  { icon: "📝", text: "Write a clear title, pick a category, and describe the problem + impact" },
  { icon: "📎", text: "Attach a support file to strengthen your case (any format · max 2 MB)" },
  { icon: "🚀", text: "Click <strong>Submit idea</strong> — it enters the review pipeline immediately" },
  { icon: "📊", text: "Track status changes on the <strong>Dashboard</strong> with full history" },
];

const ADMIN_STEPS = [
  { icon: "📋", text: "Open the <strong>Dashboard</strong> — you see all ideas from every submitter" },
  { icon: "🔍", text: "Use the status filter to find <strong>Submitted</strong> ideas awaiting review" },
  { icon: "📂", text: "Read each idea's description and download any support file" },
  { icon: "⚖️", text: "Use the <strong>review form</strong> at the bottom of each card to update status" },
  { icon: "✍️", text: "Always add an evaluator comment — it's <strong>required</strong> for Accept/Reject" },
];

/* ─── Driver.js interactive tours ───────────────────────────── */
const SUBMITTER_TOUR = [
  {
    element: "#submitPanel",
    popover: {
      title: "📝 Your idea form",
      description: "Fill in each field here to build the strongest possible submission. Let's walk through it step by step.",
      side: "left", align: "start",
    },
  },
  {
    element: "#submitPanel input[name='title']",
    popover: {
      title: "💡 Idea title",
      description: "Write a short, action-oriented name. Be specific — \"AI meeting summarizer\" beats \"AI tool\". Max 90 characters.",
      side: "bottom",
    },
  },
  {
    element: "#categorySelect",
    popover: {
      title: "🏷️ Category",
      description: "Pick the category that best fits. It helps evaluators route your idea to the right expert quickly.",
      side: "bottom",
    },
  },
  {
    element: "#submitPanel textarea[name='description']",
    popover: {
      title: "📄 Description",
      description: "Name the problem, propose your solution, and hint at impact. 3–5 clear sentences is ideal. More evidence = higher acceptance rate.",
      side: "top",
    },
  },
  {
    element: "#fileDropZone",
    popover: {
      title: "📎 Support file",
      description: "Drag a file here or click to browse. A diagram, doc, or data sheet as evidence makes your idea significantly more compelling.",
      side: "top",
    },
  },
  {
    element: "#submitIdeaBtn",
    popover: {
      title: "🚀 Submit!",
      description: "Click to send your idea into the review pipeline. Evaluators see it on their dashboard immediately — good luck!",
      side: "top",
    },
  },
];

const ADMIN_TOUR_STEPS = [
  {
    element: "#metricsPanel",
    popover: {
      title: "📊 Overview metrics",
      description: "At a glance — total ideas in scope, how many are in review, how many were accepted, and how many have attachments.",
      side: "bottom",
    },
  },
  {
    element: ".filters",
    popover: {
      title: "🔍 Filter & search",
      description: "Use the status filter to find ideas at a specific stage. Start with \"Submitted\" to see what needs your attention first.",
      side: "bottom",
    },
  },
  {
    element: "#ideasList",
    popover: {
      title: "📋 Idea cards",
      description: "Each card shows the idea's title, description, category, author, and any attached file. The status badge shows where it stands in the pipeline.",
      side: "top",
    },
  },
  {
    element: "#ideasList",
    popover: {
      title: "⚖️ Review form",
      description: "Scroll down inside any card to find the review form. Select a new status, write your evaluator comment (required for Accept/Reject), and click Update.",
      side: "top",
    },
  },
];

async function startTour(role) {
  const driverFn = await loadDriver();
  if (!driverFn) return;
  const steps = role === ROLES.ADMIN ? ADMIN_TOUR_STEPS : SUBMITTER_TOUR;
  const driverObj = driverFn({
    showProgress:    true,
    animate:         true,
    overlayOpacity:  0.65,
    progressText:    "Step {{current}} of {{total}}",
    nextBtnText:     "Next →",
    prevBtnText:     "← Back",
    doneBtnText:     "Done ✓",
    steps,
    onDestroyStarted: () => { driverObj.destroy(); },
  });
  driverObj.drive();
}

/* ─── DOM refs ───────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const refs = {
  // Pages
  onboardingOverlay: $("onboardingOverlay"),
  authPage:          $("authPage"),
  appView:           $("appView"),

  // Onboarding
  obSteps:      $$(".ob-step"),
  obDots:       $$(".ob-dot"),
  obNextBtn:    $("obNextBtn"),
  obSkipBtn:    $("obSkipBtn"),
  obRoleCards:  $("obRoleCards"),
  obFinalTitle: $("obFinalTitle"),
  obFinalText:  $("obFinalText"),
  obFinalTips:  $("obFinalTips"),

  // First-run guide
  firstRunGuide: $("firstRunGuide"),
  frgBackdrop:   $("frgBackdrop"),
  frgClose:      $("frgClose"),
  frgIconWrap:   $("frgIconWrap"),
  frgTitle:      $("frgTitle"),
  frgSubtitle:   $("frgSubtitle"),
  frgSteps:      $("frgSteps"),
  frgLater:      $("frgLater"),
  frgAction:     $("frgAction"),

  // Auth panels
  authFormsWrap: $("authFormsWrap"),
  signInPanel:   $("signInPanel"),
  registerPanel: $("registerPanel"),
  authTabPill:   $("authTabPill"),
  tabSignIn:     $("tabSignIn"),
  tabRegister:   $("tabRegister"),

  // Forms
  loginForm:       $("loginForm"),
  registerForm:    $("registerForm"),
  ideaForm:        $("ideaForm"),
  loginMessage:    $("loginMessage"),
  registerMessage: $("registerMessage"),
  ideaMessage:     $("ideaMessage"),
  routeMessage:    $("routeMessage"),
  demoAccess:      $("demoAccess"),

  // App shell
  logoutButton:    $("logoutButton"),
  resetDemoButton: $("resetDemoButton"),
  userChip:        $("userChip"),
  showGuideBtn:    $("showGuideBtn"),
  footerGuideBtn:  $("footerGuideBtn"),
  navLinks:        $$("[data-route-link]"),

  // Views
  dashboardView: $("dashboardView"),
  submitView:    $("submitView"),
  guideView:     $("guideView"),

  // Dashboard
  workspaceTitle: $("workspaceTitle"),
  workspaceCopy:  $("workspaceCopy"),
  metricsPanel:   $("metricsPanel"),
  ideasList:      $("ideasList"),
  statusFilter:   $("statusFilter"),
  searchInput:    $("searchInput"),
  welcomeBanner:  $("welcomeBanner"),

  // Submit
  sessionPanel:    $("sessionPanel"),
  submitPanel:     $("submitPanel"),
  categorySelect:  $("categorySelect"),
  titleCounter:    $("titleCounter"),
  descCounter:     $("descCounter"),
  fileDropZone:    $("fileDropZone"),
  attachmentInput: $("attachmentInput"),
  fdzPlaceholder:  $("fdzPlaceholder"),

  // Guide / Docs
  docsLinks:    $$(".docs-link"),
  docsSections: $$(".docs-section"),
};

/* ─── App state ─────────────────────────────────────────────── */
let state       = loadState();
let currentUser = publicUser(getUserById(state, sessionStorage.getItem(SESSION_KEY)));

/* ════════════════════════════════════════════
   STATE HELPERS
════════════════════════════════════════════ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createSeedState();
  } catch {
    return createSeedState();
  }
}

function saveState(next) {
  state = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setCurrentUser(user) {
  currentUser = user ? publicUser(user) : null;
  if (currentUser) {
    sessionStorage.setItem(SESSION_KEY, currentUser.id);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(WELCOME_KEY);
  }
}

/* ════════════════════════════════════════════
   ONBOARDING (pre-auth, 5 steps)
════════════════════════════════════════════ */
let obStep = 0;
let obSelectedRole = null;
const OB_TOTAL = refs.obSteps.length;

function showOnboarding() {
  if (localStorage.getItem(ONBOARDING_KEY)) return;
  refs.onboardingOverlay.hidden = false;
  setObStep(0);
  refs.authPage.style.filter = "blur(4px)";
  refs.authPage.style.pointerEvents = "none";
}

function hideOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, "1");
  refs.onboardingOverlay.hidden = true;
  refs.authPage.style.filter = "";
  refs.authPage.style.pointerEvents = "";
}

function setObStep(i) {
  obStep = i;
  refs.obSteps.forEach((s, idx) => s.classList.toggle("active", idx === i));
  refs.obDots.forEach((d, idx) => d.classList.toggle("active", idx === i));
  const isLast = i === OB_TOTAL - 1;
  refs.obNextBtn.textContent = isLast ? "Get started →" : "Next →";
  if (isLast) updateFinalStep();
}

function updateFinalStep() {
  if (obSelectedRole === "submitter") {
    refs.obFinalTitle.textContent = "Ready to submit your first idea!";
    refs.obFinalText.textContent  = "Sign in or register as a Submitter. The demo account is ready to go immediately.";
    refs.obFinalTips.innerHTML = `
      <div class="ob-tip-row"><span>→</span><span>Demo: <strong>aylin@epam.local / Submit123!</strong></span></div>
      <div class="ob-tip-row"><span>→</span><span>Or register a new submitter account</span></div>
      <div class="ob-tip-row"><span>→</span><span>Head to <strong>Submit Idea</strong> to start your first submission</span></div>
    `;
  } else if (obSelectedRole === "admin") {
    refs.obFinalTitle.textContent = "Ready to start reviewing ideas!";
    refs.obFinalText.textContent  = "Sign in as an Evaluator Admin. The demo admin account has ideas waiting for review.";
    refs.obFinalTips.innerHTML = `
      <div class="ob-tip-row"><span>→</span><span>Demo: <strong>admin@innovatepam.local / Admin123!</strong></span></div>
      <div class="ob-tip-row"><span>→</span><span>Or register a new evaluator admin account</span></div>
      <div class="ob-tip-row"><span>→</span><span>Filter ideas by <strong>Submitted</strong> to find ones awaiting review</span></div>
    `;
  } else {
    refs.obFinalTitle.textContent = "Ready to go!";
    refs.obFinalText.textContent  = "Sign in or register to get started. Use the demo accounts to instantly explore both roles.";
    refs.obFinalTips.innerHTML = `
      <div class="ob-tip-row"><span>→</span><span>Use demo accounts to explore without registering</span></div>
      <div class="ob-tip-row"><span>→</span><span>Register to create a persistent user account</span></div>
      <div class="ob-tip-row"><span>→</span><span>Data is saved locally in your browser</span></div>
    `;
  }
}

refs.obRoleCards.addEventListener("click", (e) => {
  const card = e.target.closest("[data-role]");
  if (!card) return;
  obSelectedRole = card.dataset.role;
  refs.obRoleCards.querySelectorAll(".ob-role-card").forEach((c) => {
    c.classList.toggle("selected", c === card);
  });
});

refs.obNextBtn.addEventListener("click", () => {
  if (obStep < OB_TOTAL - 1) {
    setObStep(obStep + 1);
  } else {
    hideOnboarding();
  }
});

refs.obSkipBtn.addEventListener("click", hideOnboarding);

/* ════════════════════════════════════════════
   POST-LOGIN FIRST-RUN GUIDE
════════════════════════════════════════════ */
function renderFirstRunGuide(role) {
  const isAdmin = role === ROLES.ADMIN;
  const steps   = isAdmin ? ADMIN_STEPS : SUBMITTER_STEPS;

  refs.frgIconWrap.textContent  = isAdmin ? "⚖️" : "💡";
  refs.frgTitle.textContent     = isAdmin ? "Welcome, Evaluator Admin!" : "Welcome! Let's submit your first idea.";
  refs.frgSubtitle.textContent  = isAdmin
    ? "Here's how to review and evaluate submitted ideas:"
    : "Here's how to create and track your first submission:";

  refs.frgSteps.innerHTML = steps.map((step, i) => `
    <li style="animation-delay:${0.05 + i * 0.07}s">
      <span class="frg-step-icon">${step.icon}</span>
      <span>${step.text}</span>
    </li>
  `).join("");

  refs.frgAction.textContent = isAdmin ? "Go to Dashboard →" : "Submit my first idea →";
  refs.frgAction.href        = isAdmin ? "#dashboard" : "#submit";
}

function showFirstRunGuide() {
  if (!currentUser) return;
  if (localStorage.getItem(guideKey(currentUser.role))) return;
  openGuide();
}

function openGuide() {
  if (!currentUser) return;
  renderFirstRunGuide(currentUser.role);
  refs.firstRunGuide.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeGuide() {
  if (currentUser) localStorage.setItem(guideKey(currentUser.role), "1");
  refs.firstRunGuide.hidden = true;
  document.body.style.overflow = "";
}

refs.frgClose.addEventListener("click", closeGuide);
refs.frgLater.addEventListener("click", closeGuide);
refs.frgBackdrop.addEventListener("click", closeGuide);
refs.showGuideBtn.addEventListener("click", openGuide);

refs.frgAction.addEventListener("click", (e) => {
  e.preventDefault();
  const role  = currentUser?.role;
  const route = role === ROLES.ADMIN ? "dashboard" : "submit";
  closeGuide();
  setRoute(route, true);
  setTimeout(() => startTour(role), 380);
});

refs.footerGuideBtn.addEventListener("click", () => setRoute("guide"));

/* ════════════════════════════════════════════
   WELCOME BANNER
════════════════════════════════════════════ */
function maybeShowWelcomeBanner() {
  if (!currentUser || !refs.welcomeBanner) return;
  if (sessionStorage.getItem(WELCOME_KEY)) return;
  sessionStorage.setItem(WELCOME_KEY, "1");

  const roleLabel = currentUser.role === ROLES.ADMIN ? "Evaluator Admin" : "Submitter";
  const firstName  = escapeHtml(currentUser.name.split(" ")[0]);
  refs.welcomeBanner.innerHTML = `
    <div class="welcome-banner" role="status">
      <div class="wb-text">
        <strong>Welcome back, ${firstName}!</strong>
        <span>Signed in as <em>${escapeHtml(roleLabel)}</em> · ${
          currentUser.role === ROLES.ADMIN
            ? "You can see and evaluate all submitted ideas."
            : "Submit ideas and track their progress here."
        }</span>
      </div>
      <button class="wb-close" type="button" aria-label="Dismiss welcome banner">Dismiss</button>
    </div>
  `;

  refs.welcomeBanner.querySelector(".wb-close")?.addEventListener("click", () => {
    refs.welcomeBanner.innerHTML = "";
  });
}

/* ════════════════════════════════════════════
   CHARACTER COUNTERS
════════════════════════════════════════════ */
function updateCounter(input, counterEl, max) {
  const len = input.value.length;
  counterEl.textContent = `${len} / ${max}`;
  counterEl.classList.toggle("warn",   len > max * 0.85);
  counterEl.classList.toggle("danger", len >= max);
}

const titleInput   = refs.ideaForm?.elements.namedItem("title");
const descTextarea = refs.ideaForm?.elements.namedItem("description");

titleInput?.addEventListener("input",   () => updateCounter(titleInput, refs.titleCounter, 90));
descTextarea?.addEventListener("input", () => updateCounter(descTextarea, refs.descCounter, 2500));

/* ════════════════════════════════════════════
   FILE DROP ZONE
════════════════════════════════════════════ */
function updateFilePlaceholder(file) {
  if (!refs.fdzPlaceholder) return;
  refs.fdzPlaceholder.innerHTML = `
    <span class="fdz-icon">📎</span>
    <span>${escapeHtml(file.name)}</span>
    <span class="fdz-hint">${formatSize(file.size)}</span>
  `;
  refs.fileDropZone?.classList.add("has-file");
}

function resetFilePlaceholder() {
  if (!refs.fdzPlaceholder) return;
  refs.fdzPlaceholder.innerHTML = `
    <span class="fdz-icon">📎</span>
    <span>Click to browse or drag a file here</span>
    <span class="fdz-hint">Any format · max 2 MB</span>
  `;
  refs.fileDropZone?.classList.remove("has-file");
}

if (refs.fileDropZone && refs.attachmentInput) {
  refs.fileDropZone.addEventListener("click", (e) => {
    if (e.target !== refs.attachmentInput) refs.attachmentInput.click();
  });

  refs.fileDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    refs.fileDropZone.classList.add("dragover");
  });

  refs.fileDropZone.addEventListener("dragleave", () => {
    refs.fileDropZone.classList.remove("dragover");
  });

  refs.fileDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    refs.fileDropZone.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    refs.attachmentInput.files = dt.files;
    updateFilePlaceholder(file);
  });

  refs.attachmentInput.addEventListener("change", () => {
    const file = refs.attachmentInput.files[0];
    file ? updateFilePlaceholder(file) : resetFilePlaceholder();
  });
}

/* ════════════════════════════════════════════
   AUTH TAB SWITCHING
════════════════════════════════════════════ */
let activePanel = "signin";

async function switchToPanel(target) {
  if (target === activePanel) return;
  const fromEl = target === "register" ? refs.signInPanel : refs.registerPanel;
  const toEl   = target === "register" ? refs.registerPanel : refs.signInPanel;

  fromEl.classList.add("fade-out");
  await new Promise((r) => setTimeout(r, 220));
  fromEl.hidden = true;
  fromEl.classList.remove("fade-out");

  toEl.hidden = false;
  toEl.classList.add("fade-in");
  await new Promise((r) => setTimeout(r, 20));
  toEl.classList.remove("fade-in");

  refs.authTabPill.classList.toggle("right", target === "register");
  refs.tabSignIn.classList.toggle("active",    target === "signin");
  refs.tabRegister.classList.toggle("active",  target === "register");
  refs.tabSignIn.setAttribute("aria-selected",   String(target === "signin"));
  refs.tabRegister.setAttribute("aria-selected", String(target === "register"));

  activePanel = target;
}

refs.tabSignIn.addEventListener("click",   () => switchToPanel("signin"));
refs.tabRegister.addEventListener("click", () => switchToPanel("register"));

/* Password show/hide toggles */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".pw-eye");
  if (!btn) return;
  const input  = btn.closest(".pw-wrap").querySelector("input");
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
});

/* ════════════════════════════════════════════
   ROUTING
════════════════════════════════════════════ */
function getRoute() {
  const hash = (location.hash || "").replace("#", "");
  return hash || (currentUser ? "dashboard" : "login");
}

function setRoute(route, replace = false) {
  const hash = `#${route}`;
  if (location.hash === hash) { applyRoute(); return; }
  if (replace) { history.replaceState(null, "", hash); applyRoute(); return; }
  location.hash = hash;
}

function applyRoute(message = "") {
  let route = getRoute();
  const publicRoutes = ["login", "register", "guide"];

  if (!currentUser && !publicRoutes.includes(route)) {
    route = "login";
    history.replaceState(null, "", "#login");
  }

  if (currentUser && ["login", "register"].includes(route)) {
    setRoute("dashboard", true);
    return;
  }

  const isAuth = !currentUser;
  refs.authPage.hidden = !isAuth;
  refs.appView.hidden  = isAuth;
  refs.logoutButton.hidden = isAuth;
  // Only show the fixed auth-page toggle when not logged in (topbar has its own)
  const authToggle = document.getElementById("authThemeToggle");
  if (authToggle) authToggle.hidden = !isAuth;

  refs.navLinks.forEach((link) => {
    const active = link.dataset.routeLink === route;
    link.classList.toggle("active", active);
    active ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
  });

  if (!currentUser) return;

  refs.dashboardView.hidden = route !== "dashboard";
  refs.submitView.hidden    = route !== "submit";
  refs.guideView.hidden     = route !== "guide";

  if (route === "submit") {
    refs.submitPanel.classList.add("route-focus");
    setTimeout(() => refs.submitPanel.classList.remove("route-focus"), 1800);
    refs.workspaceTitle.textContent = "Prepare a complete idea submission";
    refs.workspaceCopy.textContent  = "Add the problem, proposed impact, category, and one useful support file.";
  } else if (route === "guide") {
    refs.workspaceTitle.textContent = "Follow the guided demo workflow";
    refs.workspaceCopy.textContent  = "Use submitter and admin flows to show the full MVP in a few minutes.";
  } else {
    refs.workspaceTitle.textContent = "Innovation review console";
    refs.workspaceCopy.textContent  = "Capture ideas, keep context attached, and move decisions through a clean review trail.";
  }

  if (refs.routeMessage) {
    refs.routeMessage.textContent = message || "";
    refs.routeMessage.hidden = !message;
  }

  if (route === "dashboard") maybeShowWelcomeBanner();
}

/* ════════════════════════════════════════════
   RENDERING
════════════════════════════════════════════ */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "No updates";
  return new Intl.DateTimeFormat("en", {
    month:  "short",
    day:    "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSize(size) {
  const b = Number(size || 0);
  if (b < 1024)        return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function setMessage(el, message, tone = "error") {
  if (!el) return;
  el.textContent = message || "";
  el.dataset.tone = tone;
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function render() {
  currentUser = publicUser(getUserById(state, currentUser?.id));
  refs.logoutButton.hidden = !currentUser;

  if (currentUser) {
    renderUserChip();
    renderSession();
    renderMetrics();
    renderIdeas();
  }

  applyRoute();
}

function renderUserChip() {
  if (!currentUser || !refs.userChip) return;
  const initials = currentUser.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  refs.userChip.innerHTML = `
    <div class="avatar" aria-hidden="true">${escapeHtml(initials)}</div>
    <span>${escapeHtml(currentUser.name)}</span>
  `;
}

function renderSession() {
  if (!refs.sessionPanel) return;
  const roleLabel = currentUser.role === ROLES.ADMIN ? "Evaluator admin" : "Submitter";
  refs.sessionPanel.innerHTML = `
    <p class="eyebrow">Signed in</p>
    <h2>${escapeHtml(currentUser.name)}</h2>
    <p class="muted">${escapeHtml(currentUser.email)}</p>
    <span class="role-pill">${escapeHtml(roleLabel)}</span>
    <a class="text-link profile-link" href="${currentUser.role === ROLES.ADMIN ? "#dashboard" : "#submit"}">
      ${currentUser.role === ROLES.ADMIN ? "Review ideas" : "Submit an idea"}
    </a>
  `;
}

function renderMetrics() {
  const metrics = getPortalMetrics(state, currentUser);
  const cards = [
    ["Total ideas",  metrics.total,                   "All ideas in your current role scope"],
    ["In review",    metrics.byStatus["under-review"], "Items awaiting evaluator action"],
    ["Accepted",     metrics.byStatus.accepted,        "Approved for follow-up"],
    ["Attachments",  metrics.withAttachments,          "Ideas with supporting files"],
  ];
  refs.metricsPanel.innerHTML = cards.map(([label, value, note]) => `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(String(value))}</div>
      <p class="metric-note">${escapeHtml(note)}</p>
    </article>
  `).join("");
}

function renderIdeas() {
  const query  = refs.searchInput.value.trim().toLowerCase();
  const status = refs.statusFilter.value || "all";
  const ideas  = getVisibleIdeas(state, currentUser).filter((idea) => {
    const statusOk = status === "all" || idea.status === status;
    const hay = `${idea.title} ${idea.description} ${idea.category}`.toLowerCase();
    return statusOk && hay.includes(query);
  });

  if (ideas.length === 0) {
    refs.ideasList.innerHTML = `
      <div class="empty-state">
        <strong>No ideas match this view.</strong>
        <span>Adjust the filters or submit a new idea.</span>
      </div>
    `;
    return;
  }

  refs.ideasList.innerHTML = ideas.map(renderIdeaCard).join("");
}

function renderIdeaCard(idea) {
  const author = getUserById(state, idea.authorId);
  const status = STATUS_META[idea.status] || STATUS_META.submitted;

  const attachment = idea.attachment
    ? `<a class="attachment-link" ${
        idea.attachment.dataUrl
          ? `href="${escapeHtml(idea.attachment.dataUrl)}" download="${escapeHtml(idea.attachment.name)}"`
          : 'href="#" aria-disabled="true"'
      }>${escapeHtml(idea.attachment.name)} <span>${formatSize(idea.attachment.size)}</span></a>`
    : '<span style="color:var(--text-muted);font-size:.85rem">No attachment</span>';

  const reviewForm =
    currentUser.role === ROLES.ADMIN
      ? `<form class="review-form" data-review-form data-idea-id="${escapeHtml(idea.id)}">
           <select name="status" aria-label="Review status">
             ${STATUSES.filter((s) => s !== "submitted")
               .map((s) => `<option value="${s}" ${s === idea.status ? "selected" : ""}>${escapeHtml(STATUS_META[s].label)}</option>`)
               .join("")}
           </select>
           <input name="comment" type="text" placeholder="Evaluator comment (required for accept/reject)">
           <button class="secondary-button" type="submit">Update</button>
         </form>`
      : "";

  return `
    <article class="idea-card">
      <div class="idea-card-main">
        <div>
          <div class="idea-title-row">
            <span class="status-badge ${escapeHtml(status.tone)}">${escapeHtml(status.label)}</span>
            <span class="idea-id">${escapeHtml(idea.id.replace("idea-", "#"))}</span>
          </div>
          <h3>${escapeHtml(idea.title)}</h3>
          <p>${escapeHtml(idea.description)}</p>
        </div>
        <dl class="idea-meta">
          <div><dt>Category</dt><dd>${escapeHtml(idea.category)}</dd></div>
          <div><dt>Owner</dt><dd>${escapeHtml(author?.name || "Unknown")}</dd></div>
          <div><dt>Updated</dt><dd>${formatDate(idea.updatedAt)}</dd></div>
          <div><dt>File</dt><dd>${attachment}</dd></div>
        </dl>
      </div>
      ${reviewForm}
      <details class="history-panel">
        <summary>Status history (${(idea.history || []).length} ${(idea.history || []).length === 1 ? "entry" : "entries"})</summary>
        <ol>
          ${(idea.history || []).map((entry) => {
            const actor = getUserById(state, entry.actorId);
            const meta  = STATUS_META[entry.status] || STATUS_META.submitted;
            return `<li><strong>${escapeHtml(meta.label)}</strong> by ${escapeHtml(actor?.name || "Unknown")} — ${escapeHtml(entry.comment || "")} <span>${formatDate(entry.at)}</span></li>`;
          }).join("")}
        </ol>
      </details>
    </article>
  `;
}

function renderStaticOptions() {
  if (refs.categorySelect) {
    refs.categorySelect.innerHTML = CATEGORIES.map(
      (c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
    ).join("");
  }

  if (refs.statusFilter) {
    refs.statusFilter.innerHTML = [
      '<option value="all">All statuses</option>',
      ...STATUSES.map((s) => `<option value="${s}">${escapeHtml(STATUS_META[s].label)}</option>`),
    ].join("");
  }

  if (refs.demoAccess) {
    refs.demoAccess.innerHTML = DEMO_CREDENTIALS.map(
      (c) => `<button class="demo-button" type="button" data-demo-email="${escapeHtml(c.email)}">${escapeHtml(c.label)}</button>`
    ).join("");
  }
}

/* ════════════════════════════════════════════
   EVENT HANDLERS
════════════════════════════════════════════ */
function handleLogin(e) {
  e.preventDefault();
  const result = loginUser(state, formValues(refs.loginForm));
  if (!result.ok) { setMessage(refs.loginMessage, result.error); return; }
  refs.loginForm.reset();
  setMessage(refs.loginMessage, "");
  setCurrentUser(result.user);
  setRoute("dashboard", true);
  render();
  showFirstRunGuide();
}

function handleRegister(e) {
  e.preventDefault();
  const result = registerUser(state, formValues(refs.registerForm));
  if (!result.ok) { setMessage(refs.registerMessage, result.error); return; }
  saveState(result.state);
  refs.registerForm.reset();
  setMessage(refs.registerMessage, "Account created.", "success");
  setCurrentUser(result.user);
  setRoute("dashboard", true);
  render();
  showFirstRunGuide();
}

async function handleIdeaSubmit(e) {
  e.preventDefault();
  setMessage(refs.ideaMessage, "");
  try {
    const values    = formValues(refs.ideaForm);
    const fileInput = refs.ideaForm.elements.namedItem("attachment");
    values.attachment = await readAttachment(fileInput.files[0]);
    const result = createIdea(state, values, currentUser.id);
    if (!result.ok) { setMessage(refs.ideaMessage, result.error); return; }
    saveState(result.state);
    refs.ideaForm.reset();
    resetFilePlaceholder();
    if (refs.titleCounter) refs.titleCounter.textContent = "0 / 90";
    if (refs.descCounter)  refs.descCounter.textContent  = "0 / 2500";
    setMessage(refs.ideaMessage, "Idea submitted successfully!", "success");
    setRoute("dashboard", true);
    render();
  } catch (err) {
    setMessage(refs.ideaMessage, err.message);
  }
}

function handleReviewSubmit(e) {
  const form = e.target.closest("[data-review-form]");
  if (!form) return;
  e.preventDefault();
  const values = formValues(form);
  const result = updateIdeaStatus(state, form.dataset.ideaId, currentUser.id, values.status, values.comment);
  if (!result.ok) {
    const commentInput = form.querySelector("input[name='comment']");
    if (commentInput) commentInput.placeholder = result.error;
    return;
  }
  saveState(result.state);
  render();
}

function handleDemoAccess(e) {
  const btn = e.target.closest("[data-demo-email]");
  if (!btn) return;
  const cred = DEMO_CREDENTIALS.find((c) => c.email === btn.dataset.demoEmail);
  if (!cred) return;
  const result = loginUser(state, cred);
  if (result.ok) {
    setCurrentUser(result.user);
    setRoute("dashboard", true);
    render();
    showFirstRunGuide();
  }
}

function readAttachment(file) {
  if (!file) return Promise.resolve(null);
  if (file.size > MAX_ATTACHMENT) return Promise.reject(new Error("Attachment must be 2 MB or smaller."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load",  () =>
      resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: String(reader.result || "") })
    );
    reader.addEventListener("error", () => reject(new Error("Attachment could not be read.")));
    reader.readAsDataURL(file);
  });
}

function resetDemo() {
  saveState(createSeedState());
  setCurrentUser(null);
  refs.loginForm.reset();
  refs.registerForm.reset();
  refs.ideaForm.reset();
  resetFilePlaceholder();
  if (refs.titleCounter) refs.titleCounter.textContent = "0 / 90";
  if (refs.descCounter)  refs.descCounter.textContent  = "0 / 2500";
  setMessage(refs.loginMessage,    "");
  setMessage(refs.registerMessage, "");
  setMessage(refs.ideaMessage,     "");
  localStorage.removeItem(guideKey("submitter"));
  localStorage.removeItem(guideKey("admin"));
  if (refs.welcomeBanner) refs.welcomeBanner.innerHTML = "";
  setRoute("login", true);
  render();
}

/* ── Docs section navigation ── */
refs.docsLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    refs.docsLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    refs.docsSections.forEach((s) => {
      const match = s.dataset.section === section;
      s.hidden = !match;
      s.classList.toggle("active", match);
    });
  });
});

/* ─── Theme toggle buttons ──────────────────────────────────── */
document.getElementById("authThemeToggle")?.addEventListener("click", toggleTheme);
document.getElementById("topbarThemeToggle")?.addEventListener("click", toggleTheme);

/* ─── Wire up events ────────────────────────────────────────── */
refs.loginForm.addEventListener("submit",    handleLogin);
refs.registerForm.addEventListener("submit", handleRegister);
refs.ideaForm.addEventListener("submit",     handleIdeaSubmit);
refs.ideasList.addEventListener("submit",    handleReviewSubmit);
refs.demoAccess.addEventListener("click",    handleDemoAccess);

refs.logoutButton.addEventListener("click", () => {
  setCurrentUser(null);
  setRoute("login", true);
  render();
});

refs.resetDemoButton.addEventListener("click", resetDemo);

refs.statusFilter.addEventListener("change", renderIdeas);
refs.searchInput.addEventListener("input",   renderIdeas);

window.addEventListener("hashchange", () => applyRoute());

/* ─── Boot ──────────────────────────────────────────────────── */
applyTheme(localStorage.getItem(THEME_KEY) || "dark");
renderStaticOptions();
render();
showOnboarding();

globalThis.__innovatepamReady = true;
