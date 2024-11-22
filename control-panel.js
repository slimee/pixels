import makeFader from './components/make-fader.js';
import Layer from './layer.js';

export default class ControlPanel {
  constructor(state, ui, canvasManager) {
    this.state = state;
    this.ui = ui;
    this.canvasManager = canvasManager;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.frame = this.frame.bind(this);
    this.bindAddDeleteLayerButtons();
    this.bindTools();
    this.bindClearButtons();
    this.bindBrush();
    this.bindEraserButton();
    this.bindResize();
    this.bindFader();
    this.bindMouse();
    this.updateDeleteFaderSubmenu();
    this.addNewLayer();
    this.bindStrafeLockButton();
  }

  bindTools() {
    // Liste des boutons d'outils
    this.toolButtons = document.querySelectorAll('#tools button');

    this.ui.strafeToolButton.addEventListener('click', () => {
      this.selectTool('strafe');
    });
    this.ui.brushButton.addEventListener('click', () => {
      this.selectTool('brush');
    });
    this.ui.continousBrushButton.addEventListener('click', () => {
      this.selectTool('continousBrush');
    });
  }

  bindStrafeLockButton() {
    const updateStrateLockButton = () => {
      if (this.state.strafeLock) {
        this.ui.strafeLockButton.classList.add('active');
        this.ui.strafeLockButton.innerHTML = "<i class='bx bx-lock'></i>";
      } else {
        this.ui.strafeLockButton.classList.remove('active');
        this.ui.strafeLockButton.innerHTML = "<i class='bx bx-lock-open'></i>";
      }
    }
    this.ui.strafeLockButton.addEventListener('click', () => {
      this.state.strafeLock = !this.state.strafeLock;
      updateStrateLockButton();
    });
    updateStrateLockButton();
  }

  selectTool(toolName) {
    this.toolButtons.forEach((button) => {
      button.classList.remove('active');
    });

    this.state.brush.tool = toolName;

    if (toolName === 'strafe') {
      this.ui.strafeToolButton.classList.add('active');
    }
  }

  get layers() {
    return this.state.layers;
  }

  get currentLayerIndex() {
    return this.state.currentLayerIndex;
  }

  set currentLayerIndex(index) {
    this.state.currentLayerIndex = index;
  }

  bindMouse() {
    document.addEventListener('mousedown', () => {

    });
    document.addEventListener('mousemove', event => {
      this.state.mouse.prevX = this.state.mouse.x;
      this.state.mouse.prevY = this.state.mouse.y;
      const rect = this.ui.canvas.getBoundingClientRect();
      this.state.mouse.x = Math.floor(event.clientX - rect.left);
      this.state.mouse.y = Math.floor(event.clientY - rect.top);
    });
  }

  bindAddDeleteLayerButtons() {
    this.ui.addLayerButton.addEventListener("click", () => this.addNewLayer());
    this.ui.deleteLayerButton.addEventListener("click", () => this.deleteCurrentLayer());
    this.ui.deleteAllLayersButton.addEventListener("click", () => this.deleteAllLayers());
  }

  bindClearButtons() {
    this.ui.clearButton.addEventListener('click', () => this.canvasManager.clearCurrentLayer());
    this.ui.clearAllButton.addEventListener('click', () => this.canvasManager.clearAllLayers());
  }

  bindBrush() {
    this.ui.brushSizeInput.addEventListener('input', () => {
      this.state.brush.size = parseInt(this.ui.brushSizeInput.value, 10);
    });

    const updateBrush = () => {
      this.state.brush.color = this.ui.brushColorInput.value;
      this.selectTool('brush');
    };
    updateBrush();
    this.ui.brushColorInput.addEventListener('input', updateBrush);

    const updateBrushShape = () => this.state.brush.shape = this.ui.brushShapeInput.value;
    updateBrushShape();
    this.ui.brushShapeInput.addEventListener('change', updateBrushShape);

    const updatePaintSpeed = () => this.state.brush.speed = parseInt(this.ui.paintSpeedInput.value, 10);
    updatePaintSpeed();
    this.ui.paintSpeedInput.addEventListener('input', updatePaintSpeed);
  }

