import { distanceCalculator } from './distance-calculator.js';
import { elementInspector } from './element-inspector.js';

let inspectModeActive = false;
let hoverElement = null;
let overlay = null;
let lastMouseMove = 0;

export function initializeHoverDetector() {
  console.log('Initializing hover detector...');
  createOverlay();
}

export function startInspectMode() {
  inspectModeActive = true;
  console.log('Inspect mode started');
  
  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseover', handleMouseOver, { passive: true });
  document.addEventListener('click', handleClick, { capture: true });
  document.addEventListener('mouseout', handleMouseOut, { passive: true });
  
  document.body.classList.add('code-peek-inspecting');
}

export function stopInspectMode() {
  inspectModeActive = false;
  console.log('Inspect mode stopped');
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('mouseout', handleMouseOut);
  
  hideHover();
  removeOverlay();
  
  document.body.classList.remove('code-peek-inspecting');
}

function createOverlay() {
  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9999;
  `;
  
  document.body.appendChild(overlay);
}

function removeOverlay() {
  if (overlay && overlay.parentNode) {
    overlay.remove();
    overlay = null;
  }
}

function handleMouseOver(event) {
  if (!inspectModeActive) return;
  
  const now = Date.now();
  if (now - lastMouseMove < 50) return;
  lastMouseMove = now;
  
  const element = event.target;
  if (element === document.body || element === document.documentElement) return;
  
  hoverElement = element;
  showHover(element, event);
}

function handleMouseMove(event) {
  if (!inspectModeActive || !hoverElement) return;
  
  const now = Date.now();
  if (now - lastMouseMove < 50) return;
  lastMouseMove = now;
  
  const rect = hoverElement.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const distances = distanceCalculator.calculate(rect, viewport);
  updateHoverDisplay(rect, distances);
}

function handleMouseOut(event) {
  if (!inspectModeActive) return;
  
  const element = event.target;
  if (element === hoverElement) {
    hideHover();
    hoverElement = null;
  }
}

function handleClick(event) {
  if (!inspectModeActive) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target;
  if (element === document.body || element === document.documentElement) return;
  
  elementInspector.inspect(element);
}

function showHover(element, event) {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  hideHover();
  
  const highlight = document.createElement('div');
  highlight.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: rgba(59, 130, 246, 0.2);
    border: 2px solid #3b82f6;
    border-radius: 2px;
    pointer-events: none;
    z-index: 9999;
    transition: all 0.1s ease;
  `;
  highlight.setAttribute('data-code-peek-highlight', 'true');
  
  const hoverInfo = document.createElement('div');
  hoverInfo.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    transform: translateY(-100%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    pointer-events: none;
    z-index: 10000;
    white-space: nowrap;
  `;
  hoverInfo.innerHTML = `
    <div><strong>${element.tagName.toLowerCase()}</strong> ${element.className ? '.' + element.className.split(' ').join('.') : ''}</div>
    <div>${Math.round(rect.width)} × ${Math.round(rect.height)}px</div>
    <div class="text-xs text-gray-400 mt-1">Click to inspect</div>
  `;
  hoverInfo.setAttribute('data-code-peek-info', 'true');
  
  document.body.appendChild(highlight);
  document.body.appendChild(hoverInfo);
  
  const distances = distanceCalculator.calculateFromEvent(rect, event);
  updateDistanceLines(distances);
}

function hideHover() {
  const highlights = document.querySelectorAll('[data-code-peek-highlight]');
  highlights.forEach(h => h.remove());
  
  const infos = document.querySelectorAll('[data-code-peek-info]');
  infos.forEach(i => i.remove());
  
  removeDistanceLines();
}

function updateHoverDisplay(rect, distances) {
  const info = document.querySelector('[data-code-peek-info]');
  if (!info) return;
  
  const msg = `
    <div>${Math.round(rect.width)} × ${Math.round(rect.height)}px</div>
    <div class="text-xs text-gray-400 mt-1">
      T: ${Math.round(distances.top)}px | 
      R: ${Math.round(distances.right)}px | 
      B: ${Math.round(distances.bottom)}px | 
      L: ${Math.round(distances.left)}px
    </div>
  `;
  
  info.innerHTML = info.innerHTML.split('<!--dist-->')[0] + '<!--dist-->' + msg;
}

function updateDistanceLines(distances) {
  removeDistanceLines();
  
  const distanceLabels = [
    { side: 'top', value: distances.top, vertical: true },
    { side: 'bottom', value: distances.bottom, vertical: true },
    { side: 'left', value: distances.left, vertical: false },
    { side: 'right', value: distances.right, vertical: false }
  ];
  
  distanceLabels.forEach(({ side, value }) => {
    if (value > 0 && value < 1000) {
      const label = document.createElement('div');
      label.className = 'distance-label';
      label.textContent = Math.round(value) + 'px';
      document.body.appendChild(label);
      
      setTimeout(() => label.remove(), 500);
    }
  });
}

function removeDistanceLines() {
  const labels = document.querySelectorAll('.distance-label');
  labels.forEach(l => l.remove());
}

export function getCurrentElement() {
  return hoverElement;
}

export function isActive() {
  return inspectModeActive;
}