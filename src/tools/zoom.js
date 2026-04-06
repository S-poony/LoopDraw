import { registerTool } from './toolManager.js';

export function initZoom() {
    registerTool('zoom', {
        button: document.getElementById('zoomBtn'),
        cursor: 'zoom-in',
    });
}
