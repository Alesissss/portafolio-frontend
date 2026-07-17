// src/api/axiosClient.ts
import axios from 'axios';
import type { ApiResponse } from './types';

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5285';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  if (response.config.responseType === 'blob') {
    return response.data;
  }

  const apiResponse = response.data as ApiResponse<any>;

  if (apiResponse.status === false) {
    return Promise.reject(new Error(apiResponse.message || 'Error en la operación.'));
  }

  return apiResponse.data;
}, (error) => {
  const msg = error.response?.data?.message || 'No se pudo conectar con el servidor.';
  return Promise.reject(new Error(msg));
});