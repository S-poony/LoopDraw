import { activeCanvas } from '../rendering/canvasRenderer.js';
import { zoom, panX, panY, setZoom, setPan, resetViewport, MIN_ZOOM, MAX_ZOOM } from '../viewport.js';
import { getCurrentTool, setTool } from '../tools/toolManager.js';
import { refreshActiveCanvas } from '../drawing.js';
import { refreshOnion } from './onionSkin.js';

// ── Constants ──────────────────────────────────────────────
const WHEEL_ZOOM_FACTOR = 0.001;   // multiplier per wheel deltaY pixel
const DRAG_ZOOM_SENSITIVITY = 0.005;
const BADGE_FADE_MS = 1200;

// ── Internal state ─────────────────────────────────────────
let spaceHeld = false;
let _isPanning = false;
let panStartX = 0, panStartY = 0;
let panStartPanX = 0, panStartPanY = 0;

let _isZoomDragging = false;
let zoomDragAnchorX = 0, zoomDragAnchorY = 0;
let zoomDragStartZoom = 1;

let badgeTimer = null;
let zoomBadge = null;

// ── Public queries ─────────────────────────────────────────
export function isPanning() { return _isPanning || spaceHeld; }
export function isZoomDragging() { return _isZoomDragging; }

// ── Core zoom helper ───────────────────────────────────────
/**
 * Zoom so that the world point under (screenX, screenY) stays fixed.
 */
function zoomAtPoint(screenX, screenY, newZoom) {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    // World coords of anchor before zoom change
    const wx = (screenX - panX) / zoom;
    const wy = (screenY - panY) / zoom;
    setZoom(clampedZoom);
    // Adjust pan so the same world point stays under the cursor
    setPan(screenX - wx * zoom, screenY - wy * zoom);
    onViewportChange();
}

// ── Viewport change notification ───────────────────────────
function onViewportChange() {
    refreshActiveCanvas();
    refreshOnion();
    showZoomBadge();
}

// ── Badge ──────────────────────────────────────────────────
function showZoomBadge() {
    if (!zoomBadge) return;
    zoomBadge.textContent = Math.round(zoom * 100) + '%';
    zoomBadge.style.opacity = '1';
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => { zoomBadge.style.opacity = '0'; }, BADGE_FADE_MS);
}

// ── Pan (Space + drag) ─────────────────────────────────────
function startPan(e) {
    _isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartPanX = panX;
    panStartPanY = panY;
    activeCanvas.style.cursor = 'grabbing';
}

function movePan(e) {
    if (!_isPanning) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    setPan(panStartPanX + dx, panStartPanY + dy);
    onViewportChange();
}

function endPan() {
    if (!_isPanning) return;
    _isPanning = false;
    activeCanvas.style.cursor = spaceHeld ? 'grab' : '';
}

// ── Zoom tool drag ─────────────────────────────────────────
function startZoomDrag(e) {
    const rect = activeCanvas.getBoundingClientRect();
    zoomDragAnchorX = e.clientX - rect.left;
    zoomDragAnchorY = e.clientY - rect.top;
    zoomDragStartZoom = zoom;
    _isZoomDragging = true;
}

function moveZoomDrag(e) {
    if (!_isZoomDragging) return;
    const rect = activeCanvas.getBoundingClientRect();
    const dx = e.clientX - (rect.left + zoomDragAnchorX);
    const dy = -(e.clientY - (rect.top + zoomDragAnchorY));
    const dragDist = dx + dy; // right/up = positive
    const newZoom = zoomDragStartZoom * Math.exp(dragDist * DRAG_ZOOM_SENSITIVITY);
    zoomAtPoint(zoomDragAnchorX, zoomDragAnchorY, newZoom);
}

function endZoomDrag() {
    _isZoomDragging = false;
}

// ── Init ───────────────────────────────────────────────────
export function initPanZoom() {
    zoomBadge = document.getElementById('zoomBadge');

    // ── Wheel zoom (always active) ─────────────────────────
    activeCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = activeCanvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_FACTOR);
        zoomAtPoint(sx, sy, zoom * factor);
    }, { passive: false });

    // ── Space key for pan mode ─────────────────────────────
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();
            spaceHeld = true;
            if (!_isPanning) {
                activeCanvas.style.cursor = 'grab';
            }
        }
        // Ctrl+0 → reset viewport
        if (e.code === 'Digit0' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            resetViewport();
            onViewportChange();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceHeld = false;
            endPan();
            // Restore cursor — setTool re-applies cursor via toolManager
            const tool = getCurrentTool();
            setTool(tool);
        }
    });

    // ── Pointer events ─────────────────────────────────────
    activeCanvas.addEventListener('pointerdown', (e) => {
        // Space+drag pan takes priority
        if (spaceHeld) {
            startPan(e);
            return;
        }
        // Zoom tool drag
        if (getCurrentTool() === 'zoom') {
            startZoomDrag(e);
            return;
        }
    });

    window.addEventListener('pointermove', (e) => {
        if (_isPanning) {
            movePan(e);
            return;
        }
        if (_isZoomDragging) {
            moveZoomDrag(e);
            return;
        }
    });

    window.addEventListener('pointerup', () => {
        if (_isPanning) endPan();
        if (_isZoomDragging) endZoomDrag();
    });
}
