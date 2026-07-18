# 🖥️ Portafolio Frontend — SPA (React 19 + TypeScript)

Single Page Application del **ERP de ventas e inventario**, construida con **React 19**, **Vite** y **TypeScript**, con UI en **Mantine v9**. Consume la API [portafolio-backend](https://github.com/Alesissss/portafolio-backend) (.NET + PostgreSQL).

![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-build-646CFF)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Mantine](https://img.shields.io/badge/Mantine-v9-339AF0)
![Docker](https://img.shields.io/badge/Docker-nginx-2496ED)

---

## ✨ Características

- **Autenticación JWT** gestionada por contexto (`AuthContext`) y rutas privadas con `ProtectedRoute`.
- **Cliente axios** centralizado que desenvuelve la respuesta `ApiResponse<T>` del backend y normaliza los errores.
- **Identidad visual propia**: tema de marca esmeralda con **modo claro/oscuro** persistente.
- **Layout tipo panel** (`AppShell`) con barra lateral **colapsable** (rail de solo íconos) y navegación responsive.
- **`DataTablePortafolio`**: componente de tabla **reutilizable y genérico** con búsqueda global, ordenamiento por columnas y exportación a **Excel**, **PDF** y portapapeles.
- **Formularios** con `@mantine/form` (validación declarativa) y **confirmaciones** con `@mantine/modals`.
- **Notificaciones** con `@mantine/notifications`.

---

## 🛠️ Stack

| Área | Tecnología |
|---|---|
| Framework | React 19 |
| Bundler | Vite |
| Lenguaje | TypeScript |
| UI | Mantine v9 (`core`, `hooks`, `form`, `modals`, `notifications`) |
| Íconos | Tabler Icons |
| Ruteo | React Router v7 |
| HTTP | Axios |
| Exportables | jsPDF + jspdf-autotable, SheetJS (xlsx) |
| Despliegue | Docker (build Node + Nginx) |

---

## 🗂️ Estructura del proyecto

```
src/
├── api/            # axiosClient, services (auth, categoría), tipos (DTOs)
├── components/     # Layout, ProtectedRoute, DataTablePortafolio
├── context/        # AuthContext (sesión + JWT)
├── pages/          # Dashboard, Auth/Login, Categorias/
├── theme.ts        # Tema de marca (paleta esmeralda + modo oscuro)
└── main.tsx        # Providers (Mantine, Modals, Notifications, Auth)
```

---

## 🚀 Puesta en marcha

### Requisitos

- Node.js 22+
- La API [portafolio-backend](https://github.com/Alesissss/portafolio-backend) corriendo

### 1. Variables de entorno

Copia `.env.example` a `.env` y apunta a tu backend:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8080
```

### 2. Instalar y ejecutar

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
```

### Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Compila TypeScript + build de producción |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | Linter (ESLint) |

---

## 🐳 Docker

El `Dockerfile` hace un build multi-etapa (Node) y sirve los estáticos con **Nginx** (con fallback a `index.html` para React Router):

```bash
docker build --build-arg VITE_API_URL=https://tu-api.com -t portafolio-frontend .
docker run -p 8080:8080 portafolio-frontend
```

---

## ⚙️ Integración continua

GitHub Actions (`.github/workflows/ci.yml`) ejecuta **lint** y **build** en cada push y PR hacia `develop` y `main`.

---

## 🌿 Flujo de trabajo (Git)

```
main        ← releases estables
 └─ develop ← integración
     └─ alexis ← rama de trabajo personal
```

Las funcionalidades y correcciones se trabajan en ramas `feature/*` y `fix/*`, y se integran a `develop` mediante Pull Request.

---

## 🗺️ Roadmap

- [x] Login + rutas protegidas
- [x] Dashboard e identidad visual
- [x] Módulo de **Categorías** (CRUD con tabla, modal y validaciones)
- [ ] Módulo de **Productos**
- [ ] Módulo de **Ventas**
