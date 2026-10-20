import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const required = [
  "index.html",
  "src/main.js",
  "src/styles.css",
  "src/data/catalog.js",
  "src/data/systemAnalyst.js",
  "src/assessment/rubricEngine.js",
  "src/services/mockAdapter.js",
  "src/services/supabaseAdapter.js",
  "src/pages/free.js",
  "src/pages/checkout.js",
  "src/pages/workspace.js",
  "src/pages/report.js",
  "src/pages/progress.js",
  "docs/USER_FLOW.md",
  "docs/ASSESSMENT_RUBRIC.md",
  "docs/BACKEND_HANDOFF.md",
  "docs/DEMO_GUIDE.md",
];

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const collectJavaScript = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScript(path);
    return /\.(?:js|mjs)$/.test(entry.name) ? [path] : [];
  });

for (const path of [...collectJavaScript("src"), ...collectJavaScript("scripts")]) {
  execFileSync(process.execPath, ["--check", path]);
}

const markers = {
  "src/pages/free.js": ["free-task-form"],
  "src/pages/checkout.js": ["checkout-form"],
  "src/pages/workspace.js": ["task-work-form"],
  "src/components/ui.js": ["feedbackList"],
  "src/pages/portfolio.js": ["formatPortfolio"],
  "src/assessment/rubricEngine.js": ["certificateEligible"],
  "src/main.js": ["restartAttempt", "refreshEntitlements"],
};

for (const [file, requiredMarkers] of Object.entries(markers)) {
  const source = readFileSync(file, "utf8");
  for (const marker of requiredMarkers) {
    if (!source.includes(marker)) throw new Error(`Missing workflow marker ${marker} in ${file}`);
  }
}

console.log("PASS — Required files, JavaScript syntax, and current workflow markers verified.");
