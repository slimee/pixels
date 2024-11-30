import prefixVariables from './components/prefix-variables.js';

let i = 0;

export default class Layer extends EventTarget {
  constructor(width, height, state, name = `c${++i}`) {
    super();
    this.width = width;
    this.height = height;
    this.state = state;
    this.name = name;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d');
    this.offscreenImage = this.offscreenCanvasContext.createImageData(this.width, this.height);
    this.visible = true;
    this.isPlaying = true;
    this.transformationFunction = null;
    this.code = 'x += 1;\ny += 1;';
    this.usedVariables = [];
  }

  get code() {
    return this._code;
  }

  set code(newCode) {
    this._code = newCode;
    this.updateTransformationFunction();
  }

  updateTransformationFunction() {
    const variableNames = Object.keys(this.state.variables);
    const { codeWithVariables, usedVariables } = prefixVariables(this.code, variableNames);
    this.usedVariables = usedVariables;
    this.transformationFunction = new Function('x', 'y', 'r', 'g', 'b', 'a', 'width', 'height', 'max', 'min', 'anyX', 'anyY', 'at', 'variables', `${codeWithVariables} return { x, y, r, g, b, a };`);
  }

  transform(layers) {
    const newData = new Uint8ClampedArray(this.offscreenImage.data.length);
    const width = this.width;
    const height = this.height;
    const numLayers = layers.length;
    const anyX = () => Math.floor(Math.random() * width);
    const anyY = () => Math.floor(Math.random() * height);

    for (let i = 0; i < numLayers; i++) {
      const layer = layers[i];
      const data = layer.offscreenImage.data;
      const name = layer.name;
      this.state.variables[name].at = (x, y) => {
        const index = (y * width + x) * 4;
        return {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
          a: data[index + 3],
        };
      }
    }
    const at = this.state.variables[this.name].at;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4; // Index du pixel actuel dans l'image source
        const r = this.offscreenImage.data[index];
        const g = this.offscreenImage.data[index + 1];
        const b = this.offscreenImage.data[index + 2];
        const a = this.offscreenImage.data[index + 3];

        for (let i = 0; i < numLayers; i++) {
          const layer = layers[i];
          const data = layer.offscreenImage.data;
          const name = layer.name;
          const layerVariable = this.state.variables[name];
          layerVariable.r = data[index];
          layerVariable.g = data[index + 1];
          layerVariable.b = data[index + 2];
          layerVariable.a = data[index + 3];
        }

        // Appel de la fonction de transformation
        const {
          x: newX,
          y: newY,
          r: newR,
          g: newG,
          b: newB,
          a: newA,
        } = this.transformationFunction(x, y, r, g, b, a, width, height, 255, 0, anyX, anyY, at, this.state.variables);

        // Calcul des coordonnées "wrap-around"
        const intNewX = Math.floor(newX);
        const intNewY = Math.floor(newY);
        const wrappedX = ((intNewX % width) + width) % width;
        const wrappedY = ((intNewY % height) + height) % height;
        const newIndex = (wrappedY * width + wrappedX) * 4; // Index du pixel transformé

        // Écriture des nouvelles valeurs RGBA dans le tableau de données
        newData[newIndex] = newR ?? r; // Garde r si newR est undefined
        newData[newIndex + 1] = newG ?? g;
        newData[newIndex + 2] = newB ?? b;
        newData[newIndex + 3] = newA ?? a; // Transparence inchangée par défaut
      }
    }

    this.offscreenImage.data.set(newData);
    this.updateOffscreen();
  }

  clear() {
    this.offscreenImage.data.fill(0);
    this.updateOffscreen();
  }

  hexToRGBA(hex) {
    let c = hex.slice(1);
    if (c.length === 6) c += 'FF';
    const num = parseInt(c, 16);
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: num & 255
    };
  }

  paint(x, y, brush) {
    const color = brush.tool === 'eraser'
      ? { r: 0, g: 0, b: 0, a: 0 }  // Transparent color for eraser
      : this.hexToRGBA(brush.color);

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

    this.updateOffscreen();
  }

  updateOffscreen() {
    this.offscreenCanvasContext.putImageData(this.offscreenImage, 0, 0);
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

  paintAll(hexColor) {
    const { r, g, b, a } = this.hexToRGBA(hexColor);
    const rgbaValue = (a << 24) | (b << 16) | (g << 8) | r;
    const data32 = new Uint32Array(this.offscreenImage.data.buffer);
    data32.fill(rgbaValue);

    this.updateOffscreen();
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

  wrapCoordinate(value, max) {
    return ((value % max) + max) % max;
  }

  setPixelColor(rawX, rawY, color) {
    const x = this.wrapCoordinate(rawX, this.width);
    const y = this.wrapCoordinate(rawY, this.height);
    const index = (y * this.width + x) * 4;

    this.offscreenImage.data[index] = color.r;
    this.offscreenImage.data[index + 1] = color.g;
    this.offscreenImage.data[index + 2] = color.b;
    this.offscreenImage.data[index + 3] = color.a;
  }

  resize(width, height) {
    const newImageData = this.offscreenCanvasContext.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const newIndex = (y * width + x) * 4;
        const oldX = x % this.width;
        const oldY = y % this.height;
        const oldIndex = (oldY * this.width + oldX) * 4;

        newImageData.data[newIndex] = this.offscreenImage.data[oldIndex];
        newImageData.data[newIndex + 1] = this.offscreenImage.data[oldIndex + 1];
        newImageData.data[newIndex + 2] = this.offscreenImage.data[oldIndex + 2];
        newImageData.data[newIndex + 3] = this.offscreenImage.data[oldIndex + 3];
      }
    }
    this.width = width;
    this.height = height;
    this.offscreenImage = newImageData;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.updateOffscreen();
  }
}