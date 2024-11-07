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

    // Controls palette
    this.playPauseButton = document.getElementById('playPauseButton');
    this.clearButton = document.getElementById('clearButton');
    this.clearAllButton = document.getElementById('clearAllButton');
    this.transformationSelector = document.getElementById('transformationSelector');
    this.transformationCodeInput = document.getElementById('transformationCode');
    this.errorDisplay = document.getElementById('errorDisplay');
  }
}