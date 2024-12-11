import preparePixelFunction from "./utils/prepare-pixel-function.js";
import prepareFrameFunction from "./utils/prepare-frame-function.js";

export default class TransformationManager {
  constructor(ui, state) {
    this.ui = ui;
    this.state = state;

    this.bindFrameCodeInput();
    this.frameFunction = () => null;
    this.bindPixelCodeInput();
    this.pixelFunction = () => null;
  }

  bindFrameCodeInput() {
    this.ui.frameCodeInput.update = () => {
      this.state.frameCode = this.ui.frameCodeInput.value;
      this.updateFrameCodeFunction();
    }
    this.ui.frameCodeInput.addEventListener('blur', this.ui.frameCodeInput.update);
  }

  prepareFrameCode(code, variables) {
    const variableNames = Object.keys(variables);
    const {
      preparedFrameFunction,
      usedVariables,
      unprefixedVariables,
    } = prepareFrameFunction(code, variableNames);

    console.log('');
    console.log(' - - - - frame code - - - - ');
    console.log('variable names:', variableNames);
    console.log('code before:', code);
    console.log('usedVariables:', usedVariables);
    console.log('unprefixedVariables:', unprefixedVariables);
    console.log('variables:', variables);
    console.log('code transformed:', preparedFrameFunction);

    return preparedFrameFunction;
  }

  preparePixelCode(code) {
    console.log('');
    console.log(' - - - - update pixel code function - - - - ')
    const layerNames = this.state.layers.map(layer => layer.name);
    const preparedPixelCode = preparePixelFunction(code, layerNames);
    console.log('layer names:', layerNames);
    console.log('layer code before:', code);
    console.log('state.variables:', this.state.variables);
    console.log('pixel code transformed:', preparedPixelCode);

    const argsNames = ['width', 'height', 'x', 'y', 'wrapX', 'wrapY', 'variables'];
    this.state.layers.forEach((layer) => {
      argsNames.push(`input${layer.name}`, `output${layer.name}`);
    });
    return { preparedPixelCode, argsNames };
  }

  updateCodeFunctions() {
    this.updateFrameCodeFunction();
    this.updatePixelCodeFunction();
  }

  updateFrameCodeFunction() {
    const preparedFrameFunction = this.prepareFrameCode(this.state.frameCode, this.state.variables);
    this.frameFunction = new Function('variables', `${preparedFrameFunction}`);
  }

  runFrameCodeFunction() {
    this.frameFunction(this.state.variables);
  }

  bindPixelCodeInput() {
    this.ui.pixelCodeInput.update = () => {
      this.state.pixelCode = this.ui.pixelCodeInput.value;
      this.updatePixelCodeFunction();
    }
    this.ui.pixelCodeInput.addEventListener('blur', this.ui.pixelCodeInput.update);
  }

  updatePixelCodeFunction() {
    const preparedFrameCode = this.prepareFrameCode(this.state.pixelCode, this.state.variables);
    const { argsNames, preparedPixelCode } = this.preparePixelCode(preparedFrameCode);
    this.pixelFunction = new Function(...argsNames, `${preparedPixelCode}`);
  }

  runPixelCodeFunction() {
    const { width, height, layers } = this.state;
    const originalDataArrays = layers.map(layer => layer.offscreenImage.data);
    const outputDataArrays = layers.map(layer =>
      new Uint8ClampedArray(layer.offscreenImage.data.length)
    );

    const argsValues = [width, height, 0, 0, this.wrapX, this.wrapY, this.state.variables];
    layers.forEach((layer, i) => {
      argsValues.push(originalDataArrays[i], outputDataArrays[i]);
    });

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        argsValues[2] = px; // x
        argsValues[3] = py; // y
        this.pixelFunction(...argsValues);
      }
    }

    layers.forEach((layer, i) => {
      const outData = outputDataArrays[i];
      layer.offscreenImage.data.set(outData);
      layer.updateOffscreen();
    });
  }

  wrapX(x, width) {
    return ((x % width) + width) % width;
  }

  wrapY(y, height) {
    return ((y % height) + height) % height;
  }

  channelOffset(channel) {
    switch (channel) {
      case 'r':
        return 0;
      case 'g':
        return 1;
      case 'b':
        return 2;
      case 'a':
        return 3;
    }
    throw new Error('Invalid channel ' + channel);
  }

  getPixelChannel(layerData, width, height, x, y, channel) {
    const wx = this.wrapX(x, width);
    const wy = this.wrapY(y, height);
    const index = (wy * width + wx) * 4 + this.channelOffset(channel);
    return layerData[index];
  }

  setPixelChannel(layerData, width, height, x, y, channel, value) {
    const wx = this.wrapX(x, width);
    const wy = this.wrapY(y, height);
    const index = (wy * width + wx) * 4 + this.channelOffset(channel);
    layerData[index] = value;
  }
}