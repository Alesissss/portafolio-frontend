import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext.tsx'
import App from './App.tsx'

// Imports de mantine
import '@mantine/core/styles.css'; // Estilos base de Mantine
import '@mantine/notifications/styles.css'; // Estilos para las alertas flotantes
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme } from './theme';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={1000} />

      {/* ModalsProvider habilita el API imperativo modals.open/openConfirmModal desde cualquier
          componente (como SweetAlert). Debe envolver a la app, dentro de MantineProvider. */}
      <ModalsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ModalsProvider>

    </MantineProvider>
  </React.StrictMode>,
);
