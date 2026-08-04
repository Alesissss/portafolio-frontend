// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Categorias } from './pages/Categorias/Categorias';
import { Productos } from './pages/Productos/Productos';
import { Usuarios } from './pages/Usuarios/Usuarios';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Ventas } from './pages/Ventas/Ventas';
import { VentaForm } from './pages/Ventas/VentaForm';
import { VentaDetalle } from './pages/Ventas/VentaDetalle';
import { Reportes } from './pages/Reportes/Reportes';

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
            <Route path="ventas" element={<Ventas />} /> {/* URL: /ventas */}
            <Route path="ventas/nueva" element={<VentaForm />} /> {/* URL: /ventas/nueva */}
            <Route path="ventas/:id" element={<VentaDetalle />} /> {/* URL: /ventas/:id */}
            <Route path="ventas/:id/editar" element={<VentaForm />} /> {/* URL: /ventas/:id/editar */}
            <Route path="reportes" element={<Reportes />} /> {/* URL: /reportes */}
          </Route>
        </Route>

        {/* 🔄 Redirección por si escriben cualquier otra ruta en la URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}