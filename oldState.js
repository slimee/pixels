export default class OldState {
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
    this.frame = 0;
  }

  isFrame = (modulo) => {
    return this.frame % modulo === 0;
  }

  get drawingLayers() {
    return this.layers.filter(({ isDrawing }) => isDrawing);
  }

  get currentLayer() {
    return this.layers[this.currentLayerIndex];
  }

  setVariable({ oldName, name, value }) {
    this.deleteVariable(oldName);
    this.variables[name] = value;
  }

  deleteVariable(name) {
    delete this.variables[name];
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