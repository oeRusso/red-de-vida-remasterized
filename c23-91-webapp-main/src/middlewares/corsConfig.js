import cors from "cors";

const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:8080",
    "https://c23-91-webapp-nfvs.onrender.com",
    "https://red-de-vida.netlify.app",
  ],
};

export default cors(corsOptions);
