import { Stagehand, type ModelConfiguration } from "@browserbasehq/stagehand";
//import { createOpenrouterStagehand } from "./stagehand-openrouter-client.js";
//const stagehand = createOpenrouterStagehand({modelName:"upstage/solar-pro-3:free",experimental:true, verbose:2,cacheDir:'act-cache' }); 
import { createNgllamaStagehand } from "../stagehand-ngllama-client.js";   
import { z } from 'zod';           
const stagehand = createNgllamaStagehand({modelName:'ministral-3:14b'}); // hf.co/gabriellarson/Qwen3-4B-Instruct-2507-GGUF:F16, ministral-3:14b
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

await page.goto('https://en.wikipedia.org/wiki/American_woodcock');
const con_stat = await stagehand.extract(
  `Identify the conservation status from the page content.
   
   Select ONLY the acronym from this list:
   - EX: Extinct
   - EW: Extinct in the wild
   - CR: Critically endangered
   - EN: Endangered
   - VU: Vulnerable
   - NT: Near Threatened
   - LC: Least Concern
   - DD: Data Deficient
   - NE: Not Evaluated`,
  z.enum([
  "EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE"
]).describe("The 2-letter IUCN conservation status acronym.")

);
console.log("waaaaaaaaaa", con_stat)
//try to make a generalised test pass/fail varifying extract prompt that i can across all tests 
//await stagehand.close();