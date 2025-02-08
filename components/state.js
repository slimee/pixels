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
    if (
      !this._isPathReactive(propertyPath) &&
      !propertyPath.endsWith('.+') &&
      !propertyPath.endsWith('.-')
    ) {
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
      this._listeners[propertyPath] = this._listeners[propertyPath].filter(
        (cb) => cb !== callback
      );
    }
  }

  // Émettre un événement
  _emit(propertyPath, value) {
    if (this._listeners[propertyPath]) {
      this._listeners[propertyPath].forEach((callback) => callback(value));
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

      // Vérifier si la propriété est bien accessible (getter/setter)
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
        throw new Error(
          `Conflict detected: The property "${key}" already exists as a non-reactive property.`
        );
      }

      if (typeof value === 'object' && value !== null) {
        // Sous-objet : créer récursivement les sous-propriétés
        let internalValue = {};
        this._initializeReactiveProperties(value, propertyPath, internalValue);

        const instance = this; // Capturer une référence à l'instance
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
        // Propriété primitive : ajouter getter et setter
        let internalValue = value;
        const instance = this; // Capturer le contexte

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
      }
    }
  }

  // Initialiser les propriétés non réactives
  _initializeNonReactiveProperties(obj) {
    this._nonReactiveProperties = {};
    for (const [key, value] of Object.entries(obj)) {
      // Vérification de conflit
      if (this.hasOwnProperty(key)) {
        throw new Error(
          `Conflict detected: The property "${key}" already exists as a reactive property.`
        );
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
    keys.forEach((key) => {
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
        const instance = this; // Capturer le contexte

        Object.defineProperty(current, lastKey, {
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
      }
    } else {
      // Ajouter une propriété non réactive
      current[lastKey] = value;
    }

    // Émettre un événement d'ajout sur le parent
    this._emit(`${keys.join('.')}.+`, value);
  }

  // Supprimer dynamiquement une propriété
  removeProperty(propertyPath) {
    const keys = propertyPath.split('.');
    const lastKey = keys.pop();
    let current = this;

    // Naviguer jusqu'à l'objet parent
    keys.forEach((key) => {
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

  /**
   * Méthode watch
   *
   * Permet de logguer dans la console :
   * - Le changement de valeur d'une propriété réactive,
   * - L'ajout de la propriété (lorsqu'elle n'existait pas et qu'elle est ajoutée),
   * - Sa suppression (lorsqu'elle est retirée).
   *
   * Exemple d'utilisation :
   *   state.watch('user.name');
   */
  watch(propertyPath) {
    // Décomposer le chemin
    const parts = propertyPath.split('.');
    const lastKey = parts.pop();
    const parentPath = parts.join('.');

    // Calcul de la référence vers l'objet parent
    const getParent = () =>
      parentPath
        ? parentPath.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), this)
        : this;

    // On mémorise l'existence initiale de la propriété
    let previousExists = !!(getParent() && Object.prototype.hasOwnProperty.call(getParent(), lastKey));

    // Surveiller les changements de valeur de la propriété (si elle est réactive)
    try {
      this.on(propertyPath, (newValue) => {
        console.log(`[watch] La propriété "${propertyPath}" a changé de valeur :`, newValue);
      });
    } catch (e) {
      console.warn(
        `[watch] Impossible de surveiller les changements de valeur sur "${propertyPath}" : le chemin n'est pas réactif.`
      );
    }

    // Événements d'ajout et de suppression :
    // Les événements d'ajout/suppression sont émis sur l'objet parent avec le suffixe ".+" ou ".-"
    const addEvent = parentPath ? `${parentPath}.+` : '.+';
    const removeEvent = parentPath ? `${parentPath}.-` : '.-';

    this.on(addEvent, () => {
      const parent = getParent();
      const nowExists = parent && Object.prototype.hasOwnProperty.call(parent, lastKey);
      if (!previousExists && nowExists) {
        console.log(
          `[watch] Ajout de la propriété "${propertyPath}" avec la valeur :`,
          parent[lastKey]
        );
        previousExists = true;
      }
    });

    this.on(removeEvent, (oldValue) => {
      const parent = getParent();
      const nowExists = parent && Object.prototype.hasOwnProperty.call(parent, lastKey);
      if (previousExists && !nowExists) {
        console.log(
          `[watch] Suppression de la propriété "${propertyPath}". Ancienne valeur :`,
          oldValue
        );
        previousExists = false;
      }
    });
  }
}
