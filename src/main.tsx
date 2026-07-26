import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext.tsx'
import App from './App.tsx'

// Imports de mantine
import '@mantine/core/styles.css'; // Estilos base de Mantine
import '@mantine/notifications/styles.css'; // Estilos para las alertas flotantes
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme } from './theme';

// El "cerebro" de TanStack Query: guarda la caché de todas las queries y decide cuándo re-fetchear.
// Se crea UNA sola vez para toda la app.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30s: durante ese lapso los datos se consideran "frescos" y NO se vuelve a pedir
      retry: 1,                     // ante un error, 1 reintento (evita spamear al backend; con 401 igual redirige)
      refetchOnWindowFocus: false,  // no re-fetchear con solo volver a la pestaña (preferencia; quítalo si lo quieres)
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={1000} />

      {/* ModalsProvider habilita el API imperativo modals.open/openConfirmModal desde cualquier
          componente (como SweetAlert). Debe envolver a la app, dentro de MantineProvider. */}
      <ModalsProvider>
        {/* QueryClientProvider expone la caché a toda la app: cualquier useQuery/useMutation la usa. */}
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
          {/* Panel flotante SOLO para desarrollo (es devDependency, no llega a producción).
              Ábrelo con el logo de abajo para VER la caché: cada queryKey, su estado
              (fresh/stale/fetching) y sus datos en vivo. */}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ModalsProvider>

    </MantineProvider>
  </React.StrictMode>,
);
