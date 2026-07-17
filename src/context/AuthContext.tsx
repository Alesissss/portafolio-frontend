// src/context/AuthContext.tsx
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setToken } from '../api/axiosClient';
import type { LoginResponseDto, UsuarioDto } from '../api/types';
import { authService } from '../api/authService';

const STORAGE_KEY = 'portafolio.auth';

interface AuthState {
  usuario: UsuarioDto | null; // Guardamos el DTO de usuario completo en RAM de React
  estaAutenticado: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// Restaura la sesión desde el disco
function restaurarSesion(): UsuarioDto | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const sesion = JSON.parse(raw) as LoginResponseDto;
    setToken(sesion.token);
    return sesion.usuario;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioDto | null>(restaurarSesion);

  async function login(username: string, password: string) {
    const data = await authService.login({username, password});
    
    // Guardamos el LoginResponseDto completo en el disco (token, expiración y usuario)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Alimentamos la RAM
    setToken(data.token);
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      estaAutenticado: !!usuario, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  return ctx;
}