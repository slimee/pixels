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
    const layers = this.state.layers;
    const numLayers = layers.length;
    const width = this.state.width;
    const height = this.state.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        for (let i = 0; i < numLayers; i++) {
          const layer = layers[i];
          const data = layer.offscreenImage.data;
          this.state.variables[layer.name] = {
            x, y,
            r: data[index], g: data[index + 1], b: data[index + 2], a: data[index + 3],
            at: layer.at,
          }
        }

        // Appel de la fonction de transformation
        this.pixelFunction(width, height, 255, 0, this.state.variables);

        for (let i = 0; i < numLayers; i++) {
          const layer = layers[i];
          const layerVariable = this.state.variables[layer.name];
          // Calcul des coordonnées "wrap-around"
          const wrappedX = ((Math.floor(layerVariable.x) % width) + width) % width;
          const wrappedY = ((Math.floor(layerVariable.y) % height) + height) % height;
          const newIndex = (wrappedY * width + wrappedX) * 4;

          // Écriture des nouvelles valeurs RGBA dans le tableau de données
          const newData = new Uint8ClampedArray(layer.offscreenImage.data.length);
          newData[newIndex] = layerVariable.r;
          newData[newIndex + 1] = layerVariable.g;
          newData[newIndex + 2] = layerVariable.b;
          newData[newIndex + 3] = layerVariable.a;
          newData[newIndex + 3] = layerVariable.a;
          layer.offscreenImage.data.set(newData);
          layer.updateOffscreen();
        }
      }
    }

  }
}