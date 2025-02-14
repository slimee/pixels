import UI from './ui.js';
import CanvasManager from "./canvas-manager.js";
import ControlPanel from "./control-panel.js";
import TransformationManager from "./transformation-manager.js";
import Commands from "./commands.js";
import DrawState from "./draw-state.js";
import TransformationHelper from "./transformation-helper.js";

document.addEventListener('DOMContentLoaded', start);

async function start() {
  const transformations = await fetch('./external/data/transformations.json')
    .then(response => response.json())
    .catch(error => console.error('Erreur lors du chargement des transformations:', error));

  const state = new DrawState(transformations);
  const helper = new TransformationHelper(state);
  const ui = new UI();
  const canvasManager = new CanvasManager(state, ui, helper);
  const commands = new Commands(state, ui, canvasManager);
  const transformationManager = new TransformationManager(ui, state, commands, helper);
  new ControlPanel(state, ui, canvasManager, transformationManager);
}