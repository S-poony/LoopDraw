import { allStrokes, setAllStrokes, cycleDuration, setCycleDuration, startTime, MS_PER_SEC } from '../state.js';
import { onionCtx, onionCanvas, renderReplay } from '../rendering/canvasRenderer.js';
import { initCycle } from '../loop.js';

const durationSlider = document.getElementById('durationSlider');
const durationVal = document.getElementById('durationVal');
const collapseBtn = document.getElementById('collapseBtn');
const clearBtn = document.getElementById('clearBtn');

export function initControls() {
    durationSlider.addEventListener('input', (e) => {
        setCycleDuration(e.target.value * MS_PER_SEC);
        durationVal.innerText = e.target.value + 's';
    });

    collapseBtn.addEventListener('click', () => {
        allStrokes.forEach(stroke => {
            stroke.points.forEach(p => { p.t = 0; });
        });
        // Snap to visible immediately
        renderReplay(Date.now() - startTime);
    });

    clearBtn.addEventListener('click', () => {
        setAllStrokes([]);
        onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
        initCycle(1);
    });
}
