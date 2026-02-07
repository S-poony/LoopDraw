const activeCanvas = document.getElementById('activeCanvas');
const replayCanvas = document.getElementById('replayCanvas');
const onionCanvas = document.getElementById('onionCanvas');
const activeCtx = activeCanvas.getContext('2d');
const replayCtx = replayCanvas.getContext('2d');
const onionCtx = onionCanvas.getContext('2d');

const durationSlider = document.getElementById('durationSlider');
const durationVal = document.getElementById('durationVal');
const progressBar = document.getElementById('progressBar');
const cycleCountEl = document.getElementById('cycleCount');
const colorBox = document.getElementById('currentColorBox');
const clearBtn = document.getElementById('clearBtn');
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const onionBtn = document.getElementById('onionBtn');
const onionText = document.getElementById('onionText');

const exportBtn = document.getElementById('exportBtn');
const exportModal = document.getElementById('exportModal');
const modalContainer = document.getElementById('modalContainer');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModal = document.getElementById('closeModal');
const exportPng = document.getElementById('exportPng');
const exportGif = document.getElementById('exportGif');
const exportVideo = document.getElementById('exportVideo');
const exportProgress = document.getElementById('exportProgress');
const exportProgressBar = document.getElementById('exportProgressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');

// Constants
const PEN_WIDTH = 3;
const ERASER_WIDTH = 20;
const DEFAULT_CYCLE_DURATION = 5000; // 5s
const VIDEO_FRAME_RATE = 30;
const GIF_CAPTURE_INTERVAL = 100; // ms
const GIF_SCALE_FACTOR = 0.5;
const EXPORT_CAPTURE_END_THRESHOLD = 30; // ms before cycle end
const MODAL_ANIMATION_DELAY = 10; // ms
const MODAL_HIDE_DELAY = 200; // ms
const MS_PER_SEC = 1000;
const PROGRESS_COMPLETE = 100;

// Application State
let allStrokes = []; // [{ color: string, isEraser: boolean, points: [{x, y, t}] }]
let currentStroke = null;
let isDrawing = false;

let cycleDuration = DEFAULT_CYCLE_DURATION;
let startTime = Date.now();
let currentCycleIndex = 1;
let currentColor = '#000000';

// Tools
let currentTool = 'pen'; // 'pen' or 'eraser'
let isOnionSkinEnabled = false;

// Bright colors to clearly distinguish cycles
const palette = [
    '#2563eb', '#dc2626', '#16a34a', '#d97706',
    '#7c3aed', '#db2777', '#0891b2', '#4f46e5'
];

function getRandomColor() {
    return palette[Math.floor(Math.random() * palette.length)];
}

function initCycle() {
    // Update color and UI
    currentColor = getRandomColor();
    colorBox.style.backgroundColor = currentColor;
    cycleCountEl.innerText = currentCycleIndex;
    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    startTime = Date.now();
}

// Render a STATIC image of all strokes fully drawn (no time animation)
function renderStaticSnapshot(targetCtx, shouldClear = true) {
    if (shouldClear) {
        targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    }

    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    allStrokes.forEach(stroke => {
        targetCtx.beginPath();
        targetCtx.strokeStyle = stroke.color;
        targetCtx.lineWidth = stroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;

        let first = true;
        for (let i = 0; i < stroke.points.length; i++) {
            const p = stroke.points[i];
            if (first) {
                targetCtx.moveTo(p.x, p.y);
                first = false;
            } else {
                targetCtx.lineTo(p.x, p.y);
            }
        }
        targetCtx.stroke();
    });
}

function resize() {
    // Save current content before resize
    let savedReplay = null;
    let savedOnion = null;

    if (replayCanvas.width > 0 && replayCanvas.height > 0) {
        savedReplay = document.createElement('canvas');
        savedReplay.width = replayCanvas.width;
        savedReplay.height = replayCanvas.height;
        savedReplay.getContext('2d').drawImage(replayCanvas, 0, 0);
    }

    if (onionCanvas.width > 0 && onionCanvas.height > 0 && isOnionSkinEnabled) {
        savedOnion = document.createElement('canvas');
        savedOnion.width = onionCanvas.width;
        savedOnion.height = onionCanvas.height;
        savedOnion.getContext('2d').drawImage(onionCanvas, 0, 0);
    }

    activeCanvas.width = activeCanvas.clientWidth;
    activeCanvas.height = activeCanvas.clientHeight;
    replayCanvas.width = replayCanvas.clientWidth;
    replayCanvas.height = replayCanvas.clientHeight;
    onionCanvas.width = onionCanvas.clientWidth;
    onionCanvas.height = onionCanvas.clientHeight;

    // Restore content after resize
    if (savedReplay) {
        replayCtx.drawImage(savedReplay, 0, 0);
    }
    if (savedOnion) {
        onionCtx.drawImage(savedOnion, 0, 0);
    }
}

