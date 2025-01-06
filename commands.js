export default class Commands {
  constructor(state, ui, canvasManager) {
    this.state = state;
    this.canvasManager = canvasManager;
  }

  paint = (layer, x, y) => {
    this.canvasManager.paint(layer, x, y, this.state.brush);
  }

  move = (layer, x, y) => {
    this.canvasManager.move(layer, x, y);
  }

  clear = (layer) => {
    this.canvasManager.clear(layer);
  }

  copy = (layerFrom, layerTo) => {
    this.canvasManager.copy(layerFrom, layerTo);
  }

  invert = (c1, c2) => {
    c1.invert(c2);
  }
}