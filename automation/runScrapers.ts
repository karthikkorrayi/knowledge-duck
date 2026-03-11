import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrapeFreeJobAlert } from "./scrapers/freejobalert";
import { saveJobs } from "./saveJobs";

async function run() {
  console.log("Starting job scraper...");
  const freeJobs = await scrapeFreeJobAlert();

  console.log("Jobs found:", freeJobs.length);
  await saveJobs(freeJobs);

  console.log("Scraping finished");
}

run();