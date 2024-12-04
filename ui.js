export default class UI {
  constructor() {
    // Menu bar
    this.brushSizeInput = document.getElementById('size');
    this.colorPicker = document.getElementById('color-picker');
    this.brushButton = document.getElementById('brushButton');
    this.continousBrushButton = document.getElementById('continousBrushButton');
    this.eraserButton = document.getElementById('eraserButton');
    this.brushShapeInput = document.getElementById('shape');

    // Canvas
    this.canvas = document.getElementById('drawing-surface');
    this.canvasContainer = document.getElementById('canvas-container');
    this.canvasRedim = document.getElementById('canvas-redimensionnable');

    // Layers palette
    this.layersList = document.getElementById('layersList');
    this.addLayerButton = document.getElementById('addLayerButton');
    this.deleteLayerButton = document.getElementById('deleteLayerButton');
    this.deleteAllLayersButton = document.getElementById('deleteAllLayersButton');

    // Controls palette
    this.playPauseButton = document.getElementById('playPauseButton');
    this.strafeToolButton = document.getElementById('strafeToolButton');
    this.strafeLockButton = document.getElementById('strafeLockButton');

    this.clearButton = document.getElementById('clearButton');
    this.clearAllButton = document.getElementById('clearAllButton');

    this.faderContainer = document.getElementById('fader-container');
    this.addFaderButton = document.getElementById('addFaderButton');
    this.deleteFaderSubmenu = document.getElementById('deleteFaderSubmenu');

    this.frameCodeInput = document.getElementById('frameCodeInput');
    this.pixelCodeInput = document.getElementById('pixelCodeInput');
    this.fillBucketButton = document.getElementById('fillBucketButton');
    this.magicFillButton = document.getElementById('magicFillButton');

    this.initModal();
  }

  initModal() {
    this.modalOverlay = document.getElementById('modalOverlay');
    this.faderForm = document.getElementById('faderForm');
    this.faderNameInput = document.getElementById('faderName');
    this.faderMinInput = document.getElementById('faderMin');
    this.faderMaxInput = document.getElementById('faderMax');
    this.closeModalButton = document.getElementById('closeModalButton');
  }
}