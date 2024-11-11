export default class ControlPanel {
  constructor(state, ui, canvasManager, layerService) {
    this.state = state;
    this.ui = ui;
    this.canvasManager = canvasManager;
    this.layerService = layerService;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.frame = this.frame.bind(this);
    this.initLayerControls();
  }

  initLayerControls() {
    this.ui.addLayerButton.addEventListener("click", () => this.layerService.addNewLayer());
    this.ui.deleteLayerButton.addEventListener("click", () => this.layerService.deleteCurrentLayer());
  }

  togglePlayPause() {
    this.state.isPlaying
      ? this.pause()
      : this.play();

    this.ui.playPauseButton.textContent = this.state.isPlaying ? 'Pause' : 'Play';
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

  initializeTransformations(predefinedTransformations) {
    // predefinedTransformations.forEach((transformation, index) => {
    //   const option = document.createElement('option');
    //   option.value = index;
    //   option.textContent = transformation.name;
    //   option.selected = transformation.selected
    //   this.ui.transformationSelector.appendChild(option);
    // });
    //
    // this.ui.transformationSelector.addEventListener('change', (event) => {
    //   const selectedIndex = event.target.value;
    //   if (selectedIndex !== '') {
    //     const selectedTransformation = predefinedTransformations[selectedIndex];
    //     this.ui.transformationCodeInput.value = selectedTransformation.code;
    //     this.transformationManager.setTransformationCode(this.canvasManager.currentLayerIndex);
    //   }
    // });
    //
    // this.ui.transformationSelector.dispatchEvent(new Event('change'));
  }
}