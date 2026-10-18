import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:3001/";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(URL, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 700));

// --- 1. Add-habit form: select + radio ---
await page.evaluate(() =>
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Add Habit"))?.click()
);
await new Promise((r) => setTimeout(r, 300));
const form = await page.evaluate(() => {
  const sel = document.querySelector("select#habit-cat");
  const options = sel ? [...sel.options].map((o) => o.value) : null;
  const radios = [...document.querySelectorAll('input[type="radio"][name="habit-freq"]')];
  return {
    hasSelect: !!sel,
    categories: options,
    radioCount: radios.length,
    radioValues: radios.map((r) => r.value),
    radioChecked: radios.find((r) => r.checked)?.value,
  };
});
console.log("FORM:", JSON.stringify(form));

// Submit a habit via select + radio
await page.type("#habit-name", "Read Books");
await page.evaluate(() => {
  const radio = [...document.querySelectorAll('input[type="radio"][name="habit-freq"]')].find((r) => r.value === "5");
  radio?.click();
});
await page.evaluate(() =>
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Forge Quest"))?.click()
);
await new Promise((r) => setTimeout(r, 500));
const created = await page.evaluate(() => ({
  name: document.body.innerText.includes("Read Books"),
  target: document.body.innerText.match(/5× \/ week/)?.[0],
}));
console.log("CREATED HABIT:", JSON.stringify(created));

// --- 2. Complete today via checklist, then view note popup ---
await page.evaluate(() => {
  const group = document.querySelector('[role="group"][aria-label*="Read Books"]');
  const todayBtn = group && group.querySelector("button");
  todayBtn?.click(); // today's empty cell
});
await new Promise((r) => setTimeout(r, 350));
await page.type("textarea#note", "Read 20 pages of a fantasy novel before bed.");
await page.evaluate(() =>
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Seal the Log"))?.click()
);
await new Promise((r) => setTimeout(r, 600));

// Now click the ✓ (completed day) to open NoteViewer
await page.evaluate(() => {
  const group = document.querySelector('[role="group"][aria-label*="Read Books"]');
  const checkBtn = group && group.querySelector("button"); // now the done cell is a button with ✓
  checkBtn?.click();
});
await new Promise((r) => setTimeout(r, 400));
const noteViewer = await page.evaluate(() => ({
  open: !!document.getElementById("note-title"),
  title: document.querySelector("#note-title")?.textContent,
  noteText: document.body.innerText.includes("fantasy novel"),
}));
console.log("NOTE VIEWER:", JSON.stringify(noteViewer));
// close it
await page.evaluate(() => {
  const close = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "✕" || b.textContent.trim() === "Close");
  close?.click();
});
await new Promise((r) => setTimeout(r, 300));

// --- 3. Generate an assessment (mock fetch) -> persisted to history ---
await page.evaluate(() => {
  window.fetch = async (url) => {
    if (String(url).includes("/api/analyze")) {
      return { ok: true, status: 200, json: async () => ({ title: "The Reader King", analysis: "You commit to your pages.", next_quest: "Read 30 pages tomorrow." }) };
    }
    return Promise.reject(new Error("unexpected"));
  };
});
await page.evaluate(() =>
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Generate Weekly Assessment"))?.click()
);
await new Promise((r) => setTimeout(r, 700));
const storedAssessments = await page.evaluate(() => localStorage.getItem("questlog:assessments"));
console.log("ASSESSMENT SAVED:", storedAssessments);

// --- 4. History page ---
await page.goto(URL + "history", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 600));
const history = await page.evaluate(() => ({
  hasTitle: document.body.innerText.includes("Assessment History"),
  entryTitle: document.body.innerText.includes("The Reader King"),
  navActive: document.querySelector('a[aria-current="page"]')?.textContent,
}));
console.log("HISTORY PAGE:", JSON.stringify(history));

// --- 5. Achievements page ---
await page.goto(URL + "achievements", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 600));
const ach = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("main .flex.items-center.gap-4")];
  const unlocked = cards.filter((c) => c.textContent.includes("Unlocked"));
  return {
    hasTitle: document.body.innerText.includes("Achievements"),
    total: cards.length,
    unlockedCount: unlocked.length,
    hasFirstQuest: document.body.innerText.includes("First Quest"),
    hasAssessmentSeeker: document.body.innerText.includes("Assessment Seeker"),
    counterText: document.body.innerText.match(/\d+\/\d+ unlocked/)?.[0],
    navActive: document.querySelector('a[aria-current="page"]')?.textContent,
  };
});
console.log("ACHIEVEMENTS PAGE:", JSON.stringify(ach));

// --- Nav back to dashboard active state ---
await page.goto(URL, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 500));
const navHome = await page.evaluate(() => document.querySelector('a[aria-current="page"]')?.textContent?.trim());
console.log("DASHBOARD NAV ACTIVE:", JSON.stringify(navHome));

console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
