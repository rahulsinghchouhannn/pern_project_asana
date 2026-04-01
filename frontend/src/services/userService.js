import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const getMe = async (token) => {
  const response = await api.get("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const getAllUsers = async (token, params = {}) => {
  const response = await api.get("/users", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
};

export default { getMe, getAllUsers };
