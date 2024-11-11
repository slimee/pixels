export default class State {
  constructor(transformations) {
    this.transformations = transformations;
    this.isPlaying = false;
    this.currentLayerIndex = 0;
    this.activeTransformationLayerIndex = null;
    this.layers = [];
  }

  get playingLayers() {
    return this.layers.filter(({ isPlaying }) => isPlaying);
  }
}