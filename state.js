export default class State {
  constructor(transformations) {
    this.layers = [];
    this.currentLayerIndex = 0;
    this.isPlaying = false;
    this.transformations = transformations;
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
    this.frameCode = '';
    this.pixelCode = '';
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