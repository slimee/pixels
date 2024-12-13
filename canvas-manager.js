export default class CanvasManager {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;

    this.canvasContext = this.ui.canvas.getContext('2d');
    this.startPoint = null;
    this.draggedLayerIndex = null;
    this.mouseMoveInterval = null;

    this.initializeControls();
  }

  initializeControls() {
    this.initCanvasMouseEvents();
  }

  initCanvasMouseEvents() {
    this.ui.canvasContainer.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
  }

  handleCanvasMouseDown() {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;
    this.state.lastPoint = { x, y };

    if (this.state.brush.tool === 'magic-fill') {
      this.state.drawingLayers.forEach(layer => layer.magicFillRegion(x, y, this.state.brush.color));
      this.updateCanvas();
      return;
    } else if (this.state.brush.tool === 'fill') {
      this.state.drawingLayers.forEach(layer => layer.fillRegion(x, y, this.state.brush.color));
      this.updateCanvas();
      return;
    } else if (this.state.brush.tool === 'strafe') {
      this.strafeStartPoint = { x, y };
      this.updateStrafeLayers();
    } else if (this.state.brush.shape === 'segment') {
      this.startPoint = { x, y };
    } else {
      // Pour les autres pinceaux, on dessine immédiatement au mousedown
      this.state.drawingLayers.forEach(layer => layer.paint(x, y, this.state.brush));
      this.updateCanvas();
    }

    this.mouseMoveInterval = setInterval(this.handleMouseMove, 1000 / this.state.brush.speed);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = () => {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.state.brush.tool === 'strafe') {
      // Calculer le delta
      const dx = x - this.strafeStartPoint.x;
      const dy = y - this.strafeStartPoint.y;

      const width = this.state.currentLayer.width;
      const height = this.state.currentLayer.height;

      // Ajuster dx et dy pour qu'ils soient dans [0, width) et [0, height)
      const shiftX = ((-dx % width) + width) % width;
      const shiftY = ((-dy % height) + height) % height;

      this.performStrafe(shiftX, shiftY);
    } else if (this.state.brush.shape === 'segment' && this.state.brush.tool === 'continousstate.brush') {
      // Dessin continu avec le pinceau "segment"
      if (this.state.lastPoint) {
        this.state.brush.startX = this.state.lastPoint.x;
        this.state.brush.startY = this.state.lastPoint.y;
        this.state.brush.endX = x;
        this.state.brush.endY = y;
        this.state.drawingLayers.forEach(layer => layer.paint(x, y, { ...this.state.brush }));
        this.state.lastPoint = { x, y };
      }
    } else if (this.state.brush.tool === 'continousstate.brush') {
      // Dessin continu avec les autres pinceaux
      this.state.drawingLayers.forEach(layer => layer.paint(x, y, this.state.brush));
    }
    this.updateCanvas();
  }

  handleMouseUp = () => {
    this.strafeStartPoint = null;
    this.startPoint = null;

    clearInterval(this.mouseMoveInterval);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  cloneCanvas(sourceCanvas) {
    const clone = document.createElement('canvas');
    clone.width = sourceCanvas.width;
    clone.height = sourceCanvas.height;
    const context = clone.getContext('2d');
    context.drawImage(sourceCanvas, 0, 0);
    return clone;
  }

  paint(x, y, brush) {
    this.state.drawingLayers.forEach(layer => layer.paint(x, y, brush));
  }

  strafe(x, y) {
    this.updateStrafeLayers();
    this.performStrafe(x, y);
  }

  updateStrafeLayers() {
    this.strafeLayers = this.strafeLayers || this.state.strafeLock
      ? this.state.layers.map((layer) => ({
        canvas: this.cloneCanvas(layer.offscreenCanvas),
        layer: layer,
      }))
      : [
        {
          canvas: this.cloneCanvas(this.state.currentLayer.offscreenCanvas),
          layer: this.state.currentLayer,
        },
      ];
  }

  copy(layerFrom, layerTo) {
    const fromData = layerFrom.offscreenCanvasContext.getImageData(0, 0, layerFrom.width, layerFrom.height);
    layerTo.offscreenCanvasContext.putImageData(fromData, 0, 0);
    this.updateCanvas();
  }

  performStrafe(shiftX, shiftY) {
    if (!shiftX && !shiftY) return;
    this.strafeLayers.forEach(({ canvas, layer }) => {
      const width = layer.width;
      const height = layer.height;

      layer.offscreenCanvasContext.clearRect(0, 0, width, height);
      layer.offscreenCanvasContext.drawImage(canvas, -shiftX, -shiftY);

      if (shiftX !== 0) {
        // Côté droit
        layer.offscreenCanvasContext.drawImage(canvas, width - shiftX, -shiftY);
      }

      if (shiftY !== 0) {
        // Côté inférieur
        layer.offscreenCanvasContext.drawImage(canvas, -shiftX, height - shiftY);
      }

      if (shiftX !== 0 && shiftY !== 0) {
        // Coin inférieur droit
        layer.offscreenCanvasContext.drawImage(canvas, width - shiftX, height - shiftY);
      }
    });
  }

  clearAllLayers() {
    this.state.layers.forEach(matrix => matrix.clear());
    this.updateCanvas();
  }

  clear(layerName) {
    const layer = this.state.layers.find(({ name }) => name === layerName);
    if (layer) {
      layer.clear();
      this.updateCanvas();
    }
  }

  clearCurrentLayer() {
    this.state.currentLayer.clear();
    this.updateCanvas();
  }

  updateCanvas() {
    this.canvasContext.clearRect(0, 0, this.state.width, this.state.height);
    this.state.layers.forEach((layer) => {
      if (layer.visible) this.canvasContext.drawImage(layer.offscreenCanvas, 0, 0)
    });
  }

  resizeCanvas() {
    this.ui.canvas.width = this.state.width;
    this.ui.canvas.height = this.state.height;
    this.state.layers.forEach(matrix => matrix.resize(this.state.width, this.state.height));
    this.updateCanvas();
  }
}