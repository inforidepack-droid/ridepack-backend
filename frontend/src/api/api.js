import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

const getStoredToken = () => {
  try {
    return window.localStorage.getItem("ridepack_token");
  } catch {
    return null;
  }
};

const token = getStoredToken();

if (token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export const setAuthToken = (newToken) => {
  if (!newToken) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

  try {
    window.localStorage.setItem("ridepack_token", newToken);
  } catch {
    // Ignore storage errors in this minimal test UI
  }
};

export default api;

