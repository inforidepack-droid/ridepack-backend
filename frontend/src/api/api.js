import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL,
});

const getStoredToken = () => {
  try {
    return window.localStorage.getItem("ridepack_token");
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return {
    ...config,
    headers: {
      ...config.headers,
    },
  };
});

export const setAuthToken = (newToken) => {
  if (!newToken) {
    try {
      window.localStorage.removeItem("ridepack_token");
    } catch {
      // ignore
    }
    delete api.defaults.headers.common.Authorization;
    return;
  }

  try {
    window.localStorage.setItem("ridepack_token", newToken);
  } catch {
    // ignore
  }

  api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
};

export const getAuthToken = () => getStoredToken();

export const getApiErrorMessage = (error) => {
  const data = error?.response?.data;
  if (data?.error?.message) {
    return data.error.message;
  }
  if (data?.message) {
    return data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "Request failed";
};

const initialToken = getStoredToken();
if (initialToken) {
  api.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export default api;
