import { createClient } from "@supabase/supabase-js";
import { companies, simulations } from "../src/data/catalog.js";
import { tasks as systemAnalystTasks } from "../src/data/systemAnalyst.js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");

const client = createClient(url, serviceKey, { auth: { persistSession: false } });
const save = async (table, rows) => {
  const { error } = await client.from(table).upsert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
};

await save("simulation_companies", companies.map((company) => ({
  id: company.id,
  name: company.name,
  definition: company,
  updated_at: new Date().toISOString(),
})));

await save("simulations", simulations.map(({ projectTasks = [], ...simulation }) => ({
  id: simulation.id,
  company_id: simulation.company,
  role_name: simulation.role,
  title: simulation.title,
  price_idr: simulation.price,
  status: simulation.status,
  definition: simulation,
  updated_at: new Date().toISOString(),
})));

await save("simulation_tasks", simulations.flatMap((simulation) => {
  const tasks = simulation.projectTasks?.length
    ? simulation.projectTasks
    : simulation.id === "system-analyst" ? systemAnalystTasks : [];
  return tasks.map((task, index) => ({
  id: task.id,
  simulation_id: simulation.id,
  sequence: index + 1,
  title: task.title,
  definition: task,
  updated_at: new Date().toISOString(),
  }));
}));

const taskCount = simulations.reduce((sum, item) => sum + (item.projectTasks?.length || (item.id === "system-analyst" ? systemAnalystTasks.length : 0)), 0);
console.log(`Seeded ${companies.length} companies, ${simulations.length} simulations, and ${taskCount} tasks.`);
