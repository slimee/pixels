export default class TransformationManager {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;
    this.transformationFunctions = {};
    this.codes = {};
  }

  setTransformationCode(layerIndex, code) {
    this.codes[layerIndex] = code;
    this.createTransformationFunction(layerIndex, code);
  }

  getTransformationCode(layerIndex) {
    return this.codes[layerIndex] || '';
  }

  createTransformationFunction(layerIndex, code) {
    try {
      this.transformationFunctions[layerIndex] = new Function('x', 'y', 'width', 'height', 'matrices', `${code} return { x, y };`);
      this.ui.clearErrorDisplay(layerIndex);
    } catch (error) {
      this.ui.showError(layerIndex, `Erreur dans la fonction de transformation : ${error.message}`);
      console.error("Erreur dans la fonction de transformation : ", error);
      this.transformationFunctions[layerIndex] = (x, y) => ({ x, y });
    }
  }

  getTransformationFunction(layerIndex) {
    return this.transformationFunctions[layerIndex] || ((x, y, _width, _height, _matrices) => ({
      x,
      y
    }));
  }
}