  bindEraserButton() {
    this.ui.eraserButton.addEventListener('click', () => {
      this.selectTool('eraser');
      this.ui.brushColorInput.classList.toggle("active", true);
    });
  }

  togglePlayPause() {
    this.state.isPlaying
      ? this.pause()
      : this.play();

    // Change le texte et l'icône
    const playPauseIcon = document.getElementById("playPauseIcon");
    const playPauseText = document.getElementById("playPauseText");

    if (this.state.isPlaying) {
      playPauseIcon.classList.replace("bx-play", "bx-pause");
      playPauseText.textContent = "Pause";
    } else {
      playPauseIcon.classList.replace("bx-pause", "bx-play");
      playPauseText.textContent = "Lecture";
    }
  }

  pause() {
    this.state.isPlaying = false;
  }

  play() {
    this.state.isPlaying = true;
    requestAnimationFrame(this.frame);
  }

  frame() {
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

  bindFader() {
    this.ui.addFaderButton.addEventListener('click', () => {
      const name = prompt('Quel nom voulez-vous donner à ce fader ?');
      if (this.state.hasVariable(name)) alert('Ce nom est déjà utilisé.');
      else if (!name) alert('Le nom ne peut pas être vide.');
      else {
        this.addFader(name);
        this.updateDeleteFaderSubmenu();
      }
    });
  }

  addFader(name) {
    const faderState = { name, min: -30, max: 30, value: 0 };
    const fader = makeFader(faderState);
    const updateFader = () => {
      this.state.setVariable(faderState);
      this.updateDeleteFaderSubmenu();
    };
    fader.addEventListener('change', updateFader);
    this.ui.faderContainer.appendChild(fader);
    updateFader();
  }

// control-panel.js

  updateDeleteFaderSubmenu() {
    const submenu = this.ui.deleteFaderSubmenu;
    submenu.innerHTML = ''; // Vider le sous-menu

    const variables = Object.keys(this.state.variables);

    if (variables.length === 0) {
      const emptyItem = document.createElement('a');
      emptyItem.textContent = 'Aucun fader';
      submenu.appendChild(emptyItem);
      return;
    }

    variables.forEach(variableName => {
      const menuItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = variableName;

      const isUsed = this.state.isVariableUsed(variableName);

      if (isUsed) {
        link.classList.add('disabled');
        const layersUsingVar = this.state.getLayersUsingVariable(variableName);
        link.textContent += ` (Utilisé dans calque(s): ${layersUsingVar.map(i => this.state.layers[i].name).join(', ')})`;
        link.addEventListener('click', (e) => e.preventDefault()); // Empêcher le clic
      } else {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.deleteFader(variableName);
        });
      }

      menuItem.appendChild(link);
      submenu.appendChild(menuItem);
    });
  }

  deleteFader(variableName) {
    // Supprimer le fader de l'état
    this.state.deleteVariable(variableName);

    // Supprimer le fader de l'interface
    const faderElements = Array.from(this.ui.faderContainer.children);
    faderElements.forEach(faderEl => {
      const input = faderEl.querySelector('.fader-name-input');
      if (input && input.value === variableName) {
        this.ui.faderContainer.removeChild(faderEl);
      }
    });

    this.updateDeleteFaderSubmenu(); // Mettre à jour le sous-menu
  }

  addNewLayer() {
    const newLayer = new Layer(this.ui.canvas.width, this.ui.canvas.height, this.state);
    this.layers.push(newLayer);
    this.currentLayerIndex = this.layers.length - 1;
    this.updateLayersList();
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
        this.canvasManager.updateCanvas();
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
    this.canvasManager.updateCanvas();
  }

  createTransformationArea(layer, index) {
    const transformationArea = document.createElement('div');
    transformationArea.className = 'transformation-area';

    // Zone de code de transformation
    const transformationCodeInput = document.createElement('textarea');
    transformationCodeInput.className = 'transformation-code';
    transformationCodeInput.rows = 5;
    transformationCodeInput.value = layer.code;
    transformationCodeInput.update = () => {
      layer.code = transformationCodeInput.value;
      this.updateDeleteFaderSubmenu();
    };
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
      this.canvasManager.updateCanvas();
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
    this.canvasManager.updateCanvas();
  }
}