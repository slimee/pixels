import prefixVariables from "./utils/prefix-variables.js";

export default class TransformationManager {
  constructor(ui, state) {
    this.ui = ui;
    this.state = state;

    this.bindFrameCodeInput();
    this.frameFunction = () => null;
    this.bindPixelCodeInput();
    this.pixelFunction = () => null;
  }

  bindFrameCodeInput() {
    this.ui.frameCodeInput.update = () => {
      this.state.frameCode = this.ui.frameCodeInput.value;
      this.updateFrameCodeFunction();
    }
    this.ui.frameCodeInput.addEventListener('blur', this.ui.frameCodeInput.update);
  }

  updateFrameCodeFunction() {
    const variableNames = Object.keys(this.state.variables);
    const {
      codeWithVariables,
      usedVariables,
      unprefixedVariables,
    } = prefixVariables(this.state.frameCode, variableNames);

    console.log('');
    console.log(' - - - - frame code - - - - ');
    console.log('variable names:', variableNames);
    console.log('code before:', this.state.frameCode);
    console.log('usedVariables:', usedVariables);
    console.log('unprefixedVariables:', unprefixedVariables);
    console.log('state.variables:', this.state.variables);
    console.log('code transformed:', codeWithVariables);

    this.frameFunction = new Function('variables', `${codeWithVariables}`);
  }

  runFrameCodeFunction() {
    this.frameFunction(this.state.variables);
  }

  bindPixelCodeInput() {
    this.ui.pixelCodeInput.update = () => {
      this.state.pixelCode = this.ui.pixelCodeInput.value;
      this.updatePixelCodeFunction();
    }
    this.ui.pixelCodeInput.addEventListener('blur', this.ui.pixelCodeInput.update);
  }

  updatePixelCodeFunction() {
    console.log('- - - - update pixel code function on layers - - - - -', this.state.layers.map(l => l.name));
    const layerNames = this.state.layers.map(layer => layer.name);
    const variableNames = [...Object.keys(this.state.variables), ...layerNames];

    const {
      codeWithVariables,
      usedVariables,
      unprefixedVariables
    } = prefixVariables(this.state.pixelCode, variableNames);
    console.log('');
    console.log(' - - - - pixel code - - - - ')
    console.log('variable names:', variableNames);
    console.log('layer code before:', this.state.pixelCode);
    console.log('usedVariables:', usedVariables);
    console.log('unprefixedVariables:', unprefixedVariables);
    console.log('state.variables:', this.state.variables);
    console.log('code transformed:', codeWithVariables);


    this.usedVariables = usedVariables;
    this.pixelFunction = new Function('width', 'height', 'max', 'min', 'variables', `${codeWithVariables}`);
  }

  runPixelCodeFunction() {
    console.log('- - - - running pixel code function on layers - - - - -', this.state.layers.map(l => l.name));
    const width = this.state.width;
    const height = this.state.height;

    for (let i = 0; i < this.state.layers.length; i++) {
      const layer = this.state.layers[i];
      const data = layer.offscreenImage.data;

      // Créer un buffer de sortie pour l'image finale
      const uint8Array = new Uint8ClampedArray(width * height * 4).fill(0);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;

          // Récupérer les valeurs RGBA du pixel dans le calque actuel
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          // Appel de la fonction de transformation
          // ici c2 n'existe pas encore quand on boucle sur c1.
          this.state.variables[layer.name] = { x, y, r, g, b, a, at: layer.at };
          this.pixelFunction(width, height, 255, 0, this.state.variables);

          // Calcul des coordonnées "wrap-around"
          const intNewX = Math.floor(this.state.variables[layer.name].x);
          const intNewY = Math.floor(this.state.variables[layer.name].y);
          const wrappedX = ((intNewX % width) + width) % width;
          const wrappedY = ((intNewY % height) + height) % height;
          const newIndex = (wrappedY * width + wrappedX) * 4; // Index du pixel transformé

          // Écriture des nouvelles valeurs RGBA dans le buffer de sortie
          const layerVariable = this.state.variables[layer.name];
          uint8Array[newIndex] = layerVariable.r;
          uint8Array[newIndex + 1] = layerVariable.g;
          uint8Array[newIndex + 2] = layerVariable.b;
          uint8Array[newIndex + 3] = layerVariable.a;
        }
      }

      layer.offscreenImage.data.set(uint8Array);
      layer.updateOffscreen();
    }
  }
}