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
  const controlPanel = new ControlPanel(canvasManager, transformationManager, ui);

  fetch('./transformations.json')
    .then(response => response.json())
    .then((transformations) => controlPanel.initializeTransformations(transformations))
    .catch(error => console.error('Erreur lors du chargement des transformations:', error));
});