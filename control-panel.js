export default class ControlPanel {
  constructor(state, ui, canvasManager) {
    this.state = state;
    this.ui = ui;
    this.canvasManager = canvasManager;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.frame = this.frame.bind(this);
    this.bindAddDeleteLayerButtons();
    this.bindClearButtons();
    this.bindDrawOnDragCheckbox();
    this.bindBrush();
    this.bindEraserButton();
    this.bindResize();
  }

  bindAddDeleteLayerButtons() {
    this.ui.addLayerButton.addEventListener("click", () => this.canvasManager.addNewLayer());
    this.ui.deleteLayerButton.addEventListener("click", () => this.canvasManager.deleteCurrentLayer());
    this.ui.deleteAllLayersButton.addEventListener("click", () => this.canvasManager.deleteAllLayers());
  }

  bindClearButtons() {
    this.ui.clearButton.addEventListener('click', () => this.canvasManager.clearCurrentLayer());
    this.ui.clearAllButton.addEventListener('click', () => this.canvasManager.clearAllLayers());
  }

  bindDrawOnDragCheckbox() {
    this.updateDrawOnDragState();
    this.ui.drawOnDragCheckbox.addEventListener('change', () => {
      this.updateDrawOnDragState();
    });
  }

  updateDrawOnDragState() {
    this.state.brush.drawOnDrag = this.ui.drawOnDragCheckbox.checked;
  }

  bindBrush() {
    this.ui.brushSizeInput.addEventListener('input', () => {
      this.state.brush.size = parseInt(this.ui.brushSizeInput.value, 10);
    });

    this.ui.brushColorInput.addEventListener('input', () => {
      this.state.brush.color = this.ui.brushColorInput.value;
      this.state.brush.erase = false;
      if (this.state.brush.erase) {
        this.ui.eraserButton.classList.add("active");
      } else {
        this.ui.eraserButton.classList.remove("active");
      }
    });

    this.ui.brushShapeInput.addEventListener('change', () => {
      this.state.brush.shape = this.ui.brushShapeInput.value;
    });
  }

  bindEraserButton() {
    this.ui.eraserButton.addEventListener('click', () => {
      this.state.brush.erase = !this.state.brush.erase;
      if (this.state.brush.erase) {
        this.ui.eraserButton.classList.add("active");
      } else {
        this.ui.eraserButton.classList.remove("active");
      }
      this.ui.brushColorInput.classList.toggle("disabled", this.state.brush.erase);
    });
  }

  togglePlayPause() {
    this.state.isPlaying
      ? this.pause()
      : this.play();

    this.ui.playPauseButton.textContent = this.state.isPlaying ? '⏸' : '▷';
  }

  pause() {
    this.state.isPlaying = false;
  }

  play() {
    this.state.isPlaying = true;
    requestAnimationFrame(this.frame);
  }

  frame() {
    this.canvasManager.drawOnDragInterval();
    const layersImageData = this.state.layers.map(layer => layer.imageData);

    this.state.playingLayers.forEach(visibleLayer => visibleLayer.transform(layersImageData));

    this.canvasManager.updateCanvas();

    if (this.state.isPlaying) requestAnimationFrame(this.frame);
  }

  bindResize() {
    const resizeObserver = new ResizeObserver(() => {
      const newWidth = this.ui.canvasRedim.clientWidth;
      const newHeight = this.ui.canvasRedim.clientHeight;
      this.canvasManager.resizeCanvas(newWidth, newHeight);
    });

    resizeObserver.observe(this.ui.canvasRedim);
  }
}