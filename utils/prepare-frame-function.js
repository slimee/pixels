import * as acorn from 'https://unpkg.com/acorn@8.8.1/dist/acorn.mjs';
import * as acornWalk from 'https://unpkg.com/acorn-walk@8.2.0/dist/walk.mjs';
import * as astring from 'https://unpkg.com/astring@1.9.0/dist/astring.mjs';
import InvalidVariablesNamesError from "../errors/invalid-variables-names-error.js";

function validateVariableNames(variableNames) {
  // Liste des mots-clés réservés et des objets intégrés
  const reservedWords = new Set([
    // Variables de la fonction
    'x', 'y',
    // Mots-clés réservés
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    // Objets intégrés
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
    'Object', 'RegExp', 'String', 'Promise', 'Symbol', 'Map', 'Set', 'WeakMap',
    'WeakSet', 'Proxy', 'Reflect', 'Intl', 'WebAssembly', 'BigInt',
    // Autres globales
    'console', 'window', 'document', 'undefined', 'null', 'NaN', 'Infinity',
    // Noms spéciaux
    'arguments', 'eval', 'await', 'enum', 'implements', 'interface', 'package',
    'private', 'protected', 'public', 'static'
  ]);

  // Listes pour les noms de variables valides et invalides
  const validVariableNames = [];
  const invalidVariableNames = [];

  // Vérifier chaque nom de variable
  variableNames.forEach(varName => {
    if (reservedWords.has(varName)) {
      invalidVariableNames.push(varName);
    } else {
      validVariableNames.push(varName);
    }
  });

  return {
    validVariableNames,
    invalidVariableNames
  };
}

function isVariableUse(node, parent) {
  // Détermine si le nœud est une utilisation de variable (et non une déclaration ou une propriété)
  if (parent.type === 'VariableDeclarator' && parent.id === node) {
    return false; // Déclaration de variable
  }
  if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression') && (parent.id === node || parent.params.includes(node))) {
    return false; // Nom ou paramètre de fonction
  }
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) {
    return false; // Propriété non calculée d'un membre
  }
  if (parent.type === 'Property' && parent.key === node && !parent.computed) {
    return false; // Clé d'une propriété dans un objet
  }
  // Ajouter d'autres cas si nécessaire
  return true; // Sinon, c'est une utilisation de variable
}

export default function prepareFrameFunction(code, variables) {
  const variableNames = variables.map(v => v.trim()).filter(v => v);
  const { invalidVariableNames } = validateVariableNames(variableNames);

  if (invalidVariableNames.length) {
    throw new InvalidVariablesNamesError(invalidVariableNames);
  }

  // Parser le code en un AST
  const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });

  const variablesSet = new Set(variableNames);
  const usedVariables = new Set();
  const allVariablesUsed = new Set();

  const builtInVariables = new Set([
    // Objets intégrés et globales communes
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
    'Object', 'RegExp', 'String', 'Promise', 'Symbol', 'Map', 'Set', 'WeakMap',
    'WeakSet', 'Proxy', 'Reflect', 'Intl', 'WebAssembly', 'BigInt',
    'console', 'window', 'document', 'undefined', 'null', 'NaN', 'Infinity'
  ]);

  // Définir un visiteur de base personnalisé qui traverse les motifs
  const customBaseVisitor = {
    ...acornWalk.base,
    VariableDeclarator(node, state, c) {
      c(node.id, state);
      if (node.init) c(node.init, state);
    },
    AssignmentExpression(node, state, c) {
      c(node.left, state);
      c(node.right, state);
    },
    FunctionDeclaration(node, state, c) {
      if (node.id) c(node.id, state);
      for (const param of node.params) c(param, state);
      c(node.body, state);
    },
    FunctionExpression(node, state, c) {
      if (node.id) c(node.id, state);
      for (const param of node.params) c(param, state);
      c(node.body, state);
    },
    ArrowFunctionExpression(node, state, c) {
      for (const param of node.params) c(param, state);
      c(node.body, state);
    },
    // Ajouter d'autres nœuds si nécessaire
  };

  // Utiliser acornWalk.fullAncestor avec la bonne signature
  acornWalk.fullAncestor(ast, (node, state, ancestors) => {
    if (node.type === 'Identifier') {
      const parent = ancestors[ancestors.length - 2]; // Le parent direct

      if (isVariableUse(node, parent)) {
        allVariablesUsed.add(node.name); // Collecter toutes les variables utilisées
      }

      if (variablesSet.has(node.name)) {
        usedVariables.add(node.name); // Stocker la variable utilisée

        if (isVariableUse(node, parent)) {
          // Remplacer l'identifiant par variables.identifiant
          Object.assign(node, {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'variables' },
            property: { type: 'Identifier', name: node.name },
            computed: false
          });
        }
      }
    }
  }, customBaseVisitor);

  return {
    preparedFrameFunction: astring.generate(ast),
    usedVariables: Array.from(usedVariables),
    unprefixedVariables: Array.from(allVariablesUsed)
      .filter(varName => !usedVariables.has(varName) && !builtInVariables.has(varName))
  };
}