import Layer from './layer.js';

export default class CanvasManager {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;

    this.canvasContext = this.ui.canvas.getContext('2d');
    this.startPoint = null;

    this.initializeControls();
  }

  get brush() {
    return this.state.brush;
  }

  get layers() {
    return this.state.layers;
  }

  get currentLayer() {
    return this.state.currentLayer;
  }

  get currentLayerIndex() {
    return this.state.currentLayerIndex;
  }

  set currentLayerIndex(index) {
    this.state.currentLayerIndex = index;
  }

  addNewLayer() {
    const newLayer = new Layer(this.ui.canvas.width, this.ui.canvas.height);
    this.layers.push(newLayer);
    this.currentLayerIndex = this.layers.length - 1;
    this.updateLayersList();
  }

  initializeControls() {
    this.initCanvasMouseEvents();
    this.addNewLayer();
  }

  initCanvasMouseEvents() {
    this.ui.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
  }

  handleCanvasMouseDown(event) {
    const rect = this.ui.canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    this.lastMousePosition = { x, y };
    if (this.brush.shape === 'segment') {
      this.startPoint = { x, y };
    } else {
      this.drawAt(x, y, this.brush);
    }

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = (event) => {
    const rect = this.ui.canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    if (this.state.brush.drawOnDrag && this.brush.shape !== 'segment') {
      this.lastMousePosition = { x, y };
      this.drawAt(x, y, this.brush);
    } else {
      if (this.brush.shape === 'segment' && this.startPoint) {
        this.lastMousePosition = { x, y };
      }
    }
  }

  handleMouseUp = (event) => {
    const rect = this.ui.canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    if (this.brush.shape === 'segment' && this.startPoint) {
      this.brush.startX = this.startPoint.x;
      this.brush.startY = this.startPoint.y;
      this.brush.endX = x;
      this.brush.endY = y;
      this.drawAt(x, y, { ...this.brush });
      this.startPoint = null;
    }
    this.lastMousePosition = null;

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  updateLayersList() {
    this.ui.layersList.innerHTML = '';
    this.layers.forEach((layer, index) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';

// Crée le conteneur du label
      const eyeCheckboxContainer = document.createElement('label');
      eyeCheckboxContainer.className = 'eye-checkbox';
      eyeCheckboxContainer.htmlFor = `eyeCheckbox-${index}`;

      // Crée la case à cocher
      const eyeCheckbox = document.createElement('input');
      eyeCheckbox.type = 'checkbox';
      eyeCheckbox.id = `eyeCheckbox-${index}`;
      eyeCheckbox.checked = layer.visible;
      eyeCheckbox.addEventListener('change', () => {
        layer.visible = eyeCheckbox.checked;
        this.updateCanvas();
      });

      // Crée les icônes
      const eyeIconShow = document.createElement('i');
      eyeIconShow.className = 'bx bxs-show';

      const eyeIconHide = document.createElement('i');
      eyeIconHide.className = 'bx bxs-hide';

      // Ajoute les éléments au conteneur
      eyeCheckboxContainer.appendChild(eyeCheckbox);
      eyeCheckboxContainer.appendChild(eyeIconShow);
      eyeCheckboxContainer.appendChild(eyeIconHide);

      // Ajoute le conteneur à votre élément parent (par exemple, un div)


      // Nom du calque
      const layerName = document.createElement('span');
      layerName.textContent = `Calque ${index + 1}`;
      layerName.addEventListener('click', () => {
        this.currentLayerIndex = index;
        this.updateLayersList();
      });

      // Bouton de transformation
      const transformToggleButton = document.createElement('button');
      transformToggleButton.className = 'transform-toggle-button';
      transformToggleButton.textContent = this.state.activeTransformationLayerIndex === index ? '▼' : '◀';
      transformToggleButton.addEventListener('click', () => {
        if (this.state.activeTransformationLayerIndex === index) {
          this.state.activeTransformationLayerIndex = null;
        } else {
          this.state.activeTransformationLayerIndex = index;
        }
        this.updateLayersList();
      });

      // Ajouter les éléments au calque
      layerItem.appendChild(eyeCheckboxContainer);
      layerItem.appendChild(layerName);
      layerItem.appendChild(transformToggleButton);

      // Mettre en évidence le calque sélectionné
      if (index === this.currentLayerIndex) {
        layerItem.classList.add('selected');
      }

      this.ui.layersList.appendChild(layerItem);

      // Afficher la zone de transformation si nécessaire
      if (this.state.activeTransformationLayerIndex === index) {
        const transformationArea = this.createTransformationArea(layer, index);
        this.ui.layersList.appendChild(transformationArea);
      }
    });
  }

  createTransformationArea(layer, index) {
    const transformationArea = document.createElement('div');
    transformationArea.className = 'transformation-area';

    // Zone de code de transformation
    const transformationCodeInput = document.createElement('textarea');
    transformationCodeInput.className = 'transformation-code';
    transformationCodeInput.rows = 5;
    transformationCodeInput.value = layer.code;
    transformationCodeInput.update = () => layer.code = transformationCodeInput.value;
    transformationCodeInput.addEventListener('blur', transformationCodeInput.update);

    // Affichage des erreurs
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'error-display';
    // Mettre à jour errorDisplay selon les besoins

    // Liste déroulante de sélection de transformation
    const transformationSelector = document.createElement('select');
    transformationSelector.className = 'transformation-selector';
    this.state.transformations.forEach(({ name, code, selected }) => {
      transformationSelector.add(new Option(name, code, selected, selected));
    });
    // Ajouter les options nécessaires
    transformationSelector.addEventListener('change', (event) => {
      transformationCodeInput.value = event.target.value;
      transformationCodeInput.update();
    });

    // Bouton Play
    const playPauseButton = document.createElement('button');
    playPauseButton.update = () => {
      playPauseButton.textContent = layer.isPlaying ? '⏸' : '▷';
    };
    playPauseButton.id = `playPauseButton-${index}`;
    playPauseButton.update();
    playPauseButton.addEventListener('click', () => {
      layer.isPlaying = !layer.isPlaying;
      playPauseButton.update();
    });

    // Ajouter les éléments à la zone de transformation
    transformationArea.appendChild(transformationCodeInput);
    transformationArea.appendChild(errorDisplay);
    transformationArea.appendChild(transformationSelector);

    return transformationArea;
  }

  deleteCurrentLayer() {
    if (this.layers.length > 1) {
      this.layers.splice(this.currentLayerIndex, 1);
      if (this.currentLayerIndex >= this.layers.length) {
        this.currentLayerIndex = this.layers.length - 1;
      }
      this.updateLayersList();
      this.updateCanvas();
    }
  }

  deleteAllLayers() {
    while (this.layers.length > 1) {
      this.layers.splice(this.currentLayerIndex, 1);
      if (this.currentLayerIndex >= this.layers.length) {
        this.currentLayerIndex = this.layers.length - 1;
      }
    }
    this.updateLayersList();
    this.updateCanvas();
  }

  clearAllLayers() {
    this.layers.forEach(matrix => matrix.clear());
    this.updateCanvas();
  }

  clearCurrentLayer() {
    this.currentLayer.clear();
    this.updateCanvas();
  }

  drawAt(x, y, brush) {
    this.currentLayer.paint(x, y, brush);
    this.updateCanvas();
  }

  updateCanvas() {
    this.canvasContext.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
    this.layers.forEach((layer) => {
      if (layer.visible) layer.drawTo(this.canvasContext);
    });
  }

  resizeCanvas(newWidth, newHeight) {
    this.ui.canvas.width = newWidth;
    this.ui.canvas.height = newHeight;
    this.layers.forEach(matrix => matrix.resize(newWidth, newHeight));
    this.updateCanvas();
  }

  drawOnDragInterval() {
    if (this.state.brush.drawOnDrag && this.lastMousePosition) {
      const { x, y } = this.lastMousePosition;
      this.currentLayer.paint(x, y, this.brush);
    }
  }
}