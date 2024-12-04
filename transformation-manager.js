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
    const variableNames = Object.keys(this.state.variables);


    const {
      codeWithVariables,
      usedVariables,
      unprefixedVariables,
    } = prefixVariables(this.state.frameCode, variableNames);

    console.log('')
    console.log(' - - - - frame code - - - - ');
    console.log('variable names:', variableNames);
    console.log('code before:', this.state.frameCode);
    console.log('usedVariables:', usedVariables);
    console.log('unprefixedVariables:', unprefixedVariables);
    console.log('state.variables:', this.state.variables);
    console.log('code transformed:', codeWithVariables);

    this.frameFunction = new Function('variables', `${codeWithVariables}`);
  }

  runFrameCodeFunction() {
    this.frameFunction(this.state.variables);
  }

  bindPixelCodeInput() {
    this.ui.pixelCodeInput.update = () => {
      this.state.pixelCode = this.ui.pixelCodeInput.value;
      this.updatePixelCodeFunction();
    }
    this.ui.frameCodeInput.addEventListener('blur', this.ui.frameCodeInput.update);
  }

  updatePixelCodeFunction() {
    const variableNames = Object.keys(this.state.variables);

    const {
      codeWithVariables,
      usedVariables,
      unprefixedVariables
    } = prefixVariables(this.pixelCode, variableNames);
    console.log('');
    console.log(' - - - - layer code - - - - ')
    console.log('variable names:', variableNames);
    console.log('layer code before:', this.state.pixelCode);
    console.log('usedVariables:', usedVariables);
    console.log('unprefixedVariables:', unprefixedVariables);
    console.log('state.variables:', this.state.variables);
    console.log('code transformed:', codeWithVariables);


    this.usedVariables = usedVariables;
    this.pixelFunction = new Function('x', 'y', 'r', 'g', 'b', 'a', 'width', 'height', 'max', 'min', 'anyX', 'anyY', 'at', 'variables', `${codeWithVariables} return { x, y, r, g, b, a };`);
  }

  runPixelCodeFunction() {
    this.pixelFunction(this.state.variables);
  }
}