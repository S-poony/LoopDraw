import { renderStrokes } from './strokeRenderer.js';
import { allStrokes } from '../state.js';
import { applyTransform } from '../viewport.js';

const activeCanvas = document.getElementById('activeCanvas');
const replayCanvas = document.getElementById('replayCanvas');
const onionCanvas = document.getElementById('onionCanvas');

export const activeCtx = activeCanvas.getContext('2d');
export const replayCtx = replayCanvas.getContext('2d');
export const onionCtx = onionCanvas.getContext('2d');

export { activeCanvas, replayCanvas, onionCanvas };

// Render a STATIC image of all strokes fully drawn
export function renderStaticSnapshot(targetCtx, { shouldClear = true, forExport = false } = {}) {
    targetCtx.resetTransform();
    if (shouldClear) {
        targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    }
    if (!forExport) applyTransform(targetCtx);
    renderStrokes(targetCtx, allStrokes, { forExport });
    targetCtx.resetTransform();
}

// Render time-based animation (strokes up to elapsed ms within cycle)
export function renderReplay(elapsed) {
    replayCtx.resetTransform();
    replayCtx.clearRect(0, 0, replayCanvas.width, replayCanvas.height);
    applyTransform(replayCtx);
    renderStrokes(replayCtx, allStrokes, { upToTime: elapsed });
    replayCtx.resetTransform();
}

export function resize() {
    let savedReplay = null;
    let savedOnion = null;

    if (replayCanvas.width > 0 && replayCanvas.height > 0) {
        savedReplay = document.createElement('canvas');
        savedReplay.width = replayCanvas.width;
        savedReplay.height = replayCanvas.height;
        savedReplay.getContext('2d').drawImage(replayCanvas, 0, 0);
    }

    // Only save onion if it's visible (opacity > 0 means it's enabled)
    if (onionCanvas.width > 0 && onionCanvas.height > 0 && parseFloat(onionCanvas.style.opacity) > 0) {
        savedOnion = document.createElement('canvas');
        savedOnion.width = onionCanvas.width;
        savedOnion.height = onionCanvas.height;
        savedOnion.getContext('2d').drawImage(onionCanvas, 0, 0);
    }

    activeCanvas.width = activeCanvas.clientWidth;
    activeCanvas.height = activeCanvas.clientHeight;
    replayCanvas.width = replayCanvas.clientWidth;
    replayCanvas.height = replayCanvas.clientHeight;
    onionCanvas.width = onionCanvas.clientWidth;
    onionCanvas.height = onionCanvas.clientHeight;

    if (savedReplay) replayCtx.drawImage(savedReplay, 0, 0);
    if (savedOnion) onionCtx.drawImage(savedOnion, 0, 0);
}
