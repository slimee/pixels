import preparePixelFunction from "./utils/prepare-pixel-function.js";
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
      this.prepareFrameCodeFunction();
    }
    this.ui.frameCodeInput.addEventListener('blur', this.ui.frameCodeInput.update);
  }

  bindPixelCodeInput() {
    this.ui.pixelCodeInput.update = () => {
      this.state.pixelCode = this.ui.pixelCodeInput.value;
      this.preparePixelCodeFunction();
    }
    this.ui.pixelCodeInput.addEventListener('blur', this.ui.pixelCodeInput.update);
  }

  updateCodeFunctions() {
    this.prepareFrameCodeFunction();
    this.preparePixelCodeFunction();
  }

  prepareFrameCodeFunction() {
    // if(isFrame(301)) clear(c1);
    // else if(isFrame(100)) brush.size = 30;
    // else brush.size = 10;
    //
    // const x = Math.round(width * Math.random());
    // const y = Math.round(height * Math.random());
    //
    // paint(x,y);
    const commands = Object.keys(this.commands);
    const layers = this.state.layers.map(({ name }) => name);
    const faders = Object.keys(this.state.faders);
    const args = [...commands, ...layers, ...faders, 'anyX', 'anyY', 'isFrame', 'frame', 'width', 'height', 'mouse', 'brush'];

    console.log('- - - - frame code - - - - -')
    console.log('args:', args);
    console.log('code:', this.state.frameCode);

    this.frameFunction = new Function(...args, `${this.state.frameCode}`);
  }

  runFrameCodeFunction() {
    const commands = Object.values(this.commands);
    const faders = Object.values(this.state.faders);
    const { isFrame, frame, width, height, mouse, brush } = this.state;
    this.frameFunction(...commands, ...this.state.layers, ...faders, this.state.anyX, this.state.anyY, isFrame, frame, width, height, brush, mouse);
  }


  preparePixelCodeFunction() {
    console.log('');
    console.log(' - - - - update pixel code function - - - - ')

    const layerNames = this.state.layers.map(layer => layer.name);
    const preparedPixelCode = preparePixelFunction(this.state.pixelCode, layerNames);

    console.log('layer names:', layerNames);
    console.log('layer code before:', this.state.pixelCode);
    console.log('pixel code transformed:', preparedPixelCode);

    const coords = ['x', 'y', 'width', 'height'];
    const helpers = Object.keys(this.helper);
    const layers = this.state.layers.map(({ name }) => name);
    const faders = Object.keys(this.state.faders);
    const inputCN = layerNames.map(name => `input${name}`);
    const outputCN = layerNames.map(name => `output${name}`);
    const argsNames = [...coords, ...helpers, ...layers, ...faders, ...inputCN, ...outputCN];

    console.log('argsNames:', argsNames);

    this.pixelFunction = new Function(...argsNames, `${preparedPixelCode}`);
  }

  runPixelCodeFunction() {
    const { width, height, layers } = this.state;
    const helpers = Object.values(this.helper);
    const faders = Object.values(this.state.faders);
    const inputCN = layers.map(layer => layer.offscreenImage.data);
    const outputCN = layers.map(layer => new Uint8ClampedArray(layer.offscreenImage.data.length));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.pixelFunction(x, y, width, height, ...helpers, ...this.state.layers, ...faders, ...inputCN, ...outputCN);
      }
    }

    layers.forEach((layer, i) => {
      const outData = outputCN[i];
      layer.offscreenImage.data.set(outData);
      layer.updateOffscreen();
    });
  }
}