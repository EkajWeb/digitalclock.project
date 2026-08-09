/* ===================================================================
   ELEMENT REFERENCES
   Grab everything once up front so the render loop below doesn't
   repeatedly query the DOM (that would be wasteful — we're about
   to run this render function once every second, forever).
=================================================================== */

const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const meridiemEl = document.getElementById("meridiem");
const dayLabelEl = document.getElementById("dayLabel");
const dateLabelEl = document.getElementById("dateLabel");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

const formatToggle = document.getElementById("formatToggle");
const tzSelect = document.getElementById("tzSelect");

/* ===================================================================
   STATE
   Two small pieces of state drive everything: which hour format
   we're in, and which timezone we're viewing. Both start from
   localStorage if the user has visited before, so preferences persist.
=================================================================== */

let is24Hour = localStorage.getItem("clock-format") === "24";
let selectedTimeZone = localStorage.getItem("clock-tz") || "local";

/* ===================================================================
   TIMEZONE OPTIONS
   Intl.supportedValuesOf('timeZone') gives us every IANA timezone
   name the browser knows about (e.g. "Europe/Paris"). We only show
   a curated shortlist so the dropdown stays usable, but the local
   option always maps to whatever the visitor's system is set to.
=================================================================== */

const TIMEZONES = [
  { value: "local", label: "Local time" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Manila", label: "Manila" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Kolkata", label: "Mumbai / Delhi" },
  { value: "Australia/Sydney", label: "Sydney" },
];

function populateTimezones() {
  TIMEZONES.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    tzSelect.appendChild(opt);
  });
  tzSelect.value = selectedTimeZone;
}

/* ===================================================================
   CORE RENDER FUNCTION
   This runs once a second. Every time it runs, it:
     1. Reads the current moment as a Date object
     2. Reformats it for the chosen timezone (via Intl.DateTimeFormat)
     3. Writes the pieces into the DOM
=================================================================== */

function render() {
  const now = new Date();

  // Intl.DateTimeFormat does timezone-aware formatting for us.
  // Passing timeZone: undefined tells it "use the browser's local zone".
  const zone = selectedTimeZone === "local" ? undefined : selectedTimeZone;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // we always pull 24h values here, then convert ourselves below
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(now);

  // formatToParts() returns an array like:
  // [{type:"weekday", value:"Monday"}, {type:"hour", value:"14"}, ...]
  // We turn that into a simple lookup object for convenience.
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";

  let hour24 = parseInt(get("hour"), 10);
  if (hour24 === 24) hour24 = 0; // some locales report midnight as "24"
  const minute = get("minute");
  const second = get("second");

  // ---- 12h vs 24h conversion ----
  // 24h format is what Intl already gave us. For 12h, we map the
  // 0–23 range onto 1–12 and derive AM/PM from whether we're past noon.
  let displayHour = hour24;
  let meridiem = "";

  if (!is24Hour) {
    meridiem = hour24 >= 12 ? "PM" : "AM";
    displayHour = hour24 % 12;
    if (displayHour === 0) displayHour = 12; // 0 -> 12 for midnight/noon
  }

  hoursEl.textContent = String(displayHour).padStart(2, "0");
  minutesEl.textContent = minute;
  secondsEl.textContent = second;
  meridiemEl.textContent = meridiem;
  meridiemEl.style.display = is24Hour ? "none" : "";

  dayLabelEl.textContent = get("weekday");
  dateLabelEl.textContent = `${get("month")} ${get("day")}, ${get("year")}`;
}

/* ===================================================================
   THE TICK LOOP
   setInterval(fn, 1000) calls fn roughly every 1000ms. It's not
   perfectly precise (the browser can delay it under load), but for
   a clock display that ticks once a second, it's more than enough.
   We also call render() once immediately so the clock doesn't sit
   blank for a second before the first interval fires.
=================================================================== */

render();
setInterval(render, 1000);

/* ===================================================================
   THEME TOGGLE (light / dark)
   All the actual visual work is done by CSS variables that flip
   when body.dark is present (see style.css). This function's only
   job is to add/remove that class and remember the choice.
=================================================================== */

function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeIcon.textContent = isDark ? "🌙" : "☀️";
  themeLabel.textContent = isDark ? "Dark" : "Light";
  localStorage.setItem("clock-theme", isDark ? "dark" : "light");
}

// On load: respect a saved preference, otherwise fall back to the
// visitor's OS-level preference via a media query.
const savedTheme = localStorage.getItem("clock-theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme ? savedTheme === "dark" : systemPrefersDark);

themeToggle.addEventListener("click", () => {
  applyTheme(!document.body.classList.contains("dark"));
});

/* ===================================================================
   12h / 24h FORMAT TOGGLE
=================================================================== */

formatToggle.addEventListener("click", (event) => {
  const button = event.target.closest(".segmented__option");
  if (!button) return;

  is24Hour = button.dataset.format === "24";
  localStorage.setItem("clock-format", is24Hour ? "24" : "12");

  // Move the "active" highlight to whichever button was clicked
  formatToggle
    .querySelectorAll(".segmented__option")
    .forEach((btn) => btn.classList.toggle("is-active", btn === button));

  render(); // re-render immediately so the change feels instant
});

// Make sure the active pill matches the restored state on page load
document
  .querySelectorAll(".segmented__option")
  .forEach((btn) => btn.classList.toggle("is-active", (btn.dataset.format === "24") === is24Hour));

/* ===================================================================
   TIMEZONE SELECTOR
=================================================================== */

populateTimezones();

tzSelect.addEventListener("change", () => {
  selectedTimeZone = tzSelect.value;
  localStorage.setItem("clock-tz", selectedTimeZone);
  render();
});