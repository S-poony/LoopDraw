// viewport.js — Camera / viewport transform state

export let zoom = 1;       // current scale factor
export let panX = 0;       // horizontal offset in screen pixels
export let panY = 0;       // vertical offset in screen pixels

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 20;

export function setZoom(val) { zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, val)); }
export function setPan(x, y) { panX = x; panY = y; }

/**
 * Convert screen (mouse) coords → world (stroke) coords.
 * @param {number} sx - screen x (relative to canvas element)
 * @param {number} sy - screen y (relative to canvas element)
 */
export function screenToWorld(sx, sy) {
    return {
        x: (sx - panX) / zoom,
        y: (sy - panY) / zoom,
    };
}

/**
 * Convert world → screen coords.
 */
export function worldToScreen(wx, wy) {
    return {
        x: wx * zoom + panX,
        y: wy * zoom + panY,
    };
}

/**
 * Apply the viewport transform to a canvas 2D context.
 * Call before rendering strokes.
 */
export function applyTransform(ctx) {
    ctx.setTransform(zoom, 0, 0, zoom, panX, panY);
}

/**
 * Reset viewport to default (1× zoom, no pan).
 */
export function resetViewport() {
    zoom = 1;
    panX = 0;
    panY = 0;
}