window.addEventListener('resize', resize);
setTimeout(resize, 0); // Ensure size is calculated after DOM layout

// --- Tools ---

function setTool(tool) {
    currentTool = tool;
    if (tool === 'pen') {
        penBtn.classList.add('active', 'bg-zinc-700');
        penBtn.classList.remove('bg-zinc-800');
        eraserBtn.classList.remove('active', 'bg-zinc-700');
        eraserBtn.classList.add('bg-zinc-800');
        activeCanvas.style.cursor = 'crosshair';
    } else {
        eraserBtn.classList.add('active', 'bg-zinc-700');
        eraserBtn.classList.remove('bg-zinc-800');
        penBtn.classList.remove('active', 'bg-zinc-700');
        penBtn.classList.add('bg-zinc-800');
        activeCanvas.style.cursor = 'cell';
    }
}

penBtn.addEventListener('click', () => setTool('pen'));
eraserBtn.addEventListener('click', () => setTool('eraser'));

// --- Onion Skin ---

onionBtn.addEventListener('click', () => {
    isOnionSkinEnabled = !isOnionSkinEnabled;
    if (isOnionSkinEnabled) {
        onionBtn.classList.add('text-blue-400');
        onionText.innerText = 'Onion Skin: On';
        onionCanvas.style.opacity = '0.2';

        // INSTANT: Render static snapshot of all previous cycles immediately
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

// --- Drawing ---

activeCanvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    currentStroke = {
        color: currentTool === 'eraser' ? '#ffffff' : currentColor,
        isEraser: currentTool === 'eraser',
        points: []
    };
    addPoint(e);
});

window.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    addPoint(e);
    drawCurrentStroke();
});

window.addEventListener('pointerup', () => {
    if (isDrawing && currentStroke.points.length > 0) {
        allStrokes.push(currentStroke);

        // If onion skin is enabled, update it to include the new stroke
        if (isOnionSkinEnabled) {
            // Add the new stroke to onion canvas
            onionCtx.beginPath();
            onionCtx.strokeStyle = currentStroke.color;
            onionCtx.lineWidth = currentStroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
            onionCtx.lineCap = 'round';
            onionCtx.lineJoin = 'round';

            let first = true;
            for (let i = 0; i < currentStroke.points.length; i++) {
                const p = currentStroke.points[i];
                if (first) {
                    onionCtx.moveTo(p.x, p.y);
                    first = false;
                } else {
                    onionCtx.lineTo(p.x, p.y);
                }
            }
            onionCtx.stroke();
        }
    }
    isDrawing = false;
    currentStroke = null;
});

function addPoint(e) {
    const rect = activeCanvas.getBoundingClientRect();
    currentStroke.points.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: Date.now() - startTime
    });
}

function drawCurrentStroke() {
    if (!currentStroke || currentStroke.points.length < 2) return;

    activeCtx.beginPath();
    activeCtx.strokeStyle = currentStroke.color;
    activeCtx.lineWidth = currentStroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
    activeCtx.lineCap = 'round';
    activeCtx.lineJoin = 'round';

    const pts = currentStroke.points;
    activeCtx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    activeCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    activeCtx.stroke();
}

// --- Export Logic ---

function showExportModal() {
    exportModal.classList.remove('hidden');
    // Trigger animation
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

exportBtn.addEventListener('click', showExportModal);
closeModal.addEventListener('click', hideExportModal);
modalBackdrop.addEventListener('click', hideExportModal);

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 1. Static PNG Export
exportPng.addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = activeCanvas.width;
    tempCanvas.height = activeCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // White background
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw everything fully (all previous strokes + current strokes) - DON'T clear the white fill
    renderStaticSnapshot(tempCtx, false);

    // Also draw current strokes if they are not yet in allStrokes
    if (currentStroke && currentStroke.points.length > 0) {
        tempCtx.beginPath();
        tempCtx.strokeStyle = currentStroke.color;
        tempCtx.lineWidth = currentStroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        let first = true;
        currentStroke.points.forEach(p => {
            if (first) { tempCtx.moveTo(p.x, p.y); first = false; }
            else { tempCtx.lineTo(p.x, p.y); }
        });
        tempCtx.stroke();
    }

    const dataUrl = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `loopdraw-snapshot-${Date.now()}.png`;
    a.click();
    hideExportModal();
});

// 2. GIF/Video Synchronized Capturing
let isCapturing = false;
let isWaitingForCycle = false;
let captureType = null; // 'gif' or 'video'
let frames = [];
let mediaRecorder = null;
let recordedChunks = [];
let exportProxyCanvas = null;
let exportProxyCtx = null;

