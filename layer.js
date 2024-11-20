import prefixVariables from './components/prefix-variables.js';

let i = 0;
export default class Layer {
  constructor(width, height, state, name = `Calque ${++i}`) {
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
    this.transformationFunction = new Function('x', 'y', 'width', 'height', 'matrices', 'variables', `${codeWithVariables} return { x, y };`);
  }

  transform(layersImageData) {
    const newData = new Uint8ClampedArray(this.offscreenImage.data.length);
    const width = this.width;
    const height = this.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const {
          x: newX,
          y: newY
        } = this.transformationFunction(x, y, width, height, layersImageData, this.state.variables);
        const intNewX = Math.floor(newX);
        const intNewY = Math.floor(newY);
        const wrappedX = ((intNewX % width) + width) % width;
        const wrappedY = ((intNewY % height) + height) % height;
        const newIndex = (wrappedY * width + wrappedX) * 4;

        const index = (y * width + x) * 4;
        newData[newIndex] = this.offscreenImage.data[index];
        newData[newIndex + 1] = this.offscreenImage.data[index + 1];
        newData[newIndex + 2] = this.offscreenImage.data[index + 2];
        newData[newIndex + 3] = this.offscreenImage.data[index + 3];
      }
    }

    this.offscreenImage.data.set(newData);
    this.offscreenCanvasContext.putImageData(this.offscreenImage, 0, 0);
  }

  clear() {
    this.offscreenImage.data.fill(0);
    this.offscreenCanvasContext.putImageData(this.offscreenImage, 0, 0);
  }

  hexToRGBA(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
      a: 255 // Full opacity
    };
  }

  paint(x, y, brush) {
    const color = brush.erase
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
    this.offscreenCanvasContext.putImageData(this.offscreenImage, 0, 0);
  }
}