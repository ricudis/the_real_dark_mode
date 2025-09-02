// Content script for Real Dark Mode
// Creates a full-page black canvas and reveals content around the cursor with a radial gradient

let overlayCanvas = null;
let overlayCtx = null;
let isActive = false;
let mouseX = 0;
let mouseY = 0;
let animationFrameId = null;

const FLASHLIGHT_RADIUS = 0; // inner radius for full transparency
const GRADIENT_FALLOFF = 50; // gradient radius to full black
const FLASHLIGHT_OFFSET_X = 72; // flashlight position: farther right of cursor
const FLASHLIGHT_OFFSET_Y = 72; // flashlight position: farther below cursor
const FLASHLIGHT_BODY_LENGTH = 56;
const FLASHLIGHT_BODY_WIDTH = 14;
const FLASHLIGHT_HEAD_LENGTH = 18;
const FLASHLIGHT_HEAD_WIDTH = 20;
const FLASHLIGHT_BODY_RADIUS = 6;
const FLASHLIGHT_TAIL_RADIUS = 7;
const FLASHLIGHT_LENS_RADIUS = 5;
const OVERLAY_ALPHA = 1.0; // base overlay opacity

function ensureCanvas() {
  if (overlayCanvas) return overlayCanvas;
  overlayCanvas = document.createElement('canvas');
  overlayCanvas.id = 'real-dark-mode-overlay';
  overlayCanvas.style.position = 'fixed';
  overlayCanvas.style.top = '0';
  overlayCanvas.style.left = '0';
  overlayCanvas.style.width = '100vw';
  overlayCanvas.style.height = '100vh';
  overlayCanvas.style.pointerEvents = 'none';
  overlayCanvas.style.zIndex = '2147483647'; // on top
  overlayCanvas.style.mixBlendMode = 'normal';
  overlayCanvas.style.transition = 'opacity 120ms ease-out';
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
  overlayCtx = overlayCanvas.getContext('2d', { alpha: true });
  document.documentElement.appendChild(overlayCanvas);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  return overlayCanvas;
}

function handleResize() {
  if (!overlayCanvas) return;
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
}

function handleMouseMove(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function drawFrame() {
  if (!isActive || !overlayCtx || !overlayCanvas) return;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Draw black overlay
  overlayCtx.fillStyle = `rgba(0,0,0,${OVERLAY_ALPHA})`;
  overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Flashlight gradient: fully transparent center to fully black edge
  const gradient = overlayCtx.createRadialGradient(
    mouseX,
    mouseY,
    Math.max(0, FLASHLIGHT_RADIUS),
    mouseX,
    mouseY,
    FLASHLIGHT_RADIUS + GRADIENT_FALLOFF
  );

  // With destination-out, alpha=1 removes overlay (transparent), alpha=0 keeps it (black)
  // Non-uniform: keep high transparency until ~70% radius, then fall off faster
  gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.95)');
  gradient.addColorStop(0.85, 'rgba(0,0,0,0.35)');
  gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

  overlayCtx.globalCompositeOperation = 'destination-out';
  overlayCtx.fillStyle = gradient;
  overlayCtx.beginPath();
  overlayCtx.arc(mouseX, mouseY, FLASHLIGHT_RADIUS + GRADIENT_FALLOFF, 0, Math.PI * 2);
  overlayCtx.fill();
  overlayCtx.globalCompositeOperation = 'source-over';

  // Draw the flashlight graphic offset from the cursor and pointing toward it
  drawFlashlightGraphic();

  animationFrameId = window.requestAnimationFrame(drawFrame);
}

function activate() {
  if (isActive) return;
  ensureCanvas();
  isActive = true;
  overlayCanvas.style.opacity = '1';
  if (!animationFrameId) {
    animationFrameId = window.requestAnimationFrame(drawFrame);
  }
}

function deactivate() {
  isActive = false;
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (overlayCtx && overlayCanvas) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }
  if (overlayCanvas) {
    overlayCanvas.style.opacity = '0';
  }
}

