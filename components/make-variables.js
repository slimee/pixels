import * as acorn from 'https://unpkg.com/acorn@8.8.1/dist/acorn.mjs';
import * as acornWalk from 'https://unpkg.com/acorn-walk@8.2.0/dist/walk.mjs';
import * as astring from 'https://unpkg.com/astring@1.9.0/dist/astring.mjs';

export default function makeVariables() {
  function validateVariableNames(variableNames) {
    // Liste des mots-clés réservés et des objets intégrés
    const reservedWords = new Set([
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
      'private', 'protected', 'public', 'static', 'yield'
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

  function prefixVariablesInCode(code, variableNames) {
    // Parser le code en un AST
    const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });

    const variablesSet = new Set(variableNames);

    // Parcourir et modifier l'AST
    acornWalk.ancestor(ast, {
      Identifier(node, ancestors) {
        const parent = ancestors[ancestors.length - 2]; // Le parent direct
        if (variablesSet.has(node.name)) {
          if (!(
            (parent.type === 'VariableDeclarator' && parent.id === node) ||
            (parent.type === 'FunctionDeclaration' && parent.id === node) ||
            (parent.type === 'FunctionExpression' && parent.params.includes(node)) ||
            (parent.type === 'ArrowFunctionExpression' && parent.params.includes(node)) ||
            (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
            (parent.type === 'Property' && parent.key === node && !parent.computed)
          )) {
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
    });

    return astring.generate(ast);
  }

  return function transformCode(code, variables) {
    const variableNames = variables.map(v => v.trim()).filter(v => v);
    const { validVariableNames, invalidVariableNames } = validateVariableNames(variableNames);

    if (invalidVariableNames.length > 0) {
      alert('Les noms de variables suivants sont réservés et ne peuvent pas être utilisés : ' + invalidVariableNames.join(', '));
    }

    return prefixVariablesInCode(code, validVariableNames);
  };
}