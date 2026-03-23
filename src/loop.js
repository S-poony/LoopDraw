import {
    cycleDuration, startTime, setStartTime, currentCycleIndex, incrementCycleIndex, setCurrentCycleIndex,
    currentColor, setCurrentColor, getRandomColor, PROGRESS_COMPLETE
} from './state.js';
import { activeCtx, activeCanvas, renderReplay } from './rendering/canvasRenderer.js';
import { onCaptureStart, handleCaptureProgress } from './features/export.js';

const cycleCountEl = document.getElementById('cycleCount');
const colorBox = document.getElementById('currentColorBox');
const progressBar = document.getElementById('progressBar');

/**
 * Reset to a new cycle. Pass a specific index to force (e.g. clear -> 1),
 * or omit to simply increment.
 * @param {number} [forceIndex]
 */
export function initCycle(forceIndex) {
    if (forceIndex !== undefined) {
        setCurrentCycleIndex(forceIndex);
    }
    setCurrentColor(getRandomColor());
    colorBox.style.backgroundColor = currentColor;
    cycleCountEl.innerText = currentCycleIndex;
    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    setStartTime(Date.now());
}

export function loop() {
    const now = Date.now();
    let elapsed = now - startTime;

    if (elapsed >= cycleDuration) {
        incrementCycleIndex();
        initCycle();
        elapsed = 0;
        onCaptureStart();
    }

    const progress = (elapsed / cycleDuration) * PROGRESS_COMPLETE;
    progressBar.style.width = progress + '%';

    handleCaptureProgress(elapsed, cycleDuration);
    renderReplay(elapsed);

    requestAnimationFrame(loop);
}
