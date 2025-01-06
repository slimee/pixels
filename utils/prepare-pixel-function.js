import * as acorn from 'https://unpkg.com/acorn@8.8.1/dist/acorn.mjs';
import * as acornWalk from 'https://unpkg.com/acorn-walk@8.2.0/dist/walk.mjs';
import * as astring from 'https://unpkg.com/astring@1.9.0/dist/astring.mjs';

export default function preparePixelFunction(code, layerNames) {
  const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });

  // Préparation des maps pour accès direct
  // Exemple: pour c1 on fera inputDataC1 et outputDataC1
  const layerReadVars = {};   // { c1: 'inputDataC1', ... }
  const layerWriteVars = {};  // { c1: 'outputDataC1', ... }

  layerNames.forEach(layer => {
    layerReadVars[layer] = `input${layer}`;
    layerWriteVars[layer] = `output${layer}`;
  });

  // Fonctions utilitaires pour l’AST
  function isLayerName(name) {
    return layerNames.includes(name);
  }

  function replaceMemberExpression(node) {
    // On gère les accès du type cN.x, cN.r, etc.
    if (node.object.type === 'Identifier' && isLayerName(node.object.name)) {
      const layer = node.object.name;
      if (node.property.type === 'Identifier') {
        const prop = node.property.name;
        // cN.x, cN.y, cN.r, cN.g, cN.b, cN.a
        if (['x', 'y', 'r', 'g', 'b', 'a'].includes(prop)) {
          // Remplacer par cN_x, cN_y, cN_r ...
          return {
            type: 'Identifier',
            name: `${layer}_${prop}`
          };
        } else if (prop === 'at') {
          // cN.at(...) est géré plus tard (au niveau des CallExpression)
          return node;
        }
      }
    }
    return node;
  }

  function transformAtCall(node) {
    // cN.at(px, py).r
    // on doit repérer ce pattern : (CallExpression (MemberExpression cN.at) (args)) . r/g/b/a
    // On s’attend à un MemberExpression parent qui accède .r/g/b/a
    // Ou un Assignment d’un canal
    // node est le MemberExpression cN.at(...)
    if (node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      isLayerName(node.callee.object.name) &&
      node.callee.property.name === 'at') {
      // node.arguments : [px, py]
      const layer = node.callee.object.name;
      const px = node.arguments[0];
      const py = node.arguments[1];
      return { layer, px, py };
    }
    return null;
  }

  // On va parcourir l’AST et transformer
  acornWalk.simple(ast, {
    MemberExpression(node) {
      // Remplacer les cN.x par cN_x
      Object.assign(node, replaceMemberExpression(node));
    },
    CallExpression(node) {
      // repérer cN.at(px,py)
      const atInfo = transformAtCall(node);
      if (atInfo) {
        // On laisse tel quel, c'est au parent (MemberExpression ou Assignment) de le gérer
      }
    }
  });

  // Deuxième passe pour gérer cN.at(px, py).r etc.
  // On a besoin de fullAncestor pour voir le parent
  acornWalk.fullAncestor(ast, (node, ancestors) => {
    if (node.type === 'MemberExpression' &&
      node.object.type === 'CallExpression') {
      const callNode = node.object;
      const atInfo = transformAtCall(callNode);
      if (atInfo) {
        // cN.at(px, py).r
        const channel = node.property.name; // 'r', 'g', 'b', 'a'

        // Lecture: getPixelChannel(inputDataCN, width, height, px, py, 'r')
        // Écriture: setPixelChannel(outputDataCN, width, height, px, py, 'r', value)

        // Pour savoir si c'est une écriture, on regarde le parent :
        const parent = ancestors[ancestors.length - 2];
        let isWrite = false;
        if (parent.type === 'AssignmentExpression' && parent.left === node) {
          isWrite = true;
        }

        if (isWrite) {
          // cN.at(px,py).r = value => setPixelChannel(outputDataCN, width, height, px, py, 'r', value)
          Object.assign(parent, {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'setPixelChannel' },
            arguments: [
              { type: 'Identifier', name: layerWriteVars[atInfo.layer] },
              { type: 'Identifier', name: 'width' },
              { type: 'Identifier', name: 'height' },
              atInfo.px,
              atInfo.py,
              { type: 'Literal', value: channel },
              parent.right
            ]
          });
        } else {
          // Lecture
          Object.assign(node, {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'getPixelChannel' },
            arguments: [
              { type: 'Identifier', name: layerReadVars[atInfo.layer] },
              { type: 'Identifier', name: 'width' },
              { type: 'Identifier', name: 'height' },
              atInfo.px,
              atInfo.py,
              { type: 'Literal', value: channel }
            ]
          });
        }
      }
    }
  });

  // Construction du préambule
  let initCode = '';
  layerNames.forEach(layer => {
    initCode += `
      let ${layer}_x = x;
      let ${layer}_y = y;
      let ${layer}Index = (y * width + x)*4;
      let ${layer}_r = ${layerReadVars[layer]}[${layer}Index];
      let ${layer}_g = ${layerReadVars[layer]}[${layer}Index+1];
      let ${layer}_b = ${layerReadVars[layer]}[${layer}Index+2];
      let ${layer}_a = ${layerReadVars[layer]}[${layer}Index+3];
    `;
  });

  const userCode = astring.generate(ast);

  // Construction du postambule (réécriture dans output)
  let finalCode = '';
  layerNames.forEach(layer => {
    finalCode += `
      {
        let finalIndex = (wrapY(${layer}_y) * width + wrapX(${layer}_x))*4;
        ${layer}Index = finalIndex;
        ${layerWriteVars[layer]}[finalIndex] = ${layer}_r;
        ${layerWriteVars[layer]}[finalIndex+1] = ${layer}_g;
        ${layerWriteVars[layer]}[finalIndex+2] = ${layer}_b;
        ${layerWriteVars[layer]}[finalIndex+3] = ${layer}_a;
      }
    `;
  });

  return `${initCode}${userCode}${finalCode}`;
}
