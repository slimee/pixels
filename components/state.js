class State {
  constructor(initialState = {}, nonReactiveProperties = {}) {
    this._listeners = {}; // Gestionnaires d'événements
    this._initializeReactiveProperties(initialState); // Propriétés réactives
    this._initializeNonReactiveProperties(nonReactiveProperties); // Propriétés non réactives
  }

  // Ajouter un écouteur
  on(propertyPath, callback) {
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

  // Initialiser les propriétés réactives
  _initializeReactiveProperties(obj, basePath = '') {
    for (const [key, value] of Object.entries(obj)) {
      const propertyPath = basePath ? `${basePath}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        // Sous-objet : récursion pour créer les sous-propriétés
        this[key] = {};
        this._initializeReactiveProperties(value, propertyPath);
      } else {
        // Propriété primitive : ajouter un getter et un setter
        let internalValue = value;

        Object.defineProperty(this, key, {
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

  // Sérialiser uniquement les propriétés réactives
  serialize() {
    const reactiveState = {};
    for (const key in this) {
      if (this.hasOwnProperty(key) && typeof this[key] !== 'function' && typeof this[key] !== 'object') {
        reactiveState[key] = this[key];
      }
    }
    return JSON.stringify(reactiveState);
  }
}
