import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Center,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
    IconArrowLeft,
    IconBan,
    IconCash,
    IconFileInvoice,
    IconPencil,
    IconReceipt,
    IconTrash,
} from "@tabler/icons-react";
import { ventaService } from "../../api/ventaService";
import { PagarVentaModal } from "./PagarVentaModal";

// Formatea soles peruanos: 1234.5 -> "S/ 1,234.50" (mismo helper que la lista).
const soles = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);

function colorEstado(idEstado: string): string {
    switch (idEstado) {
        case "BO": return "gray";   // Borrador
        case "GEN": return "blue";  // Generada
        case "PAG": return "brand"; // Pagada
        case "AN": return "red";    // Anulada
        default: return "gray";
    }
}

export function VentaDetalle() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [pagarAbierto, setPagarAbierto] = useState(false);

    const { data: venta, isLoading, isError } = useQuery({
        queryKey: ["ventas", id],
        queryFn: () => ventaService.obtenerUnaVenta(id!),
        enabled: id !== undefined,
    });

    // Las 4 acciones comparten el mismo cierre: notificar, refrescar caché y (a veces) navegar.
    // Se extrae para no repetir el bloque en cada mutation.
    function alFallar(mensajePorDefecto: string) {
        return (error: unknown) =>
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : mensajePorDefecto,
            });
    }

    // invalidateQueries por prefijo: ["ventas"] alcanza a la lista Y a este detalle.
    function refrescarVentas() {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
    }

    const generarMutation = useMutation({
        mutationFn: () => ventaService.generarVenta(id!),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Venta generada. Se descontó el stock." });
            refrescarVentas();
            // Generar SÍ mueve stock: el combo de productos del formulario quedó desactualizado.
            queryClient.invalidateQueries({ queryKey: ["combos", "productos"] });
        },
        onError: alFallar("No se pudo generar la venta."),
    });

    const anularMutation = useMutation({
        mutationFn: () => ventaService.anularVenta(id!),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Venta anulada. Se devolvió el stock." });
            refrescarVentas();
            queryClient.invalidateQueries({ queryKey: ["combos", "productos"] });
        },
        onError: alFallar("No se pudo anular la venta."),
    });

    const pagarMutation = useMutation({
        mutationFn: (comprobante: File) => ventaService.pagarVenta(id!, comprobante),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Venta pagada. Comprobante adjuntado." });
            refrescarVentas();
            // El modal se cierra AQUÍ y no en el handler: si la subida falla, sigue abierto
            // con el archivo puesto y el usuario solo reintenta.
            setPagarAbierto(false);
        },
        onError: alFallar("No se pudo registrar el pago."),
    });

    const eliminarMutation = useMutation({
        mutationFn: () => ventaService.eliminarVenta(id!),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Borrador eliminado." });
            refrescarVentas();
            navigate("/ventas");   // esta venta ya no existe: no hay detalle que mostrar
        },
        onError: alFallar("No se pudo eliminar la venta."),
    });

    // El comprobante es privado: no se puede poner la URL en un <a href> porque el navegador
    // no mandaría el JWT. Se descarga con axios y se abre como blob temporal.
    async function verComprobante() {
        try {
            const archivo = await ventaService.descargarComprobante(id!);
            const url = URL.createObjectURL(archivo);
            window.open(url, "_blank");
            // Liberar la memoria del blob una vez que la pestaña ya lo cargó.
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            alFallar("No se pudo abrir el comprobante.")(error);
        }
    }

    function handleGenerar() {
        generarMutation.mutate();
    }
    function handleAnular() {
        anularMutation.mutate();
    }
    function handlePagar(comprobante: File) {
        pagarMutation.mutate(comprobante);
    }
    function handleEliminar() {
        eliminarMutation.mutate();
    }

    // Confirmaciones (reutilizan modals.openConfirmModal, igual que en Productos).
    function confirmarGenerar() {
        modals.openConfirmModal({
            title: "Generar venta",
            centered: true,
            children: (
                <Text size="sm">
                    Al generar la venta se descontará el stock de los productos. ¿Deseas continuar?
                </Text>
            ),
            labels: { confirm: "Generar", cancel: "Cancelar" },
            onConfirm: handleGenerar,
        });
    }

    function confirmarAnular() {
        modals.openConfirmModal({
            title: "Anular venta",
            centered: true,
            children: (
                <Text size="sm">
                    Anular devuelve el stock y es <b>irreversible</b>. ¿Seguro que deseas anular esta venta?
                </Text>
            ),
            labels: { confirm: "Anular", cancel: "Cancelar" },
            confirmProps: { color: "red" },
            onConfirm: handleAnular,
        });
    }

    function confirmarEliminar() {
        modals.openConfirmModal({
            title: "Eliminar venta",
            centered: true,
            children: <Text size="sm">¿Eliminar este borrador? Esta acción no se puede deshacer.</Text>,
            labels: { confirm: "Eliminar", cancel: "Cancelar" },
            confirmProps: { color: "red" },
            onConfirm: handleEliminar,
        });
    }

    if (isLoading) {
        return (
            <Center py="xl">
                <Loader />
            </Center>
        );
    }

    // Sin venta (aún sin conectar el useQuery, o error/no encontrada).
    if (isError || !venta) {
        return (
            <Stack gap="md">
                <Group gap="sm">
                    <ActionIcon variant="subtle" onClick={() => navigate("/ventas")} aria-label="Volver">
                        <IconArrowLeft size={20} stroke={1.5} />
                    </ActionIcon>
                    <Title order={2}>Detalle de Venta</Title>
                </Group>
                <Center py="xl">
                    <Text c="dimmed">
                        No hay datos de la venta. Conecta el useQuery para cargarla.
                    </Text>
                </Center>
            </Stack>
        );
    }

    // Acciones disponibles según el estado del flujo BO -> GEN -> PAG / AN.
    const esBorrador = venta.idEstadoVenta === "BO";
    const esGenerada = venta.idEstadoVenta === "GEN";
    const esPagada = venta.idEstadoVenta === "PAG";

    return (
        <Stack gap="lg">
            {/* Encabezado + acciones según estado */}
            <Group justify="space-between" align="flex-start">
                <Group gap="sm">
                    <ActionIcon variant="subtle" onClick={() => navigate("/ventas")} aria-label="Volver">
                        <IconArrowLeft size={20} stroke={1.5} />
                    </ActionIcon>
                    <div>
                        <Title order={2}>Detalle de Venta</Title>
                        <Badge color={colorEstado(venta.idEstadoVenta)} variant="light" mt={4}>
                            {venta.nombreEstadoVenta}
                        </Badge>
                    </div>
                </Group>

                <Group gap="sm">
                    {esBorrador && (
                        <>
                            <Button
                                variant="light"
                                leftSection={<IconPencil size={16} stroke={1.5} />}
                                onClick={() => navigate(`/ventas/${id}/editar`)}
                            >
                                Editar
                            </Button>
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={16} stroke={1.5} />}
                                onClick={confirmarEliminar}
                                loading={eliminarMutation.isPending}
                            >
                                Eliminar
                            </Button>
                            <Button
                                leftSection={<IconFileInvoice size={16} stroke={1.5} />}
                                onClick={confirmarGenerar}
                                loading={generarMutation.isPending}
                            >
                                Generar
                            </Button>
                        </>
                    )}

                    {esGenerada && (
                        <>
                            {/* "Anular" será solo-admin cuando entre el RBAC. */}
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<IconBan size={16} stroke={1.5} />}
                                onClick={confirmarAnular}
                                loading={anularMutation.isPending}
                            >
                                Anular
                            </Button>
                            <Button
                                leftSection={<IconCash size={16} stroke={1.5} />}
                                onClick={() => setPagarAbierto(true)}
                            >
                                Pagar
                            </Button>
                        </>
                    )}

                    {/* PAG y AN son terminales: no hay transiciones. Lo único que queda
                        disponible en PAG es consultar el comprobante que se adjuntó. */}
                    {esPagada && (
                        <Button
                            variant="light"
                            leftSection={<IconReceipt size={16} stroke={1.5} />}
                            onClick={verComprobante}
                        >
                            Ver comprobante
                        </Button>
                    )}
                </Group>
            </Group>

            {/* Cabecera */}
            <Paper withBorder p="md" radius="md">
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    <Dato
                        label="Fecha de emisión"
                        valor={new Date(venta.fechaEmision).toLocaleString("es-PE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    />
                    <Dato label="Vendedor" valor={venta.nombreVendedor} />
                    <Dato label="Estado" valor={venta.nombreEstadoVenta} />
                </SimpleGrid>
            </Paper>

            {/* Detalles */}
            <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                    <Text fw={600}>Productos</Text>
                    <Table.ScrollContainer minWidth={520}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Producto</Table.Th>
                                    <Table.Th ta="right">Precio</Table.Th>
                                    <Table.Th ta="right">Cantidad</Table.Th>
                                    <Table.Th ta="right">Subtotal</Table.Th>
                                    <Table.Th>Observación</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {venta.detalles.map((d) => (
                                    <Table.Tr key={d.idProducto}>
                                        <Table.Td>{d.nombreProducto}</Table.Td>
                                        <Table.Td ta="right">{soles(d.precioVenta)}</Table.Td>
                                        <Table.Td ta="right">{d.cantidad}</Table.Td>
                                        <Table.Td ta="right">{soles(d.precioVenta * d.cantidad)}</Table.Td>
                                        <Table.Td>{d.observacion ?? "—"}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Stack>
            </Paper>

            {/* Totales */}
            <Group justify="flex-end">
                <Card withBorder radius="md" p="md" w={{ base: "100%", sm: 300 }}>
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text c="dimmed">Subtotal</Text>
                            <Text>{soles(venta.subtotal)}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">IGV</Text>
                            <Text>{soles(venta.igv)}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text fw={700}>Total</Text>
                            <Text fw={700} size="lg">{soles(venta.total)}</Text>
                        </Group>
                    </Stack>
                </Card>
            </Group>

            <PagarVentaModal
                opened={pagarAbierto}
                onClose={() => setPagarAbierto(false)}
                onPagar={handlePagar}
                loading={pagarMutation.isPending}
            />
        </Stack>
    );
}

// Mini componente para los pares etiqueta/valor de la cabecera.
function Dato({ label, valor }: { label: string; valor: string }) {
    return (
        <div>
            <Text size="xs" c="dimmed" tt="uppercase">
                {label}
            </Text>
            <Text fw={500}>{valor}</Text>
        </div>
    );
}
