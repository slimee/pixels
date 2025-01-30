import State from "./components/state.js";

export default class DrawState extends State {
  constructor(transformations) {
    const reactive = {
      brush: {
        size: null,
        color: '#ff0000',
        shape: 'circle',
        repeat: null,
        tool: 'brush',
      },
      faders: [],
      currentLayerIndex: 0,
      codeButton: [],
    };
    const nonReactive = {
      isPlaying: false,
      transformations,
      variables: {},
      layers: [],
      mouse: { x: 0, y: 0, prevX: 0, prevY: 0 },
      moveLock: false,
      frameCode: '',
      pixelCode: '',
      frame: 0,
      frameTotal: 0,
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
}