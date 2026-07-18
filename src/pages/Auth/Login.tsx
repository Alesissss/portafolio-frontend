import { useState } from "react";
import { TextInput, PasswordInput, Button, Container, Paper } from "@mantine/core";
import { useAuth } from "../../context/AuthContext";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value: string) =>
        value.trim().length === 0 ? "El nombre de usuario es obligatorio" : null,
      password: (value: string) =>
        value.length === 0 ? "La contraseña es obligatoria" : null,
    },
  });

  async function submitLogin(values: typeof form.values) {
    try {
      setCargando(true);
      await login(values.username, values.password);

      notifications.show({
        title: '¡Acceso concedido!',
        message: 'Inicio de sesión exitoso. Cargando tu panel...',
        color: 'green',
        autoClose: 3000,
      });

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (error) {
      notifications.show({
        title: 'Error al iniciar sesión',
        message: error instanceof Error ? error.message : 'No se pudo conectar con el servidor.',
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

        <form onSubmit={form.onSubmit(submitLogin)}>

          <TextInput
            label="Nombre de Usuario"
            placeholder="Ej. atorres"
            {...form.getInputProps('username')}
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña secreta"
            mt="md"
            {...form.getInputProps('password')}
          />

          <Button type="submit" fullWidth mt="xl" loading={cargando}>
            Iniciar Sesión
          </Button>

        </form>

      </Paper>

    </Container>
  );
}
