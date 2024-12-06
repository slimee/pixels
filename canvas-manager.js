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

  get brush() {
    return this.state.brush;
  }

  get layers() {
    return this.state.layers;
  }

  get currentLayer() {
    return this.state.currentLayer;
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

    if (this.brush.tool === 'magic-fill') {
      this.state.drawingLayers.forEach(layer => layer.magicFillRegion(x, y, this.brush.color));
      this.updateCanvas();
      return;
    } else if (this.brush.tool === 'fill') {
      this.state.drawingLayers.forEach(layer => layer.fillRegion(x, y, this.brush.color));
      this.updateCanvas();
      return;
    } else if (this.brush.tool === 'strafe') {
      this.strafeStartPoint = { x, y };
      this.strafeLayers = this.state.strafeLock
        ? this.layers.map((layer) => ({
          canvas: this.cloneCanvas(layer.offscreenCanvas),
          layer: layer,
        }))
        : [
          {
            canvas: this.cloneCanvas(this.currentLayer.offscreenCanvas),
            layer: this.currentLayer,
          },
        ];
    } else if (this.brush.shape === 'segment') {
      this.startPoint = { x, y };
    } else {
      // Pour les autres pinceaux, on dessine immédiatement au mousedown
      this.state.drawingLayers.forEach(layer => layer.drawAt(x, y, this.brush));
      this.updateCanvas();
    }

    this.mouseMoveInterval = setInterval(this.handleMouseMove, 1000 / this.brush.speed);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  cloneCanvas(sourceCanvas) {
    const clone = document.createElement('canvas');
    clone.width = sourceCanvas.width;
    clone.height = sourceCanvas.height;
    const context = clone.getContext('2d');
    context.drawImage(sourceCanvas, 0, 0);
    return clone;
  }

  handleMouseMove = () => {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.brush.tool === 'strafe') {
      // Calculer le delta
      const dx = x - this.strafeStartPoint.x;
      const dy = y - this.strafeStartPoint.y;

      const width = this.currentLayer.width;
      const height = this.currentLayer.height;

      // Ajuster dx et dy pour qu'ils soient dans [0, width) et [0, height)
      const shiftX = ((-dx % width) + width) % width;
      const shiftY = ((-dy % height) + height) % height;

      this.performStrafe(shiftX, shiftY);
    } else if (this.brush.shape === 'segment' && this.brush.tool === 'continousBrush') {
      // Dessin continu avec le pinceau "segment"
      if (this.state.lastPoint) {
        this.brush.startX = this.state.lastPoint.x;
        this.brush.startY = this.state.lastPoint.y;
        this.brush.endX = x;
        this.brush.endY = y;
        this.state.drawingLayers.forEach(layer => layer.drawAt(x, y, { ...this.brush }));
        this.state.lastPoint = { x, y };
      }
    } else if (this.state.brush.tool === 'continousBrush') {
      // Dessin continu avec les autres pinceaux
      this.state.drawingLayers.forEach(layer => layer.drawAt(x, y, this.brush));
    }
    this.updateCanvas();
  }

  handleMouseUp = () => {
    if (this.brush.shape === 'strafe') {
      // Effacer les variables temporaires
      this.strafeStartPoint = null;
      this.strafeCanvas = null;
    }

    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.brush.shape === 'segment') {
      if (this.brush.tool === 'continousBrush') {
        // En mode dessin continu, on réinitialise state.lastPoint
        this.state.lastPoint = null;
      } else if (this.startPoint) {
        // En mode normal, on dessine le segment une fois le bouton relâché
        this.brush.startX = this.startPoint.x;
        this.brush.startY = this.startPoint.y;
        this.brush.endX = x;
        this.brush.endY = y;
        this.drawAt(x, y, { ...this.brush });
        this.startPoint = null;
      }
    }

    clearInterval(this.mouseMoveInterval);
    document.removeEventListener('mouseup', this.handleMouseUp);
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
    this.layers.forEach(matrix => matrix.clear());
    this.updateCanvas();
  }

  clearCurrentLayer() {
    this.currentLayer.clear();
    this.updateCanvas();
  }

  updateCanvas() {
    this.canvasContext.clearRect(0, 0, this.state.width, this.state.height);
    this.layers.forEach((layer) => {
      if (layer.visible) this.canvasContext.drawImage(layer.offscreenCanvas, 0, 0)
    });
  }

  resizeCanvas() {
    this.ui.canvas.width = this.state.width;
    this.ui.canvas.height = this.state.height;
    this.layers.forEach(matrix => matrix.resize(this.state.width, this.state.height));
    this.updateCanvas();
  }
}