import prefixVariables from './utils/prefix-variables.js';

export default class State {
  constructor(transformations) {
    this.layers = [];
    this.currentLayerIndex = 0;
    this.isPlaying = false;
    this.transformations = transformations;
    this.activeTransformationLayerIndex = null;
    this.brush = {
      size: 15,
      color: '#ff0000',
      shape: 'circle',
      speed: 60,
      tool: 'brush',
    };
    this.lastPoint = null;
    this.variables = {};
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.strafeLock = false;
    this.variablesCode = '';
    this.variablesFunction = () => null;
  }

  set variableInputValue(value) {
    this.variablesCode = value;
    this.updateVariablesFunction();
  }

  updateVariablesFunction() {
    const variableNames = Object.keys(this.variables);
    const { codeWithVariables } = prefixVariables(this.variablesCode, variableNames);

    console.log('codeWithVariables', codeWithVariables);

    this.variablesFunction = new Function('variables', `${codeWithVariables}`);
  }

  runVariablesFunction() {
    this.variablesFunction(this.variables);
  }

  get playingLayers() {
    return this.layers.filter(({ isPlaying }) => isPlaying);
  }

  get drawingLayers() {
    return this.layers.filter(({ isDrawing }) => isDrawing);
  }

  get currentLayer() {
    return this.layers[this.currentLayerIndex];
  }

  setVariable({ oldName, name, value }) {
    delete this.variables[oldName];
    this.variables[name] = value;
    this.layers.forEach(layer => layer.updateTransformationFunction());
  }

  deleteVariable(name) {
    delete this.variables[name];
    this.layers.forEach(layer => layer.updateTransformationFunction());
  }

  isVariableUsed(name) {
    return this.layers.some(layer => layer.usedVariables && layer.usedVariables.includes(name));
  }

  getLayersUsingVariable(name) {
    return this.layers
      .map((layer, index) => ({ layer, index }))
      .filter(({ layer }) => layer.usedVariables && layer.usedVariables.includes(name))
      .map(({ index }) => index);
  }
}