import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
//const backendUrl = "http://localhost:5000";
const apiClient = axios.create({
  baseURL: backendUrl,
});

export default apiClient;
