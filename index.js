import UI from './ui.js';
import State from './state.js';
import CanvasManager from "./canvas-manager.js";
import ControlPanel from "./control-panel.js";
import TransformationManager from "./transformation-manager.js";

document.addEventListener('DOMContentLoaded', start);

async function start() {
  const transformations = await fetch('./data/transformations.json')
    .then(response => response.json())
    .catch(error => console.error('Erreur lors du chargement des transformations:', error));

  const state = new State(transformations);
  const ui = new UI();
  const canvasManager = new CanvasManager(state, ui);
  const transformationManager = new TransformationManager(ui, state);
  new ControlPanel(state, ui, canvasManager, transformationManager);
}