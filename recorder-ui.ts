import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function run() {

  const targetUrl = process.argv[2] || 'https://wikipedia.org';
  const fileName = process.argv[3] || 'interactions.jsonl';
  
  // 2. Resolve the full path for the log file
  const logPath = path.isAbsolute(fileName) 
    ? fileName 
    : path.join(process.cwd(), fileName);

  console.log(`🌐 URL: ${targetUrl}`);
  console.log(`📁 Log Path: ${logPath}`);
  const browser = await chromium.launch({ headless: false });
  
  // 1. Setup the main recording context
  let currentInstruction = ""; 
  let pendingElementCapture: any = null; 

  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();

  const controlContext = await browser.newContext();
  const controlPage = await controlContext.newPage();
  await controlPage.setViewportSize({ width: 300, height: 380 });
  await controlPage.exposeFunction('updateInstruction', (text: string) => {
    currentInstruction = text;
  });

  // The "Commit" function: Writes to file and resets state
    await controlPage.exposeFunction('commitStep', () => {
    // 🟢 REQUIREMENT: Instruction must not be empty
    const trimmedInstruction = (currentInstruction || "").trim();
    
    if (!trimmedInstruction) {
      console.log("⚠️ REJECTED: Cannot save a step without a description.");
      // Notify the UI to show an error state
      controlPage.evaluate(() => (window as any).showInputError());
      return false; 
    }

    const payload = {
      instruction: trimmedInstruction,
      element: pendingElementCapture // Still optional, can be null
    };

    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n');
    console.log(`💾 SAVED: "${payload.instruction}" ${pendingElementCapture ? '[+Element]' : '[Text Only]'}`);

    // Reset states
    currentInstruction = "";
    pendingElementCapture = null;
    return true; // Success
  });


  let isRecording = false;

  await controlPage.exposeFunction('toggleRecording', (state: boolean) => {
  isRecording = state;
  console.log(`Units engaged: Recording is now ${isRecording ? 'ON' : 'OFF'}`);
  // Push this state change to the main page script
  page.evaluate((s) => { (window as any).setRecordingMode(s); }, isRecording);
  });

  await controlPage.exposeFunction('finishRecording', async () => {
    console.log('🛑 Closing...');
    await browser.close();
    process.exit(0);
  });

  // --- UI FOR CONTROL PANEL ---

    await controlPage.setContent(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>

        
        html, body { 
          margin: 0; padding: 0; 
          width: 100%; height: 100%; 
          background: #ffffff; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: hidden;
        }

        body {
          display: flex;
          justify-content: center;
          align-items: flex-start; /* Keeps it at the top if window is tall */
        }
        
        #container { 
            display: flex; 
            flex-direction: column; 
            width: 100%;
            max-width: 400px; 
            /* Changed height: 100vh to min-height: 100% */
            min-height: 100%; 
            padding: 20px;
            gap: 12px; /* Slightly reduced gap for small screens */
            box-sizing: border-box;
            margin: 0 auto; /* Safety centering */
        }

        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          width: 100%; 
          padding-bottom: 12px; 
          border-bottom: 1px solid #f0f0f0;
        }

        .mode-label { font-size: 10px; font-weight: 800; color: #a0a0a0; letter-spacing: 0.8px; }

        .input-wrapper { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        .section-title { font-size: 11px; font-weight: 700; color: #444; }
        
        textarea { 
          width: 100%; 
          height: 100px; 
          padding: 12px; 
          border: 1px solid #e0e0e0; 
          border-radius: 10px; 
          font-size: 14px; 
          resize: none; 
          box-sizing: border-box;
          background: #fafafa; 
          outline: none; 
          transition: border 0.2s, box-shadow 0.2s;
        }
        textarea:focus { border-color: #007aff; background: #fff; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }

        button { cursor: pointer; border: none; transition: transform 0.1s, opacity 0.2s; }
        
        .btn-primary { 
          width: 100%; 
          padding: 14px; 
          border-radius: 10px;
          background: #007aff; 
          color: white; 
          font-weight: 700; 
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(0,122,255,0.2);
        }
        .btn-primary:active { transform: scale(0.98); }
        
        .btn-text { 
          background: transparent; 
          color: #ff3b30; 
          font-size: 12px; 
          font-weight: 600; 
          margin-top: auto; /* Pushes to bottom */
          padding: 12px;
          text-align: center;
        }

        #status { 
          width: 100%; 
          font-size: 12px; 
          color: #555; 
          padding: 12px; 
          border-radius: 8px; 
          background: #f2f2f7; 
          box-sizing: border-box;
          text-align: center; 
          font-weight: 500;
        }

        /* TOGGLE SWITCH */
        .switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #d1d1d6; transition: .3s; border-radius: 20px; }
        input:checked + .slider { background-color: #34c759; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider:before { transform: translateX(16px); }
      </style>
    </head>
    <body>
      <div id="container">
        <div class="header">
          <span class="mode-label">RECORDING MODE</span>
          <label class="switch">
            <input type="checkbox" id="modeToggle">
            <span class="slider"></span>
          </label>
        </div>

        <div class="input-wrapper">
          <label class="section-title">STEP DESCRIPTION</label>
          <textarea id="stepInput" placeholder="e.g., Click the 'Search' bar..."></textarea>
        </div>

        <button id="nextBtn" class="btn-primary">Next Step</button>
        <div id="status">Mode: Normal Interaction</div>
        <button id="finishBtn" class="btn-text">Finish Session</button>
      </div>

      <script>
       window.showInputError = () => {
            const input = document.getElementById('stepInput');
            if (!input) return;
            input.style.border = "2px solid #ff3b30";
            input.style.background = "#fff2f1";
            input.placeholder = "⚠️ Description required!";
            setTimeout(() => {
            input.style.border = "1px solid #e0e0e0";
            input.style.background = "#fafafa";
            input.placeholder = "e.g., Click the 'Search' bar...";
            }, 1500);
        };
        window.updateUIWithCapture = (tagName) => {
          const statusEl = document.getElementById('status');
          if (statusEl) {
            statusEl.innerText = "Linked: " + tagName;
            statusEl.style.background = "#d4edda";
            statusEl.style.color = "#28a745";
          }
        };

        const setup = () => {
            const input = document.getElementById('stepInput');
            const nextBtn = document.getElementById('nextBtn');
            const status = document.getElementById('status');
            const modeToggle = document.getElementById('modeToggle');

            // Update text in Node
            input.addEventListener('input', (e) => window.updateInstruction(e.target.value));

            // Handle the Hijack Toggle
            modeToggle.addEventListener('change', (e) => {
                const active = e.target.checked;
                window.toggleRecording(active); // Calls Node function
                status.innerText = active ? "READY: Clicks will be captured/blocked" : "Mode: Normal Interaction";
                status.style.background = active ? "#fff3cd" : "#eee";
            });

            // Save Step
            nextBtn.addEventListener('click', async () => {
                await window.commitStep();
                input.value = "";
                
                // Reset capture status but keep recording mode where it was
                if (!modeToggle.checked) {
                status.innerText = "Mode: Normal Interaction";
                status.style.background = "#eee";
                } else {
                status.innerText = "READY: Clicks will be captured/blocked";
                status.style.background = "#fff3cd";
                }
            });

            // Called by Node when a click is successfully hijacked/captured
            window.updateUIWithCapture = (tagName) => {
                status.innerText = "Linked: " + tagName;
                status.style.background = "#d4edda";
            };


          finishBtn.addEventListener('click', () => window.finishRecording?.());
        };

        setup();
      </script>
    </body>
    </html>
`);



  // Attach the listener to the button in the small window
  await controlPage.evaluate(() => {
    const btn = document.getElementById('finishBtn');
    const status = document.getElementById('status');
    btn?.addEventListener('click', () => {
      status!.innerText = "Stopping...";
      (window as any).finishRecording();
    });
  });

  // --- REST OF YOUR ORIGINAL LOGIC ---

  page.on('console', msg => console.log(`🌐 BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`));

  

    await page.exposeFunction('saveToNode', async (data: any) => {
    // --- YOUR ORIGINAL FILTERING LOGIC ---
    const attrs = data.target.attributes || {};
    const hasText = data.target.text && data.target.text.length > 0;
    const hasIdentity = !!(attrs.label || attrs.id);
    const isCustom = data.target.tag.includes('-');

    // Only "link" the element if it meets your original quality standards
    if (hasText || hasIdentity || isCustom) {
        const preview = data.target.text || attrs.label || attrs.id || "Action";
        
        // 1. Log the capture to your terminal
        console.log(`📍 Element Linked: [${data.target.tag}] "${preview}"`);

        // 2. Store it in the pending variable (Logic change: don't save to file yet!)
        pendingElementCapture = data;

        // 3. Update the Control Panel UI so you see it's linked
        await controlPage.evaluate((tag) => {
          (window as any).updateUIWithCapture(tag);
        }, data.target.tag);
    } else {
        console.log(`mmskipped: [${data.target.tag}] (No identifying features)`);
    }
  });

  const scriptContent = `
  (() => {
    console.log("🚀 Recorder Active in Browser");

    let recordingActive = false;
    window.setRecordingMode = (state) => { 
        recordingActive = state; 
        console.log("Recording Mode:", recordingActive ? "ON (Hijacking)" : "OFF (Normal)");
    };

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
      if (recordingActive) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
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
          // class: interactive.className?.toString().trim() || undefined,
        };

        const cleanAttributes = Object.fromEntries(
          Object.entries(rawAttrs).filter(([_, v]) => v !== undefined && v !== "")
        );

        const lines = (interactive.innerText || '').split('\\n').map(l => l.trim()).filter(l => l.length > 0);
        const cleanText = lines.length > 0 ? lines[0].substring(0, 60) : "";

        const payload = {
          // url: window.location.href,
          // area: (eventPath.find(el => el instanceof HTMLElement && ['NAV', 'HEADER', 'MAIN'].includes(el.tagName)) || {tagName: 'BODY'}).tagName,
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

    window.addEventListener('click', (e) => {
      if (recordingActive) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { capture: true });
  })();`;

  await page.addInitScript(scriptContent);

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  console.log('\n🚀 SEMANTIC RECORDER ACTIVE');
  
  // Wait until either page is closed manually or through the Control Panel
  await new Promise(resolve => page.on('close', resolve));
  await browser.close();
}

run().catch(err => console.error('❌ SCRIPT ERROR:', err));
