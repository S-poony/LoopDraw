import { activeCanvas, replayCanvas, activeCtx, replayCtx, renderStaticSnapshot } from '../rendering/canvasRenderer.js';
import { allStrokes, currentStroke } from '../state.js';
import { PEN_WIDTH, ERASER_WIDTH, VIDEO_FRAME_RATE, EXPORT_CAPTURE_END_THRESHOLD, PROGRESS_COMPLETE } from '../state.js';
import { renderStrokes } from '../rendering/strokeRenderer.js';
import { zoom, panX, panY } from '../viewport.js';

const exportBtn = document.getElementById('exportBtn');
const exportModal = document.getElementById('exportModal');
const modalContainer = document.getElementById('modalContainer');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModal = document.getElementById('closeModal');
const exportPng = document.getElementById('exportPng');
const exportVideo = document.getElementById('exportVideo');
const exportProgress = document.getElementById('exportProgress');
const exportProgressBar = document.getElementById('exportProgressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');

const MODAL_ANIMATION_DELAY = 10;
const MODAL_HIDE_DELAY = 200;
const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;

export let isCapturing = false;
export let isWaitingForCycle = false;
export let captureType = null;

let mediaRecorder = null;
let recordedChunks = [];
let exportProxyCanvas = null;
let exportProxyCtx = null;
// Snapshot scale factors at capture start so they stay consistent across frames
let exportScaleX = 1;
let exportScaleY = 1;
let exportZoom = 1;
let exportPanX = 0;
let exportPanY = 0;

/**
 * Apply the viewport transform scaled to the export resolution.
 * Maps the current canvas view → EXPORT_WIDTH × EXPORT_HEIGHT.
 */
function applyExportTransform(ctx, sx, sy, z, px, py) {
    ctx.setTransform(z * sx, 0, 0, z * sy, px * sx, py * sy);
}

function showExportModal() {
    exportModal.classList.remove('hidden');
    setTimeout(() => {
        modalContainer.classList.remove('scale-95', 'opacity-0');
        modalContainer.classList.add('scale-100', 'opacity-100');
    }, MODAL_ANIMATION_DELAY);
}

function hideExportModal() {
    modalContainer.classList.remove('scale-100', 'opacity-100');
    modalContainer.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        exportModal.classList.add('hidden');
        exportProgress.classList.add('hidden');
    }, MODAL_HIDE_DELAY);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function startCapture(type) {
    if (isCapturing || isWaitingForCycle) return;
    captureType = type;
    isWaitingForCycle = true;
    exportProgress.classList.remove('hidden');
    progressText.innerText = 'Waiting for new cycle...';
    progressPercent.innerText = '0%';
    exportProgressBar.style.width = '0%';
}

export function onCaptureStart() {
    if (!isWaitingForCycle) return;
    isWaitingForCycle = false;
    isCapturing = true;
    if (captureType === 'video') startVideoRecording();
}

function startVideoRecording() {
    progressText.innerText = 'Recording Video...';
    recordedChunks = [];

    // Snapshot current viewport so it stays fixed across all frames
    exportScaleX = EXPORT_WIDTH / replayCanvas.width;
    exportScaleY = EXPORT_HEIGHT / replayCanvas.height;
    exportZoom = zoom;
    exportPanX = panX;
    exportPanY = panY;

    exportProxyCanvas = document.createElement('canvas');
    exportProxyCanvas.width = EXPORT_WIDTH;
    exportProxyCanvas.height = EXPORT_HEIGHT;
    exportProxyCtx = exportProxyCanvas.getContext('2d');

    const stream = exportProxyCanvas.captureStream(VIDEO_FRAME_RATE);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        downloadBlob(blob, `loopdraw-${Date.now()}.webm`);
        isCapturing = false;
        hideExportModal();
    };

    mediaRecorder.start();
}

export function handleCaptureProgress(elapsed, cycleDuration) {
    if (!isCapturing) return;

    const progress = Math.min((elapsed / cycleDuration) * PROGRESS_COMPLETE, PROGRESS_COMPLETE);
    exportProgressBar.style.width = progress + '%';
    progressPercent.innerText = Math.round(progress) + '%';

    if (captureType === 'video' && exportProxyCtx) {
        exportProxyCtx.resetTransform();
        exportProxyCtx.fillStyle = '#ffffff';
        exportProxyCtx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
        applyExportTransform(exportProxyCtx, exportScaleX, exportScaleY, exportZoom, exportPanX, exportPanY);
        renderStrokes(exportProxyCtx, allStrokes, { upToTime: elapsed, forExport: true });
        exportProxyCtx.resetTransform();
    }

    if (elapsed >= cycleDuration - EXPORT_CAPTURE_END_THRESHOLD) {
        if (captureType === 'video' && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            isCapturing = false;
        }
    }
}

export function initExport() {
    exportBtn.addEventListener('click', showExportModal);
    closeModal.addEventListener('click', hideExportModal);
    modalBackdrop.addEventListener('click', hideExportModal);
    exportVideo.addEventListener('click', () => startCapture('video'));

    exportPng.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = EXPORT_WIDTH;
        tempCanvas.height = EXPORT_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');

        // White background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

        // Apply viewport transform scaled to export resolution
        const sx = EXPORT_WIDTH / activeCanvas.width;
        const sy = EXPORT_HEIGHT / activeCanvas.height;
        applyExportTransform(tempCtx, sx, sy, zoom, panX, panY);

        // forExport=true: erasers render as white paint on white BG
        renderStrokes(tempCtx, allStrokes, { forExport: true });
        tempCtx.resetTransform();

        const dataUrl = tempCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `loopdraw-snapshot-${Date.now()}.png`;
        a.click();
        hideExportModal();
    });
}

