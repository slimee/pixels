import State from "./components/state.js";

export default class DrawState extends State {
  constructor(reactive, nonReactive) {
    super(reactive, nonReactive);
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