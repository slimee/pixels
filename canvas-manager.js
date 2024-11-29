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
      this.magicFillRegion(x, y, this.brush.color);
      return;
    } else if (this.brush.tool === 'fill') {
      this.fillRegion(x, y, this.brush.color);
      return;
    } else if (this.brush.tool === 'strafe') {
      // Enregistrer le point de départ pour le strafe
      this.strafeStartPoint = { x, y };
      // Créer une copie des calques
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
      this.drawAt(x, y, this.brush);
    }

    this.mouseMoveInterval = setInterval(this.handleMouseMove, 1000 / this.brush.speed);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  fillRegion(x, y, targetColor) {
    this.currentLayer.paintAll(targetColor);
    this.updateCanvas();
  }

  magicFillRegion(x, y, hexTargetColor) {
    const targetColor = this.currentLayer.hexToRGBA(hexTargetColor);
    const canvasData = this.currentLayer.offscreenImage.data;
    const width = this.currentLayer.width;
    const height = this.currentLayer.height;

    // Couleur de départ
    const startIndex = (y * width + x) * 4;
    const startColor = {
      r: canvasData[startIndex],
      g: canvasData[startIndex + 1],
      b: canvasData[startIndex + 2],
      a: canvasData[startIndex + 3],
    };

    // Si la couleur cible est identique à la couleur de départ, rien à faire
    if (
      startColor.r === targetColor.r &&
      startColor.g === targetColor.g &&
      startColor.b === targetColor.b &&
      startColor.a === targetColor.a
    ) return;

    // Tampon pour suivre les pixels visités
    const visited = new Uint8Array(width * height);
    const stack = [{ x, y }];

    // Fonction utilitaire pour obtenir l'index
    const getPixelIndex = (x, y) => (y * width + x) * 4;

    // Fonction pour vérifier si une couleur correspond
    const isSameColor = (index) =>
      canvasData[index] === startColor.r &&
      canvasData[index + 1] === startColor.g &&
      canvasData[index + 2] === startColor.b &&
      canvasData[index + 3] === startColor.a;

    // Parcours en profondeur
    while (stack.length > 0) {
      const { x, y } = stack.pop();
      const index = getPixelIndex(x, y);

      // Si déjà visité ou non identique à la couleur de départ, ignorer
      if (visited[y * width + x] || !isSameColor(index)) continue;

      // Marquer comme visité
      visited[y * width + x] = 1;

      // Appliquer la nouvelle couleur
      canvasData[index] = targetColor.r;
      canvasData[index + 1] = targetColor.g;
      canvasData[index + 2] = targetColor.b;
      canvasData[index + 3] = targetColor.a;

      // Ajouter les voisins à la pile
      if (x > 0) stack.push({ x: x - 1, y });
      if (x < width - 1) stack.push({ x: x + 1, y });
      if (y > 0) stack.push({ x, y: y - 1 });
      if (y < height - 1) stack.push({ x, y: y + 1 });
    }

    // Mettre à jour le canvas
    this.currentLayer.updateOffscreen();
    this.updateCanvas();
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
        this.drawAt(x, y, { ...this.brush });
        this.state.lastPoint = { x, y };
      }
    } else if (this.state.brush.tool === 'continousBrush') {
      // Dessin continu avec les autres pinceaux
      this.drawAt(x, y, this.brush);
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