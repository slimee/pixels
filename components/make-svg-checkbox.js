import createElement from "../utils/create-element.js";

let i = 0;

export default function makeSvgCheckbox(symbol, checked, title, onChange) {
  const id = `box-${++i}`;
  const component = createElement(`
        <label class="checkbox" for="${id}" title="${title}">
            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            <svg class="icon">
                <use href="sprite.svg#${symbol}"></use>
            </svg>
        </label>
      `);
  const box = component.querySelector('input');
  box.addEventListener('change', onChange);

  Object.defineProperty(component, 'checked', {
    get() {
      return box.checked;
    },
    set(value) {
      box.checked = value;
    },
  });

  return component;
}