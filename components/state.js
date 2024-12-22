export default class State {
  constructor(initialState = {}, nonReactiveProperties = {}) {
    this._listeners = {}; // Gestionnaires d'événements

    // Initialiser les propriétés
    this._initializeReactiveProperties(initialState);
    this._initializeNonReactiveProperties(nonReactiveProperties);
  }

  static fromJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    const initialState = parsed.reactive || {};
    const nonReactiveProperties = parsed.nonReactive || {};
    return new State(initialState, nonReactiveProperties);
  }

  toJSON() {
    const serialize = (obj) => {
      const result = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            result[key] = serialize(obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }
      return result;
    };

    const reactiveState = serialize(this);
    const nonReactiveState = serialize(this._nonReactiveProperties || {});
    return JSON.stringify({ reactive: reactiveState, nonReactive: nonReactiveState });
  }

  // Ajouter un écouteur
  on(propertyPath, callback) {
    if (!this._isPathReactive(propertyPath) && !propertyPath.endsWith('.+') && !propertyPath.endsWith('.-')) {
      throw new Error(`The path "${propertyPath}" is not a reactive property.`);
    }
    if (!this._listeners[propertyPath]) {
      this._listeners[propertyPath] = [];
    }
    this._listeners[propertyPath].push(callback);
  }

  // Supprimer un écouteur
  off(propertyPath, callback) {
    if (this._listeners[propertyPath]) {
      this._listeners[propertyPath] = this._listeners[propertyPath].filter(cb => cb !== callback);
    }
  }

  // Émettre un événement
  _emit(propertyPath, value) {
    if (this._listeners[propertyPath]) {
      this._listeners[propertyPath].forEach(callback => callback(value));
    }
  }

  // Vérifier si un chemin est réactif
  _isPathReactive(propertyPath) {
    const keys = propertyPath.split('.');
    let current = this;

    for (const key of keys) {
      // Vérifier si la propriété existe
      if (!current || !Object.prototype.hasOwnProperty.call(current, key)) {
        return false; // Le chemin n'existe pas
      }

      // Vérifier si la propriété est bien accessible
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!descriptor || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
        return false; // La propriété n'est pas réactive
      }

      // Naviguer dans l'objet imbriqué
      current = current[key];
    }
    return true; // Le chemin est réactif
  }

  // Initialiser les propriétés réactives
  _initializeReactiveProperties(obj, basePath = '', parent = this) {
    for (const [key, value] of Object.entries(obj)) {
      const propertyPath = basePath ? `${basePath}.${key}` : key;

      // Vérification de conflit
      if (parent.hasOwnProperty(key)) {
        throw new Error(`Conflict detected: The property "${key}" already exists as a non-reactive property.`);
      }

      if (typeof value === 'object' && value !== null) {
        // Sous-objet : créer récursivement les sous-propriétés
        let internalValue = {};
        this._initializeReactiveProperties(value, propertyPath, internalValue);

        const instance = this; // Capturer une référence explicite à l'instance de State
        Object.defineProperty(parent, key, {
          get() {
            return internalValue;
          },
          set(newValue) {
            if (internalValue !== newValue) {
              internalValue = newValue;
              instance._emit(propertyPath, newValue);
            }
          },
          enumerable: true,
          configurable: true,
        });
      } else {
        // Propriété primitive : ajouter un getter et un setter
        let internalValue = value;
        const instance = this; // Capturer une référence explicite à l'instance de State

        Object.defineProperty(parent, key, {
          get() {
            return internalValue;
          },
          set(newValue) {
            if (internalValue !== newValue) {
              internalValue = newValue;
              instance._emit(propertyPath, newValue); // Émettre un événement dans le bon contexte
            }
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  // Initialiser les propriétés non réactives
  _initializeNonReactiveProperties(obj) {
    this._nonReactiveProperties = {};
    for (const [key, value] of Object.entries(obj)) {
      // Vérification de conflit
      if (this.hasOwnProperty(key)) {
        throw new Error(`Conflict detected: The property "${key}" already exists as a reactive property.`);
      }
      this[key] = value;
      this._nonReactiveProperties[key] = value;
    }
  }

  // Ajouter dynamiquement une propriété (réactive ou non)
  addProperty(propertyPath, value, reactive = true) {
    const keys = propertyPath.split('.');
    const lastKey = keys.pop();
    let current = this;

    // Naviguer jusqu'à l'objet parent
    keys.forEach(key => {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    });

    // Vérification de conflit
    if (current.hasOwnProperty(lastKey)) {
      throw new Error(
        `Conflict detected: The property "${lastKey}" already exists as ${
          typeof current[lastKey] === 'function' ? 'non-reactive' : 'reactive'
        }.`
      );
    }

    if (reactive) {
      if (typeof value === 'object' && value !== null) {
        // Ajouter un objet réactif
        const nestedObject = {};
        Object.defineProperty(current, lastKey, {
          get() {
            return nestedObject;
          },
          set() {
            throw new Error(`Cannot overwrite nested reactive object "${lastKey}"`);
          },
          enumerable: true,
          configurable: true,
        });

        // Initialiser récursivement les propriétés réactives
        this._initializeReactiveProperties(value, `${propertyPath}`, nestedObject);
      } else {
        // Ajouter une propriété réactive simple
        let internalValue = value;
        const instance = this; // Capturer explicitement le contexte de State

        Object.defineProperty(current, lastKey, {
          get() {
            return internalValue;
          },
          set(newValue) {
            if (internalValue !== newValue) {
              internalValue = newValue;
              instance._emit(propertyPath, newValue); // Émettre un événement dans le bon contexte
            }
          },
          enumerable: true, // Permet la sérialisation et les boucles
          configurable: true,
        });
      }
    } else {
      // Ajouter une propriété non réactive
      current[lastKey] = value;
    }

    // Émettre un événement d'ajout
    this._emit(`${keys.join('.')}.+`, value);
  }

  // Supprimer dynamiquement une propriété
  removeProperty(propertyPath) {
    const keys = propertyPath.split('.');
    const lastKey = keys.pop();
    let current = this;

    // Naviguer jusqu'à l'objet parent
    keys.forEach(key => {
      if (!current[key]) {
        throw new Error(`The path "${propertyPath}" does not exist.`);
      }
      current = current[key];
    });

    // Vérification d'existence
    if (!current.hasOwnProperty(lastKey)) {
      throw new Error(`The property "${lastKey}" does not exist.`);
    }

    // Sauvegarder la valeur avant suppression pour l'événement
    const value = current[lastKey];

    // Supprimer la propriété
    delete current[lastKey];

    // Émettre un événement de suppression
    this._emit(propertyPath, undefined);
    this._emit(`${keys.join('.')}.-`, value);
  }
}
