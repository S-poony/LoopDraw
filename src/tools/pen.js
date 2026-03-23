import { registerTool } from './toolManager.js';

export function initPen() {
    registerTool('pen', {
        button: document.getElementById('penBtn'),
        cursor: 'crosshair',
    });
}
