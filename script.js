const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas size - responsive
// Pick a nice tall ResizeObserverSize; shrink if the viewport is small
const BASE_W = 360;
const BASE_H = 640;

function resizeCanvas() {
    // leave a small margin on mobile
    const maxH = window.innerHeight - 24;
    const maxW = window.innerWidth - 24;
    const scale = Math.min(maxW / BASE_W, maxH / BASE_H, 1);
    canvas.width = Math.floor(BASE_W * scale);
    canvas.height = Math.floor(BASE_H * scale);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// shorthand so I don't have to recalculate every frame
function W() { return canvas.width; }
function H() { return canvas.height; }
function scale() { return canvas.width / BASE_W; }

// Game sate flags
let isRunning = false;
let gameOver = false;
let score = 0;
let bestScore = 0;
let animFrameId = null;

// Bird object
const bird = {
    x: 80,
    y: 200,
    radius: 14,
    vy: 0,
    gravity: 0.45,
    jumpPower: -8.5,
    rotation: 0,

    jump() {
        this.vy = this.jumpPower;
    },

    update() {
        this.vy += this.gravity;
        this.y += this.vy;

        this.rotation = Math.min(Math.max(this.vy * 0.07, -0.45), 1.2);
    },

    draw() {
        const s = scale();
        const bx = this.x * s;
        const by = this.y * s;
        const r = this.radius * s;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(this.rotation);

        // body
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#e6a000';
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        // eye
        ctx.beginPath();
        ctx.arc(r * 0.35, -r * 0.3, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.42, -r * 0.28, r * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();

        //beak
        ctx.beginPath();
        ctx.moveTo(r * 0.7, r * 0.1);
        ctx.lineTo(r * 1.3, r * 0.25);
        ctx.lineTo(r * 0.7, r * 0.4);
        ctx.closePath();
        ctx.fillStyle = '#ff8c00';
        ctx.fill();

        //tiny wing
        ctx.beginPath();
        ctx.ellipse(-r * 0.1, r * 0.35, r * 0.55, r * 0.28, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f0b800';
        ctx.fill();

        ctx.restore();
    }
};

// Pipe settings
const GAP = 130;
const PIPE_WIDTH = 52;
const PIPE_SPEED = 2.4;
const PIPE_INTERVAL = 90;

let pipes = [];
let frameCount = 0;

function spawnPipe() {
    // random Y for the gap centre, keeping it away from the edges
    const minGapCenter = 120;
    const maxGapCenter = BASE_H - 120 - 60;
    const gapCenter = minGapCenter + Math.random() * (maxGapCenter - minGapCenter);

    pipes.push({
        x: BASE_W + 10,
        gapCenter: gapCenter,
        scored: false
    });
}

function updatePipes() {
    //add new pipe every PIPE_INTERVAL frames
    if (frameCount % PIPE_INTERVAL === 0 && frameCount > 0) {
        spawnPipe();
    }

    for(let p of pipes) {
        p.x -= PIPE_SPEED;

        //score: bird passed the pipe's right edge
        if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
            score++;
            p.scored = true;
        }
    }

    //remove pipes that have scrolled off screen
    pipes = pipes.filter(p => p.x + PIPE_WIDTH > -10);
}

// draw a single pipe (top or bottom)
function drawPipeRect(x,y,w,h,flip){
    const s = scale();
    const px = x * s, py = y * s, pw = w * s, ph = h * s;

    //main body
    const grad = ctx.createLinearGradient(px, 0, px + pw, 0);
    grad.addColorStop(0, '#3dba4e');
    grad.addColorStop(0.4, '#5de86d');
    grad.addColorStop(1, '#2a8f38');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, pw, ph);

    //cap (slightly wider rectangle at the open end)
    const capH = 18 * s;
    const capW = (w + 10) * s;
    const capX = px - 5 * s
    const capY = flip ? py : py + ph - capH;
    ctx.fillStyle = '#2ea03d';
    ctx.fillRect(capX, capY, capW, capH);

    // shine line
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(px + 6 * s, py, 8 * s, ph);
}

function drawPipes() {
    const groundY = BASE_H -60;

    for (let p of pipes) {
        const topH = p.gapCenter - GAP / 2;
        const botY = p.gapCenter + GAP / 2;
        const botH = groundY - botY;

        // top pipe (flipped)
        drawPipeRect(p.x, 0, PIPE_WIDTH, topH, false);

        //bottom pipe
        drawPipeRect(p.x, botY, PIPE_WIDTH, botH, true);
    }
}

// Collision detection
function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    // Find the closest point on the rect to the circle center
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return (dx * dx + dy * dy) < (cr * cr);
}

