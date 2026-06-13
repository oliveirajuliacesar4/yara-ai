(function () {
  const sdk = {
    config: {},
    _options: null,
    init(options) {
      this._options = options || {};
      this.config = { ...(options?.defaultConfig || {}) };

      if (typeof options?.onConfigChange === "function") {
        options.onConfigChange(this.config);
      }

      return { isOk: true };
    },
    setConfig(nextConfig) {
      this.config = { ...this.config, ...(nextConfig || {}) };

      if (typeof this._options?.onConfigChange === "function") {
        this._options.onConfigChange(this.config);
      }

      return { isOk: true };
    },
  };

  window.elementSdk = sdk;
})();
