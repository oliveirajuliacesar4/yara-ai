window.ATLAS_CONFIG = {
  API_BASE_URL:
    window.ATLAS_API_BASE_URL ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5500"
      : "https://api.atlasone.com"),
};
