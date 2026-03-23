import { activeCanvas } from './rendering/canvasRenderer.js';
import {
    currentStroke, setCurrentStroke, isDrawing, setIsDrawing,
    pushStroke, startTime, currentColor
} from './state.js';
import { getCurrentTool } from './tools/toolManager.js';
import { updateOnionWithStroke } from './features/onionSkin.js';
import { PEN_WIDTH, ERASER_WIDTH } from './state.js';

function addPoint(e) {
    const rect = activeCanvas.getBoundingClientRect();
    currentStroke.points.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: Date.now() - startTime
    });
}

function drawCurrentStroke(ctx) {
    if (!currentStroke || currentStroke.points.length < 2) return;

    const pts = currentStroke.points;
    ctx.beginPath();
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
}

export function initDrawing(activeCtx) {
    activeCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    activeCanvas.addEventListener('pointerdown', (e) => {
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
