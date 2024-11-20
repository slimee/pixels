import Layer from './layer.js';

export default class CanvasManager {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;

    this.canvasContext = this.ui.canvas.getContext('2d');
    this.startPoint = null;
    this.draggedLayerIndex = null;
    this.mouseMoveInterval = null;

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
    const newLayer = new Layer(this.ui.canvas.width, this.ui.canvas.height, this.state);
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

  handleCanvasMouseDown() {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;
    this.state.lastPoint = { x, y };

    if (this.brush.shape === 'segment') {
      this.startPoint = { x, y };
    } else {
      // Pour les autres pinceaux, on dessine immédiatement au mousedown
      this.drawAt(x, y, this.brush);
    }

    this.mouseMoveInterval = setInterval(this.handleMouseMove, 1000 / this.brush.speed);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = () => {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.brush.shape === 'segment' && this.brush.drawOnDrag) {
      // Dessin continu avec le pinceau "segment"
      if (this.state.lastPoint) {
        this.brush.startX = this.state.lastPoint.x;
        this.brush.startY = this.state.lastPoint.y;
        this.brush.endX = x;
        this.brush.endY = y;
        this.drawAt(x, y, { ...this.brush });
        this.state.lastPoint = { x, y };
      }
    } else if (this.state.brush.drawOnDrag) {
      // Dessin continu avec les autres pinceaux
      this.drawAt(x, y, this.brush);
    } else if (this.brush.shape === 'segment') {
      // En mode non continu avec le pinceau "segment", on peut implémenter un aperçu si souhaité
    }
  }

