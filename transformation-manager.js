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
    console.log('- - - - running pixel code function - - - - -', this.state.layers.map(l => l.name));

    const { width, height, layers } = this.state;
    const numLayers = layers.length;

    // Récupération des données source
    const originalDataArrays = layers.map(layer => layer.offscreenImage.data);

    // Création des buffers de sortie pour chaque calque
    const outputDataArrays = layers.map(layer =>
      new Uint8ClampedArray(layer.offscreenImage.data.length)
    );

    // Dictionnaire de variables. Clé = nom du calque. Valeur = { x, y, r, g, b, a, at }
    const variables = {};
    for (let i = 0; i < numLayers; i++) {
      variables[layers[i].name] = { x: 0, y: 0, r: 0, g: 0, b: 0, a: 0, at: layers[i].at };
    }

    // Boucle sur tous les pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;

        // Remplir 'variables' avec les données de chaque calque
        for (let i = 0; i < numLayers; i++) {
          const layer = layers[i];
          const data = originalDataArrays[i];

          variables[layer.name].x = x;
          variables[layer.name].y = y;
          variables[layer.name].r = data[index];
          variables[layer.name].g = data[index + 1];
          variables[layer.name].b = data[index + 2];
          variables[layer.name].a = data[index + 3];
        }

        // Appel de la pixelFunction
        this.pixelFunction(width, height, 255, 0, variables);

        // Après la modification, écrire dans les buffers de sortie
        for (let i = 0; i < numLayers; i++) {
          const layer = layers[i];
          const v = variables[layer.name];

          // Calcul des coordonnées wrap-around
          const intNewX = Math.floor(v.x);
          const intNewY = Math.floor(v.y);
          const wrappedX = ((intNewX % width) + width) % width;
          const wrappedY = ((intNewY % height) + height) % height;
          const newIndex = (wrappedY * width + wrappedX) * 4;

          // Ecriture dans le buffer de sortie
          const outData = outputDataArrays[i];
          outData[newIndex] = v.r;
          outData[newIndex + 1] = v.g;
          outData[newIndex + 2] = v.b;
          outData[newIndex + 3] = v.a;
        }
      }
    }

    // Mise à jour des calques avec les données finales
    for (let i = 0; i < numLayers; i++) {
      const layer = layers[i];
      const outData = outputDataArrays[i];
      layer.offscreenImage.data.set(outData);
      layer.updateOffscreen();
    }
  }
}