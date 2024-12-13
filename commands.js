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
}