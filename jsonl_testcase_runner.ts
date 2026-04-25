import { Stagehand } from "@browserbasehq/stagehand";
import fs from "fs";
import { createNgllamaStagehand } from "./stagehand-ngllama-client.js";

const targetUrl = process.argv[2];
const filePath = process.argv[3] || 'interactions.jsonl';
  

if (!targetUrl) {
  console.error("❌ ERROR: Please provide a URL as an argument.");
  console.log("Usage: node your-script.js https://example.com");
  process.exit(1);
}

const stagehand = createNgllamaStagehand({ modelName: 'ministral-3:14b' }); //did100/qwen2.5-32B-Instruct-Q4_K_M

await stagehand.init();
const page = await stagehand.context.awaitActivePage();

// 1. Read and parse the JSONL file

const fileContent = fs.readFileSync(filePath, "utf-8");

const steps = fileContent
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0)
  .map((line) => JSON.parse(line));

if (steps.length === 0) {
  console.log("File is empty.");
  await stagehand.close();
  process.exit(0);
}

// 2. Initial navigation (using the URL from the first element)
console.log(`🚀 Navigating to: ${targetUrl}`);
await page.goto(targetUrl);


// 3. Execution Loop
// ... (rest of your script remains the same)

for (const step of steps) {
  const { instruction, element } = step;

  // 1. Handle optional element data safely
  let elementContext = "No specific element provided. Use general page context.";
  
  if (element && element.target) {
    elementContext = `
    Focus on this element:
    Tag: ${element.target.tag}
    Selector: ${element.target.selector}
    Text: ${element.target.text}
    Attributes: ${JSON.stringify(element.target.attributes || {})}
    `.trim();
  }
  
  const combinedPrompt = `Instruction: "${instruction}"\n\nContext: ${elementContext}`;

  console.log(`\n🚀 Executing: ${instruction}`);

  try {
    const result = await stagehand.act(combinedPrompt);

    if (result.success) {
      console.log(`✅ SUCCESS: ${instruction}`);
    } else {
      console.log(`❌ FAILED: ${instruction}`);
      break;
    }
  } catch (err: unknown) {
    // 2. Fix the 'unknown' type error
    let errorMessage = "An unknown error occurred";
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    }

    console.error(`💥 ENGINE ERROR: ${errorMessage}`);
    break;
  }
}

// Keep browser open for inspection
// await stagehand.close();
