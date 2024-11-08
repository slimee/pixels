// drag.js
document.addEventListener('DOMContentLoaded', () => {
  const paletteContainer = document.getElementById('paletteContainer');
  let isDragging = false;
  let startX, startY;

  paletteContainer.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('palette-tab')) return; // Ignore si clic sur un onglet
    isDragging = true;
    startX = e.clientX - paletteContainer.offsetLeft;
    startY = e.clientY - paletteContainer.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    paletteContainer.style.left = `${e.clientX - startX}px`;
    paletteContainer.style.top = `${e.clientY - startY}px`;
    paletteContainer.style.position = 'absolute';
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
});
