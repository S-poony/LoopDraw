import { activeCanvas, replayCanvas, activeCtx, replayCtx, renderStaticSnapshot } from '../rendering/canvasRenderer.js';
import { allStrokes, currentStroke } from '../state.js';
import { PEN_WIDTH, ERASER_WIDTH, VIDEO_FRAME_RATE, EXPORT_CAPTURE_END_THRESHOLD, PROGRESS_COMPLETE } from '../state.js';
import { renderStrokes } from '../rendering/strokeRenderer.js';

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

export let isCapturing = false;
export let isWaitingForCycle = false;
export let captureType = null;

let mediaRecorder = null;
let recordedChunks = [];
let exportProxyCanvas = null;
let exportProxyCtx = null;

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

    exportProxyCanvas = document.createElement('canvas');
    exportProxyCanvas.width = replayCanvas.width;
    exportProxyCanvas.height = replayCanvas.height;
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
        exportProxyCtx.fillStyle = '#ffffff';
        exportProxyCtx.fillRect(0, 0, exportProxyCanvas.width, exportProxyCanvas.height);
        renderStrokes(exportProxyCtx, allStrokes, { upToTime: elapsed, forExport: true });
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
        tempCanvas.width = activeCanvas.width;
        tempCanvas.height = activeCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // White background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // forExport=true: erasers render as white paint on white BG
        renderStaticSnapshot(tempCtx, { shouldClear: false, forExport: true });

        const dataUrl = tempCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `loopdraw-snapshot-${Date.now()}.png`;
        a.click();
        hideExportModal();
    });
}
