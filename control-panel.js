import makeFader from './components/make-fader.js';
import Layer from './layer.js';
import makeCheckbox from "./components/make-checkbox.js";

export default class ControlPanel {
  constructor(state, ui, canvasManager, transformationManager) {
    this.state = state;
    this.ui = ui;
    this.canvasManager = canvasManager;
    this.transformationManager = transformationManager;

    this.bindPlayPauseButton();
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
    this.faderIndex = 0;
  }

  bindTools() {
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
    this.ui.fillBucketButton.addEventListener('click', () => {
      this.selectTool('fill');
    });
    this.ui.magicFillButton.addEventListener('click', () => {
      this.selectTool('magic-fill');
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
    if (toolName === 'magic-fill') {
      this.ui.magicFillButton.classList.add('active');
    }
    if (toolName === 'brush') {
      this.ui.brushButton.classList.add('active');
    }
    if (toolName === 'continousBrush') {
      this.ui.continousBrushButton.classList.add('active');
    }
    if (toolName === 'eraser') {
      this.ui.eraserButton.classList.add('active');
    }
    if (toolName === 'fill') {
      this.ui.fillBucketButton.classList.add('active');
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

    const updateBrush = (color) => {
      this.state.brush.color = color;
    };
    updateBrush('#000000FF');
    Coloris({
      forceAlpha: true,
      theme: 'polaroid',
      themeMode: 'dark',
      onChange: updateBrush,
      defaultColor: '#000000FF',
    });
    document.querySelector('#color-picker').dispatchEvent(new Event('input', { bubbles: true }));


    const updateBrushShape = () => this.state.brush.shape = this.ui.brushShapeInput.value;
    updateBrushShape();
    this.ui.brushShapeInput.addEventListener('change', updateBrushShape);
  }

  bindEraserButton() {
    this.ui.eraserButton.addEventListener('click', () => {
      this.selectTool('eraser');
      this.ui.colorPicker.classList.toggle("active", true);
    });
  }

  bindPlayPauseButton() {
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
  }

  togglePlayPause() {
    this.state.isPlaying
      ? this.pause()
      : this.play();

    const playPauseIcon = document.getElementById("playPauseIcon");
    if (this.state.isPlaying) {
      playPauseIcon.classList.replace("bx-play", "bx-pause");
    } else {
      playPauseIcon.classList.replace("bx-pause", "bx-play");
    }
  }

  pause() {
    this.state.isPlaying = false;
  }

  play() {
    this.state.isPlaying = true;
    requestAnimationFrame(this.frame);
  }

  frame = () => {
    this.transformationManager.runFrameCodeFunction();
    this.transformationManager.runPixelCodeFunction();

    this.canvasManager.updateCanvas();

    if (this.state.isPlaying) requestAnimationFrame(this.frame);
  }

  resize = () => {
    this.state.width = this.ui.canvasRedim.clientWidth;
    this.state.height = this.ui.canvasRedim.clientHeight;
    this.canvasManager.resizeCanvas();
  }

  bindResize() {
    this.resize();
    const resizeObserver = new ResizeObserver(this.resize);
    resizeObserver.observe(this.ui.canvasRedim);
  }

  bindFader() {
    this.ui.addFaderButton.addEventListener('click', () => {
      this.openFaderModal();
    });

    this.ui.faderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createFaderFromModal();
    });

    this.ui.closeModalButton.addEventListener('click', () => {
      this.closeFaderModal();
    });
  }

  createFaderFromModal() {
    const name = this.ui.faderNameInput.value.trim();
    const min = parseFloat(this.ui.faderMinInput.value);
    const max = parseFloat(this.ui.faderMaxInput.value);

    if (name && !isNaN(min) && !isNaN(max)) {
      // Créer le fader avec les valeurs saisies
      this.addFader(name, min, max);
      this.updateDeleteFaderSubmenu();
      // Fermer la modale
      this.closeFaderModal();
    } else {
      alert('Veuillez remplir tous les champs correctement.');
    }
  }

  openFaderModal() {
    // Réinitialiser le formulaire
    this.ui.faderForm.reset();
    this.ui.faderNameInput.value = `f${++this.faderIndex}`;
    // Afficher la modale
    this.ui.modalOverlay.classList.remove('hidden');
  }

  closeFaderModal() {
    // Masquer la modale
    this.ui.modalOverlay.classList.add('hidden');
  }

  addFader(name, min = -30, max = 30) {
    const state = { name, min, max, value: (min + max) / 2 };
    const onChange = () => {
      this.state.setVariable(state);
      this.updateDeleteFaderSubmenu();
      this.transformationManager.updateFrameCodeFunction();
    };
    this.ui.faderContainer.appendChild(makeFader(state, onChange));
    this.transformationManager.updateFrameCodeFunction();
  }

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
    const newLayer = new Layer(this.state);
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

      const eyeCheckbox = makeCheckbox('bx bxs-show', 'bx bxs-hide', layer.visible, 'Cacher le calque', () => {
        layer.visible = eyeCheckbox.checked;
        this.canvasManager.updateCanvas();
      });

      const drawCheckbox = makeCheckbox('bx bxs-paint', 'bx bx-paint', false, 'Dessiner sur ce calque', () => {
        layer.isDrawing = drawCheckbox.checked;
      });

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

      // Ajouter les éléments au calque
      layerItem.appendChild(gripArea);
      layerItem.appendChild(eyeCheckbox);
      layerItem.appendChild(drawCheckbox);
      layerItem.appendChild(layerName);

      // Mettre en évidence le calque sélectionné
      if (index === this.currentLayerIndex) {
        layerItem.classList.add('selected');
      }

      this.ui.layersList.appendChild(layerItem);
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

    this.updateLayersList();
    this.canvasManager.updateCanvas();
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