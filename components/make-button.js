import createElement from "../utils/create-element.js";

export default function makeButton(icon, title, onClick) {
  const component = createElement(`
        <button title="${title}"><i class="${icon}"></i></button>
      `);
  component.addEventListener('click', onClick);
  return component;
}