function startCapture(type) {
    if (isCapturing || isWaitingForCycle) return;

    captureType = type;
    isWaitingForCycle = true;
    exportProgress.classList.remove('hidden');
    progressText.innerText = "Waiting for new cycle...";
    progressPercent.innerText = "0%";
    exportProgressBar.style.width = "0%";
}

function onCycleStart() {
    if (isWaitingForCycle) {
        isWaitingForCycle = false;
        isCapturing = true;
        if (captureType === 'video') {
            startVideoRecording();
        } else if (captureType === 'gif') {
            startGifCapture();
        }
    }
}

function startVideoRecording() {
    progressText.innerText = "Recording Video...";
    recordedChunks = [];

    // Create a proxy canvas to ensure white background
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

function startGifCapture() {
    progressText.innerText = "Capturing Frames...";
    frames = [];
}

function handleCaptureProgress(elapsed) {
    if (!isCapturing) return;

    const progress = Math.min((elapsed / cycleDuration) * PROGRESS_COMPLETE, PROGRESS_COMPLETE);
    exportProgressBar.style.width = progress + "%";
    progressPercent.innerText = Math.round(progress) + "%";

    // Update Proxy for Video (White BG + Replay)
    if (captureType === 'video' && exportProxyCtx) {
        exportProxyCtx.fillStyle = '#ffffff';
        exportProxyCtx.fillRect(0, 0, exportProxyCanvas.width, exportProxyCanvas.height);
        exportProxyCtx.drawImage(replayCanvas, 0, 0);
    }

    if (captureType === 'gif' && progressText.innerText === "Capturing Frames...") {
        // Capture frame every ~100ms
        if (frames.length === 0 || Date.now() - frames[frames.length - 1].realT >= GIF_CAPTURE_INTERVAL) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = replayCanvas.width * GIF_SCALE_FACTOR;
            frameCanvas.height = replayCanvas.height * GIF_SCALE_FACTOR;
            const fCtx = frameCanvas.getContext('2d');
            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);
            fCtx.drawImage(replayCanvas, 0, 0, frameCanvas.width, frameCanvas.height);
            frames.push({ canvas: frameCanvas, realT: Date.now() });
        }
    }

    // End of capture check (slightly before cycle end to avoid reset race)
    if (elapsed >= cycleDuration - EXPORT_CAPTURE_END_THRESHOLD) {
        if (captureType === 'video' && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            isCapturing = false; // Prevents re-firing before browser resets elapsed
        } else if (captureType === 'gif' && progressText.innerText === "Capturing Frames...") {
            finalizeGif();
            isCapturing = false;
        }
    }
}

exportVideo.addEventListener('click', () => startCapture('video'));

// --- Render Loop ---

function loop() {
    const now = Date.now();
    let elapsed = now - startTime;

    // Handle end of cycle
    if (elapsed >= cycleDuration) {
        currentCycleIndex++;
        initCycle();
        elapsed = 0;
        onCycleStart();
    }

    // UI Update
    const progress = (elapsed / cycleDuration) * PROGRESS_COMPLETE;
    progressBar.style.width = progress + '%';

    // Handle Export Progress/Capture
    handleCaptureProgress(elapsed);

    // Render Replay (Animated video of previous cycles)
    renderReplay(elapsed);

    requestAnimationFrame(loop);
}

// Render time-based animation (current cycle playing back)
function renderReplay(elapsed) {
    replayCtx.clearRect(0, 0, replayCanvas.width, replayCanvas.height);

    replayCtx.lineCap = 'round';
    replayCtx.lineJoin = 'round';

    allStrokes.forEach(stroke => {
        replayCtx.beginPath();
        replayCtx.strokeStyle = stroke.color;
        replayCtx.lineWidth = stroke.isEraser ? ERASER_WIDTH : PEN_WIDTH;

        let first = true;
        for (let i = 0; i < stroke.points.length; i++) {
            const p = stroke.points[i];

            // Only draw the point if its time corresponds to the elapsed cycle time
            if (p.t <= elapsed) {
                if (first) {
                    replayCtx.moveTo(p.x, p.y);
                    first = false;
                } else {
                    replayCtx.lineTo(p.x, p.y);
                }
            }
        }
        replayCtx.stroke();
    });
}

// --- Controls ---

durationSlider.addEventListener('input', (e) => {
    cycleDuration = e.target.value * MS_PER_SEC;
    durationVal.innerText = e.target.value + 's';
});

clearBtn.addEventListener('click', () => {
    allStrokes = [];
    currentCycleIndex = 1;
    onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
    initCycle();
});

// Start
initCycle();
loop();
