import { ActionIcon, Badge, Button, Center, Group, Loader, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconEye, IconPencil, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ventaService } from "../../api/ventaService";
import type { VentaDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";

// Formatea un número como soles peruanos: 1234.5 -> "S/ 1,234.50"
const soles = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);

// Cada estado de venta tiene su color. Usa la paleta del theme (brand = esmeralda).
function colorEstado(idEstado: string): string {
    switch (idEstado) {
        case "BO": return "gray";    // Borrador
        case "GEN": return "blue";   // Generada
        case "PAG": return "brand";  // Pagada
        case "AN": return "red";     // Anulada
        default: return "gray";
    }
}

export function Ventas() {
    const navigate = useNavigate();

    // ANTES: 2 useState (ventas + cargando) + función cargar + useEffect + try/catch.
    // AHORA: una sola llamada. useQuery se encarga del fetch, el loading, el error y la caché.
    // - data:      lo que devolvió listarVentas (le damos [] por defecto mientras no hay datos).
    // - isLoading: true SOLO en la primera carga sin caché (justo el spinner inicial).
    // - isError/error: si el fetch falló.
    const {
        data: ventas = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["ventas"], // la "dirección" de estos datos en la caché
        queryFn: ventaService.listarVentas,
    });

    // --- Columnas de la tabla ---
    const columnas: ColumnConfig<VentaDto>[] = [
        {
            header: "Fecha",
            accessor: "fechaEmision", // el ISO 8601 crudo ordena bien cronológicamente (es lexicográfico)
            render: (row) =>
                new Date(row.fechaEmision).toLocaleString("es-PE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                }),
        },
        { header: "Vendedor", accessor: "nombreVendedor" },
        {
            header: "Estado",
            accessor: "nombreEstadoVenta", // buscar/ordenar/exportar usan el nombre legible, no el código
            render: (row) => (
                <Badge color={colorEstado(row.idEstadoVenta)} variant="light">
                    {row.nombreEstadoVenta}
                </Badge>
            ),
        },
        {
            header: "Subtotal",
            accessor: "subtotal",
            render: (row) => soles(row.subtotal),
        },
        {
            header: "IGV",
            accessor: "igv",
            render: (row) => soles(row.igv),
        },
        {
            header: "Total",
            accessor: "total",
            render: (row) => <Text fw={700}>{soles(row.total)}</Text>,
        },
        {
            header: "Acciones",
            accessor: "idVenta",
            sortable: false,
            render: (row) => (
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Ver detalle">
                        <ActionIcon
                            variant="light"
                            color="brand"
                            onClick={() => navigate(`/ventas/${row.idVenta}`)}
                        >
                            <IconEye size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>

                    {/* Editar solo tiene sentido en Borrador: generada/pagada/anulada son
                        inmutables y el backend las rechaza. Mejor no ofrecer el botón que
                        dejar al usuario chocar contra un error. */}
                    {row.idEstadoVenta === "BO" && (
                        <Tooltip label="Editar">
                            <ActionIcon
                                variant="light"
                                color="gray"
                                onClick={() => navigate(`/ventas/${row.idVenta}/editar`)}
                            >
                                <IconPencil size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>
            ),
        },
    ];

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <Title order={2}>Listado de Ventas</Title>
                <Button
                    leftSection={<IconPlus size={18} stroke={1.5} />}
                    onClick={() => navigate("/ventas/nueva")}
                >
                    Nueva Venta
                </Button>
            </Group>

            {isLoading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : isError ? (
                <Center py="xl">
                    <Text c="red">
                        {error instanceof Error ? error.message : "No se pudieron cargar las ventas."}
                    </Text>
                </Center>
            ) : (
                <DataTablePortafolio data={ventas} columns={columnas} fileName="Ventas" />
            )}
        </Stack>
    );
}
