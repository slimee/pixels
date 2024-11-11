export default class ControlPanel {
  constructor(state, ui, transformationManager, canvasManager) {
    this.state = state;
    this.ui = ui;
    this.transformationManager = transformationManager;
    this.canvasManager = canvasManager;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.frame = this.frame.bind(this);
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
    const matricesData = this.state.layers.map(layer => layer.imageData);

    this.state.playingLayers.forEach((visibleLayer, layerIndex) => {
      const transformationFunction = this.transformationManager.getTransformationFunction(layerIndex);
      const wrappedTransformationFunction = (x, y) => {
        try {
          return transformationFunction(x, y, visibleLayer.width, visibleLayer.height, matricesData);
        } catch (error) {
          this.ui.showError(layerIndex, `Erreur pendant l'exécution : ${error.message}`);
          console.error("Erreur pendant l'exécution : ", error);
          return { x, y };
        }
      };
      visibleLayer.transform(wrappedTransformationFunction);
    });

    this.canvasManager.updateCanvas();

    requestAnimationFrame(this.frame);
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