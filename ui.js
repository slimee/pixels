export default class UI {
  constructor() {
    // Menu bar
    this.pointSizeInput = document.getElementById('size');
    this.pointColorInput = document.getElementById('color');
    this.eraserButton = document.getElementById('eraserButton');
    this.pointShapeInput = document.getElementById('shape');
    this.drawOnDragCheckbox = document.getElementById('drawOnDrag');

    // Canvas
    this.canvas = document.getElementById('myCanvas');
    this.resizeAnchor = document.getElementById('resizeAnchor');

    // Layers palette
    this.layersList = document.getElementById('layersList');
    this.addLayerButton = document.getElementById('addLayerButton');
    this.deleteLayerButton = document.getElementById('deleteLayerButton');

    // Controls palette
    this.playPauseButton = document.getElementById('playPauseButton');
    this.clearButton = document.getElementById('clearButton');
    this.clearAllButton = document.getElementById('clearAllButton');

    this.layerTransformationInputs = {};
    this.layerPlayPauseButtons = {};
    this.layerErrorDisplays = {};

    // Bouton de repli
    this.togglePaletteButton = document.getElementById('togglePaletteButton');
    this.paletteContainer = document.getElementById('paletteContainer');
    this.mainContainer = document.querySelector('.main-container');

    // Initialiser le repli de la palette
    this.initPaletteToggle();
  }

  showError(layerIndex, message) {
    if (this.layerErrorDisplays[layerIndex]) {
      this.layerErrorDisplays[layerIndex].textContent = message;
    }
  }

  clearErrorDisplay(layerIndex) {
    if (this.layerErrorDisplays[layerIndex]) {
      this.layerErrorDisplays[layerIndex].textContent = '';
    }
  }

  initPaletteToggle() {
    // Définir l'icône initiale
    if (this.paletteContainer.classList.contains('collapsed')) {
      this.togglePaletteButton.textContent = '→';
    } else {
      this.togglePaletteButton.textContent = '←';
    }

    this.togglePaletteButton.addEventListener('click', () => {
      this.paletteContainer.classList.toggle('collapsed');
      this.mainContainer.classList.toggle('palette-collapsed');

      // Mettre à jour l'icône du bouton
      if (this.paletteContainer.classList.contains('collapsed')) {
        this.togglePaletteButton.textContent = '→'; // Icône lorsque replié
      } else {
        this.togglePaletteButton.textContent = '←'; // Icône lorsque déplié
      }
    });
  }
}