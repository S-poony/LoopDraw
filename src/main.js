import { resize, activeCtx, activeCanvas, replayCanvas, onionCanvas } from './rendering/canvasRenderer.js';
import { initToolManager, setTool } from './tools/toolManager.js';
import { initPen } from './tools/pen.js';
import { initEraser } from './tools/eraser.js';
import { initOnionSkin } from './features/onionSkin.js';
import { initExport } from './features/export.js';
import { initControls } from './features/controls.js';
import { initDrawing } from './drawing.js';
import { initCycle, loop } from './loop.js';

// Prevent context menu on all canvases
[activeCanvas, replayCanvas, onionCanvas].forEach(c =>
    c.addEventListener('contextmenu', (e) => e.preventDefault())
);

// Canvas resize
window.addEventListener('resize', resize);
setTimeout(resize, 0);

// Tools (register before setTool)
initPen();
initEraser();
initToolManager();
setTool('pen');

// Features
initOnionSkin();
initExport();
initControls();

// Drawing
initDrawing(activeCtx);

// Start
initCycle(1);
loop();
