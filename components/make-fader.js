function makeFaderUI(name) {
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

  // Label pour le nom du fader
  const faderNameInput = document.createElement('input');
  faderNameInput.classList.add('fader-name-input');
  faderNameInput.type = 'text';
  faderNameInput.value = name;

  // Assembler les éléments
  faderThumb.appendChild(faderLabel); // L'étiquette est un enfant du curseur
  faderTrack.appendChild(faderThumb);
  faderContainer.appendChild(faderTrack);
  faderContainer.appendChild(faderNameInput);

  return {
    faderLabel, faderThumb, faderTrack, faderHoverLabel, faderContainer, faderNameInput
  }
}

export default function makeFader(state, onChange) {
  const {
    faderLabel,
    faderThumb,
    faderTrack,
    faderHoverLabel,
    faderContainer,
    faderNameInput
  } = makeFaderUI(state.name);
  // Variables pour le glissement
  let isDragging = false;
  let isThumbHovered = false;
  let dragOffsetY = 0;

  const updateThumbPosition = () => {
    const percentage = (state.value - state.min) / (state.max - state.min);
    const trackHeight = faderTrack.clientHeight;
    const thumbHeight = faderThumb.clientHeight;
    const position = (1 - percentage) * (trackHeight - thumbHeight);
    faderThumb.style.top = `${position}px`;
    faderLabel.textContent = Math.round(state.value);
  };
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

  faderThumb.addEventListener('mousedown', onMouseDown);
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
  faderTrack.addEventListener('mouseleave', () => {
    faderHoverLabel.classList.remove('visible');
  });

  faderNameInput.addEventListener('blur', (event) => {
    state.oldName = state.name;
    state.name = event.target.value;
    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
  });

  faderContainer.setValue = (newValue) => {
    state.value = Math.min(Math.max(newValue, state.min), state.max);
    updateThumbPosition();
  };
  faderContainer.setRange = (newMin, newMax) => {
    state.min = newMin;
    state.max = newMax;
    state.value = Math.min(Math.max(state.value, state.min), state.max);
    updateThumbPosition();
  };
  faderContainer.addEventListener('change', onChange);
  onChange();

  requestAnimationFrame(updateThumbPosition);

  return faderContainer;
}