import { Stagehand } from "@browserbasehq/stagehand";
import fs from "fs";
import { createNgllamaStagehand } from "./stagehand-ngllama-client.js";              
const stagehand = createNgllamaStagehand({modelName:'ministral-3:14b'}); // hf.co/gabriellarson/Qwen3-4B-Instruct-2507-GGUF:F16, ministral-3:14b

/* const stagehand = new Stagehand({
  env: 'LOCAL',
  model: 'ollama/ministral-3:3b',
  experimental: true,
  verbose: 0,
  cacheDir: 'act-cache'
}); */

await stagehand.init();
const page = await stagehand.context.awaitActivePage();

// 1. Read an clean di file
const fileContent = fs.readFileSync("testcase/sauce_login.txt", "utf-8");
const lines: string[] = fileContent
  .split(";")
  .map((cmd) => cmd.trim())
  .filter((cmd) => cmd.length > 0);

// 2. Safe check
if (lines.length === 0) {
  console.log("Di file empty, nothing fi do!");
  await stagehand.close();
  process.exit(0);
}

// 3. Extract di first line safely
const firstLine = lines[0]; // IDE know seh a string dat, caz a di length check deh pon top.
let commands = lines;

if (firstLine && firstLine.startsWith("url:")) {
  const targetUrl = firstLine.replace("url:", "").trim();
  console.log(`Navigating to: ${targetUrl}`);
  await page.goto(targetUrl);
  commands = lines.slice(1); // Skip di URL fi di act() loop
}

// 3. Loop through di actual actions
for (const command of commands) {
  console.log(`Executing: ${command}`);
  try {
    const result = await stagehand.act(command);
    if (result.success) {
      console.log(`SUCCESS: ${command}`);
    } else {
      console.log(`FAILED: ${command}`);
      break;
    }
  } catch (err) {
    console.error(`CRASHED: ${command}`, err);
    break;
  }
}

//await stagehand.close();
