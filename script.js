/* ============= ELEMENT REFERENCES =============*/

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



let is24Hour = localStorage.getItem("clock-format") === "24";
let selectedTimeZone = localStorage.getItem("clock-tz") || "local";



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



function render() {
  const now = new Date();

  
  const zone = selectedTimeZone === "local" ? undefined : selectedTimeZone;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, 
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(now);

 
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";

  let hour24 = parseInt(get("hour"), 10);
  if (hour24 === 24) hour24 = 0; 
  const minute = get("minute");
  const second = get("second");

 
  let displayHour = hour24;
  let meridiem = "";

  if (!is24Hour) {
    meridiem = hour24 >= 12 ? "PM" : "AM";
    displayHour = hour24 % 12;
    if (displayHour === 0) displayHour = 12; 
  }

  hoursEl.textContent = String(displayHour).padStart(2, "0");
  minutesEl.textContent = minute;
  secondsEl.textContent = second;
  meridiemEl.textContent = meridiem;
  meridiemEl.style.display = is24Hour ? "none" : "";

  dayLabelEl.textContent = get("weekday");
  dateLabelEl.textContent = `${get("month")} ${get("day")}, ${get("year")}`;
}



render();
setInterval(render, 1000);



function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeIcon.textContent = isDark ? "🌙" : "☀️";
  themeLabel.textContent = isDark ? "Dark" : "Light";
  localStorage.setItem("clock-theme", isDark ? "dark" : "light");
}


const savedTheme = localStorage.getItem("clock-theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme ? savedTheme === "dark" : systemPrefersDark);

themeToggle.addEventListener("click", () => {
  applyTheme(!document.body.classList.contains("dark"));
});



formatToggle.addEventListener("click", (event) => {
  const button = event.target.closest(".segmented__option");
  if (!button) return;

  is24Hour = button.dataset.format === "24";
  localStorage.setItem("clock-format", is24Hour ? "24" : "12");

 
  formatToggle
    .querySelectorAll(".segmented__option")
    .forEach((btn) => btn.classList.toggle("is-active", btn === button));

  render(); 
});


document
  .querySelectorAll(".segmented__option")
  .forEach((btn) => btn.classList.toggle("is-active", (btn.dataset.format === "24") === is24Hour));



populateTimezones();

tzSelect.addEventListener("change", () => {
  selectedTimeZone = tzSelect.value;
  localStorage.setItem("clock-tz", selectedTimeZone);
  render();
});
