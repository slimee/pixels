import createElement from "../utils/create-element.js";
import defineProperty from "../utils/define-property.js";
import Component from "../utils/component.js";

let i = 0;

export default function makeNewFader(parent, { name, min, max, value, step }) {
  const range = createElement(`
    <input type="range" id="fader-${i++}" name="${name}" min="${min}" max="${max}" value="${value}" step="${step}"
      style="writing-mode: vertical-lr;"/>
  `);
  parent.appendChild(range);

  const component = new Component();
  range.addEventListener('input', (event) => {
    component.emit('value', Number(event.target.value));
  });
  defineProperty(component, 'name', range);
  defineProperty(component, 'min', range);
  defineProperty(component, 'max', range);
  defineProperty(component, 'value', range);
  defineProperty(component, 'step', range);

  return component;
}