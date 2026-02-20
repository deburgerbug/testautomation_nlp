import { createOpenrouterStagehand } from "./stagehand-openrouter-client.js";
import { chromium } from "playwright-core";


const stagehand = createOpenrouterStagehand({modelName:'nvidia/nemotron-nano-12b-v2-vl:free'}); 

await stagehand.init();

// Connect Playwright to Stagehand's browser
const browser = await chromium.connectOverCDP({
  wsEndpoint: stagehand.connectURL(),
});

const pwContext = browser.contexts()[0];
const pwPage = pwContext?.pages()[0];

await pwPage?.goto("https://www.saucedemo.com");

await pwPage?.pause();

stagehand.act('enter standard_user in username field')
