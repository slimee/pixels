export default class State {
  constructor(transformations) {
    this.layers = [];
    this.currentLayerIndex = 0;
    this.isPlaying = false;
    this.transformations = transformations;
    this.activeTransformationLayerIndex = null;
    this.brush = { size: 15, color: '#ff0000', shape: 'circle', erase: false, drawOnDrag: false };
    this.variables = {};
  }

  get playingLayers() {
    return this.layers.filter(({ isPlaying }) => isPlaying);
  }

  get currentLayer() {
    return this.layers[this.currentLayerIndex];
  }

  setVariable({ oldName, name, value }) {
    delete this.variables[oldName];
    this.variables[name] = value;
    this.layers.forEach(layer => layer.updateTransformationFunction());
  }
}