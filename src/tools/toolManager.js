import { activeCanvas } from '../rendering/canvasRenderer.js';

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
    // Bind click handlers for all registered tools that have buttons
    Object.entries(tools).forEach(([name, config]) => {
        if (config.button) {
            config.button.addEventListener('click', () => setTool(name));
        }
    });
}
