(function () {
  const STORAGE_KEY = "gerencomiza_data_sdk_expenses";
  const SESSION_KEY = "gerencomiza_user";

  let handler = null;

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("Falha ao ler dados do dataSdk", error);
      return fallback;
    }
  }

  function getSession() {
    return safeParse(localStorage.getItem(SESSION_KEY), null);
  }

  function getUserKey() {
    return getSession()?.email || "__guest__";
  }

  function getStore() {
    return safeParse(localStorage.getItem(STORAGE_KEY), {});
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getCurrentList() {
    const store = getStore();
    return Array.isArray(store[getUserKey()]) ? store[getUserKey()] : [];
  }

  function emitCurrentList() {
    if (typeof handler?.onDataChanged === "function") {
      handler.onDataChanged(getCurrentList());
    }
  }

  function withIds(items) {
    return items.map((item, index) => ({
      ...item,
      __backendId: item.__backendId || item.id || `expense_${Date.now()}_${index}`,
    }));
  }

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY || event.key === SESSION_KEY) {
      emitCurrentList();
    }
  });

  window.dataSdk = {
    async init(nextHandler) {
      handler = nextHandler || null;
      emitCurrentList();
      return { isOk: true };
    },

    async create(payload) {
      try {
        const store = getStore();
        const userKey = getUserKey();
        const list = withIds(Array.isArray(store[userKey]) ? store[userKey] : []);
        const item = {
          ...payload,
          __backendId: `expense_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        };

        list.push(item);
        store[userKey] = list;
        saveStore(store);
        emitCurrentList();

        return { isOk: true, value: item };
      } catch (error) {
        console.error("Falha ao criar item", error);
        return { isOk: false, error };
      }
    },

    async delete(item) {
      try {
        const store = getStore();
        const userKey = getUserKey();
        const list = withIds(Array.isArray(store[userKey]) ? store[userKey] : []);
        store[userKey] = list.filter((entry) => entry.__backendId !== item?.__backendId);
        saveStore(store);
        emitCurrentList();

        return { isOk: true };
      } catch (error) {
        console.error("Falha ao excluir item", error);
        return { isOk: false, error };
      }
    },

    refresh() {
      emitCurrentList();
      return { isOk: true };
    },
  };
})();
