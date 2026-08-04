import { useCallback, useMemo, useState } from "react";
import {
    Badge,
    Card,
    Center,
    Group,
    Loader,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { reporteService } from "../../api/reporteService";
import { comboService } from "../../api/comboService";
import type { TopProductoDto } from "../../api/types";
import { EChartPortafolio, type EChartSeleccion } from "../../components/EChartPortafolio";
import { SearchableSelectPortafolio } from "../../components/SearchableSelectPortafolio";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { useColoresEstadoVenta } from "../../theme";

const soles = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);

const entero = (n: number) => new Intl.NumberFormat("es-PE").format(n);

const RANGOS = [
    { value: "7", label: "7 días" },
    { value: "30", label: "30 días" },
    { value: "90", label: "90 días" },
    { value: "365", label: "1 año" },
    { value: "custom", label: "Personalizado" },
];

// Un número suelto NO es un gráfico: va como tile.
function StatTile({ label, valor, detalle }: { label: string; valor: string; detalle: string }) {
    return (
        <Card withBorder radius="lg" p="lg">
            <Text tt="uppercase" c="dimmed" fw={700} fz="xs" style={{ letterSpacing: 1 }}>
                {label}
            </Text>
            {/* Sin tabular-nums: a este tamaño los dígitos de ancho fijo se ven sueltos. */}
            <Text fw={700} fz={30} lh={1.2} mt="xs">
                {valor}
            </Text>
            <Text c="dimmed" size="sm" mt={4}>
                {detalle}
            </Text>
        </Card>
    );
}

