import UI from './ui.js';
import CanvasManager from "./canvas-manager.js";
import ControlPanel from "./control-panel.js";
import TransformationManager from "./transformation-manager.js";
import Commands from "./commands.js";
import DrawState from "./draw-state.js";

document.addEventListener('DOMContentLoaded', start);

async function start() {
  const transformations = await fetch('./data/transformations.json')
    .then(response => response.json())
    .catch(error => console.error('Erreur lors du chargement des transformations:', error));

  const reactive = {
    brush: {
      size: 15,
      color: '#ff0000',
      shape: 'circle',
      speed: 60,
      tool: 'brush',
    },
  }
  const nonReactive = {
    currentLayerIndex: 0,
    isPlaying: false,
    transformations,
    variables: {},
    lastPoint: null,
    layers: [],
    mouse: { x: 0, y: 0, prevX: 0, prevY: 0 },
    strafeLock: false,
    frameCode: '',
    pixelCode: '',
    frame: 0,
  }
  const state = new DrawState(reactive, nonReactive);
  const ui = new UI();
  const canvasManager = new CanvasManager(state, ui);
  const commands = new Commands(state, ui, canvasManager);
  const transformationManager = new TransformationManager(ui, state, commands);
  new ControlPanel(state, ui, canvasManager, transformationManager);
}