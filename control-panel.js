export default class ControlPanel {
  constructor(state, canvasManager, transformationManager, ui) {
    this.state = state;
    this.canvasManager = canvasManager;
    this.transformationManager = transformationManager;
    this.ui = ui;
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

    this.state.visibleLayers.forEach((visibleLayer, layerIndex) => {
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

    if (this.state.playingLayers.size > 0) {
      requestAnimationFrame(this.frame);
    } else {
      this.state.isPlaying = false;
    }
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