export default class State {
  constructor(initialState = {}, nonReactiveProperties = {}) {
    this._listeners = {}; // Gestionnaires d'événements

    // Initialiser les propriétés
    this._initializeReactiveProperties(initialState);
    this._initializeNonReactiveProperties(nonReactiveProperties);
  }

  // Ajouter un écouteur
  on(propertyPath, callback) {
    if (!this._isPathReactive(propertyPath)) {
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
        const nestedObject = {};
        Object.defineProperty(parent, key, {
          get() {
            return nestedObject;
          },
          set() {
            throw new Error(`Cannot overwrite nested reactive object "${key}"`);
          },
          enumerable: true,
        });

        this._initializeReactiveProperties(value, propertyPath, nestedObject);
      } else {
        // Propriété primitive : ajouter un getter et un setter
        let internalValue = value;

        Object.defineProperty(parent, key, {
          get() {
            return internalValue;
          },
          set(newValue) {
            if (internalValue !== newValue) {
              internalValue = newValue;
              this._emit(propertyPath, newValue); // Émettre un événement
            }
          },
          enumerable: true, // Permet la sérialisation et les boucles
        });
      }
    }
  }

  // Initialiser les propriétés non réactives
  _initializeNonReactiveProperties(obj) {
    for (const [key, value] of Object.entries(obj)) {
      // Vérification de conflit
      if (this.hasOwnProperty(key)) {
        throw new Error(`Conflict detected: The property "${key}" already exists as a reactive property.`);
      }

      this[key] = value; // Ajouter la propriété directement
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
      // Ajouter une propriété réactive
      let internalValue = value;

      Object.defineProperty(current, lastKey, {
        get() {
          return internalValue;
        },
        set(newValue) {
          if (internalValue !== newValue) {
            internalValue = newValue;
            this._emit(propertyPath, newValue); // Émettre un événement
          }
        },
        enumerable: true, // Permet la sérialisation et les boucles
      });
    } else {
      // Ajouter une propriété non réactive
      current[lastKey] = value;
    }
  }
}
