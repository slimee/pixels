export default class Commands {
  constructor(state, ui, canvasManager) {
    this.state = state;
    this.canvasManager = canvasManager;
  }

  paint = (x, y) => {
    this.canvasManager.paint(x, y, this.state.brush);
  }

  strafe = (x, y) => {
    this.canvasManager.strafe(x, y);
  }

  clear = (layerName) => {
    this.canvasManager.clear(layerName);
  }

  copy = (layerFrom, layerTo) => {
    this.canvasManager.copy(layerFrom, layerTo);
  }

  save = () => {
    const data = {
      pixelCode: this.state.pixelCode,
      frameCode: this.state.frameCode,
      currentLayerIndex: this.state.currentLayerIndex,
      brush: this.state.brush,
      frame: this.state.frame,
    }
    localStorage.setItem('data', JSON.stringify(data));
  }
}