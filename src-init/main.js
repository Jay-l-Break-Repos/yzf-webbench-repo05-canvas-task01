// Constants
const FLOOR_HEIGHT = 80;
const BIRD_INITIAL_X = 30;
const BIRD_JUMP_VELOCITY = -6;
const GRAVITY = 0.45;
const MAX_VELOCITY = 6;
const PIPE_SPEED = 4;
const WIND_SPEED_MULTIPLIER = 1.5;

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Initialize game store
const urlParams = new URLSearchParams(window.location.search);

window.store = {
    score: 0,
    floorX: 0,
    frameAdjustedRate: parseFloat(urlParams.get('frameAdjustedRate')) || 1,
    isAnimating: false,
    isGameOver: false,
    bird: { x: BIRD_INITIAL_X, y: 0, velocity: 0, rotation: 0 },
    pipes: [],
    enemies: [],
    bullets: [],
    floorHeight: FLOOR_HEIGHT,
    mode: urlParams.get('mode') || 'normal',
    dpr: window.devicePixelRatio || 1,
    assets: {
        birdImg: new Image(),
        floorImg: new Image(),
        pipeUpImg: new Image(),
        pipeDownImg: new Image(),
        enemyImg: null
    },
    randomRate: 0.25,
    fieldRandomRate: 0.25,
    isProtected: false,
    shieldEndTime: 0,
    lives: 1,
    maxLives: 10,
    weather: {
        current: 'Normal',
        particles: []
    },
    field: null,
    rapidDescent: false,
    speedUp: false,
    lastBulletFiredTime: 0,
    boss: null,
    bossBullets: [],
    lastBossBulletFiredTime: 0,
    bossSpawnTime: 0,
    bombs: 3,
    isExploding: false,
    explodProgress: 0,
    maxBombs: 3,
    coinPhase: {
        isActive: false,
        startTime: 0,
        coins: [],
        lastPhaseEndTime: 0
    },
    horizontalMovement: 0,
};

// Load assets - helper that handles already-cached images
function loadImage(img, src) {
    return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Don't block on error
        img.src = src;
        if (img.complete) resolve();
    });
}

function updateStore(newState) {
    window.store = { ...window.store, ...newState };
    return window.store;
}

/**
 * Resize the canvas to match the window height while maintaining
 * a proportional width (600:800 ratio). Applies device pixel ratio
 * (DPR) scaling so the rendering stays crisp on high-density displays.
 */
function resizeCanvas() {
    // Always read fresh DPR value
    const dpr = window.devicePixelRatio || 1;
    window.store.dpr = dpr;
    const { innerWidth: width, innerHeight: height } = window;
    const ratio = 600 / 800;

    // CSS dimensions (what user sees)
    const cssWidth = Math.min(width, height * ratio);
    const cssHeight = height;

    // Set CSS display size
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Set buffer size = CSS size × DPR
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    // Scale context for CSS-pixel coordinates
    ctx.scale(dpr, dpr);

    // Update bird Y position to center vertically
    updateStore({
        bird: {
            ...window.store.bird,
            y: canvas.height / (2 * dpr) - window.store.assets.birdImg.height / 2
        }
    });
}

// --- Drawing functions ---

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

function drawBird() {
    ctx.save();
    ctx.translate(
        window.store.bird.x + window.store.assets.birdImg.width / 2,
        window.store.bird.y + window.store.assets.birdImg.height / 2
    );
    ctx.rotate(window.store.bird.rotation * Math.PI / 180);
    ctx.drawImage(
        window.store.assets.birdImg,
        -window.store.assets.birdImg.width / 2,
        -window.store.assets.birdImg.height / 2
    );
    ctx.restore();
}

function drawFloor() {
    const floorY = canvas.height / window.store.dpr - window.store.floorHeight;
    for (let i = 0; i * window.store.assets.floorImg.width < canvas.width / window.store.dpr + window.store.assets.floorImg.width; i++) {
        ctx.drawImage(
            window.store.assets.floorImg,
            i * window.store.assets.floorImg.width + window.store.floorX,
            floorY
        );
    }
    if (window.store.isAnimating) {
        const speedMultiplier = (window.store.weather.current === 'Wind' ? WIND_SPEED_MULTIPLIER : 1) * (window.store.speedUp ? 2 : 1);
        const newFloorX = window.store.floorX - PIPE_SPEED * window.store.frameAdjustedRate * speedMultiplier;
        updateStore({
            floorX: newFloorX <= -window.store.assets.floorImg.width ? 0 : newFloorX
        });
    }
}

