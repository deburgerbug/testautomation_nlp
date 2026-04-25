import { Stagehand, type ModelConfiguration } from "@browserbasehq/stagehand";
//import { createOpenrouterStagehand } from "./stagehand-openrouter-client.js";
//const stagehand = createOpenrouterStagehand({modelName:"upstage/solar-pro-3:free",experimental:true, verbose:2,cacheDir:'act-cache' }); 


import { createNgllamaStagehand } from "../stagehand-ngllama-client.js";              
  

/*
const stagehand = new Stagehand({
  env:'LOCAL',
  model:'ollama/phi4-mini',//'ollama/ministral-3:3b', //ollama/hf.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF:BF16'
  experimental:true,
  verbose:2,
  cacheDir:'act-cache'
});

*/

const stagehand = createNgllamaStagehand({modelName:'lfm2:24b'});
await stagehand.init();
const page = await stagehand.context.awaitActivePage();
console.log(`Stagehand Session Started`);

await page.goto('https://practicetestautomation.com/practice-test-login/');

const agent = await stagehand.agent({systemPrompt:"always verify that you succeeded in performing the task before exiting.", mode:"hybrid" });
await agent.execute('enter student in username field');
await agent.execute('enter Password123 in password field');
await agent.execute('click on login button');

await stagehand.close();