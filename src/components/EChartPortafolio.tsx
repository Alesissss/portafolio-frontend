import { useEffect, useRef } from "react";
import { useComputedColorScheme } from "@mantine/core";

// Importación "por piezas" (tree-shaking): se registra SOLO lo que se usa en vez de
// traer todo ECharts. Cada gráfico y cada componente de chrome se declara aquí abajo;
// si algún día se agrega un heatmap hay que sumar su import a esta lista.
import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    ToolboxComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

echarts.use([
    LineChart,
    BarChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    ToolboxComponent,
    CanvasRenderer,
]);

// --- Chrome de los gráficos -------------------------------------------------
// El modo oscuro NO es el claro invertido: son dos temas elegidos aparte, con los mismos
// tokens del theme de Mantine (dark[6] = superficie, dark[4] = bordes, dark[2] = atenuado).
// Ejes y rejilla son líneas SÓLIDAS de un tono sobre el fondo: recesivas, nunca punteadas.
const chromeClaro = {
    backgroundColor: "transparent",
    textStyle: { color: "#495057" },
    title: { textStyle: { color: "#212529", fontWeight: 600 } },
    categoryAxis: {
        axisLine: { lineStyle: { color: "#dee2e6" } },
        axisTick: { show: false },
        axisLabel: { color: "#868e96" },
        splitLine: { show: false },
    },
    valueAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#868e96" },
        splitLine: { lineStyle: { color: "#f1f3f5" } },
    },
    legend: { textStyle: { color: "#495057" } },
    tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "#dee2e6",
        textStyle: { color: "#212529" },
    },
};

const chromeOscuro = {
    backgroundColor: "transparent",
    textStyle: { color: "#c8d0e0" },
    title: { textStyle: { color: "#e9ecef", fontWeight: 600 } },
    categoryAxis: {
        axisLine: { lineStyle: { color: "#2b3346" } },
        axisTick: { show: false },
        axisLabel: { color: "#8290ab" },
        splitLine: { show: false },
    },
    valueAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#8290ab" },
        splitLine: { lineStyle: { color: "#1f2739" } },
    },
    legend: { textStyle: { color: "#c8d0e0" } },
    tooltip: {
        backgroundColor: "#161d2e",
        borderColor: "#2b3346",
        textStyle: { color: "#c8d0e0" },
    },
};

echarts.registerTheme("portafolioClaro", chromeClaro);
echarts.registerTheme("portafolioOscuro", chromeOscuro);

// Lo que devolvemos al hacer clic en una marca (una porción de la torta, una barra).
export interface EChartSeleccion {
    name: string;
    dataIndex: number;
    // El id de negocio que el gráfico haya guardado en el dato (ej. "GEN").
    id?: string;
}

interface EChartPortafolioProps {
    option: EChartsOption;
    height?: number | string;
    // Mientras se refresca NO se desmonta el gráfico ni se muestra un esqueleto: se atenúa
    // el render anterior. Así no hay parpadeo ni salto de layout.
    cargando?: boolean;
    onSeleccion?: (seleccion: EChartSeleccion) => void;
    ariaLabel?: string;
}

export function EChartPortafolio({
    option,
    height = 320,
    cargando = false,
    onSeleccion,
    ariaLabel,
}: EChartPortafolioProps) {
    const contenedor = useRef<HTMLDivElement>(null);
    const grafico = useRef<echarts.ECharts | null>(null);
    const colorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });

    // El tema no se puede cambiar en caliente: hay que destruir e inicializar de nuevo.
    // Por eso colorScheme está en las dependencias de ESTE efecto y no del de setOption.
    useEffect(() => {
        if (!contenedor.current) return;

        const instancia = echarts.init(
            contenedor.current,
            colorScheme === "dark" ? "portafolioOscuro" : "portafolioClaro",
            { renderer: "canvas" }
        );
        grafico.current = instancia;

        // ResizeObserver y no window.resize: el gráfico también cambia de ancho cuando se
        // colapsa la barra lateral, y eso no dispara un resize de ventana.
        const observador = new ResizeObserver(() => instancia.resize());
        observador.observe(contenedor.current);

        return () => {
            observador.disconnect();
            instancia.dispose();
            grafico.current = null;
        };
    }, [colorScheme]);

    // notMerge: true — sin esto, al filtrar quedarían series viejas mezcladas con las nuevas.
    useEffect(() => {
        grafico.current?.setOption(option, { notMerge: true });
    }, [option]);

    useEffect(() => {
        const instancia = grafico.current;
        if (!instancia) return;

        instancia.off("click");
        if (onSeleccion) {
            instancia.on("click", (params) => {
                const dato = params.data as { id?: string } | undefined;
                onSeleccion({
                    name: String(params.name ?? ""),
                    dataIndex: params.dataIndex ?? 0,
                    id: dato?.id,
                });
            });
        }
        return () => {
            instancia.off("click");
        };
    }, [onSeleccion]);

    return (
        <div
            ref={contenedor}
            role="img"
            aria-label={ariaLabel}
            style={{
                width: "100%",
                height,
                opacity: cargando ? 0.45 : 1,
                transition: "opacity 150ms ease",
            }}
        />
    );
}
