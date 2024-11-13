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
    this.canvasRedim = document.getElementById('canvas-redimensionnable');

    // Layers palette
    this.layersList = document.getElementById('layersList');
    this.addLayerButton = document.getElementById('addLayerButton');
    this.deleteLayerButton = document.getElementById('deleteLayerButton');
    this.deleteAllLayersButton = document.getElementById('deleteAllLayersButton');

    // Controls palette
    this.playPauseButton = document.getElementById('playPauseButton');
    this.clearButton = document.getElementById('clearButton');
    this.clearAllButton = document.getElementById('clearAllButton');
  }
}