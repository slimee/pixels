export default class ControlPanel {
  constructor(canvasManager, transformationManager, ui) {
    this.canvasManager = canvasManager;
    this.transformationManager = transformationManager;
    this.ui = ui;
    this.isPlaying = false;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.playingLayers = new Set();
    this.frame = this.frame.bind(this);
    this.isAnimating = false;

    this.canvasManager = canvasManager;
    this.transformationManager = transformationManager;
    this.ui = ui;
  }

  togglePlayPauseForLayer(layerIndex) {
    if (this.playingLayers.has(layerIndex)) {
      this.playingLayers.delete(layerIndex);
      this.ui.layerPlayPauseButtons[layerIndex].textContent = 'Play';
    } else {
      this.playingLayers.add(layerIndex);
      this.ui.layerPlayPauseButtons[layerIndex].textContent = 'Pause';

      if (!this.isAnimating) {
        this.isAnimating = true;
        requestAnimationFrame(this.frame);
      }
    }
  }

  togglePlayPause() {
    this.isPlaying
      ? this.pause()
      : this.play();

    this.ui.playPauseButton.textContent = this.isPlaying ? 'Pause' : 'Play';
  }

  pause() {
    this.isPlaying = false;
  }

  play() {
    this.isPlaying = true;
    requestAnimationFrame(this.frame);
  }

  frame() {
    this.canvasManager.drawOnDragInterval();

    const matricesData = this.canvasManager.layers.map(layer => layer.imageData);

    this.playingLayers.forEach(layerIndex => {
      const layer = this.canvasManager.layers[layerIndex];
      const transformationFunction = this.transformationManager.getTransformationFunction(layerIndex);
      const width = layer.width;
      const height = layer.height;
      const wrappedTransformationFunction = (x, y) => {
        try {
          return transformationFunction(x, y, width, height, matricesData);
        } catch (error) {
          this.ui.showError(layerIndex, `Erreur pendant l'exécution : ${error.message}`);
          console.error("Erreur pendant l'exécution : ", error);
          return { x, y };
        }
      };
      layer.transform(wrappedTransformationFunction);
    });

    this.canvasManager.updateCanvas();

    if (this.playingLayers.size > 0) {
      requestAnimationFrame(this.frame);
    } else {
      this.isAnimating = false;
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
    //     this.transformationManager.transformationCodeChanged(this.canvasManager.currentLayerIndex);
    //   }
    // });
    //
    // this.ui.transformationSelector.dispatchEvent(new Event('change'));
  }
}