export function Reportes() {
    // Los colores de estado salen del theme: los mismos que pintan los badges de Ventas.
    const { esquema: colorScheme, colores } = useColoresEstadoVenta();

    // En pantallas chicas los gráficos bajan de alto y la torta pierde las etiquetas
    // externas (no caben): la leyenda y el tooltip siguen dando la misma información.
    const esMovil = useMediaQuery("(max-width: 48em)") ?? false;

    const [rango, setRango] = useState("30");
    const [desdeCustom, setDesdeCustom] = useState("");
    const [hastaCustom, setHastaCustom] = useState("");
    const [estado, setEstado] = useState<string | null>(null);
    const [vendedor, setVendedor] = useState<string | null>(null);

    // El rango se deriva del preset. Los presets van primero porque nadie quiere pelear
    // con un calendario para pedir "últimos 30 días".
    const { desde, hasta } = useMemo(() => {
        if (rango === "custom" && desdeCustom && hastaCustom) {
            return {
                desde: new Date(`${desdeCustom}T00:00:00`).toISOString(),
                hasta: new Date(`${hastaCustom}T23:59:59`).toISOString(),
            };
        }
        const fin = new Date();
        const ini = new Date();
        ini.setDate(ini.getDate() - Number(rango === "custom" ? "30" : rango));
        ini.setHours(0, 0, 0, 0);
        return { desde: ini.toISOString(), hasta: fin.toISOString() };
    }, [rango, desdeCustom, hastaCustom]);

    const { data: vendedores = [] } = useQuery({
        queryKey: ["combo-vendedores"],
        queryFn: comboService.listarVendedoresCombo,
    });

    // placeholderData conserva la respuesta anterior mientras llega la nueva: los gráficos
    // se atenúan pero no desaparecen, así no hay parpadeo ni salto de layout al filtrar.
    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ["reporte-dashboard", desde, hasta, estado, vendedor],
        queryFn: () => reporteService.obtenerDashboard({ desde, hasta, estado, vendedor }),
        placeholderData: (anterior) => anterior,
    });

    // Clic en una porción de la torta -> setea el filtro GLOBAL, no solo el de esa torta.
    // Si cada gráfico filtrara por su cuenta, los números dejarían de cuadrar entre sí.
    const alSeleccionarEstado = useCallback((seleccion: EChartSeleccion) => {
        setEstado((actual) => (actual === seleccion.id ? null : (seleccion.id ?? null)));
    }, []);

    const fondoExport = colorScheme === "dark" ? "#161d2e" : "#ffffff";

    // Tokens de texto para las etiquetas de SERIE (las de las barras, las de la torta).
    // Van explícitos porque el textStyle de un tema registrado en ECharts NO cascadea hasta
    // series.label: ahí manda el default de la librería (blanco con contorno negro), que en
    // modo oscuro se ve pésimo. Los ejes y la leyenda sí los toma del tema.
    const textoTenue = colorScheme === "dark" ? "#8290ab" : "#868e96";
    const textoFuerte = colorScheme === "dark" ? "#c8d0e0" : "#495057";

    // El título va DENTRO de la opción de ECharts (no en el Card) para que salga en el PNG
    // que genera el botón de descarga del toolbox.
    const toolbox = useMemo(
        () => ({
            show: true,
            right: 0,
            top: 0,
            feature: {
                saveAsImage: {
                    title: "Descargar PNG",
                    name: "reporte",
                    backgroundColor: fondoExport,
                    pixelRatio: 2,
                },
            },
        }),
        [fondoExport]
    );

    const opcionSerie = useMemo<EChartsOption>(() => {
        const puntos = data?.serie ?? [];
        const porMes = data?.granularidad === "mes";
        return {
            title: { text: "Ventas en el tiempo", left: 0, top: 0 },
            toolbox,
            grid: { left: 8, right: 16, top: 64, bottom: 8, containLabel: true },
            tooltip: {
                trigger: "axis",
                // La cruz encuentra la fecha: el lector apunta a un día, no a una línea de 2px.
                axisPointer: { type: "line" },
                valueFormatter: (v) => soles(Number(v)),
            },
            xAxis: {
                type: "category",
                boundaryGap: false,
                data: puntos.map((p) =>
                    porMes
                        ? new Date(`${p.fecha}T00:00:00`).toLocaleDateString("es-PE", {
                              month: "short",
                              year: "2-digit",
                          })
                        : new Date(`${p.fecha}T00:00:00`).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                          })
                ),
            },
            yAxis: { type: "value", axisLabel: { formatter: (v: number) => `S/ ${entero(Number(v))}` } },
            series: [
                {
                    name: "Vendido",
                    type: "line",
                    smooth: true,
                    // Una sola serie: no hace falta leyenda, el título ya la nombra.
                    lineStyle: { width: 2, color: colores.PAG },
                    itemStyle: { color: colores.PAG },
                    showSymbol: false,
                    symbolSize: 8,
                    areaStyle: { color: colores.PAG, opacity: 0.12 },
                    data: puntos.map((p) => p.total),
                },
            ],
        };
    }, [data, colores, toolbox]);

    const opcionTopProductos = useMemo<EChartsOption>(() => {
        // Se invierte para que el mayor quede arriba (ECharts pinta el eje Y de abajo hacia arriba).
        const top = [...(data?.topProductos ?? [])].reverse();
        return {
            title: { text: "Top 10 productos", left: 0, top: 0 },
            toolbox,
            // containLabel deja sitio para las etiquetas del eje: sin esto el nombre del
            // producto se corta y la tarjeta termina con un scroll vertical propio.
            grid: { left: 8, right: esMovil ? 56 : 72, top: 64, bottom: 8, containLabel: true },
            tooltip: { trigger: "item", valueFormatter: (v) => soles(Number(v)) },
            xAxis: { type: "value", axisLabel: { formatter: (v: number) => `S/ ${entero(Number(v))}` } },
            yAxis: {
                type: "category",
                data: top.map((p) => p.nombre),
                // Nombres largos: se truncan en vez de empujar el gráfico. El nombre completo
                // sigue disponible en el tooltip y en la tabla de abajo.
                axisLabel: { width: esMovil ? 90 : 130, overflow: "truncate" },
            },
            series: [
                {
                    name: "Vendido",
                    type: "bar",
                    // Magnitud, no identidad: un solo color para todas las barras. Pintarlas
                    // más oscuras donde son más grandes duplicaría lo que ya dice el largo.
                    itemStyle: { color: colores.PAG, borderRadius: [0, 4, 4, 0] },
                    barMaxWidth: 18,
                    // El valor va afuera, al final de la barra: adentro se cortaría en las cortas.
                    label: {
                        show: true,
                        position: "right",
                        formatter: (p) => soles(Number(p.value ?? 0)),
                        color: textoTenue,
                        textBorderWidth: 0,
                        fontSize: 11,
                    },
                    data: top.map((p) => p.total),
                },
            ],
        };
    }, [data, colores, textoTenue, toolbox, esMovil]);

    const opcionEstados = useMemo<EChartsOption>(() => {
        const porEstado = data?.porEstado ?? [];
        const totalEstados = porEstado.reduce((acc, e) => acc + e.total, 0);
        return {
            title: { text: "Ventas por estado", left: 0, top: 0 },
            toolbox,
            tooltip: {
                trigger: "item",
                // El valor manda y la etiqueta acompaña: aquí el lector ya sabe qué estado es
                // y lo que busca es el número.
                formatter: (params) => {
                    const p = Array.isArray(params) ? params[0] : params;
                    return `<b>${soles(Number(p.value ?? 0))}</b><br/>${p.name} · ${p.percent ?? 0}%`;
                },
            },
            legend: {
                bottom: 0,
                icon: "roundRect",
                textStyle: { color: textoFuerte },
                // La leyenda lleva nombre Y porcentaje: la identidad nunca depende solo del
                // color, y el número se lee sin tener que pasar el mouse.
                formatter: (name: string) => {
                    const e = porEstado.find((x) => x.nombre === name);
                    if (!e || totalEstados === 0) return name;
                    return `${name}  ${((e.total / totalEstados) * 100).toFixed(1)}%`;
                },
            },
            series: [
                {
                    name: "Estado",
                    type: "pie",
                    radius: ["48%", "72%"],
                    center: ["50%", "45%"],
                    // 2px de separación con el color de la superficie: separa sin dibujar bordes.
                    itemStyle: { borderColor: fondoExport, borderWidth: 2 },
                    // Etiquetas externas APAGADAS: duplicaban a la leyenda que está justo
                    // debajo y sus líneas guía se encabalgaban en las porciones chicas.
                    // Si alguna vez se reactivan, el color va explícito: el textStyle de un
                    // tema registrado NO cascadea a series.label, y el default de ECharts es
                    // blanco con contorno negro (que es lo que se veía mal en oscuro).
                    label: {
                        show: false,
                        formatter: "{b}\n{d}%",
                        fontSize: 11,
                        color: textoTenue,
                        textBorderWidth: 0,
                    },
                    labelLine: { show: false },
                    data: porEstado.map((e) => ({
                        // 'id' viaja en el dato para que el clic sepa qué estado se seleccionó.
                        id: e.idEstadoVenta,
                        name: e.nombre,
                        value: e.total,
                        itemStyle: {
                            color: colores[e.idEstadoVenta] ?? "#868e96",
                            // Con un estado filtrado, los demás se atenúan pero NO cambian de color.
                            opacity: estado && estado !== e.idEstadoVenta ? 0.25 : 1,
                        },
                    })),
                },
            ],
        };
    }, [data, colores, estado, fondoExport, toolbox, textoTenue, textoFuerte]);

    const columnasTop: ColumnConfig<TopProductoDto>[] = [
        { header: "Producto", accessor: "nombre" },
        { header: "Cantidad", accessor: "cantidad", render: (r) => entero(r.cantidad) },
        { header: "Vendido", accessor: "total", render: (r) => <Text fw={600}>{soles(r.total)}</Text> },
    ];

    const resumen = data?.resumen;
    const nombreEstado = data?.porEstado.find((e) => e.idEstadoVenta === estado)?.nombre ?? estado;
    const nombreVendedor = vendedores.find((v) => v.value === vendedor)?.label;

    return (
        <Stack gap="lg">
            <Title order={2}>Reportes</Title>

            {/* FILA DE FILTROS — una sola fila, arriba de todo lo que condiciona.
                Nunca dentro de una tarjeta ni por gráfico: todos leen la misma tajada. */}
            <Card withBorder radius="lg" p="md">
                <Group gap="md" align="flex-end" wrap="wrap">
                    <Stack gap={4}>
                        <Text size="xs" c="dimmed" fw={600}>
                            Rango
                        </Text>
                        <SegmentedControl size="xs" value={rango} onChange={setRango} data={RANGOS} />
                    </Stack>

                    {rango === "custom" && (
                        <>
                            <TextInput
                                size="xs"
                                type="date"
                                label="Desde"
                                value={desdeCustom}
                                onChange={(e) => setDesdeCustom(e.currentTarget.value)}
                            />
                            <TextInput
                                size="xs"
                                type="date"
                                label="Hasta"
                                value={hastaCustom}
                                onChange={(e) => setHastaCustom(e.currentTarget.value)}
                            />
                        </>
                    )}

                    <SearchableSelectPortafolio
                        size="xs"
                        label="Vendedor"
                        placeholder="Todos"
                        data={vendedores}
                        value={vendedor}
                        onChange={setVendedor}
                        w={220}
                    />

                    {/* El filtro que nace de un clic en la torta se hace VISIBLE aquí, y se
                        puede quitar desde acá. Si no, el lector no sabría qué está viendo. */}
                    {estado && (
                        <Badge
                            size="lg"
                            variant="light"
                            color="gray"
                            rightSection={<IconX size={14} style={{ cursor: "pointer" }} />}
                            onClick={() => setEstado(null)}
                            style={{ cursor: "pointer" }}
                        >
                            Estado: {nombreEstado}
                        </Badge>
                    )}
                </Group>

                <Text size="xs" c="dimmed" mt="sm">
                    {new Date(desde).toLocaleDateString("es-PE", { dateStyle: "medium" })} —{" "}
                    {new Date(hasta).toLocaleDateString("es-PE", { dateStyle: "medium" })}
                    {nombreVendedor ? ` · ${nombreVendedor}` : ""}
                </Text>
            </Card>

            {isLoading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : isError ? (
                <Center py="xl">
                    <Text c="red">
                        {error instanceof Error ? error.message : "No se pudo cargar el reporte."}
                    </Text>
                </Center>
            ) : (
                <>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                        <StatTile
                            label="Vendido"
                            valor={soles(resumen?.totalVendido ?? 0)}
                            detalle="Generadas y pagadas"
                        />
                        <StatTile
                            label="Ventas"
                            valor={entero(resumen?.numeroVentas ?? 0)}
                            detalle="En el rango elegido"
                        />
                        <StatTile
                            label="Ticket promedio"
                            valor={soles(resumen?.ticketPromedio ?? 0)}
                            detalle="Vendido / n° de ventas"
                        />
                        <StatTile
                            label="Por cobrar"
                            valor={soles(resumen?.porCobrar ?? 0)}
                            detalle="Generadas sin pagar"
                        />
                    </SimpleGrid>

                    <Card withBorder radius="lg" p="md">
                        <EChartPortafolio
                            option={opcionSerie}
                            height={esMovil ? 240 : 320}
                            cargando={isFetching}
                            ariaLabel="Ventas en el tiempo"
                        />
                    </Card>

                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                        <Card withBorder radius="lg" p="md">
                            <EChartPortafolio
                                option={opcionTopProductos}
                                height={esMovil ? 300 : 380}
                                cargando={isFetching}
                                ariaLabel="Top 10 de productos por monto vendido"
                            />
                        </Card>

                        <Card withBorder radius="lg" p="md">
                            <EChartPortafolio
                                option={opcionEstados}
                                height={esMovil ? 300 : 380}
                                cargando={isFetching}
                                onSeleccion={alSeleccionarEstado}
                                ariaLabel="Ventas por estado. Al hacer clic en una porción se filtra el reporte."
                            />
                            <Text size="xs" c="dimmed" ta="center">
                                Haz clic en una porción para filtrar todo el reporte
                            </Text>
                        </Card>
                    </SimpleGrid>

                    {/* Gemelo en tabla del gráfico de productos: todo valor que está en un
                        gráfico se puede leer sin depender del color ni del hover, y de paso
                        se exporta a Excel/PDF. */}
                    <Card withBorder radius="lg" p="md">
                        <Text fw={600} mb="sm">
                            Detalle de productos
                        </Text>
                        <DataTablePortafolio
                            data={data?.topProductos ?? []}
                            columns={columnasTop}
                            fileName="Top_productos"
                            maxHeight="40vh"
                        />
                    </Card>
                </>
            )}
        </Stack>
    );
}
