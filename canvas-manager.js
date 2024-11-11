import Layer from './layer.js';

export default class CanvasManager {
  constructor(state, ui, transformationManager) {
    this.state = state;
    this.ui = ui;
    this.transformationManager = transformationManager;

    this.canvasContext = this.ui.canvas.getContext('2d');
    this.brush = { size: 15, color: '#ff0000', shape: 'circle' };
    this.startPoint = null;

    this.initializeControls();

    this.drawOnDrag = this.ui.drawOnDragCheckbox.checked;
  }

  get layers() {
    return this.state.layers;
  }

  get currentLayer() {
    return this.layers[this.currentLayerIndex];
  }

  get currentLayerIndex() {
    return this.state.currentLayerIndex;
  }

  set currentLayerIndex(index) {
    this.state.currentLayerIndex = index;
  }

  addNewLayer() {
    const newLayer = new Layer(this.ui.canvas.width, this.ui.canvas.height, this.state.isPlaying);
    this.layers.push(newLayer);
    this.updateLayersList();
  }

  initializeControls() {
    this.initBrushSettings();
    this.initEraserButton();
    this.initDrawOnDragCheckbox();
    this.initCanvasMouseEvents();
    this.initResize();
    this.initLayerControls();
    this.initTransformationControls();
    this.addNewLayer();
  }

  initBrushSettings() {
    this.ui.pointSizeInput.addEventListener('input', () => {
      this.brush.size = parseInt(this.ui.pointSizeInput.value, 10);
    });

    this.ui.pointColorInput.addEventListener('input', () => {
      this.brush.color = this.ui.pointColorInput.value;
    });

    this.ui.pointShapeInput.addEventListener('change', () => {
      this.brush.shape = this.ui.pointShapeInput.value;
    });
  }

  initEraserButton() {
    this.ui.eraserButton.addEventListener('click', () => {
      const isEraserActive = this.ui.eraserButton.classList.toggle("active");
      this.brush.color = isEraserActive ? null : this.ui.pointColorInput.value;
      this.ui.pointColorInput.classList.toggle("disabled", isEraserActive);
    });

    this.ui.pointColorInput.addEventListener('click', () => {
      this.ui.eraserButton.classList.remove("active");
      this.ui.pointColorInput.classList.remove("disabled");
      this.brush.color = this.ui.pointColorInput.value;
    });
  }

  initDrawOnDragCheckbox() {
    this.ui.drawOnDragCheckbox.addEventListener('change', () => {
      this.drawOnDrag = this.ui.drawOnDragCheckbox.checked;
    });
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
    if (this.drawOnDrag && this.brush.shape !== 'segment') {
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

  initResize() {
    const addListeners = () => {
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", removeListeners);
    }
    const removeListeners = () => {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseup", removeListeners);
    }
    const mouseMove = (event) => {
      const newWidth = Math.ceil(event.clientX - this.ui.canvas.getBoundingClientRect().left);
      const newHeight = Math.ceil(event.clientY - this.ui.canvas.getBoundingClientRect().top);
      this.resizeCanvas(newWidth, newHeight);
    }

    this.ui.resizeAnchor.addEventListener("mousedown", addListeners);
  }

  updateLayersList() {
    this.ui.layersList.innerHTML = '';
    this.layers.forEach((layer, index) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';

      // Icône de visibilité (œil)
      const eyeIcon = document.createElement('div');
      eyeIcon.className = 'eye-icon';
      const eyeCheckbox = document.createElement('input');
      eyeCheckbox.type = 'checkbox';
      eyeCheckbox.id = `eyeCheckbox-${index}`;
      eyeCheckbox.checked = layer.visible;
      eyeCheckbox.addEventListener('change', () => {
        layer.visible = eyeCheckbox.checked;
        this.updateCanvas();
      });
      const eyeLabel = document.createElement('label');
      eyeLabel.htmlFor = `eyeCheckbox-${index}`;
      eyeIcon.appendChild(eyeCheckbox);
      eyeIcon.appendChild(eyeLabel);

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
      layerItem.appendChild(eyeIcon);
      layerItem.appendChild(layerName);
      layerItem.appendChild(transformToggleButton);

      // Mettre en évidence le calque sélectionné
      if (index === this.currentLayerIndex) {
        layerItem.classList.add('selected');
      }

      this.ui.layersList.appendChild(layerItem);

      // Afficher la zone de transformation si nécessaire
      if (this.state.activeTransformationLayerIndex === index) {
        const transformationArea = this.createTransformationArea(index);
        this.ui.layersList.appendChild(transformationArea);
      }
    });
  }

  createTransformationArea(index) {
    const transformationArea = document.createElement('div');
    transformationArea.className = 'transformation-area';

    // Zone de code de transformation
    const transformationCodeInput = document.createElement('textarea');
    transformationCodeInput.className = 'transformation-code';
    transformationCodeInput.rows = 5;
    transformationCodeInput.value = this.transformationManager.getTransformationCode(index);
    transformationCodeInput.addEventListener('input', () => {
      const code = transformationCodeInput.value;
      this.transformationManager.setTransformationCode(index, code);
    });

    // Affichage des erreurs
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'error-display';
    // Mettre à jour errorDisplay selon les besoins

    // Liste déroulante de sélection de transformation
    const transformationSelector = document.createElement('select');
    transformationSelector.className = 'transformation-selector';
    // Ajouter les options nécessaires
    transformationSelector.addEventListener('change', () => {
      // Gérer le changement de sélection
    });

    // Pied de page des contrôles de transformation
    const transformationFooter = document.createElement('div');
    transformationFooter.className = 'transformation-footer';

    // Bouton Play
    const playPauseButton = document.createElement('button');
    playPauseButton.id = `playPauseButton-${index}`;
    playPauseButton.textContent = 'Play';
    playPauseButton.addEventListener('click', () => {
      // Gérer le play/pause pour ce calque
    });

    // Bouton Effacer le calque
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Effacer le calque';
    clearButton.addEventListener('click', () => {
      this.layers[index].clear();
      this.updateCanvas();
    });

    // Ajouter les boutons au pied de page
    transformationFooter.appendChild(clearButton);
    transformationFooter.appendChild(playPauseButton);

    // Ajouter les éléments à la zone de transformation
    transformationArea.appendChild(transformationCodeInput);
    transformationArea.appendChild(errorDisplay);
    transformationArea.appendChild(transformationSelector);
    transformationArea.appendChild(transformationFooter);

    return transformationArea;
  }


  initLayerControls() {
    this.ui.addLayerButton.addEventListener("click", this.addNewLayer.bind(this));
    this.ui.deleteLayerButton.addEventListener("click", () => this.deleteCurrentLayer());
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

  initTransformationControls() {
    this.ui.clearButton.addEventListener('click', () => this.clearCurrentLayer());
    this.ui.clearAllButton.addEventListener('click', () => this.clearAllLayers());
  }

  clearCurrentLayer() {
    this.currentLayer.clear();
    this.updateCanvas();
  }

  clearAllLayers() {
    this.layers.forEach(matrix => matrix.clear());
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
    if (this.drawOnDrag && this.lastMousePosition) {
      const { x, y } = this.lastMousePosition;
      this.currentLayer.paint(x, y, this.brush);
    }
  }

  updateTransformationCodeInput() {
    this.ui.transformationCodeInput.value = this.transformationManager.getTransformationCode(this.currentLayerIndex);
    this.ui.errorDisplay.textContent = '';
  }
}