const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

/**
 * Resize the canvas to match the window height while maintaining
 * a proportional width (600:800 ratio). Applies device pixel ratio
 * (DPR) scaling so the rendering stays crisp on high-density displays.
 */
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const { innerWidth: width, innerHeight: height } = window;
    const ratio = 600 / 800;

    // Canvas CSS dimensions: height matches window, width is proportional
    const cssWidth = Math.min(width, height * ratio);
    const cssHeight = height;

    // Set the CSS display size
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Set the actual canvas buffer size scaled by DPR for crisp rendering
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    // Scale the drawing context so drawing operations use CSS pixel coordinates
    ctx.scale(dpr, dpr);
}

// Initial sizing
resizeCanvas();

// Re-apply sizing on window resize
window.addEventListener('resize', resizeCanvas);
