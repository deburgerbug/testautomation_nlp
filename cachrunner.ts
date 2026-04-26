import { createNgllamaStagehand } from "./stagehand-ngllama-client.js"; 
import fs from "fs";
import path from "path";

const getMsg = (e: unknown) => e instanceof Error ? e.message : String(e);

async function runStrictReplay() {
  const [,, url, folderPath] = process.argv;

  if (!url || !folderPath) {
    console.error("❌ Usage: node replay.js <url> <folderPath>");
    process.exit(1);
  }

  // 1. Initialize Stagehand
  // Pointing cacheDir here tells Stagehand: "Look at these files first."
  const stagehand = createNgllamaStagehand({
    modelName: 'ministral-3:14b', 
    verbose: 1, 
    cacheDir: folderPath 
  });

  await stagehand.init();
  console.log(`🚀 Session Started`);

  try {
    const page = await stagehand.context.awaitActivePage();
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    // 2. Sort files by Creation Time (Birthtime)
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.json'))
      .map(name => ({
        name,
        time: fs.statSync(path.join(folderPath, name)).birthtimeMs
      }))
      .sort((a, b) => a.time - b.time)
      .map(f => f.name);

    console.log(`📂 Processing ${files.length} actions in chronological order...`);

    // 3. Sequential Execution
    for (const file of files) {
      // Re-sync active page every iteration in case of redirects/new tabs
      const currentPage = await stagehand.context.awaitActivePage();
      
      const filePath = path.join(folderPath, file);
      const { instruction } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (instruction) {
        console.log(`\n👉 Action: "${instruction}"`);
        
        // No try/catch here: if act() fails (cache miss or element gone), 
        // the script will throw and hit the main catch block.
        await stagehand.act(instruction);
        
        console.log(`✅ Success`);
      }
    }

    console.log(`\n✨ All actions finished successfully.`);

  } catch (error) {
    console.error(`\n❌ SCRIPT STOPPED: Action failed or Cache Missed.`);
    console.error(`Error Details: ${getMsg(error)}`);
    process.exit(1); // Hard stop
  } finally {
    await stagehand.close();
  }
}

runStrictReplay();
