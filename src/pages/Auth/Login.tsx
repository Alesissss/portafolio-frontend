import { TextInput, PasswordInput, Button, Container, Paper } from "@mantine/core";
import { useAuth } from "../../context/AuthContext";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

const loginSchema = z.object({
  username: z.string().trim().min(1, "El nombre de usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginValues>({
    mode: "controlled",
    initialValues: {
      username: "",
      password: "",
    },

    validate: zod4Resolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (values: typeof form.values) => login(values.username, values.password),
    onSuccess: () => {
      notifications.show({
        title: '¡Acceso concedido!',
        message: 'Inicio de sesión exitoso. Cargando tu panel...',
        color: 'green',
        autoClose: 3000,
      });

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error al iniciar sesión',
        message: error instanceof Error ? error.message : 'No se pudo conectar con el servidor.',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

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

        <form onSubmit={form.onSubmit((values) => loginMutation.mutate(values))}>

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

          <Button type="submit" fullWidth mt="xl" loading={loginMutation.isPending}>
            Iniciar Sesión
          </Button>

        </form>

      </Paper>

    </Container>
  );
}
