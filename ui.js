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
    this.transformationSelector = document.getElementById('transformationSelector');
    this.transformationCodeInput = document.getElementById('transformationCode');
    this.errorDisplay = document.getElementById('errorDisplay');

    this.paletteTabs = document.querySelectorAll('.palette-tab');
    this.palettePanels = document.querySelectorAll('.palette-panel');
    this.paletteContainer = document.getElementById('paletteContainer');

    // Initialize palette tabs
    this.initPaletteTabs();
  }

  initPaletteTabs() {
    this.paletteTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        this.paletteTabs.forEach(t => t.classList.remove('active'));
        // Hide all panels
        this.palettePanels.forEach(panel => panel.classList.add('hidden'));
        // Activate the clicked tab and show its panel
        tab.classList.add('active');
        const targetPanel = document.querySelector(tab.dataset.target);
        targetPanel.classList.remove('hidden');
      });
    });
  }
}