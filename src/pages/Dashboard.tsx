import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Avatar,
    Badge,
    Box,
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconCategory,
    IconChevronRight,
    IconPackage,
    IconReportAnalytics,
    IconSettings,
    IconShoppingCart,
    IconUsers,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import classes from "./Dashboard.module.css";

// Los "módulos" del portafolio, como datos. 'color' es un color del theme y da la identidad
// cromática de cada tile (ThemeIcon + Badge comparten ese color). 'activo' decide si es clickeable.
const MODULOS = [
    { title: "Categorías", desc: "Mantenimiento de categorías de productos", color: "brand", icon: IconCategory, to: "/categorias", activo: true },
    { title: "Productos", desc: "Inventario, precios y control de stock", color: "grape", icon: IconPackage, to: "/productos", activo: true },
    { title: "Ventas", desc: "Cotizaciones, ventas e indicadores", color: "orange", icon: IconShoppingCart, to: "#", activo: false },
    { title: "Reportes", desc: "Exportables en Excel y PDF", color: "cyan", icon: IconReportAnalytics, to: "#", activo: false },
    { title: "Usuarios", desc: "Cuentas, roles y permisos", color: "blue", icon: IconUsers, to: "#", activo: false },
    { title: "Configuración", desc: "Preferencias y apariencia", color: "pink", icon: IconSettings, to: "#", activo: false },
];

export function Dashboard() {
    const { usuario } = useAuth();

    // Reloj en vivo: guardamos la hora en estado y la refrescamos cada segundo.
    // El return del useEffect limpia el intervalo al desmontar (evita fugas de memoria).
    const [ahora, setAhora] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setAhora(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const hora = ahora.getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
    const reloj = ahora.toLocaleTimeString("es-PE", { hour12: false });
    const fecha = ahora.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const iniciales = (usuario?.nombres ?? "?")
        .trim()
        .split(" ")
        .map((parte) => parte[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <Stack gap="xl">
            {/* CARD DE BIENVENIDA */}
            <Card withBorder radius="lg" p="xl" className={classes.welcomeCard}>
                <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Group>
                        <Avatar size={64} radius="md" color="brand" variant="light">
                            {iniciales}
                        </Avatar>
                        <Stack gap={2}>
                            <Text c="dimmed" size="sm">
                                {saludo},
                            </Text>
                            <Title order={2}>{usuario?.nombres}</Title>
                            <Group gap="xs" mt={4}>
                                <Badge variant="light" color="brand">
                                    @{usuario?.username}
                                </Badge>
                            </Group>
                        </Stack>
                    </Group>

                    <Stack gap={0} align="flex-end">
                        {/* ff="monospace" evita que los números "salten" de ancho cada segundo */}
                        <Text fw={700} fz={40} lh={1} ff="monospace">
                            {reloj}
                        </Text>
                        <Text c="dimmed" size="sm" tt="capitalize" mt={4}>
                            {fecha}
                        </Text>
                    </Stack>
                </Group>
            </Card>

            {/* GRID DE MÓDULOS */}
            <div>
                <Text tt="uppercase" c="dimmed" fw={700} fz="xs" mb="sm" style={{ letterSpacing: 1 }}>
                    Módulos del sistema
                </Text>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {MODULOS.map((m) => {
                        const Icon = m.icon;

                        const contenido = (
                            <Card
                                withBorder
                                radius="lg"
                                p="lg"
                                className={m.activo ? classes.moduleCard : classes.moduleCardDisabled}
                            >
                                <Group justify="space-between" align="flex-start" mb="md">
                                    {/* variant="light" = fondo tintado + ícono del color: el efecto "tile" de la referencia */}
                                    <ThemeIcon variant="light" color={m.color} size={46} radius="md">
                                        <Icon size={24} stroke={1.5} />
                                    </ThemeIcon>
                                    {m.activo && (
                                        <IconChevronRight size={18} color="var(--mantine-color-dimmed)" />
                                    )}
                                </Group>

                                <Text fw={600}>{m.title}</Text>
                                <Text c="dimmed" size="sm" mt={4} mb="md">
                                    {m.desc}
                                </Text>

                                <Badge variant="light" color={m.activo ? m.color : "gray"}>
                                    {m.activo ? "Disponible" : "Próximamente"}
                                </Badge>
                            </Card>
                        );

                        // Las activas se envuelven en un Link; las demás en un Box inerte.
                        return m.activo ? (
                            <Box
                                key={m.title}
                                component={Link}
                                to={m.to}
                                style={{ height: "100%", textDecoration: "none", color: "inherit" }}
                            >
                                {contenido}
                            </Box>
                        ) : (
                            <Box key={m.title} style={{ height: "100%" }}>
                                {contenido}
                            </Box>
                        );
                    })}
                </SimpleGrid>
            </div>
        </Stack>
    );
}
