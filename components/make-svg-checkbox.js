import createElement from "../utils/create-element.js";

let i = 0;

export default function makeSvgCheckbox(symbol, symbol2, checked, title, onChange) {
  const id = `svg-box-${++i}`;
  const component = createElement(`
        <label class="checkbox" for="${id}" title="${title}">
            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            <svg class="icon">
                <use href="svg.svg#${symbol}" class="show"></use>
                <use href="svg.svg#${symbol2}" class="hide"></use>
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