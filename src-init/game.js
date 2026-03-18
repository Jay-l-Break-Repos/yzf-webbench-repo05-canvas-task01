/**
 * game.js - Canvas infrastructure and core game logic for Flappy Bird-style game
 *
 * Handles canvas setup, DPR scaling, game state management,
 * bird rendering, floor scrolling, score display, and start/game-over screens.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FLOOR_HEIGHT = 80;
const BIRD_INITIAL_X = 30;
const BIRD_JUMP_VELOCITY = -6;
const GRAVITY = 0.45;
const MAX_VELOCITY = 6;
const PIPE_SPEED = 4;

// ---------------------------------------------------------------------------
// URL params (for test harness compatibility)
// ---------------------------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);

// ---------------------------------------------------------------------------
// Global game store – exposed on window so tests can inspect it
// ---------------------------------------------------------------------------
window.store = {
    score: 0,
    floorX: 0,
    frameAdjustedRate: parseFloat(urlParams.get('frameAdjustedRate')) || 1,
    isAnimating: false,
    isGameOver: false,
    bird: { x: BIRD_INITIAL_X, y: 0, velocity: 0, rotation: 0 },
    pipes: [],
    floorHeight: FLOOR_HEIGHT,
    mode: urlParams.get('mode') || 'normal',
    dpr: window.devicePixelRatio || 1,
    assets: {
        birdImg: new Image(),
        floorImg: new Image(),
        pipeUpImg: new Image(),
        pipeDownImg: new Image(),
    },
};

// ---------------------------------------------------------------------------
// Store helper
// ---------------------------------------------------------------------------
function updateStore(newState) {
    window.store = { ...window.store, ...newState };
    return window.store;
}

// ---------------------------------------------------------------------------
// Canvas & context – obtained immediately (module scripts are deferred)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Canvas setup & DPR scaling  (matches reference src/util.js exactly)
// ---------------------------------------------------------------------------

/**
 * Resize and configure the canvas to match the window dimensions.
 * Pattern from src/util.js:
 *   1. Set canvas bitmap to CSS dimensions
 *   2. Set CSS style dimensions
 *   3. Multiply bitmap by DPR
 *   4. Scale context by DPR
 */
function resizeCanvas() {
    const { innerWidth: width, innerHeight: height } = window;
    const ratio = 600 / 800;
    const dpr = window.store.dpr;

    canvas.width = Math.min(width, height * ratio);
    canvas.height = height;

    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    canvas.width *= dpr;
    canvas.height *= dpr;

    ctx.scale(dpr, dpr);

    return updateStore({
        bird: {
            ...window.store.bird,
            y: canvas.height / (2 * dpr) - window.store.assets.birdImg.height / 2,
        },
    });
}

// ---------------------------------------------------------------------------
// Set canvas dimensions IMMEDIATELY (before images load)
// so tests can read canvas.width / canvas.height right away
// ---------------------------------------------------------------------------
resizeCanvas();

// ---------------------------------------------------------------------------
// Now kick off image loading (after canvas is sized)
// ---------------------------------------------------------------------------
window.store.assets.birdImg.src = 'assets/bird.png';
window.store.assets.floorImg.src = 'assets/fg.png';
window.store.assets.pipeUpImg.src = 'assets/pipeUp.png';
window.store.assets.pipeDownImg.src = 'assets/pipeDown.png';

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

/** Draw the score box in the top-left corner */
function drawScore() {
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.textAlign = 'left';
    ctx.lineWidth = 2;
    const text = `Score: ${window.store.score}`;
    const metrics = ctx.measureText(text);
    const padding = 5;
    ctx.strokeRect(10, 10, metrics.width + padding * 2, 24);
    ctx.fillText(text, 15, 27);
}

/** Draw the bird image (with rotation) */
function drawBird() {
    const { bird, assets } = window.store;
    ctx.save();
    ctx.translate(
        bird.x + assets.birdImg.width / 2,
        bird.y + assets.birdImg.height / 2,
    );
    ctx.rotate((bird.rotation * Math.PI) / 180);
    ctx.drawImage(
        assets.birdImg,
        -assets.birdImg.width / 2,
        -assets.birdImg.height / 2,
    );
    ctx.restore();
}

/** Draw the tiled floor and scroll it when animating */
function drawFloor() {
    const dpr = window.store.dpr;
    const floorY = canvas.height / dpr - window.store.floorHeight;
    const floorImg = window.store.assets.floorImg;

    for (
        let i = 0;
        i * floorImg.width < canvas.width / dpr + floorImg.width;
        i++
    ) {
        ctx.drawImage(floorImg, i * floorImg.width + window.store.floorX, floorY);
    }

    if (window.store.isAnimating) {
        const newFloorX =
            window.store.floorX -
            PIPE_SPEED * window.store.frameAdjustedRate;
        updateStore({
            floorX: newFloorX <= -floorImg.width ? 0 : newFloorX,
        });
    }
}

