import { Badge, Button, Center, Group, Loader, Stack, Title, ActionIcon, Tooltip, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconPencil, IconTrash, IconPlus, IconBan } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productoService } from "../../api/productoService";
import type { ProductoDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { ProductoFormModal } from "./ProductoFormModal";

export function Productos() {
    const queryClient = useQueryClient();

    // Estado de UI del modal (sigue siendo useState).
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditar, setProductoEditar] = useState<ProductoDto | null>(null);

    // Estado de servidor: la lista de productos.
    const {
        data: productos = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["productos"],
        queryFn: productoService.listarProductos,
    });

    // --- Mutaciones ---
    const darBajaMutation = useMutation({
        mutationFn: (id: number) => productoService.darBajaProducto(id),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Producto dado de baja." });
            queryClient.invalidateQueries({ queryKey: ["productos"] });
        },
        onError: (e) =>
            notifications.show({
                color: "red",
                message: e instanceof Error ? e.message : "No se pudo dar de baja al producto.",
            }),
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => productoService.eliminarProducto(id),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Producto eliminado." });
            queryClient.invalidateQueries({ queryKey: ["productos"] });
        },
        onError: (e) =>
            notifications.show({
                color: "red",
                message: e instanceof Error ? e.message : "No se pudo eliminar el producto.",
            }),
    });

    // --- Handlers de la UI ---

    function abrirCrear() {
        setProductoEditar(null);
        setModalAbierto(true);
    }

    function abrirEditar(producto: ProductoDto) {
        setProductoEditar(producto);
        setModalAbierto(true);
    }

    function confirmarEliminar(producto: ProductoDto) {
        modals.openConfirmModal({
            title: "Eliminar producto",
            centered: true,
            children: (
                <Text size="sm">
                    ¿Seguro que deseas eliminar el producto <b>{producto.nombre}</b>? Esta acción no se
                    puede deshacer.
                </Text>
            ),
            labels: { confirm: "Eliminar", cancel: "Cancelar" },
            confirmProps: { color: "red" },
            onConfirm: () => eliminarMutation.mutate(producto.idProducto),
        });
    }

    // --- Columnas de la tabla ---
    const columnas: ColumnConfig<ProductoDto>[] = [
        { header: "ID", accessor: "idProducto" },
        { header: "Nombre", accessor: "nombre" },
        { header: "Descripción", accessor: "descripcion" },
        {
            header: "Precio",
            accessor: "precio",
            render: (row) =>
                `S/ ${row.precio.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        { header: "Stock", accessor: "stock" },
        { header: "Categoría", accessor: "nombreCategoria" },
        {
            header: "Estado",
            accessor: "estado",
            render: (row) => (
                <Badge color={row.estado ? "brand" : "gray"} variant="light">
                    {row.estado ? "Activo" : "Inactivo"}
                </Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "idProducto",
            sortable: false,
            render: (row) => (
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" color="brand" onClick={() => abrirEditar(row)}>
                            <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={row.estado ? "Dar de baja" : "Ya está inactivo"}>
                        <ActionIcon
                            variant="light"
                            color="yellow"
                            onClick={() => darBajaMutation.mutate(row.idProducto)}
                            disabled={!row.estado || darBajaMutation.isPending}
                        >
                            <IconBan size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar">
                        <ActionIcon variant="light" color="red" onClick={() => confirmarEliminar(row)}>
                            <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            ),
        },
    ];

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <Title order={2}>Mantenimiento de Productos</Title>
                <Button leftSection={<IconPlus size={18} stroke={1.5} />} onClick={abrirCrear}>
                    Nuevo Producto
                </Button>
            </Group>

            {isLoading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : isError ? (
                <Center py="xl">
                    <Text c="red">
                        {error instanceof Error ? error.message : "No se pudieron cargar los productos."}
                    </Text>
                </Center>
            ) : (
                <DataTablePortafolio data={productos} columns={columnas} fileName="Productos" />
            )}

            <ProductoFormModal
                opened={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onGuardado={() => queryClient.invalidateQueries({ queryKey: ["productos"] })}
                producto={productoEditar}
            />
        </Stack>
    );
}
