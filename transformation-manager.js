import preparePixelFunction from "./utils/prepare-pixel-function.js";

export default class TransformationManager {
  constructor(ui, state, commands, helper) {
    this.ui = ui;
    this.state = state;
    this.commands = commands;
    this.helper = helper;

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
    const helpers = Object.keys(this.helper);
    const layers = this.state.layers.map(({ name }) => name);
    const faders = Object.keys(this.state.faders);
    const args = [...commands, ...helpers, ...layers, ...faders, 'isFrame', 'frame', 'frameTotal', 'width', 'height', 'brush', 'mouse'];

    // console.log('- - - - frame code - - - - -')
    // console.log('args:', args);
    // console.log('code:', this.state.frameCode);

    this.frameFunction = new Function(...args, `${this.state.frameCode}`);
  }

  runFrameCodeFunction() {
    const commands = Object.values(this.commands);
    const helpers = Object.values(this.helper);
    const faders = Object.values(this.state.faders);
    const { isFrame, frame, frameTotal, width, height, mouse, brush } = this.state;
    this.frameFunction(...commands, ...helpers, ...this.state.layers, ...faders, isFrame, frame, frameTotal, width, height, brush, mouse);
  }


  preparePixelCodeFunction() {
    // console.log('');
    // console.log(' - - - - update pixel code function - - - - ')

    const layerNames = this.state.layers.map(layer => layer.name);
    const preparedPixelCode = preparePixelFunction(this.state.pixelCode, layerNames);

    // console.log('layer names:', layerNames);
    // console.log('layer code before:', this.state.pixelCode);
    // console.log('pixel code transformed:', preparedPixelCode);

    const coords = ['x', 'y'];
    const helpers = Object.keys(this.helper);
    const layers = this.state.layers.map(({ name }) => name);
    const faders = Object.keys(this.state.faders);
    const inputCN = layerNames.map(name => `input${name}`);
    const outputCN = layerNames.map(name => `output${name}`);
    const state = ['isFrame', 'frame', 'frameTotal', 'width', 'height', 'brush', 'mouse'];
    const argsNames = [...coords, ...helpers, ...layers, ...faders, ...inputCN, ...outputCN, ...state];

    // console.log('argsNames:', argsNames);

    this.pixelFunction = new Function(...argsNames, `${preparedPixelCode}`);
  }

  runPixelCodeFunction() {
    const { layers } = this.state;
    const helpers = Object.values(this.helper);
    const faders = Object.values(this.state.faders);
    const inputCN = layers.map(layer => layer.getImageData());
    const outputCN = layers.map(layer => new Uint8ClampedArray(layer.getImageData().length));
    const { isFrame, frame, frameTotal, width, height, brush, mouse } = this.state;
    const state = [isFrame, frame, frameTotal, width, height, brush, mouse];
    const args = [0, 0, ...helpers, ...this.state.layers, ...faders, ...inputCN, ...outputCN, ...state];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        args[0] = x;
        args[1] = y;
        this.pixelFunction(...args);
      }
    }

    layers.forEach((layer, i) => {
      const outData = outputCN[i];
      layer.setImageData(outData);
      layer.putImageDataToCanvasContext();
    });
  }
}