function drawStartText() {
    if (!window.store.isAnimating && !window.store.isGameOver) {
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Start', canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr));
    }
}

function drawGameOver() {
    if (window.store.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr) - 40);

        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${window.store.score}`, canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr));

        ctx.font = '16px Arial';
        ctx.fillText('Click to Play Again', canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr) + 40);
    }
}

// --- Game logic ---

function updateBird() {
    if (window.store.isAnimating) {
        let { velocity, y, rotation } = window.store.bird;

        if (window.store.rapidDescent) {
            velocity = 6;
        } else {
            velocity += GRAVITY * window.store.frameAdjustedRate;
            velocity = Math.min(velocity, MAX_VELOCITY);
        }

        y += velocity * window.store.frameAdjustedRate;
        const targetRotation = velocity > 0 ? 35 : -35;
        rotation += (targetRotation - rotation) * 0.2 * window.store.frameAdjustedRate;

        if (y + window.store.assets.birdImg.height >= canvas.height / window.store.dpr - window.store.floorHeight) {
            if (window.store.mode !== 'debug' && !window.store.isProtected) {
                loseLife();
            } else {
                y = canvas.height / window.store.dpr - window.store.floorHeight - window.store.assets.birdImg.height;
            }
        }

        updateStore({ bird: { ...window.store.bird, velocity, y, rotation } });
    }
}

function startAnimation() {
    if (!window.store.isAnimating && !window.store.isGameOver) {
        updateStore({ isAnimating: true });
    }
}

function jump() {
    if (window.store.isAnimating) {
        updateStore({
            bird: { ...window.store.bird, velocity: BIRD_JUMP_VELOCITY }
        });
    }
}

function loseLife() {
    const newLives = window.store.lives - 1;
    if (newLives <= 0) {
        endGame();
    } else {
        updateStore({ lives: newLives });
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
    updateStore({
        isGameOver: false,
        isAnimating: true,
        score: 0,
        lives: 1,
        bird: {
            x: BIRD_INITIAL_X,
            y: canvas.height / (2 * window.store.dpr) - window.store.assets.birdImg.height / 2,
            velocity: 0,
            rotation: 0
        },
        pipes: [],
        field: null,
        enemies: [],
        bullets: [],
        boss: null,
        bossBullets: [],
    });
    canvas.removeEventListener('click', restartGame);
    window.removeEventListener('keydown', handleRestartKeydown);
}

function handleRestartKeydown(e) {
    if (e.key === 'Enter') {
        restartGame();
    }
}

// --- Render loop ---

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

// --- Event listeners ---

window.addEventListener('resize', () => {
    resizeCanvas();
});

canvas.addEventListener('click', () => {
    if (!window.store.isGameOver) {
        startAnimation();
        jump();
    }
});

window.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === 'w' || e.key === 'j' || e.key === ' ' || e.key === 'ArrowUp') && !window.store.isGameOver) {
        startAnimation();
        jump();
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
        updateStore({ rapidDescent: true });
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        updateStore({ speedUp: true });
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown' || e.key === 's') {
        updateStore({ rapidDescent: false });
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        updateStore({ speedUp: false });
    }
});

// --- Initialization ---

// Ensure DOM is fully ready before sizing canvas and loading images
function init() {
    // Size the canvas immediately so it's correct even before images load
    resizeCanvas();

    // Load images, then re-size (to position bird using image dimensions) and start rendering
    Promise.all([
        loadImage(window.store.assets.birdImg, 'assets/bird.png'),
        loadImage(window.store.assets.floorImg, 'assets/fg.png'),
        loadImage(window.store.assets.pipeUpImg, 'assets/pipeUp.png'),
        loadImage(window.store.assets.pipeDownImg, 'assets/pipeDown.png')
    ]).then(() => {
        resizeCanvas();
        render();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
