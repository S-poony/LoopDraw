import { PEN_WIDTH, ERASER_WIDTH } from '../state.js';

/**
 * Set composite operation and stroke style for a given stroke.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} stroke
 * @param {object} [opts]
 * @param {boolean} [opts.forExport=false] - When true, eraser is rendered as opaque white paint
 *                                           instead of using destination-out (so it works on
 *                                           a solid white background export canvas).
 */
export function applyStrokeStyle(ctx, stroke, { forExport = false } = {}) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.isEraser && !forExport) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = ERASER_WIDTH;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color; // '#ffffff' for eraser strokes in export
        ctx.lineWidth = stroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
    }
}

/**
 * Trace and stroke a path from an array of points.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x:number, y:number, t:number}>} points
 * @param {object} [opts]
 * @param {number} [opts.upToTime=Infinity] - Only draw points with t <= this value (for animation).
 */
export function drawStrokePath(ctx, points, { upToTime = Infinity } = {}) {
    ctx.beginPath();
    let first = true;
    for (const p of points) {
        if (p.t > upToTime) break;
        if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
        } else {
            ctx.lineTo(p.x, p.y);
        }
    }
    ctx.stroke();
}

/**
 * Render a list of strokes onto a context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} strokes
 * @param {object} [opts]
 * @param {boolean} [opts.forExport=false]   - See applyStrokeStyle
 * @param {number}  [opts.upToTime=Infinity] - See drawStrokePath (for animated replay)
 */
export function renderStrokes(ctx, strokes, opts = {}) {
    ctx.save();
    for (const stroke of strokes) {
        applyStrokeStyle(ctx, stroke, opts);
        drawStrokePath(ctx, stroke.points, opts);
    }
    ctx.restore();
}
