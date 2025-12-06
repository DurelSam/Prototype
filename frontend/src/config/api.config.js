require("dotenv").config();

// Configuration de l'API Backend
const config = {
  development: {
    apiUrl: "http://localhost:5000/api",
    baseUrl: "http://localhost:5000",
  },
  production: {
    apiUrl:
      process.env.REACT_APP_API_URL || "https://your-production-api.com/api",
    baseUrl:
      process.env.REACT_APP_BASE_URL || "https://your-production-api.com",
  },
};

const environment = process.env.NODE_ENV || "development";

export const API_CONFIG = config[environment];

export default API_CONFIG;