function teardown() {
  deactivate();
  if (overlayCanvas && overlayCanvas.parentNode) {
    overlayCanvas.parentNode.removeChild(overlayCanvas);
  }
  overlayCanvas = null;
  overlayCtx = null;
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', handleMouseMove);
}

function toggle() {
  if (isActive) deactivate();
  else activate();
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== 'object') return;
  if (message.type === 'RDM_TOGGLE') {
    toggle();
  } else if (message.type === 'RDM_SET') {
    if (message.enabled) activate();
    else deactivate();
  }
});

// Optional keyboard escape to exit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isActive) {
    deactivate();
  }
}, { passive: true });


function drawFlashlightGraphic() {
  const ctx = overlayCtx;
  if (!ctx) return;

  // Position flashlight bottom-right from cursor
  const flashlightX = mouseX + FLASHLIGHT_OFFSET_X;
  const flashlightY = mouseY + FLASHLIGHT_OFFSET_Y;

  // Angle from flashlight to the cursor so the head points at the cursor center
  const angleToCursor = Math.atan2(mouseY - flashlightY, mouseX - flashlightX);

  ctx.save();
  ctx.translate(flashlightX, flashlightY);
  ctx.rotate(angleToCursor);

  // Subtle shadow so it pops against black
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Metallic body with rounded ends
  const bodyX = -FLASHLIGHT_BODY_LENGTH;
  const bodyY = -FLASHLIGHT_BODY_WIDTH / 2;
  const bodyW = FLASHLIGHT_BODY_LENGTH;
  const bodyH = FLASHLIGHT_BODY_WIDTH;

  // Body gradient
  const bodyGrad = ctx.createLinearGradient(bodyX, 0, 0, 0);
  bodyGrad.addColorStop(0, '#9aa2ad');
  bodyGrad.addColorStop(0.5, '#c9cfd8');
  bodyGrad.addColorStop(1, '#a3aab4');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#2a2e33';
  ctx.lineWidth = 1.2;

  // Rounded body path
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyH / 2, bodyY);
  ctx.arcTo(bodyX + bodyW, bodyY, bodyX + bodyW, bodyY + bodyH, FLASHLIGHT_BODY_RADIUS);
  ctx.arcTo(bodyX + bodyW, bodyY + bodyH, bodyX, bodyY + bodyH, FLASHLIGHT_BODY_RADIUS);
  ctx.arcTo(bodyX, bodyY + bodyH, bodyX, bodyY, FLASHLIGHT_TAIL_RADIUS);
  ctx.arcTo(bodyX, bodyY, bodyX + bodyW, bodyY, FLASHLIGHT_BODY_RADIUS);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Grip rings
  ctx.strokeStyle = 'rgba(50,54,59,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const gx = bodyX + (bodyW * (0.2 + i * 0.18));
    ctx.beginPath();
    ctx.moveTo(gx, bodyY + 2);
    ctx.lineTo(gx, bodyY + bodyH - 2);
    ctx.stroke();
  }

  // Head (flared)
  const headX = 0;
  const headY = -FLASHLIGHT_HEAD_WIDTH / 2;
  const headW = FLASHLIGHT_HEAD_LENGTH;
  const headH = FLASHLIGHT_HEAD_WIDTH;

  const headGrad = ctx.createLinearGradient(headX, 0, headX + headW, 0);
  headGrad.addColorStop(0, '#d6a739');
  headGrad.addColorStop(1, '#f4cf6a');
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = '#5a4a1c';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(headX + headW - 4, headY);
  ctx.quadraticCurveTo(headX + headW, headY + headH / 2, headX + headW - 4, headY + headH);
  ctx.lineTo(headX, headY + headH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lens at the tip aimed towards cursor
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#8fd7ff';
  ctx.strokeStyle = '#203044';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(headX + headW - 3, headY + headH / 2, FLASHLIGHT_LENS_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Beam highlight line inside head
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(headX + 3, headY + headH * 0.35);
  ctx.lineTo(headX + headW - 6, headY + headH * 0.35);
  ctx.stroke();

  ctx.restore();
}


