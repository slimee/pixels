import UI from './ui.js';
import State from './state.js';
import CanvasManager from "./canvas-manager.js";
import ControlPanel from "./control-panel.js";

document.addEventListener('DOMContentLoaded', () => {
  const transformations = fetch('./transformations.json')
    .then(response => response.json())
    .catch(error => console.error('Erreur lors du chargement des transformations:', error));

  const state = new State(transformations);
  const ui = new UI();
  const canvasManager = new CanvasManager(state, ui);
  new ControlPanel(state, ui, canvasManager);
});