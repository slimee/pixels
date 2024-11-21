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
    this.ui.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
  }

  handleCanvasMouseDown() {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;
    this.state.lastPoint = { x, y };

    if (this.brush.shape === 'strafe') {
      // Enregistrer le point de départ pour le strafe
      this.strafeStartPoint = { x, y };
      // Créer une copie du canvas du calque courant
      this.strafeCanvas = document.createElement('canvas');
      this.strafeCanvas.width = this.currentLayer.width;
      this.strafeCanvas.height = this.currentLayer.height;
      const strafeCtx = this.strafeCanvas.getContext('2d');
      strafeCtx.drawImage(this.currentLayer.offscreenCanvas, 0, 0);
    } else if (this.brush.shape === 'segment') {
      this.startPoint = { x, y };
    } else {
      // Pour les autres pinceaux, on dessine immédiatement au mousedown
      this.drawAt(x, y, this.brush);
    }

    this.mouseMoveInterval = setInterval(this.handleMouseMove, 1000 / this.brush.speed);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = () => {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.brush.shape === 'strafe') {
      // Calculer le delta
      const dx = x - this.strafeStartPoint.x;
      const dy = y - this.strafeStartPoint.y;

      const width = this.currentLayer.width;
      const height = this.currentLayer.height;

      // Ajuster dx et dy pour qu'ils soient dans [0, width) et [0, height)
      const shiftX = ((-dx % width) + width) % width;
      const shiftY = ((-dy % height) + height) % height;

      this.performStrafe(shiftX, shiftY);
    } else if (this.brush.shape === 'segment' && this.brush.drawOnDrag) {
      // Dessin continu avec le pinceau "segment"
      if (this.state.lastPoint) {
        this.brush.startX = this.state.lastPoint.x;
        this.brush.startY = this.state.lastPoint.y;
        this.brush.endX = x;
        this.brush.endY = y;
        this.drawAt(x, y, { ...this.brush });
        this.state.lastPoint = { x, y };
      }
    } else if (this.state.brush.drawOnDrag) {
      // Dessin continu avec les autres pinceaux
      this.drawAt(x, y, this.brush);
    } else if (this.brush.shape === 'segment') {
      // En mode non continu avec le pinceau "segment", on peut implémenter un aperçu si souhaité
    }
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
      if (this.brush.drawOnDrag) {
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
    const width = this.currentLayer.width;
    const height = this.currentLayer.height;

    // Effacer le calque courant
    this.currentLayer.offscreenCanvasContext.clearRect(0, 0, width, height);

    // Dessiner l'image décalée
    this.currentLayer.offscreenCanvasContext.drawImage(
      this.strafeCanvas,
      -shiftX,
      -shiftY
    );

    // Dessiner les parties bouclées
    if (shiftX !== 0) {
      // Côté droit
      this.currentLayer.offscreenCanvasContext.drawImage(
        this.strafeCanvas,
        width - shiftX,
        -shiftY
      );
    }

    if (shiftY !== 0) {
      // Côté inférieur
      this.currentLayer.offscreenCanvasContext.drawImage(
        this.strafeCanvas,
        -shiftX,
        height - shiftY
      );
    }

    if (shiftX !== 0 && shiftY !== 0) {
      // Coin inférieur droit
      this.currentLayer.offscreenCanvasContext.drawImage(
        this.strafeCanvas,
        width - shiftX,
        height - shiftY
      );
    }

    this.updateCanvas();
  }

  clearAllLayers() {
    this.layers.forEach(matrix => matrix.clear());
    this.updateCanvas();
  }

  clearCurrentLayer() {
    this.currentLayer.clear();
    this.updateCanvas();
  }

  drawAt(x, y, brush) {
    this.currentLayer.paint(x, y, brush);
    this.updateCanvas();
  }

  updateCanvas() {
    this.canvasContext.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
    this.layers.forEach((layer) => {
      if (layer.visible) this.canvasContext.drawImage(layer.offscreenCanvas, 0, 0)
    });
  }

  resizeCanvas(newWidth, newHeight) {
    this.ui.canvas.width = newWidth;
    this.ui.canvas.height = newHeight;
    this.layers.forEach(matrix => matrix.resize(newWidth, newHeight));
    this.updateCanvas();
  }
}