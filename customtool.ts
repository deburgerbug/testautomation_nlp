import promptSync from "prompt-sync";
import { tool } from "ai";
import { z } from "zod/v3";

import { createOpenrouterStagehand } from "./stagehand-openrouter-client.js";
import { Stagehand } from "@browserbasehq/stagehand";

//const stagehand = createOpenrouterStagehand({modelName:"google/gemma-3-27b-it:free",experimental:true, verbose:2}); 

import { createNgllamaStagehand } from "./stagehand-openaicompatible.js";                  
const stagehand = createNgllamaStagehand({modelName:'ministral-3:14b', experimental:true});

/*
const stagehand = new Stagehand({
  env:'LOCAL',
  model:'ollama/llama3.2',
  experimental:true,
  verbose:2
});

*/

const prompt = promptSync()
await stagehand.init();
const page = await stagehand.context.awaitActivePage();
console.log(`Stagehand Session Started`);
await page.goto('https://www.w3schools.com');
//await stagehand.act('enter standard_user in username field');
const agent = await stagehand.agent({tools: {
    askUser: tool({
      description:'Ask the user for the next instruction.',
      inputSchema: z.object({
        modelMessage: z.string().describe('your query to the user along with a description of your last action.'),
      }),
      execute: async ({ modelMessage }) => {
        console.log(modelMessage)
        const nextInstruction = prompt(`Enter next insturction: `);
        return {
          nextInstruction
        };
      },
    })
  },
  systemPrompt: `You are a web automation assistant. 
                You use the askUser tool to get an instruction, then perform the action in the browser. 
                after every action, call askUser again to get the next instuction. YOU WILL NEVER CALL DONE 
                unless the user tells you EXPLICITLY that you are done and can exit. YOU CANNOT EXIT ON YOUR OWN`,
}); 
const result = await agent.execute("ask the user what to do using askUser tool");
console.log(result);

await stagehand.close();