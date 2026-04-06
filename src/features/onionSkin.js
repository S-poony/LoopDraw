import { onionCtx, onionCanvas, renderStaticSnapshot } from '../rendering/canvasRenderer.js';
import { allStrokes } from '../state.js';
import { applyStrokeStyle, drawStrokePath } from '../rendering/strokeRenderer.js';
import { applyTransform } from '../viewport.js';

const onionBtn = document.getElementById('onionBtn');
const onionText = document.getElementById('onionText');

export let isOnionSkinEnabled = false;

export function updateOnionWithStroke(stroke) {
    if (!isOnionSkinEnabled) return;
    applyTransform(onionCtx);
    applyStrokeStyle(onionCtx, stroke);
    drawStrokePath(onionCtx, stroke.points);
    onionCtx.resetTransform();
}

/**
 * Re-render the entire onion canvas with the current viewport transform.
 * Called when zoom/pan changes.
 */
export function refreshOnion() {
    if (!isOnionSkinEnabled) return;
    onionCtx.resetTransform();
    onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
    renderStaticSnapshot(onionCtx);
}

export function initOnionSkin() {
    onionBtn.addEventListener('click', () => {
        isOnionSkinEnabled = !isOnionSkinEnabled;
        if (isOnionSkinEnabled) {
            onionBtn.classList.add('text-blue-400');
            onionText.innerText = 'Onion Skin: On';
            onionCanvas.style.opacity = '0.2';
            if (allStrokes.length > 0) {
                renderStaticSnapshot(onionCtx);
            }
        } else {
            onionBtn.classList.remove('text-blue-400');
            onionText.innerText = 'Onion Skin: Off';
            onionCanvas.style.opacity = '0';
            onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
        }
    });
}
