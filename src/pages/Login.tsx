import { useState } from "react";
import { TextInput, PasswordInput, Button, Container, Paper } from "@mantine/core";
import { useAuth } from "../context/AuthContext";
import { notifications } from "@mantine/notifications";

export function Login() {
  // función de login
  const { login } = useAuth();

  // variables de entrada
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCargando(true);
      // Llamar a la función de login que hace la solicitud HTTP al endpoint de .NET
      await login(username, password);

      // login exitoso
      notifications.show({
        title: '¡Acceso concedido!',
        message: 'Inicio de sesión exitoso. Cargando tu panel...',
        color: 'green',
        autoClose: 3000,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error al iniciar sesión',
        message: error.message || 'No se pudo conectar con el servidor.',
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <Container size={420} my={80}>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
          Mi Portafolio GITHUB
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
          Ingresa tus credenciales para ingresar el sistema
        </p>
      </div>

      <Paper withBorder shadow="md" p={30} radius="md">

        <form onSubmit={submitLogin}>

          <TextInput
            label="Nombre de Usuario"
            placeholder="Ej. atorres"
            required
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña secreta"
            required
            mt="md" // mt = Margin Top mediano
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />

          <Button type="submit" fullWidth mt="xl" loading={cargando}>
            Iniciar Sesión
          </Button>

        </form>

      </Paper>

    </Container>
  );
}