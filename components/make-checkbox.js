import createElement from "../utils/create-element.js";

let i = 0;

export default function makeCheckbox(show, hide, checked, title, onChange) {
  const id = `checkbox-${++i}`;
  const component = createElement(`
        <label class="checkbox" for="${id}" title="${title}">
            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            <i class="${show} show"></i>
            <i class="${hide} hide"></i>
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