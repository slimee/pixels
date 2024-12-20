import State from "./components/state.js";

export default class DrawState extends State {
  constructor(transformations) {
    const reactive = {
      brush: {
        size: 15,
        color: '#ff0000',
        shape: 'circle',
        speed: 60,
        tool: 'brush',
      },
      faders: [],
    };
    const nonReactive = {
      currentLayerIndex: 0,
      isPlaying: false,
      transformations,
      variables: {},
      lastPoint: null,
      layers: [],
      mouse: { x: 0, y: 0, prevX: 0, prevY: 0 },
      strafeLock: false,
      frameCode: '',
      pixelCode: '',
      frame: 0,
    };
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

  get anyX() {
    return Math.round(Math.random() * this.width);
  }

  get anyY() {
    return Math.round(Math.random() * this.height);
  }
}