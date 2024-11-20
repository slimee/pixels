import makeFader from './components/make-fader.js';

export default class ControlPanel {
  constructor(state, ui, canvasManager) {
    this.state = state;
    this.ui = ui;
    this.canvasManager = canvasManager;
    this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    this.frame = this.frame.bind(this);
    this.bindAddDeleteLayerButtons();
    this.bindClearButtons();
    this.bindDrawOnDragCheckbox();
    this.bindBrush();
    this.bindEraserButton();
    this.bindResize();
    this.bindFader();
    this.bindMouse();
    this.updateDeleteFaderSubmenu();
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
    this.ui.addLayerButton.addEventListener("click", () => this.canvasManager.addNewLayer());
    this.ui.deleteLayerButton.addEventListener("click", () => this.canvasManager.deleteCurrentLayer());
    this.ui.deleteAllLayersButton.addEventListener("click", () => this.canvasManager.deleteAllLayers());
  }

  bindClearButtons() {
    this.ui.clearButton.addEventListener('click', () => this.canvasManager.clearCurrentLayer());
    this.ui.clearAllButton.addEventListener('click', () => this.canvasManager.clearAllLayers());
  }

  bindDrawOnDragCheckbox() {
    const updateDrawOnDragState = () => {
      this.state.brush.drawOnDrag = this.ui.drawOnDragCheckbox.checked;
    }
    updateDrawOnDragState();
    this.ui.drawOnDragCheckbox.addEventListener('change', () => {
      updateDrawOnDragState();
    });
  }

  bindBrush() {
    this.ui.brushSizeInput.addEventListener('input', () => {
      this.state.brush.size = parseInt(this.ui.brushSizeInput.value, 10);
    });

    const updateBrush = () => {
      this.state.brush.color = this.ui.brushColorInput.value;
      this.state.brush.erase = false;
      if (this.state.brush.erase) {
        this.ui.eraserButton.classList.add("active");
      } else {
        this.ui.eraserButton.classList.remove("active");
      }
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
      this.state.brush.erase = !this.state.brush.erase;
      if (this.state.brush.erase) {
        this.ui.eraserButton.classList.add("active");
      } else {
        this.ui.eraserButton.classList.remove("active");
      }
      this.ui.brushColorInput.classList.toggle("disabled", this.state.brush.erase);
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

  updateDeleteFaderSubmenu() {
    const submenu = this.ui.deleteFaderSubmenu;
    submenu.innerHTML = ''; // Vider le sous-menu

    const variables = Object.keys(this.state.variables);

    if (variables.length === 0) {
      const emptyItem = document.createElement('li');
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
        link.textContent += ` (Utilisé dans: ${layersUsingVar.map(i => this.state.layers[i].name).join(', ')})`;
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
}