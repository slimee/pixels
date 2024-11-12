export default class UI {
  constructor() {
    // Menu bar
    this.brushSizeInput = document.getElementById('size');
    this.brushColorInput = document.getElementById('color');
    this.eraserButton = document.getElementById('eraserButton');
    this.brushShapeInput = document.getElementById('shape');
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
}