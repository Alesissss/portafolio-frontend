import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext.tsx'
import App from './App.tsx'

// Imports de mantine
import '@mantine/core/styles.css'; // Estilos base de Mantine
import '@mantine/notifications/styles.css'; // Estilos para las alertas flotantes
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark"> 
      <Notifications position="top-right" zIndex={1000} />
      
      <AuthProvider>
        <App />
      </AuthProvider>
      
    </MantineProvider>
  </React.StrictMode>,
);
