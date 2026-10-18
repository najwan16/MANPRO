import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const required=['index.html','src/main.js','src/styles.css','src/tailwind-entry.css','src/data/catalog.js','src/data/systemAnalyst.js','src/assessment/rubricEngine.js','src/services/mockAdapter.js','src/services/supabaseAdapter.js','docs/USER_FLOW.md','docs/ASSESSMENT_RUBRIC.md','docs/BACKEND_HANDOFF.md','docs/DEMO_GUIDE.md'];
for(const file of required){if(!existsSync(file))throw Error('Missing required file: '+file)}
for(const path of ['src/main.js','src/data/catalog.js','src/data/systemAnalyst.js','src/assessment/rubricEngine.js','src/services/mockAdapter.js'])execFileSync(process.execPath,['--check',path]);
const code=readFileSync('src/main.js','utf8');for(const part of ['free-task-form','demo-checkout-form','task-work-form','feedbackList','formatPortfolio','certificateEligible','start-work'])if(!code.includes(part))throw Error('Missing workflow marker: '+part);
console.log('PASS — Required files, syntax, and critical workflow markers found.');
