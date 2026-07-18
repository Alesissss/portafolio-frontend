// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Categorias } from './pages/Categorias/Categorias';
import { Productos } from './pages/Productos/Productos';
import { Usuarios } from './pages/Usuarios/Usuarios';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 Rutas Públicas */}
        <Route path="login" element={<Login />} />

        {/* 🔒 Rutas Privadas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} /> {/* URL: / */}
            <Route path="categorias" element={<Categorias />} /> {/* URL: /categorias */}
            <Route path="productos" element={<Productos />} /> {/* URL: /productos */}
            <Route path="usuarios" element={<Usuarios />} /> {/* URL: /usuarios */}
          </Route>
        </Route>

        {/* 🔄 Redirección por si escriben cualquier otra ruta en la URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}