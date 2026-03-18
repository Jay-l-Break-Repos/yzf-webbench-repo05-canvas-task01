/**
 * game.js - Canvas infrastructure for Flappy Bird-style game
 *
 * Sets up the canvas element with proper sizing, DPR scaling,
 * and provides exported functions for canvas management.
 */

/** Device pixel ratio for crisp rendering on high-density displays */
let dpr = window.devicePixelRatio || 1;

/**
 * Resize and configure the canvas to match the window dimensions.
 *
 * - Canvas height matches window.innerHeight
 * - Canvas width is proportionally scaled using a 600:800 (3:4) aspect ratio
 *   capped at window.innerWidth so it never overflows
 * - The internal canvas resolution is multiplied by the device pixel ratio
 *   (canvas.width = clientWidth * dpr) for crisp rendering on Retina / HiDPI screens
 * - The 2D context is scaled by dpr so all subsequent draw calls use CSS-pixel coordinates
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
export function resizeCanvas(canvas, ctx) {
    const { innerWidth: width, innerHeight: height } = window;
    const ratio = 600 / 800; // width-to-height aspect ratio

    // CSS (layout) dimensions
    const cssWidth = Math.min(width, height * ratio);
    const cssHeight = height;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Internal (bitmap) dimensions – scaled by DPR for sharp rendering
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    // Scale the context so drawing code can use CSS-pixel units
    ctx.scale(dpr, dpr);
}

/**
 * Initialise the canvas: obtain the 2D context, apply sizing, and wire up
 * the resize listener so the canvas stays correctly sized when the window changes.
 *
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function setupCanvas() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get 2D rendering context');
    }

    // Initial sizing
    resizeCanvas(canvas, ctx);

    // Keep canvas in sync with viewport changes
    window.addEventListener('resize', () => {
        dpr = window.devicePixelRatio || 1;
        resizeCanvas(canvas, ctx);
    });

    return { canvas, ctx };
}

/**
 * Return the current device pixel ratio tracked by this module.
 * @returns {number}
 */
export function getDpr() {
    return dpr;
}

// --- Bootstrap -----------------------------------------------------------
const { canvas, ctx } = setupCanvas();

// Quick visual verification: draw a small filled rectangle so we can confirm
// the context is working (will be removed once game rendering is added).
ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
ctx.fillRect(10, 10, 50, 50);
