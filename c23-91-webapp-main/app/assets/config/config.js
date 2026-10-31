const config = {
  API_URL:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:8080/api" // Desarrollo (local)
      : "https://c23-91-webapp-nfvs.onrender.com/api", // Producción (Render)

  AUTH_URL:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:8080/auth" // Desarrollo (local)
      : "https://c23-91-webapp-nfvs.onrender.com/auth", // Producción (Render)
};
