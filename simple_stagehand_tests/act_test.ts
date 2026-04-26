import { Stagehand, type ModelConfiguration } from "@browserbasehq/stagehand";
//import { createOpenrouterStagehand } from "./stagehand-openrouter-client.js";
//const stagehand = createOpenrouterStagehand({modelName:"upstage/solar-pro-3:free",experimental:true, verbose:2,cacheDir:'act-cache' }); 
import { createNgllamaStagehand } from "../stagehand-ngllama-client.js";              
const stagehand = createNgllamaStagehand({modelName:' ministral-3:14b', verbose:1, cacheDir:'act/we'}); // did100/qwen2.5-32B-Instruct-Q4_K_M, ministral-3:14b
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
await page.goto('https://the-internet.herokuapp.com/infinite_scroll');
/* 
const [action] = await stagehand.observe(`return elements that closely match this metadata: {"url":"https://www.w3schools.com/","target":{"tag":"H2","text":"React","html":"<h2 ">React</h2>"},"domPath":["HTML","BODY","DIV","DIV","DIV","DIV","DIV","DIV","DIV","DIV","A","DIV","H2"]}
`);

if (action) {
  const actresult = await stagehand.act(action + `click the big button labelled react towards the bottom of the page`);
  console.log(actresult.message)
}
  */
await stagehand.act(`hover on user1 `);
  /* 
await page.goto('https://www.w3schools.com');
await stagehand.act('click on jquery');
await stagehand.act('enter p in the text box that is in the exercise section');
await stagehand.act('click on submit answer');

*/
//await stagehand.close();