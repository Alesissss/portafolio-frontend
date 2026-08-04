import { createTheme, useComputedColorScheme, type MantineColorsTuple } from "@mantine/core";

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

// ---------------------------------------------------------------------------
// COLORES DE LOS ESTADOS DE VENTA
// ---------------------------------------------------------------------------
// Una sola fuente de verdad para los badges (Ventas, VentaDetalle) y los gráficos
// (Reportes): un 'GEN' tiene que verse igual en la tabla que en la torta.
//
// Los tonos NO son elegidos a ojo: pasan la validación de la guía de dataviz —
// banda de luminosidad OKLCH, piso de croma, separación bajo daltonismo (deuteranopía,
// protanopía, tritanopía) y contraste contra la superficie.
//
// El modo oscuro NO es el claro invertido: es una selección aparte, porque la banda de
// luminosidad válida sobre fondo oscuro es MÁS OSCURA ([0.48, 0.67]) que sobre fondo
// claro ([0.43, 0.77]). Aquí solo el azul necesitó cambiar; los otros tres ya caían
// dentro de ambas bandas.
//
// Un gris "de borrador" quedó descartado a propósito: reprueba el piso de croma (lee
// como ausencia de dato) y bajo daltonismo se confunde con el azul de 'generada'.
// Por eso BO va en ámbar, que además comunica mejor "pendiente".
export const COLOR_ESTADO_VENTA: Record<"light" | "dark", Record<string, string>> = {
    light: { BO: "#c17d0b", GEN: "#1971c2", PAG: "#0ca678", AN: "#c92a2a" },
    dark: { BO: "#c17d0b", GEN: "#339af0", PAG: "#0ca678", AN: "#c92a2a" },
};

// Para un código de estado desconocido (no debería pasar, pero el backend manda strings).
const NEUTRO: Record<"light" | "dark", string> = { light: "#868e96", dark: "#8290ab" };

export function useColoresEstadoVenta() {
    const esquema = useComputedColorScheme("light", { getInitialValueInEffect: true });
    const colores = COLOR_ESTADO_VENTA[esquema];
    return {
        esquema,
        colores,
        colorDe: (idEstado: string) => colores[idEstado] ?? NEUTRO[esquema],
    };
}
