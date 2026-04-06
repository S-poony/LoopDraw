import { activeCanvas } from './rendering/canvasRenderer.js';
import {
    currentStroke, setCurrentStroke, isDrawing, setIsDrawing,
    pushStroke, startTime, currentColor, cycleStart, MS_PER_SEC
} from './state.js';
import { getCurrentTool } from './tools/toolManager.js';
import { updateOnionWithStroke } from './features/onionSkin.js';
import { PEN_WIDTH, ERASER_WIDTH } from './state.js';
import { screenToWorld, applyTransform } from './viewport.js';
import { isPanning, isZoomDragging } from './features/panZoom.js';

let _activeCtx = null;

function addPoint(e) {
    const rect = activeCanvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    currentStroke.points.push({
        x: world.x,
        y: world.y,
        t: cycleStart * MS_PER_SEC + (Date.now() - startTime)
    });
}

function drawCurrentStroke(ctx) {
    if (!currentStroke || currentStroke.points.length < 2) return;

    const pts = currentStroke.points;
    applyTransform(ctx);
    ctx.beginPath();
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.resetTransform();
}

/**
 * Clear the active canvas and redraw the in-progress stroke (if any)
 * with the current viewport transform. Called when viewport changes.
 */
export function refreshActiveCanvas() {
    if (!_activeCtx) return;
    _activeCtx.resetTransform();
    _activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    if (!currentStroke || currentStroke.points.length < 2) return;

    applyTransform(_activeCtx);
    _activeCtx.beginPath();
    _activeCtx.strokeStyle = currentStroke.color;
    _activeCtx.lineWidth = currentStroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
    _activeCtx.lineCap = 'round';
    _activeCtx.lineJoin = 'round';
    const pts = currentStroke.points;
    _activeCtx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        _activeCtx.lineTo(pts[i].x, pts[i].y);
    }
    _activeCtx.stroke();
    _activeCtx.resetTransform();
}

export function initDrawing(activeCtx) {
    _activeCtx = activeCtx;

    activeCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    activeCanvas.addEventListener('pointerdown', (e) => {
        // Don't draw while panning or zoom-dragging
        if (isPanning() || isZoomDragging()) return;
        if (getCurrentTool() === 'zoom') return;

        const tool = getCurrentTool();
        setIsDrawing(true);
        setCurrentStroke({
            color: tool === 'eraser' ? '#ffffff' : currentColor,
            isEraser: tool === 'eraser',
            points: []
        });
        addPoint(e);
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDrawing) return;
        addPoint(e);
        drawCurrentStroke(activeCtx);
    });

    window.addEventListener('pointerup', () => {
        if (isDrawing && currentStroke && currentStroke.points.length > 0) {
            pushStroke(currentStroke);
            updateOnionWithStroke(currentStroke);
        }
        setIsDrawing(false);
        setCurrentStroke(null);
        // Clear — completed strokes are now in allStrokes and rendered by the replay canvas
        _activeCtx.resetTransform();
        _activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    });
}

