import Layer from './layer.js';
import makeSvgCheckbox from "./components/make-svg-checkbox.js";
import hexToRGBA from "./utils/hex-to-rgba.js";
import makeNewFader from "./components/make-new-fader.js";
import ProjectStorage from "./utils/project-storage.js";

export default class ControlPanel {
  constructor(state, ui, canvasManager, transformationManager) {
    this.state = state;
    this.ui = ui;
    this.canvasManager = canvasManager;
    this.transformationManager = transformationManager;

    this.bindCodeButton();
    this.bindLoadSave();
    this.bindPlayPauseButton();
    this.bindTestButton();
    this.bindLayers();
    this.bindTools();
    this.bindClearButtons();
    this.bindBrush();
    this.bindEraserButton();
    this.bindResize();
    this.bindFader();
    this.bindMouse();
    this.addNewLayer();
    this.faderIndex = 0;
    this.draggedLayerIndex = null;
  }

  bindCodeButton() {
    // this.ui.codeButton.addEventListener('click', () => {
    //   const name = `b1`;
    //   this.state.codeButton[name] = { name };
    // });
    // this.state.on('codeButton.+', (codeButtonState) => {
    //   addToCodeButtonBar(makeCodebutton(codeButtonState));
    // });
  }

  bindLoadSave() {
    this.ui.saveButton.addEventListener('click', () => {
      this.save();
    });
    this.ui.loadButton.addEventListener('click', () => {
      this.load();
    });
  }

  bindTools() {
    this.toolButtons = document.querySelectorAll('#tools button');

    this.ui.moveButton.addEventListener('click', () => {
      this.selectTool('move');
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

  selectTool(toolName) {
    this.toolButtons.forEach((button) => {
      button.classList.remove('active');
    });

    this.state.brush.tool = toolName;

    if (toolName === 'move') {
      this.ui.moveButton.classList.add('active');
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

  bindMouse() {
    document.addEventListener('mousemove', event => {
      this.state.mouse.prevX = this.state.mouse.x;
      this.state.mouse.prevY = this.state.mouse.y;
      const rect = this.ui.canvas.getBoundingClientRect();
      this.state.mouse.x = Math.floor(event.clientX - rect.left);
      this.state.mouse.y = Math.floor(event.clientY - rect.top);
    });
  }

  bindLayers() {
    this.state.on('currentLayerIndex', (currentLayerIndex) => {
      this.state.layers.forEach((layer, index) => {
        layer.isDrawing = index === currentLayerIndex;
      });
    });
    this.ui.addLayerButton.addEventListener("click", () => this.addNewLayer());
    this.ui.deleteLayerButton.addEventListener("click", () => this.deleteCurrentLayer());
    this.ui.deleteAllLayersButton.addEventListener("click", () => this.deleteAllLayers());
  }

  bindClearButtons() {
    this.ui.clearButton.addEventListener('click', () => this.canvasManager.clearCurrentLayer());
    this.ui.clearAllButton.addEventListener('click', () => this.canvasManager.clearAllLayers());
  }

  bindBrush() {
    this.ui.brushSizeInput.addEventListener('change', () => {
      this.state.brush.size = parseInt(this.ui.brushSizeInput.value, 10);
    });
    this.state.on('brush.size', (size) => {
      this.ui.brushSizeInput.value = size;
    });

    const updateBrush = (hexColor) => {
      this.state.brush.color = hexToRGBA(hexColor);
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
    this.ui.playPauseButton.addEventListener('click', this.togglePlayPause);
  }

  bindTestButton() {
    this.ui.testButton.addEventListener('click', this.testAnimation);
  }

  testAnimation = () => {
    this.state.isPlaying = false;
    this.frame();
  }

  togglePlayPause = () => {
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
    try {
      this.transformationManager.runFrameCodeFunction();
      this.transformationManager.runPixelCodeFunction();
      this.canvasManager.updateCanvas();
    } catch (e) {
      console.error(e);
    }

    if (this.state.isPlaying) {
      this.state.frame++;
      this.state.frameTotal++;
      requestAnimationFrame(this.frame);
    } else {
      this.state.frame = 0;
    }
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
    this.state.on('faders.-', () => {
      this.transformationManager.updateCodeFunctions();
    });
    this.state.on('faders.+', faderState => {
      const fader = makeNewFader(this.ui.faderContainer, faderState);

      fader.on('value', (value) => {
        this.state.faders[faderState.name].value = value;
      })

      this.state.on(`faders.${faderState.name}.value`, (value) => {
        fader.value = value;
      });

      this.transformationManager.updateCodeFunctions();
    })

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
    this.state.addProperty(`faders.${name}`, state);
  }

  addNewLayer() {
    const newLayer = new Layer(this.state);
    this.layers.push(newLayer);
    this.state.currentLayerIndex = this.layers.length - 1;
    this.updateLayersList();
    this.state.setVariable({ name: newLayer.name, value: newLayer });
    this.transformationManager.updateCodeFunctions();
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
        this.transformationManager.updateCodeFunctions();
      });

      const eyeBox = makeSvgCheckbox('icon-eye', 'icon-eye-closed', layer.visible, 'Cacher le calque', () => {
        layer.visible = eyeBox.checked;
        this.canvasManager.updateCanvas();
      });

      const drawCheckbox = makeSvgCheckbox('brush', 'no-paint', layer.isDrawing, 'Dessiner sur ce calque', () => {
        layer.isDrawing = drawCheckbox.checked;
      });

      // Nom du calque
      const layerName = document.createElement('span');
      layerName.textContent = layer.name;
      layerName.addEventListener('change', () => {
        layer.name = layerName.value;
      });
      layerName.addEventListener('click', (event) => {
        this.state.currentLayerIndex = index;
        this.updateLayersList();
        event.stopPropagation();
      });

      // Ajouter les éléments au calque
      layerItem.appendChild(gripArea);
      layerItem.appendChild(eyeBox);
      layerItem.appendChild(drawCheckbox);
      layerItem.appendChild(layerName);

      // Mettre en évidence le calque sélectionné
      if (index === this.state.currentLayerIndex) {
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
    if (this.state.currentLayerIndex === fromIndex) {
      this.state.currentLayerIndex = toIndex;
    } else if (this.state.currentLayerIndex > fromIndex && this.state.currentLayerIndex <= toIndex) {
      this.state.currentLayerIndex--;
    } else if (this.state.currentLayerIndex < fromIndex && this.state.currentLayerIndex >= toIndex) {
      this.state.currentLayerIndex++;
    }

    this.updateLayersList();
    this.canvasManager.updateCanvas();
  }

  deleteCurrentLayer() {
    if (this.layers.length > 1) {
      this.layers.splice(this.state.currentLayerIndex, 1);
      if (this.state.currentLayerIndex >= this.layers.length) {
        this.state.currentLayerIndex = this.layers.length - 1;
      }
      this.updateLayersList();
      this.canvasManager.updateCanvas();
    }
  }

  deleteAllLayers() {
    while (this.layers.length > 1) {
      this.layers.splice(this.state.currentLayerIndex, 1);
      if (this.state.currentLayerIndex >= this.layers.length) {
        this.state.currentLayerIndex = this.layers.length - 1;
      }
    }
    this.updateLayersList();
    this.canvasManager.updateCanvas();
  }

  save() {
    new ProjectStorage().saveProject('p1', this.getProject());
  }

  load() {
    this.applyProject(new ProjectStorage().getProject());
  }

  getProject() {
    return this.state.toJSON();
  }

  applyProject(state) {
    this.state.fromJSON(state);
  }
}