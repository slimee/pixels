export default class Storage {
  load(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  get(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  drop(key) {
    localStorage.removeItem(key);
  }
}