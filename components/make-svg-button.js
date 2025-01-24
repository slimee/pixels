import createElement from "../utils/create-element.js";

export default function makeSvgButton(icon, title, onClick) {
  const component = createElement(`
        <button title="${title}"><svg><use href="svp.svg#${icon}"></use></svg></button>
      `);
  component.addEventListener('click', onClick);
  return component;
}