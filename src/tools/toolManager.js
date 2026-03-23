import { activeCanvas } from '../rendering/canvasRenderer.js';

const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');

let currentTool = 'pen';

const tools = {};

export function registerTool(name, config) {
    tools[name] = config;
}

export function getCurrentTool() {
    return currentTool;
}

export function setTool(name) {
    if (!tools[name]) return;
    currentTool = name;

    // Reset all tool buttons
    Object.entries(tools).forEach(([toolName, config]) => {
        const btn = config.button;
        if (!btn) return;
        if (toolName === name) {
            btn.classList.add('active', 'bg-zinc-700');
            btn.classList.remove('bg-zinc-800');
        } else {
            btn.classList.remove('active', 'bg-zinc-700');
            btn.classList.add('bg-zinc-800');
        }
    });

    activeCanvas.style.cursor = tools[name].cursor ?? 'crosshair';
}

export function initToolManager() {
    penBtn.addEventListener('click', () => setTool('pen'));
    eraserBtn.addEventListener('click', () => setTool('eraser'));
}
