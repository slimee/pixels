export default class CanvasManager {
  constructor(state, ui, helper) {
    this.state = state;
    this.ui = ui;
    this.helper = helper;
    this.canvasContext = this.ui.canvas.getContext('2d');
    this.drawInterval = null;

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
    this.state.mouse.down = { x, y };

    if (this.state.brush.tool === 'magic-fill') {
      this.state.drawingLayers.forEach(layer => layer.magicFillRegion(x, y, this.state.brush.color));
      this.updateCanvas();
      return;
    } else if (this.state.brush.tool === 'fill') {
      this.state.drawingLayers.forEach(layer => layer.fillRegion(x, y, this.state.brush.color));
      this.updateCanvas();
      return;
    } else if (this.state.brush.tool === 'move') {
    } else if (this.state.brush.shape === 'segment') {
      // nothing to do
    } else {
      // Pour les autres pinceaux, on dessine immédiatement au mousedown
      this.state.drawingLayers.forEach(layer => layer.paint(x, y, this.state.brush));
      this.updateCanvas();
    }

    this.drawInterval = setInterval(this.handleDrawInterval.bind(this), 1000 / this.state.brush.speed);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleDrawInterval() {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.state.brush.tool === 'move') {
      const dx = x - this.state.mouse.prevX;
      const dy = y - this.state.mouse.prevY;
      this.performMove(dx, dy);
    } else if (this.state.brush.shape === 'segment' && this.state.brush.tool === 'continousBrush') {
      // Dessin continu avec le pinceau "segment"
      this.state.brush.startX = this.state.mouse.down.x;
      this.state.brush.startY = this.state.mouse.down.y;
      this.state.brush.endX = x;
      this.state.brush.endY = y;
      this.state.drawingLayers.forEach(layer => layer.paint(x, y, { ...this.state.brush }));
      this.state.mouse.down = { x, y };
    } else if (this.state.brush.tool === 'continousBrush') {
      // Dessin continu avec les autres pinceaux
      this.state.drawingLayers.forEach(layer => layer.paint(x, y, this.state.brush));
    }
    this.updateCanvas();
  }

  handleMouseUp = () => {
    this.state.mouse.down = null;
    clearInterval(this.drawInterval);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  paint(layer, x, y, brush) {
    layer.paint(x, y, brush);
  }

  copy(layerFrom, layerTo) {
    layerTo.copy(layerFrom);
    this.updateCanvas();
  }

  move(layer, x, y) {
    const dx = this.helper.wrapX(-x);
    const dy = this.helper.wrapY(-y);

    if (!dx && !dy) return;
    layer.move(dx, dy);
  }

  performMove(x, y) {
    const dx = this.helper.wrapX(-x);
    const dy = this.helper.wrapY(-y);

    if (!dx && !dy) return;
    this.state.drawingLayers.forEach(layer => layer.move(dx, dy));
  }

  clearAllLayers() {
    this.state.layers.forEach(matrix => matrix.clear());
    this.updateCanvas();
  }

  clear(layer) {
    layer.clear();
    this.updateCanvas();
  }

  clearCurrentLayer() {
    this.state.currentLayer.clear();
    this.updateCanvas();
  }

  updateCanvas() {
    this.canvasContext.clearRect(0, 0, this.state.width, this.state.height);
    this.state.layers.forEach((layer) => layer.drawImage(this.canvasContext));
  }

  resizeCanvas() {
    this.ui.canvas.width = this.state.width;
    this.ui.canvas.height = this.state.height;
    this.state.layers.forEach(layer => layer.resize(this.state.width, this.state.height));
    this.updateCanvas();
  }
}