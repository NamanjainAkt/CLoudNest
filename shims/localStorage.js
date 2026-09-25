class LocalStorage {
  constructor() {
    this._data = {};
  }
  getItem(key) {
    return this._data[key] !== undefined ? this._data[key] : null;
  }
  setItem(key, value) {
    this._data[key] = String(value);
  }
  removeItem(key) {
    delete this._data[key];
  }
  clear() {
    this._data = {};
  }
}

module.exports = {
  LocalStorage,
};
