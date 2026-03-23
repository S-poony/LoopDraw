import { registerTool } from './toolManager.js';

export function initEraser() {
    registerTool('eraser', {
        button: document.getElementById('eraserBtn'),
        cursor: 'cell',
    });
}
