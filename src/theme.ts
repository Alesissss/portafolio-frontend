import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Color de marca (teal / esmeralda). Una tupla de Mantine SIEMPRE tiene 10 tonos (0 = más claro,
// 9 = más oscuro). Mantine elige cuál usar como "primario" según primaryShade (abajo).
const brand: MantineColorsTuple = [
    "#e5fcf4",
    "#c9f7e6",
    "#97edcd",
    "#61e3b3",
    "#37db9d",
    "#1dd690",
    "#08d389", // 6 -> primario en tema claro
    "#00ba76", // 7 -> primario en tema oscuro
    "#00a267",
    "#008a57",
];

// Sobrescribimos la escala "dark" de Mantine por un azul-noche por capas (da profundidad).
// Índices que Mantine usa por convención: 7 = fondo del body, 6 = superficies elevadas (cards),
// 4 = bordes, 2 = texto atenuado. Ajustar estos cambia TODO el modo oscuro de golpe.
const dark: MantineColorsTuple = [
    "#c8d0e0",
    "#a4afc4",
    "#8290ab", // texto atenuado
    "#5f6d88",
    "#2b3346", // bordes
    "#1f2739",
    "#161d2e", // superficies (cards)
    "#0f1523", // fondo del body
    "#0a0f1a",
    "#060911",
];

export const theme = createTheme({
    primaryColor: "brand",
    // Qué tono de la paleta se usa como color principal, distinto en claro vs oscuro.
    primaryShade: { light: 6, dark: 7 },
    defaultRadius: "md",
    colors: {
        brand,
        dark,
    },
});
