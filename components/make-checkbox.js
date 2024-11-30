import createElement from "../utils/create-element.js";

let i = 0;

export default function makeCheckbox(show, hide, checked, onChange) {
  const id = `checkbox-${++i}`;
  const component = createElement(`
        <label class="checkbox" for="${id}">
            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            <i class="bx ${show} show"></i>
            <i class="bx ${hide} hide"></i>
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