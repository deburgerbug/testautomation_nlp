import { createNgllamaStagehand } from "../stagehand-ngllama-client.js";   
import { z } from 'zod';           
const stagehand = createNgllamaStagehand({modelName:'ministral-3:14b', verbose:0}); // hf.co/gabriellarson/Qwen3-4B-Instruct-2507-GGUF:F16, ministral-3:14b
/*
const stagehand = new Stagehand({
  env:'LOCAL',
  model:'ollama/ministral-3:3b', //ollama/hf.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF:BF16'
  experimental:true,
  verbose:0,
  cacheDir:'act-cache'
});
*/



await stagehand.init();
const page = await stagehand.context.awaitActivePage();
console.log(`Stagehand Session Started`);

await page.goto('https://www.wikipedia.org');
const actresult= await stagehand.act('click on salamamama');
console.log(actresult.message);
const result = await stagehand.extract(`Evaluate the page for whether if the action "click on salamamama" was successful based on this result: "${actresult.message}".`, 
   z.object({
    success: z.boolean().describe('True if the specific action was completed without error'),
    reason: z.string().describe('Explanation of why the result indicates success or failure')
  })
);

console.log(`
--- Action Verification ---
Success: ${result.success ? "✅ YES" : "❌ NO"}
Reason:  ${result.reason}
---------------------------
`);