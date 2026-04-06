import { allStrokes, setAllStrokes, cycleStart, cycleEnd, setCycleStart, setCycleEnd, startTime, MS_PER_SEC } from '../state.js';
import { onionCtx, onionCanvas, renderReplay } from '../rendering/canvasRenderer.js';
import { initCycle } from '../loop.js';

const rangeSlider = document.getElementById('rangeSlider');
const fill = document.getElementById('rangeSliderFill');
const thumbStart = document.getElementById('rangeThumbStart');
const thumbEnd = document.getElementById('rangeThumbEnd');
const durationVal = document.getElementById('durationVal');

const collapseBtn = document.getElementById('collapseBtn');
const clearBtn = document.getElementById('clearBtn');

const SLIDER_MIN = 0;
const SLIDER_MAX = 60;
const MIN_GAP = 1;

let isDraggingStart = false;
let isDraggingEnd = false;

let currentStartVal = cycleStart;
let currentEndVal = cycleEnd;

function posToVal(clientX) {
    const rect = rangeSlider.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(SLIDER_MIN + pct * (SLIDER_MAX - SLIDER_MIN));
}

function updateSlider() {
    const startPct = ((currentStartVal - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
    const endPct = ((currentEndVal - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
    
    thumbStart.style.left = startPct + '%';
    thumbEnd.style.left = endPct + '%';
    fill.style.left = startPct + '%';
    fill.style.width = (endPct - startPct) + '%';
    
    durationVal.innerText = currentStartVal + 's – ' + currentEndVal + 's';
    
    setCycleStart(currentStartVal);
    setCycleEnd(currentEndVal);
}

function handlePointerMove(e) {
    if (isDraggingStart) {
        let val = posToVal(e.clientX);
        if (val > currentEndVal - MIN_GAP) val = currentEndVal - MIN_GAP;
        if (currentStartVal !== val) {
            currentStartVal = val;
            updateSlider();
        }
    } else if (isDraggingEnd) {
        let val = posToVal(e.clientX);
        if (val < currentStartVal + MIN_GAP) val = currentStartVal + MIN_GAP;
        if (currentEndVal !== val) {
            currentEndVal = val;
            updateSlider();
        }
    }
}

function handlePointerUp() {
    isDraggingStart = false;
    isDraggingEnd = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
}

export function initControls() {
    updateSlider();

    thumbStart.addEventListener('pointerdown', (e) => {
        isDraggingStart = true;
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        e.preventDefault();
    });

    thumbEnd.addEventListener('pointerdown', (e) => {
        isDraggingEnd = true;
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        e.preventDefault();
    });

    collapseBtn.addEventListener('click', () => {
        const targetT = cycleStart * MS_PER_SEC;
        allStrokes.forEach(stroke => {
            stroke.points.forEach(p => { p.t = targetT; });
        });
        // Snap to visible immediately
        renderReplay(cycleStart * MS_PER_SEC + (Date.now() - startTime));
    });

    clearBtn.addEventListener('click', () => {
        setAllStrokes([]);
        onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
        initCycle(1);
    });
}
