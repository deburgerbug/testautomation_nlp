import { Stagehand } from "@browserbasehq/stagehand";
import fs from "fs";
import { z } from "zod"; // Ensure zod is imported for the schema
import { createNgllamaStagehand } from "../stagehand-ngllama-client.js";              

const stagehand = createNgllamaStagehand({modelName:'did100/qwen2.5-32B-Instruct-Q4_K_M', verbose:0, domSettleTimeout: 3000});  //0000/ui-tars-1.5-7b-q8_0:7b    ministral-3:14b

await stagehand.init();
const page = await stagehand.context.awaitActivePage();

const fileContent = fs.readFileSync("testcase/sauce_login.txt", "utf-8");
const lines: string[] = fileContent
  .split(";")
  .map((cmd) => cmd.trim())
  .filter((cmd) => cmd.length > 0);

if (lines.length === 0) {
  console.log("File empty, nothing to do!");
  await stagehand.close();
  process.exit(0);
}

let commands = lines;
const firstLine = lines[0];

if (firstLine && firstLine.startsWith("url:")) {
  const targetUrl = firstLine.replace("url:", "").trim();
  console.log(`🚀 Navigating to: ${targetUrl}`);
  await page.goto(targetUrl);
  commands = lines.slice(1);
}

for (const command of commands) {
  console.log(`\nExecuting: ${command}`);
  try {
    // 1. Perform the action
    const actResult = await stagehand.act(command);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Cross-verify with Extract (Checking actual UI state)
    const verification = await stagehand.extract(
                    `The last action attempted was: "${command}". 
                    The system reported: "${actResult.message}".
                    see if the action was actually accomplished
                    `,
        z.object({
        success: z.boolean().describe('True if the action completed'),
        reason: z.string().describe('Be brief with your reasoning in why this was true or false')
      })
    );

    // 3. Report detailed results
    console.log(`--- Action Verification ---`);
    console.log(`Status: ${verification.success ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`Reason: ${verification.reason}`);
    console.log(`---------------------------`);

    if (!verification.success) {
      console.log(`Stopping execution due to verification failure.`);
      break; 
    }

  } catch (err) {
    console.error(`💥 CRASHED: ${command}`, err);
    break;
  }
}
console.log('END')
// Keep session open for debugging if needed
// await stagehand.close();
