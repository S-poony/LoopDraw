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

// État de l'application
let allStrokes = []; // [{ color: string, isEraser: boolean, points: [{x, y, t}] }]
let currentStroke = null;
let isDrawing = false;

let cycleDuration = 30000; // 30s
let startTime = Date.now();
let currentCycleIndex = 1;
let currentColor = '#000000';

// Outils
let currentTool = 'pen'; // 'pen' ou 'eraser'
let isOnionSkinEnabled = false;

// Couleurs vives pour bien distinguer les cycles
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
function renderStaticSnapshot(targetCtx) {
    targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    allStrokes.forEach(stroke => {
        if (stroke.isEraser) return; // Skip eraser strokes for onion skin

        targetCtx.beginPath();
        targetCtx.strokeStyle = stroke.color;
        targetCtx.lineWidth = 3;

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
resize();

// --- Outils ---

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

// --- Dessin ---

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
        if (isOnionSkinEnabled && !currentStroke.isEraser) {
            // Add the new stroke to onion canvas
            onionCtx.beginPath();
            onionCtx.strokeStyle = currentStroke.color;
            onionCtx.lineWidth = 3;
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
    activeCtx.lineWidth = currentStroke.isEraser ? 20 : 3;
    activeCtx.lineCap = 'round';
    activeCtx.lineJoin = 'round';

    const pts = currentStroke.points;
    activeCtx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    activeCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    activeCtx.stroke();
}

// --- Boucle de rendu ---

function loop() {
    const now = Date.now();
    let elapsed = now - startTime;

    // Gestion de la fin du cycle
    if (elapsed >= cycleDuration) {
        currentCycleIndex++;
        initCycle();
        elapsed = 0;
    }

    // Mise à jour UI
    const progress = (elapsed / cycleDuration) * 100;
    progressBar.style.width = progress + '%';

    // Rendu du Replay (Vidéo des cycles précédents - animated)
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
        replayCtx.lineWidth = stroke.isEraser ? 20 : 3;

        let first = true;
        for (let i = 0; i < stroke.points.length; i++) {
            const p = stroke.points[i];

            // On ne dessine le point que si son temps correspond au temps écoulé du cycle
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

// --- Contrôles ---

durationSlider.addEventListener('input', (e) => {
    cycleDuration = e.target.value * 1000;
    durationVal.innerText = e.target.value + 's';
});

clearBtn.addEventListener('click', () => {
    allStrokes = [];
    currentCycleIndex = 1;
    onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
    initCycle();
});

// Lancement
initCycle();
loop();
