import UI from './ui.js';
import OldState from './oldState.js';
import CanvasManager from "./canvas-manager.js";
import ControlPanel from "./control-panel.js";
import TransformationManager from "./transformation-manager.js";
import Commands from "./commands.js";

document.addEventListener('DOMContentLoaded', start);

async function start() {
  const transformations = await fetch('./data/transformations.json')
    .then(response => response.json())
    .catch(error => console.error('Erreur lors du chargement des transformations:', error));

  const state = new OldState(transformations);
  const ui = new UI();
  const canvasManager = new CanvasManager(state, ui);
  const commands = new Commands(state, ui, canvasManager);
  const transformationManager = new TransformationManager(ui, state, commands);
  new ControlPanel(state, ui, canvasManager, transformationManager);
}