  handleMouseUp = () => {
    const x = this.state.mouse.x;
    const y = this.state.mouse.y;

    if (this.brush.shape === 'segment') {
      if (this.brush.drawOnDrag) {
        // En mode dessin continu, on réinitialise state.lastPoint
        this.state.lastPoint = null;
      } else if (this.startPoint) {
        // En mode normal, on dessine le segment une fois le bouton relâché
        this.brush.startX = this.startPoint.x;
        this.brush.startY = this.startPoint.y;
        this.brush.endX = x;
        this.brush.endY = y;
        this.drawAt(x, y, { ...this.brush });
        this.startPoint = null;
      }
    }

    clearInterval(this.mouseMoveInterval);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  updateLayersList() {
    this.ui.layersList.innerHTML = '';

    this.layers.forEach((layer, index) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';
      layerItem.setAttribute('data-index', index);

      // Créer la zone de grip
      const gripArea = document.createElement('div');
      gripArea.className = 'layer-grip';
      gripArea.draggable = true;

      // Ajouter l'icône du grip
      const gripIcon = document.createElement('i');
      gripIcon.className = 'bx bx-menu'; // Utiliser l'icône appropriée
      gripArea.appendChild(gripIcon);

      // Ajouter les écouteurs d'événements pour le drag and drop
      gripArea.addEventListener('dragstart', (event) => {
        this.draggedLayerIndex = index;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', index.toString()); // Modifier ici
        gripArea.classList.add('dragging');
      });

      gripArea.addEventListener('dragend', () => {
        gripArea.classList.remove('dragging');
      });

      layerItem.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const rect = layerItem.getBoundingClientRect();
        const offset = event.clientY - rect.top;
        const height = rect.height;

        let targetIndex = index;

        if (offset > height / 2) {
          // Si la souris est dans la moitié inférieure, insérer après
          targetIndex = index + 1;
        }

        // Vérifier si le targetIndex est différent de draggedLayerIndex
        if (
          targetIndex !== this.draggedLayerIndex &&
          targetIndex !== this.draggedLayerIndex + 1
        ) {
          // Afficher l'indicateur visuel
          if (offset < height / 2) {
            layerItem.classList.add('drag-over-top');
            layerItem.classList.remove('drag-over-bottom');
          } else {
            layerItem.classList.add('drag-over-bottom');
            layerItem.classList.remove('drag-over-top');
          }
        } else {
          // Ne pas afficher l'indicateur visuel
          layerItem.classList.remove('drag-over-top');
          layerItem.classList.remove('drag-over-bottom');
        }
      });

      layerItem.addEventListener('dragleave', () => {
        layerItem.classList.remove('drag-over-top');
        layerItem.classList.remove('drag-over-bottom');
      });

      layerItem.addEventListener('drop', (event) => {
        event.preventDefault();
        layerItem.classList.remove('drag-over');

        const rect = layerItem.getBoundingClientRect();
        const offset = event.clientY - rect.top;
        const height = rect.height;

        let targetIndex = index;

        if (offset > height / 2) {
          // Si la souris est dans la moitié inférieure, insérer après
          targetIndex = index + 1;
        }

        this.moveLayer(this.draggedLayerIndex, targetIndex);
        this.draggedLayerIndex = null;
      });

      // Créer les autres éléments (checkbox œil, nom du calque, etc.)

      // Code pour la checkbox œil (inchangé)
      const eyeCheckboxContainer = document.createElement('label');
      eyeCheckboxContainer.className = 'eye-checkbox';
      eyeCheckboxContainer.htmlFor = `eyeCheckbox-${index}`;

      const eyeCheckbox = document.createElement('input');
      eyeCheckbox.type = 'checkbox';
      eyeCheckbox.id = `eyeCheckbox-${index}`;
      eyeCheckbox.checked = layer.visible;
      eyeCheckbox.addEventListener('change', () => {
        layer.visible = eyeCheckbox.checked;
        this.updateCanvas();
      });

      const eyeIconShow = document.createElement('i');
      eyeIconShow.className = 'bx bxs-show';

      const eyeIconHide = document.createElement('i');
      eyeIconHide.className = 'bx bxs-hide';

      eyeCheckboxContainer.appendChild(eyeCheckbox);
      eyeCheckboxContainer.appendChild(eyeIconShow);
      eyeCheckboxContainer.appendChild(eyeIconHide);

      // Nom du calque
      const layerName = document.createElement('span');
      layerName.textContent = layer.name;
      layerName.addEventListener('change', () => {
        layer.name = layerName.value;
      });
      layerName.addEventListener('click', (event) => {
        this.currentLayerIndex = index;
        this.updateLayersList();
        event.stopPropagation();
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
      layerItem.appendChild(gripArea);
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

  moveLayer(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex === null || toIndex === null) return;

    const layers = this.state.layers;
    const layer = layers.splice(fromIndex, 1)[0];

    // Ajuster l'index de destination si nécessaire
    if (fromIndex < toIndex) {
      toIndex--; // Compte tenu du retrait du calque
    }

    layers.splice(toIndex, 0, layer);

    // Mettre à jour currentLayerIndex si nécessaire
    if (this.currentLayerIndex === fromIndex) {
      this.currentLayerIndex = toIndex;
    } else if (this.currentLayerIndex > fromIndex && this.currentLayerIndex <= toIndex) {
      this.currentLayerIndex--;
    } else if (this.currentLayerIndex < fromIndex && this.currentLayerIndex >= toIndex) {
      this.currentLayerIndex++;
    }

    // Mettre à jour l'index de transformation active
    if (this.state.activeTransformationLayerIndex === fromIndex) {
      this.state.activeTransformationLayerIndex = toIndex;
    } else if (this.state.activeTransformationLayerIndex > fromIndex && this.state.activeTransformationLayerIndex <= toIndex) {
      this.state.activeTransformationLayerIndex--;
    } else if (this.state.activeTransformationLayerIndex < fromIndex && this.state.activeTransformationLayerIndex >= toIndex) {
      this.state.activeTransformationLayerIndex++;
    }

    this.updateLayersList();
    this.updateCanvas();
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
      if (layer.visible) this.canvasContext.drawImage(layer.offscreenCanvas, 0, 0)
    });
  }

  resizeCanvas(newWidth, newHeight) {
    this.ui.canvas.width = newWidth;
    this.ui.canvas.height = newHeight;
    this.layers.forEach(matrix => matrix.resize(newWidth, newHeight));
    this.updateCanvas();
  }
}