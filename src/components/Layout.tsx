import { Outlet, Link, useLocation } from "react-router-dom";
import {
    AppShell,
    Group,
    Burger,
    Title,
    NavLink,
    Button,
    ActionIcon,
    Avatar,
    Text,
    Stack,
    Tooltip,
    useMantineColorScheme,
    useComputedColorScheme,
    useMatches,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import {
    IconHome,
    IconPackage,
    IconLogout,
    IconSun,
    IconMoon,
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarLeftExpand,
    IconBrandDropbox,
    IconUsers,
    IconShoppingBag,
    IconReportAnalytics,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";

// Definimos la navegación como datos (no repetimos JSX). Si mañana agregas "Productos",
// solo añades una línea aquí y el menú se pinta solo.
// 'icon' guarda el COMPONENTE del ícono (no un string): lo instanciamos abajo como <Icon />.
const NAV_ITEMS = [
    { label: "Inicio", to: "/", icon: IconHome },
    { label: "Categorías", to: "/categorias", icon: IconPackage },
    { label: "Productos", to: "/productos", icon: IconBrandDropbox },
    { label: "Usuarios", to: "/usuarios", icon: IconUsers },
    { label: "Ventas", to: "/ventas", icon: IconShoppingBag },
    { label: "Reportes", to: "/reportes", icon: IconReportAnalytics },
];

// Anchos del navbar en desktop: rail de solo íconos vs. barra completa.
const NAV_WIDTH_EXPANDED = 260;
const NAV_WIDTH_COLLAPSED = 80;

export function Layout() {
    const { usuario, logout } = useAuth();
    const location = useLocation();

    // useDisclosure maneja un booleano abierto/cerrado; lo usamos para mostrar/ocultar
    // el navbar en MÓVIL con el botón "hamburguesa".
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

    // Colapso en DESKTOP: rail de solo íconos. useLocalStorage persiste la preferencia
    // (sobrevive recargas) igual que hace Mantine con el color scheme.
    const [collapsed, setCollapsed] = useLocalStorage({
        key: "portafolio-sidebar-collapsed",
        defaultValue: false,
    });

    // --- Modo claro/oscuro ---
    // setColorScheme persiste la elección en localStorage automáticamente (sobrevive recargas).
    const { setColorScheme } = useMantineColorScheme();
    // useComputedColorScheme resuelve el esquema REAL aplicado ('light' | 'dark'), incluso si
    // estuviera en 'auto'. Le damos 'dark' como fallback inicial (coincide con tu MantineProvider).
    const colorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });
    const toggleColorScheme = () => setColorScheme(colorScheme === "dark" ? "light" : "dark");

    // Tamaño de ícono RESPONSIVE: en vez de un 18 fijo, useMatches devuelve un valor distinto
    // según el breakpoint activo (18px por defecto, 20px desde pantallas grandes 'lg').
    const iconSize = useMatches({ base: 18, lg: 20 });

    // Iniciales para el avatar (ej. "Alexis Torres" -> "AT"). Defensivo ante datos vacíos.
    const iniciales = (usuario?.nombres ?? "?")
        .trim()
        .split(" ")
        .map((parte) => parte[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    // ¿La ruta del item está activa? La "/" solo si es exacta; el resto por prefijo.
    const isActive = (to: string) =>
        to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                // El ancho cambia según el estado de colapso (solo importa en desktop).
                width: collapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED,
                breakpoint: "sm",
                // En móvil el navbar arranca colapsado y se abre con la hamburguesa.
                collapsed: { mobile: !mobileOpened },
            }}
            padding="md"
        >
            {/* CABECERA superior */}
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
                        <Title order={4}>Portafolio GITHUB</Title>
                    </Group>

                    <Group gap="sm">
                        {/* Botón de modo claro/oscuro: mostramos el sol cuando está oscuro (para pasar a claro)
                            y la luna cuando está claro (para pasar a oscuro). */}
                        <ActionIcon
                            onClick={toggleColorScheme}
                            variant="default"
                            size="lg"
                            aria-label="Cambiar tema"
                        >
                            {colorScheme === "dark" ? (
                                <IconSun size={iconSize} stroke={1.5} />
                            ) : (
                                <IconMoon size={iconSize} stroke={1.5} />
                            )}
                        </ActionIcon>

                        {/* Datos del usuario (se ocultan en pantallas muy pequeñas) */}
                        <Group gap="xs" visibleFrom="xs">
                            <Avatar color="brand" radius="xl" size="sm">
                                {iniciales}
                            </Avatar>
                            <Text size="sm" fw={500}>
                                {usuario?.nombres}
                            </Text>
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* BARRA lateral de navegación */}
            <AppShell.Navbar p="md">
                {/* Section "grow" ocupa el espacio disponible y empuja el resto hacia abajo. */}
                <AppShell.Section grow>
                    <Stack gap="xs">
                        {NAV_ITEMS.map((item) => {
                            // Capitalizamos a 'Icon' para poder usarlo como componente JSX <Icon />.
                            const Icon = item.icon;
                            return (
                                // Tooltip a la derecha SOLO cuando el rail está colapsado
                                // (si no, el texto ya se ve dentro del NavLink).
                                <Tooltip
                                    key={item.to}
                                    label={item.label}
                                    position="right"
                                    disabled={!collapsed}
                                >
                                    <NavLink
                                        component={Link}
                                        to={item.to}
                                        // Al colapsar quitamos el label: queda solo el ícono.
                                        label={collapsed ? undefined : item.label}
                                        leftSection={<Icon size={iconSize} stroke={1.5} />}
                                        active={isActive(item.to)}
                                        // En modo rail ocultamos el cuerpo (label/chevron) y pegamos el ícono.
                                        styles={
                                            collapsed
                                                ? { body: { display: "none" }, section: { marginRight: 0 } }
                                                : undefined
                                        }
                                        onClick={() => mobileOpened && toggleMobile()} // cierra el menú en móvil al navegar
                                    />
                                </Tooltip>
                            );
                        })}
                    </Stack>
                </AppShell.Section>

                {/* Cerrar sesión: como botón del sidebar (preferido antes que un ícono en el header). */}
                <AppShell.Section>
                    {collapsed ? (
                        <Tooltip label="Cerrar sesión" position="right">
                            <ActionIcon
                                color="red"
                                variant="light"
                                size="lg"
                                onClick={logout}
                                aria-label="Cerrar sesión"
                                mx="auto"
                                display="block"
                            >
                                <IconLogout size={iconSize} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    ) : (
                        <Button
                            color="red"
                            variant="light"
                            fullWidth
                            leftSection={<IconLogout size={iconSize} stroke={1.5} />}
                            onClick={logout}
                        >
                            Cerrar Sesión
                        </Button>
                    )}
                </AppShell.Section>

                {/* Control de colapso: solo tiene sentido en desktop (en móvil se usa la hamburguesa). */}
                <AppShell.Section visibleFrom="sm" mt="xs">
                    <Tooltip label="Expandir" position="right" disabled={!collapsed}>
                        <Button
                            variant="subtle"
                            color="gray"
                            fullWidth
                            justify={collapsed ? "center" : "flex-start"}
                            px={collapsed ? 0 : undefined}
                            onClick={() => setCollapsed((c) => !c)}
                            leftSection={
                                collapsed ? (
                                    <IconLayoutSidebarLeftExpand size={iconSize} stroke={1.5} />
                                ) : (
                                    <IconLayoutSidebarLeftCollapse size={iconSize} stroke={1.5} />
                                )
                            }
                            styles={collapsed ? { section: { marginRight: 0 } } : undefined}
                        >
                            {collapsed ? undefined : "Colapsar"}
                        </Button>
                    </Tooltip>
                </AppShell.Section>
            </AppShell.Navbar>

            {/* CONTENIDO de cada página */}
            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
