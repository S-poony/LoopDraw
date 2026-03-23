// Shared application state — import from here, never duplicate.

export const PEN_WIDTH = 3;
export const ERASER_WIDTH = 20;
export const DEFAULT_CYCLE_DURATION = 5000; // ms
export const VIDEO_FRAME_RATE = 30;
export const EXPORT_CAPTURE_END_THRESHOLD = 30; // ms before cycle end
export const MS_PER_SEC = 1000;
export const PROGRESS_COMPLETE = 100;

const palette = [
    '#2563eb', '#dc2626', '#16a34a', '#d97706',
    '#7c3aed', '#db2777', '#0891b2', '#4f46e5'
];

export function getRandomColor() {
    return palette[Math.floor(Math.random() * palette.length)];
}

// Stroke store
// Each stroke: { color: string, isEraser: boolean, points: [{x, y, t}] }
export let allStrokes = [];
export let currentStroke = null;
export let isDrawing = false;

export function setAllStrokes(val) { allStrokes = val; }
export function setCurrentStroke(val) { currentStroke = val; }
export function setIsDrawing(val) { isDrawing = val; }
export function pushStroke(stroke) { allStrokes.push(stroke); }

// Cycle state
export let cycleDuration = DEFAULT_CYCLE_DURATION;
export let startTime = Date.now();
export let currentCycleIndex = 1;
export let currentColor = '#000000';

export function setCycleDuration(val) { cycleDuration = val; }
export function setStartTime(val) { startTime = val; }
export function setCurrentCycleIndex(val) { currentCycleIndex = val; }
export function setCurrentColor(val) { currentColor = val; }
export function incrementCycleIndex() { currentCycleIndex++; }
