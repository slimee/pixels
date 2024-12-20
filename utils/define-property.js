export default function defineProperty(host, name, component) {
  const secureName = `sm-${name}`;

  Object.defineProperty(host, name, {
    get() {
      return component.getAttribute(secureName)
    },
    set(value) {
      component.setAttribute(secureName, value);
    },
  });
}