function checkCollisions() {
    const groundY = BASE_H - 60;
    const br = bird.radius - 3;

    // hit the ground or ceiling
    if ( bird.y + br >= groundY || bird.y - br <= 0) return true;

    // hit a pipe
    for (let p of pipes) {
        const topH = p.gapCenter - GAP / 2;
        const botY = p.gapCenter + GAP / 2;
        const botH = groundY - botY;

        if (
            circleRect(bird.x, bird.y, br, p.x, 0, PIPE_WIDTH, topH) ||
            circleRect(bird.x, bird.y, br, p.x, botY, PIPE_WIDTH, botH)
        ) {
            return true;
        }
    }

    return false;
}

// Drawing the background (sky + clouds + ground)
const cloudPositions = [
    { x: 40, y: 60, r: 1.0},
    { x: 160, y: 45, r: 0.8},
    { x: 260, y: 80, r: 1.1},
    { x: 80, y: 130, r: 0.7},
    { x: 310, y: 30, r: 0.6}
];
let cloudOffset = 0;

function drawBackground() {
    const w = W(), h = H();
    const s = scale();

    // sky gradient
    const sky = ctx.createLinearGradient(0, 0 , 0, h);
    sky.addColorStop(0, '#5dc8f5');
    sky.addColorStop(0.7, '#a8e0f7');
    sky.addColorStop(1, '#d0f0fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    //drifting clouds
    cloudOffset = (cloudOffset + 0.3) % BASE_W;
    for (let c of cloudPositions) {
        let cx = ((c.x - cloudOffset + BASE_W) % (BASE_W + 60)) * s;
        let cy = c.y * s;
        let cr = 22 * c.r * s;

        ctx.beginPath();
        ctx.ellipse(cx, cy, cr * 1.4, cr * 0.9, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + cr, cy - cr*0.3, cr, cr * 0.8, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - cr, cy + cr*0.1, cr*0.8, cr * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
    }

    // ground strip
    const groundY = (BASE_H - 60) * s;
    ctx.fillStyle = '#78c040';
    ctx.fillRect(0, groundY, w, 18 * s);
    ctx.fillStyle = '#5a9e28';
    ctx.fillRect(0, groundY + 18 * s, w, h - groundY - 18 * s);

    // little grass tufts (static, purely decorative)
    ctx.fillStyle = '#8ed44e';
    for (let gx = 0; gx < BASE_W; gx += 20) {
        let tx = gx * s;
        ctx.fillRect(tx, groundY - 4 * s, 4 * s, 4 * s);
        ctx.fillRect(tx + 8 * s, groundY - 6 * s, 3 * s, 6 * s);
    }
}

// HUD (score on screen)
function drawHUD() {
    const s = scale();
    ctx.save();
    ctx.font = `bold ${28 * s}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 6 * s;
    ctx.fillText(score, W() / 2, 52 * s);
    ctx.restore();
}

// Main game loop
function gameLoop() {
    if(!isRunning) return;

    frameCount++;

    ctx.clearRect(0, 0, W(), H());
    drawBackground();
    updatePipes();
    drawPipes();

    bird.update();
    bird.draw();
    drawHUD();

    if (checkCollisions()) {
        triggerGameOver();
        return;
    }

    animFrameId = requestAnimationFrame(gameLoop);
}

// Game flow functions
function startGame() {
    // reset everything
    bird.x = 80;
    bird.y = BASE_H / 2;
    bird.vy = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameOver = false;
    isRunning = true;

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');

    animFrameId = requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    isRunning = false;
    gameOver = true;

    if (score > bestScore) bestScore = score;

    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('bestScore').textContent = `Best: ${bestScore}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function restartGame() {
    startGame();
}

// Input: spacebar + mouse/touch
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (isRunning) bird.jump();
    }
});

canvas.addEventListener('mousedown', function() {
    if (isRunning) bird.jump();
});

// touch works on mobile
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (isRunning) bird.jump();
}, { passive: false });

// Draw a still frame while on the start screen
(function drawIdleFrame() {
    ctx.clearRect(0, 0 , W(), H());
    drawBackground();
    bird.y = BASE_H / 2;
    bird.draw();
})();