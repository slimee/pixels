export default class Component extends EventTarget {
  emit(eventType, value) {
    const event = new CustomEvent(eventType, { detail: value });
    super.dispatchEvent(event);
  }

  on(eventType, callback) {
    this.addEventListener(eventType, (event) => callback(event.detail));
  }
}