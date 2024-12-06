import prefixVariables from "./utils/prefix-variables.js";

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

  updateFrameCodeFunction() {
    // const variableNames = Object.keys(this.state.variables);
    // const {
    //   codeWithVariables,
    //   usedVariables,
    //   unprefixedVariables,
    // } = prefixVariables(this.state.frameCode, variableNames);
    //
    // console.log('');
    // console.log(' - - - - frame code - - - - ');
    // console.log('variable names:', variableNames);
    // console.log('code before:', this.state.frameCode);
    // console.log('usedVariables:', usedVariables);
    // console.log('unprefixedVariables:', unprefixedVariables);
    // console.log('state.variables:', this.state.variables);
    // console.log('code transformed:', codeWithVariables);
    //
    // this.frameFunction = new Function('variables', `${codeWithVariables}`);
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
    console.log('');
    console.log(' - - - - update pixel code function - - - - ')
    const layerNames = this.state.layers.map(layer => layer.name);
    const variableNames = [...Object.keys(this.state.variables), ...layerNames];

    const codeWithVariables = prefixVariables(this.state.pixelCode, variableNames);
    console.log('variable names:', variableNames);
    console.log('layer code before:', this.state.pixelCode);
    console.log('state.variables:', this.state.variables);
    console.log('code transformed:', codeWithVariables);

    const argsNames = ['width', 'height', 'x', 'y', 'wrapX', 'wrapY'];
    this.state.layers.forEach((layer) => {
      argsNames.push(`input${layer.name}`, `output${layer.name}`);
    });

    this.pixelFunction = new Function(...argsNames, `${codeWithVariables}`);
  }

  runPixelCodeFunction() {
    const { width, height, layers } = this.state;
    const originalDataArrays = layers.map(layer => layer.offscreenImage.data);
    const outputDataArrays = layers.map(layer =>
      new Uint8ClampedArray(layer.offscreenImage.data.length)
    );

    const argsValues = [width, height, 0, 0, this.wrapX, this.wrapY];
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