import { activeCanvas } from './rendering/canvasRenderer.js';
import {
    currentStroke, setCurrentStroke, isDrawing, setIsDrawing,
    pushStroke, startTime, currentColor
} from './state.js';
import { getCurrentTool } from './tools/toolManager.js';
import { updateOnionWithStroke } from './features/onionSkin.js';
import { PEN_WIDTH, ERASER_WIDTH } from './state.js';
import { screenToWorld, applyTransform } from './viewport.js';
import { isPanning, isZoomDragging } from './features/panZoom.js';

function addPoint(e) {
    const rect = activeCanvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    currentStroke.points.push({
        x: world.x,
        y: world.y,
        t: Date.now() - startTime
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

export function initDrawing(activeCtx) {
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
    });
}

