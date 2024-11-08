import Matrix from './matrix.js';

export default class CanvasManager {
  constructor(state, transformationManager, ui) {
    this.state = state;
    this.ui = ui;
    this.canvasContext = this.ui.canvas.getContext('2d');
    this.transformationManager = transformationManager;
    this.brush = { size: 15, color: '#ff0000', shape: 'circle' };
    this.startPoint = null;
    this.matrices = [];
    this.layerVisibility = [];

    this.initializeControls();
    this.addNewMatrix();

    this.drawOnDrag = this.ui.drawOnDragCheckbox.checked;
  }

  get currentMatrix() {
    return this.matrices[this.currentMatrixIndex];
  }

  get currentMatrixIndex() {
    return this.state.currentMatrixIndex;
  }

  set currentMatrixIndex(index) {
    this.state.currentMatrixIndex = index;
  }

  addNewMatrix() {
    const newMatrix = new Matrix(this.ui.canvas.width, this.ui.canvas.height);
    this.matrices.push(newMatrix);
    this.layerVisibility.push(true);
    this.currentMatrixIndex = this.matrices.length - 1;

    const initialCode = this.transformationManager.getCode(this.currentMatrixIndex);
    this.transformationManager.transformationCodeChanged(this.currentMatrixIndex, initialCode);

    this.updateLayersList();
    this.updateCanvas();
  }

  initializeControls() {
    this.initBrushSettings();
    this.initEraserButton();
    this.initDrawOnDragCheckbox();
    this.initCanvasMouseEvents();
    this.initResize();
    this.initLayerControls();
    this.initTransformationControls();
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
    this.ui.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  handleMouseDown(event) {
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

  initLayerControls() {
    this.ui.addLayerButton.addEventListener("click", () => this.addNewMatrix());
  }

  updateLayersList() {
    this.ui.layersList.innerHTML = '';
    this.matrices.forEach((_, index) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';

      const eyeIcon = document.createElement('span');
      eyeIcon.textContent = this.layerVisibility[index] ? '👁️' : '👓';
      eyeIcon.className = 'layer-eye';
      eyeIcon.addEventListener('click', () => {
        this.layerVisibility[index] = !this.layerVisibility[index];
        eyeIcon.textContent = this.layerVisibility[index] ? '👁️' : '👓';
        this.updateCanvas();
      });

      const layerName = document.createElement('span');
      layerName.textContent = `Calque ${index + 1}`;
      layerName.addEventListener('click', () => {
        this.currentMatrixIndex = index;
        this.updateLayersList();
        this.updateTransformationCodeInput();
      });

      if (index === this.currentMatrixIndex) {
        layerName.style.fontWeight = 'bold';
      }

      const deleteIcon = document.createElement('span');
      deleteIcon.textContent = '🗑️';
      deleteIcon.className = 'layer-delete';
      deleteIcon.addEventListener('click', () => {
        if (this.matrices.length > 1) {
          this.matrices.splice(index, 1);
          this.layerVisibility.splice(index, 1);
          if (this.currentMatrixIndex >= this.matrices.length) {
            this.currentMatrixIndex = this.matrices.length - 1;
          }
          this.updateLayersList();
          this.updateCanvas();
        }
      });

      layerItem.appendChild(eyeIcon);
      layerItem.appendChild(layerName);
      layerItem.appendChild(deleteIcon);
      this.ui.layersList.appendChild(layerItem);
    });
  }

  initTransformationControls() {
    this.ui.clearButton.addEventListener('click', () => this.clearCurrentMatrix());
    this.ui.clearAllButton.addEventListener('click', () => this.clearAllMatrices());
  }

  clearCurrentMatrix() {
    this.currentMatrix.clear();
    this.updateCanvas();
  }

  clearAllMatrices() {
    this.matrices.forEach(matrix => matrix.clear());
    this.updateCanvas();
  }

  drawAt(x, y, brush) {
    this.currentMatrix.paint(x, y, brush);
    this.updateCanvas();
  }

  updateCanvas() {
    this.canvasContext.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
    this.matrices.forEach((matrix, index) => {
      if (this.layerVisibility[index]) {
        matrix.drawTo(this.canvasContext);
      }
    });
  }

  resizeCanvas(newWidth, newHeight) {
    this.ui.canvas.width = newWidth;
    this.ui.canvas.height = newHeight;
    this.matrices.forEach(matrix => matrix.resize(newWidth, newHeight));
    this.updateCanvas();
  }

  drawOnDragInterval() {
    if (this.drawOnDrag && this.lastMousePosition) {
      const { x, y } = this.lastMousePosition;
      this.currentMatrix.paint(x, y, this.brush);
    }
  }

  updateTransformationCodeInput() {
    this.ui.transformationCodeInput.value = this.transformationManager.getCode(this.currentMatrixIndex);
    this.ui.errorDisplay.textContent = '';
  }
}