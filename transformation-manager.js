import preparePixelFunction from "./utils/prepare-pixel-function.js";
import prepareFrameFunction from "./utils/prepare-frame-function.js";
import TransformationHelper from "./transformation-helper.js";

export default class TransformationManager {
  constructor(ui, state, commands) {
    this.ui = ui;
    this.state = state;
    this.commands = commands;
    this.helper = new TransformationHelper();

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

  bindPixelCodeInput() {
    this.ui.pixelCodeInput.update = () => {
      this.state.pixelCode = this.ui.pixelCodeInput.value;
      this.updatePixelCodeFunction();
    }
    this.ui.pixelCodeInput.addEventListener('blur', this.ui.pixelCodeInput.update);
  }

  updateCodeFunctions() {
    this.updateFrameCodeFunction();
    this.updatePixelCodeFunction();
  }

  prepareFrameCode(code, variables) {
    // if(isFrame(301)) clear(c1);
    // else if(isFrame(100)) brush.size = 30;
    // else brush.size = 10;
    //
    // const x = Math.round(width * Math.random());
    // const y = Math.round(height * Math.random());
    //
    // paint(x,y);
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

  updateFrameCodeFunction() {
    const preparedFrameFunction = this.prepareFrameCode(this.state.frameCode, this.state.variables);
    this.frameFunction = new Function('clear', 'isFrame', 'frame', 'width', 'height', 'brush', 'mouse', 'paint', 'strafe', `${preparedFrameFunction}`);
  }

  runFrameCodeFunction() {
    const { isFrame, frame, width, height, mouse, brush } = this.state;
    this.frameFunction(this.commands.clear, isFrame, frame, width, height, brush, mouse, this.commands.paint, this.commands.strafe);
  }


  updatePixelCodeFunction() {
    console.log('');
    console.log(' - - - - update pixel code function - - - - ')

    const layerNames = this.state.layers.map(layer => layer.name);
    const preparedPixelCode = preparePixelFunction(this.state.pixelCode, layerNames);

    console.log('layer names:', layerNames);
    console.log('layer code before:', this.state.pixelCode);
    console.log('pixel code transformed:', preparedPixelCode);

    const coords = ['x', 'y', 'width', 'height'];
    const helpers = ['getPixelChannel', 'setPixelChannel', 'wrapX', 'wrapY'];
    const inputCN = layerNames.map(name => `input${name}`);
    const outputCN = layerNames.map(name => `output${name}`);
    const argsNames = [...coords, ...helpers, ...inputCN, ...outputCN];

    console.log('argsNames:', argsNames);
    this.pixelFunction = new Function(...argsNames, `${preparedPixelCode}`);
  }

  runPixelCodeFunction() {
    const { width, height, layers } = this.state;
    const { getPixelChannel, setPixelChannel, wrapX, wrapY } = this.helper;
    const coords = [width, height];
    const helpers = [getPixelChannel, setPixelChannel, wrapX, wrapY]
    const inputCN = layers.map(layer => layer.offscreenImage.data);
    const outputCN = layers.map(layer => new Uint8ClampedArray(layer.offscreenImage.data.length));
    const argsValues = [...coords, ...helpers, ...inputCN, ...outputCN];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.pixelFunction(x, y, ...argsValues);
      }
    }

    layers.forEach((layer, i) => {
      const outData = outputCN[i];
      layer.offscreenImage.data.set(outData);
      layer.updateOffscreen();
    });
  }
}