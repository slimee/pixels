let i = 0;

export default class Layer extends EventTarget {
  constructor(state, name = `c${++i}`) {
    super();
    this.state = state;
    this.name = name;
    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d', { willReadFrequently: true });
    this.canvasContextImageData = null;
    this.visible = true;
    this.isDrawing = true;
    this.width = null;
    this.height = null;

    this.resize(this.state.width, this.state.height);
  }

  //TODO also resize offscreen canvas
  resize(width, height) {
    const newImageData = this.canvasContext.createImageData(width, height);
    if (this.canvasContextImageData) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const newIndex = (y * width + x) * 4;
          const oldX = x % this.width;
          const oldY = y % this.height;
          const oldIndex = (oldY * this.width + oldX) * 4;

          newImageData.data[newIndex] = this.canvasContextImageData.data[oldIndex];
          newImageData.data[newIndex + 1] = this.canvasContextImageData.data[oldIndex + 1];
          newImageData.data[newIndex + 2] = this.canvasContextImageData.data[oldIndex + 2];
          newImageData.data[newIndex + 3] = this.canvasContextImageData.data[oldIndex + 3];
        }
      }
    }
    this.width = width;
    this.height = height;
    this.canvasContextImageData = newImageData;
    this.canvas.width = width;
    this.canvas.height = height;
    this.makeOffscreenCanvas();
    this.putImageDataToCanvasContext();
  }

  makeOffscreenCanvas() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d');
  }

  drawImage(destinationContext) {
    if (this.visible) destinationContext.drawImage(this.canvas, 0, 0);
  }

  copy(layerFrom) {
    const fromData = layerFrom.offscreenCanvasContext.getImageData(0, 0, layerFrom.width, layerFrom.height);
    this.canvasContextImageData.data.set(fromData.data);
    this.putImageDataToCanvasContext();
  }

  getImageData() {
    return this.canvasContextImageData.data;
  }

  setImageData(data) {
    this.canvasContextImageData.data.set(data);
  }

  at = (x, y) => {
    const data = this.canvasContextImageData.data;
    const index = (y * this.width + x) * 4;
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    };
  }

  clear() {
    this.canvasContextImageData.data.fill(0);
    this.putImageDataToCanvasContext();
  }

  paint(x, y, brush = this.state.brush) {
    const color = brush.tool === 'eraser'
      ? { r: 0, g: 0, b: 0, a: 0 }  // Transparent color for eraser
      : brush.color;

    const halfSize = Math.floor(brush.size / 2);

    if (brush.shape === 'segment' && brush.endX !== undefined && brush.endY !== undefined) {
      this.paintSegment(brush.startX, brush.startY, brush.endX, brush.endY, color, brush.size);
    } else if (brush.shape === 'circle') {
      this.paintCircle(x, y, halfSize, color);
    } else if (brush.shape === 'square') {
      this.paintSquare(x, y, halfSize, color);
    } else if (brush.shape === 'triangle') {
      this.paintTriangle(x, y, halfSize, color);
    }

    this.putImageDataToCanvasContext();
  }

  putImageDataToCanvasContext() {
    this.canvasContext.putImageData(this.canvasContextImageData, 0, 0);
  }

  paintCircle(x, y, halfSize, color) {
    for (let offsetY = -halfSize; offsetY <= halfSize; offsetY++) {
      for (let offsetX = -halfSize; offsetX <= halfSize; offsetX++) {
        if (Math.sqrt(offsetX ** 2 + offsetY ** 2) <= halfSize) {
          this.setPixelColor(x + offsetX, y + offsetY, color);
        }
      }
    }
  }

  paintAll({ r, g, b, a }) {
    const rgbaValue = (a << 24) | (b << 16) | (g << 8) | r;
    const data32 = new Uint32Array(this.canvasContextImageData.data.buffer);
    data32.fill(rgbaValue);

    this.putImageDataToCanvasContext();
  }

  paintSquare(x, y, halfSize, color) {
    for (let offsetY = -halfSize; offsetY <= halfSize; offsetY++) {
      for (let offsetX = -halfSize; offsetX <= halfSize; offsetX++) {
        this.setPixelColor(x + offsetX, y + offsetY, color);
      }
    }
  }

  paintTriangle(x, y, halfSize, color) {
    for (let offsetY = 0; offsetY <= halfSize; offsetY++) {
      for (let offsetX = -offsetY; offsetX <= offsetY; offsetX++) {
        this.setPixelColor(x + offsetX, y - offsetY + halfSize, color);
      }
    }
  }

  paintSegment(x1, y1, x2, y2, color, brushSize) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    const halfSize = Math.floor(brushSize / 2);

    while (true) {
      for (let offsetY = -halfSize; offsetY <= halfSize; offsetY++) {
        for (let offsetX = -halfSize; offsetX <= halfSize; offsetX++) {
          this.setPixelColor(x1 + offsetX, y1 + offsetY, color);
        }
      }
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }
  }

  fillRegion(x, y, targetColor) {
    this.paintAll(targetColor);
  }

  magicFillRegion(x, y, targetColor) {
    const canvasData = this.canvasContextImageData.data;
    const width = this.width;
    const height = this.height;

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
    this.putImageDataToCanvasContext();
  }

  wrapCoordinate(value, max) {
    return ((value % max) + max) % max;
  }

  setPixelColor(rawX, rawY, color) {
    const x = this.wrapCoordinate(rawX, this.width);
    const y = this.wrapCoordinate(rawY, this.height);
    const index = (y * this.width + x) * 4;

    this.canvasContextImageData.data[index] = color.r;
    this.canvasContextImageData.data[index + 1] = color.g;
    this.canvasContextImageData.data[index + 2] = color.b;
    this.canvasContextImageData.data[index + 3] = color.a;
  }

  invert(other) {
    const canvas = this.canvas;
    const canvasContext = this.canvasContext;
    const canvasContextImageData = this.canvasContextImageData;
    this.canvas = other.canvas;
    this.canvasContext = other.canvasContext;
    this.canvasContextImageData = other.canvasContextImageData;
    other.canvas = canvas;
    other.canvasContext = canvasContext;
    other.offscreecanvasContextImageDatanImage = canvasContextImageData;
  }

  move(dx, dy) {
    const { width, height } = this;

    this.offscreenCanvasContext.clearRect(0, 0, width, height);
    this.offscreenCanvasContext.drawImage(this.canvas, 0, 0);
    this.canvasContext.clearRect(0, 0, width, height);
    this.canvasContext.drawImage(this.offscreenCanvas, -dx, -dy);

    if (dx !== 0) this.canvasContext.drawImage(this.offscreenCanvas, width - dx, -dy);
    if (dy !== 0) this.canvasContext.drawImage(this.offscreenCanvas, -dx, height - dy);
    if (dx !== 0 && dy !== 0) this.canvasContext.drawImage(this.offscreenCanvas, width - dx, height - dy);

    this.canvasContextImageData = this.canvasContext.getImageData(0, 0, width, height);
  }
}