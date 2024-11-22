export default class UI {
  constructor() {
    // Menu bar
    this.brushSizeInput = document.getElementById('size');
    this.brushColorInput = document.getElementById('color');
    this.brushButton = document.getElementById('brushButton');
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
    this.paintSpeedInput = document.getElementById('paintSpeedInput');
    this.strafeToolButton = document.getElementById('strafeToolButton');
    this.strafeLockButton = document.getElementById('strafeLockButton');

    this.clearButton = document.getElementById('clearButton');
    this.clearAllButton = document.getElementById('clearAllButton');

    this.faderContainer = document.getElementById('fader-container');
    this.addFaderButton = document.getElementById('addFaderButton');
    this.deleteFaderSubmenu = document.getElementById('deleteFaderSubmenu');
  }
}