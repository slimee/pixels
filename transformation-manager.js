export default class TransformationManager {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;
    this.transformationFunctions = {};
    this.codes = {};
    this.ui.transformationCodeInput.addEventListener('blur', () => this.transformationCodeChanged(this.state.currentMatrixIndex));
  }

  transformationCodeChanged(matrixIndex, code = this.ui.transformationCodeInput.value) {
    this.codes[matrixIndex] = code;
    this.createTransformationFunction(matrixIndex, code);
  }

  getCode(matrixIndex) {
    return this.codes[matrixIndex] || 'x = x + 1;\ny = y + 1;';
  }

  createTransformationFunction(matrixIndex, code) {
    try {
      this.transformationFunctions[matrixIndex] = new Function('x', 'y', 'width', 'height', 'matrices', `${code} return { x, y };`);
      this.ui.errorDisplay.textContent = '';
    } catch (error) {
      this.ui.errorDisplay.textContent = `Erreur dans la fonction de transformation : ${error.message}`;
      console.error("Erreur dans la fonction de transformation : ", error);
      this.transformationFunctions[matrixIndex] = (x, y) => ({ x, y });
    }
  }

  getTransformationFunction(matrixIndex) {
    return this.transformationFunctions[matrixIndex] || ((x, y, _width, _height, _matrices) => ({
      x,
      y
    }));
  }
}