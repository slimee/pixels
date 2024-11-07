import {predefinedTransformations} from './transformations.js';
import UI from './ui.js';
import State from './state.js';
import TransformationManager from "./transformation-manager.js";
import CanvasManager from "./canvas-manager.js";
import ControlPanel from "./control-panel.js";

document.addEventListener('DOMContentLoaded', () => {
  const state = new State();
  const ui = new UI();
  const transformationManager = new TransformationManager(state, ui);
  const canvasManager = new CanvasManager(state, transformationManager, ui);
  new ControlPanel(canvasManager, transformationManager, ui);

  predefinedTransformations.forEach((transformation, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = transformation.name;
    ui.transformationSelector.appendChild(option);
  });

  ui.transformationSelector.addEventListener('change', (event) => {
    const selectedIndex = event.target.value;
    if (selectedIndex !== '') {
      const selectedTransformation = predefinedTransformations[selectedIndex];
      ui.transformationCodeInput.value = selectedTransformation.code;
      transformationManager.transformationCodeChanged(canvasManager.currentMatrixIndex);
    }
  });
});