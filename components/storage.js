export default class Storage {
  load(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  drop(key) {
    localStorage.removeItem(key);
  }
}