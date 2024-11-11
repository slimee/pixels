export default class State {
  constructor() {
    this.isPlaying = false;
    this.currentLayerIndex = 0;
    this.activeTransformationLayerIndex = null;
    this.layers = [];
  }

  get playingLayers() {
    return this.layers.filter(({ isPlaying }) => isPlaying);
  }
}