/** Draw "Click to Start" text centred on the canvas */
function drawStartText() {
    if (!window.store.isAnimating && !window.store.isGameOver) {
        const dpr = window.store.dpr;
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(
            'Click to Start',
            canvas.width / (2 * dpr),
            canvas.height / (2 * dpr),
        );
    }
}

/** Draw the Game Over overlay */
function drawGameOver() {
    if (window.store.isGameOver) {
        const dpr = window.store.dpr;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(
            'GAME OVER',
            canvas.width / (2 * dpr),
            canvas.height / (2 * dpr) - 40,
        );

        ctx.font = '20px Arial';
        ctx.fillText(
            `Score: ${window.store.score}`,
            canvas.width / (2 * dpr),
            canvas.height / (2 * dpr),
        );

        ctx.font = '16px Arial';
        ctx.fillText(
            'Click to Play Again',
            canvas.width / (2 * dpr),
            canvas.height / (2 * dpr) + 40,
        );
    }
}

// ---------------------------------------------------------------------------
// Bird physics
// ---------------------------------------------------------------------------
function updateBird() {
    if (!window.store.isAnimating) return;

    const dpr = window.store.dpr;
    let { velocity, y, rotation } = window.store.bird;

    velocity += GRAVITY * window.store.frameAdjustedRate;
    velocity = Math.min(velocity, MAX_VELOCITY);
    y += velocity * window.store.frameAdjustedRate;

    const targetRotation = velocity > 0 ? 35 : -35;
    rotation += (targetRotation - rotation) * 0.2 * window.store.frameAdjustedRate;

    if (
        y + window.store.assets.birdImg.height >=
        canvas.height / dpr - window.store.floorHeight
    ) {
        if (window.store.mode !== 'debug') {
            endGame();
        } else {
            y =
                canvas.height / dpr -
                window.store.floorHeight -
                window.store.assets.birdImg.height;
        }
    }

    updateStore({ bird: { ...window.store.bird, velocity, y, rotation } });
}

// ---------------------------------------------------------------------------
// Game events
// ---------------------------------------------------------------------------
function startAnimation() {
    if (!window.store.isAnimating && !window.store.isGameOver) {
        updateStore({ isAnimating: true });
    }
}

function jump() {
    if (window.store.isAnimating) {
        updateStore({
            bird: { ...window.store.bird, velocity: BIRD_JUMP_VELOCITY },
        });
    }
}

function endGame() {
    updateStore({ isGameOver: true, isAnimating: false });
    setTimeout(() => {
        canvas.addEventListener('click', restartGame);
        window.addEventListener('keydown', handleRestartKeydown);
    }, 500);
}

function restartGame() {
    const dpr = window.store.dpr;
    updateStore({
        isGameOver: false,
        isAnimating: true,
        score: 0,
        bird: {
            x: BIRD_INITIAL_X,
            y:
                canvas.height / (2 * dpr) -
                window.store.assets.birdImg.height / 2,
            velocity: 0,
            rotation: 0,
        },
        pipes: [],
        floorX: 0,
    });
    canvas.removeEventListener('click', restartGame);
    window.removeEventListener('keydown', handleRestartKeydown);
}

function handleRestartKeydown(e) {
    if (e.key === 'Enter') {
        restartGame();
    }
}

// ---------------------------------------------------------------------------
// Main render loop
// ---------------------------------------------------------------------------
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawScore();
    drawBird();
    drawFloor();
    drawStartText();
    drawGameOver();
    updateBird();

    requestAnimationFrame(render);
}

// ---------------------------------------------------------------------------
// Input handlers (bound at top level, same as reference src/main.js)
// ---------------------------------------------------------------------------
canvas.addEventListener('click', () => {
    if (!window.store.isGameOver) {
        startAnimation();
        jump();
    }
});

window.addEventListener('keydown', (e) => {
    if (
        (e.key === 'Enter' ||
            e.key === 'w' ||
            e.key === 'j' ||
            e.key === ' ' ||
            e.key === 'ArrowUp') &&
        !window.store.isGameOver
    ) {
        startAnimation();
        jump();
    }
});

// ---------------------------------------------------------------------------
// Resize handler (bound at top level, same as reference src/main.js)
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
    updateStore({ dpr: window.devicePixelRatio || 1 });
    resizeCanvas();
});

// ---------------------------------------------------------------------------
// Bootstrap – wait for all images then recalculate bird position and render
// ---------------------------------------------------------------------------
Promise.all([
    new Promise((resolve) => (window.store.assets.birdImg.onload = resolve)),
    new Promise((resolve) => (window.store.assets.floorImg.onload = resolve)),
    new Promise((resolve) => (window.store.assets.pipeUpImg.onload = resolve)),
    new Promise((resolve) => (window.store.assets.pipeDownImg.onload = resolve)),
]).then(() => {
    // Recalculate with actual image dimensions now available
    resizeCanvas();
    render();
});
