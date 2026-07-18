import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5285';

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

  const apiResponse = response.data as ApiResponse<any>;

  if (apiResponse.status === false) {
    return Promise.reject(new Error(apiResponse.message || 'Error en la operación.'));
  }

  return apiResponse.data;
}, (error) => {
  const msg = error.response?.data?.message || 'No se pudo conectar con el servidor.';
  return Promise.reject(new Error(msg));
});