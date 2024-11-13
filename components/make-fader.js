export default function makeFader(options = {}) {
  const { min = 0, max = 100, value = 50, state = {} } = options;

  // Créer les éléments HTML
  const faderContainer = document.createElement('div');
  faderContainer.classList.add('fader-container');

  const faderTrack = document.createElement('div');
  faderTrack.classList.add('fader-track');

  const faderThumb = document.createElement('div');
  faderThumb.classList.add('fader-thumb');

  // Assembler les éléments
  faderTrack.appendChild(faderThumb);
  faderContainer.appendChild(faderTrack);

  // Initialiser les valeurs
  state.min = min;
  state.max = max;
  state.value = value;

  // Calculer la position initiale du thumb
  const updateThumbPosition = () => {
    const percentage = (state.value - state.min) / (state.max - state.min);
    const position = percentage * 100;
    faderThumb.style.bottom = `${position}%`;
  };

  updateThumbPosition();

  // Gérer le glissement du thumb
  let isDragging = false;

  const onMouseDown = (event) => {
    isDragging = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    event.preventDefault();
  };

  const onMouseMove = (event) => {
    if (!isDragging) return;

    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const offsetY = event.clientY - trackRect.top;

    let percentage = 1 - offsetY / trackHeight;
    percentage = Math.min(Math.max(percentage, 0), 1);

    state.value = state.min + percentage * (state.max - state.min);
    state.value = Math.round(state.value);

    // Mettre à jour la position du thumb
    updateThumbPosition();

    // Émettre l'événement 'change'
    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  faderThumb.addEventListener('mousedown', onMouseDown);

  // Permettre le clic sur la piste pour déplacer le thumb
  faderTrack.addEventListener('click', (event) => {
    const trackRect = faderTrack.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const offsetY = event.clientY - trackRect.top;

    let percentage = 1 - offsetY / trackHeight;
    percentage = Math.min(Math.max(percentage, 0), 1);

    state.value = state.min + percentage * (state.max - state.min);
    state.value = Math.round(state.value);

    updateThumbPosition();

    // Émettre l'événement 'change'
    const changeEvent = new Event('change');
    faderContainer.dispatchEvent(changeEvent);
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
