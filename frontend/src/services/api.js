import axios from "axios";

/* =========================
   API CONFIGURATION
========================= */

export const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000
});

/* =========================
   METRICS
========================= */

export const getMetrics = async () => {

  const response =
    await api.get("/metrics");

  return response.data;
};

/* =========================
   LOGS
========================= */

export const getLogs = async () => {

  const response =
    await api.get("/logs");

  return response.data;
};

/* =========================
   FILE UPLOAD
========================= */

export const uploadWorkload =
  async (
    file,
    priority = "normal"
  ) => {

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "priority",
      priority
    );

    const response =
      await api.post(
        "/upload",
        formData
      );

    return response.data;
  };

export default api;