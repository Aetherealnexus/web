export function createContentCache() {
  const store = new Map();

  function getKey(key, lang) {
    return `${lang}::${key}`;
  }

  function get(key, lang) {
    return store.get(getKey(key, lang));
  }

  function set(key, lang, value) {
    store.set(getKey(key, lang), value);
    return value;
  }

  function remove(key, lang) {
    store.delete(getKey(key, lang));
  }

  function clear() {
    store.clear();
  }

  return {
    getKey,
    get,
    set,
    remove,
    clear
  };
}