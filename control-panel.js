export default class ControlPanel {
  constructor(canvasManager, transformationManager, ui) {
    this.canvasManager = canvasManager;
    this.transformationManager = transformationManager;
    this.ui = ui;
    this.isPlaying = false;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.frame = this.frame.bind(this);
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

    const matricesData = this.canvasManager.layers.map(matrix => matrix.imageData);

    this.canvasManager.layers.forEach((matrix, index) => {
      const transformationFunction = this.transformationManager.getTransformationFunction(index);
      const width = matrix.width;
      const height = matrix.height;
      const wrappedTransformationFunction = (x, y) => {
        try {
          return transformationFunction(x, y, width, height, matricesData);
        } catch (error) {
          this.ui.errorDisplay.textContent = `Erreur pendant l'exécution : ${error.message}`;
          console.error("Erreur pendant l'exécution : ", error);
          return { x, y };
        }
      };
      matrix.transform(wrappedTransformationFunction);
    });

    this.canvasManager.updateCanvas();

    if (this.isPlaying) {
      requestAnimationFrame(this.frame);
    }
  }

  initializeTransformations(predefinedTransformations) {
    predefinedTransformations.forEach((transformation, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = transformation.name;
      option.selected = transformation.selected
      this.ui.transformationSelector.appendChild(option);
    });

    this.ui.transformationSelector.addEventListener('change', (event) => {
      const selectedIndex = event.target.value;
      if (selectedIndex !== '') {
        const selectedTransformation = predefinedTransformations[selectedIndex];
        this.ui.transformationCodeInput.value = selectedTransformation.code;
        this.transformationManager.transformationCodeChanged(this.canvasManager.currentLayerIndex);
      }
    });

    this.ui.transformationSelector.dispatchEvent(new Event('change'));
  }
}