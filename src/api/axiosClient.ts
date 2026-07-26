import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5285';

// Clave única de la sesión en localStorage. Se comparte con AuthContext para no repetir el literal.
export const STORAGE_KEY = 'portafolio.auth';

// Redefinimos la forma en que axios hace su AxiosResponse por el ApiResponse del backend
type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> & {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
}) as unknown as ApiClient;

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

  const apiResponse = response.data as ApiResponse<unknown>;

  if (apiResponse.status === false) {
    return Promise.reject(new Error(apiResponse.message || 'Error en la operación.'));
  }

  return apiResponse.data;
}, (error) => {
  // Token inválido/expirado: el backend responde 401 (la middleware de auth corta antes del controller,
  // por eso NO trae ApiResponse). Lo tratamos como fin de sesión: limpiamos y expulsamos al login.
  if (error.response?.status === 401) {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(new Error('Tu sesión expiró. Inicia sesión de nuevo.'));
  }

  // error.response existe => el servidor respondió (aunque sea con error).
  // error.response undefined => de verdad no hubo conexión (red caída / backend apagado).
  const msg = error.response
    ? (error.response.data?.message || 'Ocurrió un error en el servidor.')
    : 'No se pudo conectar con el servidor.';
  return Promise.reject(new Error(msg));
});