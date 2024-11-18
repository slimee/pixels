export default function makeFader(state = {}) {
  // Créer les éléments HTML
  const faderContainer = document.createElement('div');
  faderContainer.classList.add('fader-container');

  const faderTrack = document.createElement('div');
  faderTrack.classList.add('fader-track');

  const faderThumb = document.createElement('div');
  faderThumb.classList.add('fader-thumb');

  const faderLabel = document.createElement('div');
  faderLabel.classList.add('fader-label');

  const faderHoverLabel = document.createElement('div');
  faderHoverLabel.classList.add('fader-hover-label');
  faderTrack.appendChild(faderHoverLabel);

  // Assembler les éléments
  faderThumb.appendChild(faderLabel); // L'étiquette est un enfant du curseur
  faderTrack.appendChild(faderThumb);
  faderContainer.appendChild(faderTrack);

  // Variables pour le glissement
  let isDragging = false;
  let isThumbHovered = false;
  let dragOffsetY = 0;

  // Fonction pour mettre à jour la position du curseur
  const updateThumbPosition = () => {
    const percentage = (state.value - state.min) / (state.max - state.min);
    const trackHeight = faderTrack.clientHeight;
    const thumbHeight = faderThumb.clientHeight;

    // Calculer la position en pixels, en tenant compte de la hauteur du curseur
    const position = (1 - percentage) * (trackHeight - thumbHeight);

    // Mettre à jour la position du curseur
    faderThumb.style.top = `${position}px`;

    // Mettre à jour le texte de l'étiquette
    faderLabel.textContent = Math.round(state.value);
  };

  updateThumbPosition();

  // Gestion des événements de souris
  const onMouseDown = (event) => {
    isDragging = true;
    faderLabel.classList.add('visible');

    // Calculer le décalage entre le clic et le centre du curseur
    const thumbRect = faderThumb.getBoundingClientRect();
    dragOffsetY = event.clientY - thumbRect.top;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    event.preventDefault();
  };

  const onMouseMove = (event) => {
    if (!isDragging) return;
    if (!isThumbHovered) {
      faderLabel.classList.remove('visible');
    }

    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const thumbHeight = faderThumb.clientHeight;

    // Calculer la position du curseur en tenant compte du décalage
    let offsetY = event.clientY - trackRect.top - dragOffsetY;

    // Limiter la position du curseur à la piste
    offsetY = Math.max(0, Math.min(offsetY, trackHeight - thumbHeight));

    // Inverser le calcul de percentage
    const percentage = 1 - offsetY / (trackHeight - thumbHeight);

    state.value = state.min + percentage * (state.max - state.min);

    updateThumbPosition();

    // Émettre l'événement 'change'
    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
  };

  const onMouseUp = () => {
    isDragging = false;
    updateThumbPosition();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  faderThumb.addEventListener('mousedown', onMouseDown);

  // Gestion des événements tactiles
  const onTouchStart = (event) => {
    isDragging = true;

    const touch = event.touches[0];
    const thumbRect = faderThumb.getBoundingClientRect();
    dragOffsetY = touch.clientY - thumbRect.top - thumbRect.height / 2;

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    event.preventDefault();
  };

  const onTouchMove = (event) => {
    if (!isDragging) return;

    const touch = event.touches[0];
    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const thumbHeight = faderThumb.clientHeight;

    let offsetY = touch.clientY - trackRect.top - dragOffsetY;

    offsetY = Math.max(0, Math.min(offsetY, trackHeight - thumbHeight));

    const percentage = 1 - offsetY / (trackHeight - thumbHeight);

    state.value = state.min + percentage * (state.max - state.min);

    updateThumbPosition();

    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
  };

  const onTouchEnd = () => {
    isDragging = false;
    updateThumbPosition();
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  };

  faderThumb.addEventListener('touchstart', onTouchStart);

  faderThumb.addEventListener('mouseover', () => {
    isThumbHovered = true;
    faderLabel.classList.add('visible');
  });

  faderThumb.addEventListener('mouseout', () => {
    isThumbHovered = false;
    if (!isDragging) {
      faderLabel.classList.remove('visible');
    }
  });

  // Permettre le clic sur la piste pour déplacer le curseur (souris)
  faderTrack.addEventListener('mousedown', (event) => {
    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const thumbHeight = faderThumb.clientHeight;
    let offsetY = event.clientY - trackRect.top - thumbHeight / 2;

    offsetY = Math.max(0, Math.min(offsetY, trackHeight - thumbHeight));

    const percentage = 1 - offsetY / (trackHeight - thumbHeight);

    state.value = state.min + percentage * (state.max - state.min);

    updateThumbPosition();

    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
  });

  // Gestion du clic sur la piste en tactile
  faderTrack.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const thumbHeight = faderThumb.clientHeight;
    let offsetY = touch.clientY - trackRect.top - thumbHeight / 2;

    offsetY = Math.max(0, Math.min(offsetY, trackHeight - thumbHeight));

    const percentage = 1 - offsetY / (trackHeight - thumbHeight);

    state.value = state.min + percentage * (state.max - state.min);

    updateThumbPosition();

    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
  });

  // Afficher la valeur lors du survol de la piste
  faderTrack.addEventListener('mousemove', (event) => {
    if (event.target === faderThumb) {
      faderHoverLabel.classList.remove('visible');
      return;
    }
    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    let offsetY = event.clientY - trackRect.top;
    offsetY = Math.max(0, Math.min(offsetY, trackHeight));

    // Calculer la valeur correspondante
    const percentage = 1 - offsetY / trackHeight;
    const hoverValue = state.min + percentage * (state.max - state.min);

    // Mettre à jour l'étiquette de survol
    faderHoverLabel.textContent = Math.round(hoverValue);
    faderHoverLabel.style.top = `${offsetY}px`;
    faderHoverLabel.classList.add('visible');
  });

// Cacher l'étiquette de survol lorsque la souris quitte la piste
  faderTrack.addEventListener('mouseleave', () => {
    faderHoverLabel.classList.remove('visible');
  });


  // Fonction pour mettre à jour la valeur depuis l'extérieur
  faderContainer.setValue = (newValue) => {
    state.value = Math.min(Math.max(newValue, state.min), state.max);
    updateThumbPosition();
  };

  // Fonction pour mettre à jour les min et max
  faderContainer.setRange = (newMin, newMax) => {
    state.min = newMin;
    state.max = newMax;
    state.value = Math.min(Math.max(state.value, state.min), state.max);
    updateThumbPosition();
  };

  return faderContainer;
}