import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();

  // UPGRADE: Show ALL browser logs in your terminal
  page.on('console', msg => console.log(`🌐 BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`));

  const logPath = path.join(process.cwd(), 'interactions.jsonl');

  await page.exposeFunction('saveToNode', (data: any) => {
    const attrs = data.target.attributes || {};
    const hasText = data.target.text && data.target.text.length > 0;
    const hasIdentity = !!(attrs.label || attrs.id);
    const isCustom = data.target.tag.includes('-');

    if (hasText || hasIdentity || isCustom) {
        const preview = data.target.text || attrs.label || attrs.id || "Action";
        console.log(`✅ [${data.target.tag}] "${preview}"`);
        fs.appendFileSync(logPath, JSON.stringify(data) + '\n');
    }
  });

  // 🛡️ PASSING AS A RAW STRING PREVENTS COMPILER INJECTION (NO MORE __NAME ERRORS)
  const scriptContent = `
  (() => {
    console.log("🚀 Recorder Active in Browser");

    const getStableSelector = (el) => {
      try {
        if (el.id && !/^(ooui-|[0-9]|yt-)/.test(el.id)) return "#" + el.id;
        const testAttr = el.getAttribute('data-testid') || el.getAttribute('data-test');
        if (testAttr) return "[data-testid='" + testAttr + "']";

        const path = [];
        let current = el;
        for (let i = 0; i < 2 && current && current.tagName !== 'BODY'; i++) {
          let segment = current.tagName.toLowerCase();
          const validClasses = Array.from(current.classList)
            .filter(c => c.length < 20 && !/\\d/.test(c))
            .join('.');
          if (validClasses) segment += "." + validClasses;
          path.unshift(segment);
          current = current.parentElement;
        }
        return path.join(' > ');
      } catch (e) { return 'unknown'; }
    };

    window.addEventListener('mousedown', (e) => {
      try {
        const eventPath = e.composedPath();
        const targetNode = eventPath[0];
        if (!targetNode || targetNode.nodeType !== 1) return;

        const interactive = eventPath.find(el => {
          if (!(el instanceof HTMLElement)) return false;
          const isGraphic = ['SVG', 'PATH', 'IMG', 'YT-ICON', 'CIRCLE', 'I'].includes(el.tagName);
          const isRipple = el.className?.toString().includes('feedback') || el.className?.toString().includes('fill');
          if (isGraphic || isRipple) return false;

          const hasLabel = !!(el.getAttribute('aria-label') || el.getAttribute('title') || el.id);
          const hasText = el.innerText?.trim().length > 0;
          return hasLabel || el.tagName.includes('-') || ['BUTTON', 'A', 'INPUT'].includes(el.tagName) || (hasText && el.tagName !== 'DIV');
        }) || targetNode;

        const rawAttrs = {
          label: interactive.getAttribute('aria-label') || interactive.getAttribute('title') || 
                 (interactive.querySelector('[aria-label]') ? interactive.querySelector('[aria-label]').getAttribute('aria-label') : undefined),
          role: interactive.getAttribute('role') || undefined,
          id: (interactive.id && !interactive.id.includes('__')) ? interactive.id : undefined,
          class: interactive.className?.toString().trim() || undefined,
        };

        const cleanAttributes = Object.fromEntries(
          Object.entries(rawAttrs).filter(([_, v]) => v !== undefined && v !== "")
        );

        const lines = (interactive.innerText || '').split('\\n').map(l => l.trim()).filter(l => l.length > 0);
        const cleanText = lines.length > 0 ? lines[0].substring(0, 60) : "";

        const payload = {
          url: window.location.href,
          area: (eventPath.find(el => el instanceof HTMLElement && ['NAV', 'HEADER', 'MAIN'].includes(el.tagName)) || {tagName: 'BODY'}).tagName,
          target: {
            tag: interactive.tagName,
            selector: getStableSelector(interactive),
            text: cleanText,
            attributes: cleanAttributes
          }
        };

        window.saveToNode(payload);
      } catch (err) { console.error("Capture Error:", err); }
    }, { capture: true });
  })();`;

  await page.addInitScript(scriptContent);

  await page.goto('https://wikipedia.org', { waitUntil: 'domcontentloaded' });
  console.log('\n🚀 SEMANTIC RECORDER ACTIVE');
  await new Promise(resolve => page.on('close', resolve));
  await browser.close();
}

run().catch(err => console.error('❌ SCRIPT ERROR:', err));
