import { useEffect, useState } from "react";
import { Badge, Button, Center, Group, Loader, Stack, Title, ActionIcon, Tooltip, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconPencil, IconTrash, IconPlus, IconBan } from "@tabler/icons-react";
import { productoService } from "../../api/productoService";
import type { ProductoDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { ProductoFormModal } from "./ProductoFormModal";

export function Productos() {
    const [productos, setProductos] = useState<ProductoDto[]>([]);
    const [cargando, setCargando] = useState(true);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditar, setProductoEditar] = useState<ProductoDto | null>(null);

    async function cargar() {
        try {
            setCargando(true);
            const data = await productoService.listarProductos();
            setProductos(data);
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudieron cargar los productos.",
            });
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    // --- Handlers de la UI ---

    function abrirCrear() {
        setProductoEditar(null);
        setModalAbierto(true);
    }

    function abrirEditar(producto: ProductoDto) {
        setProductoEditar(producto);
        setModalAbierto(true);
    }

    async function darBaja(producto: ProductoDto) {
        try {
            await productoService.darBajaProducto(producto.idProducto);
            notifications.show({ color: "green", message: "Producto dado de baja." });
            cargar(); // recargamos para ver el estado nuevo
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo dar de baja al producto.",
            });
        }
    }

    // Abre el modal de confirmación (tematizado, reemplaza al window.confirm). Solo pregunta;
    // el borrado real vive en `eliminar`, que se dispara en onConfirm.
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
            onConfirm: () => eliminar(producto),
        });
    }

    async function eliminar(producto: ProductoDto) {
        try {
            await productoService.eliminarProducto(producto.idProducto);
            notifications.show({ color: "green", message: "Producto eliminado." });
            cargar();
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo eliminar el producto.",
            });
        }
    }

    // --- Columnas de la tabla ---
    // Le decimos a tu DataTablePortafolio qué mostrar. `render` es solo para pintar distinto
    // (badge, botones); el buscar/ordenar/exportar sigue usando el valor crudo del accessor.
    const columnas: ColumnConfig<ProductoDto>[] = [
        { header: "ID", accessor: "idProducto" },
        { header: "Nombre", accessor: "nombre" },
        { header: "Descripción", accessor: "descripcion" },
        {
            header: "Precio",
            accessor: "precio",
            // render solo cambia lo que se VE; ordenar/exportar sigue usando el número crudo.
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
            accessor: "idProducto", // apunta a un campo real, aunque no mostramos su texto
            sortable: false,         // no tiene sentido ordenar por la columna de botones
            render: (row) => (
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" color="brand" onClick={() => abrirEditar(row)}>
                            <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    {/* Solo desactiva; se deshabilita si el producto ya está inactivo. */}
                    <Tooltip label={row.estado ? "Dar de baja" : "Ya está inactivo"}>
                        <ActionIcon
                            variant="light"
                            color="yellow"
                            onClick={() => darBaja(row)}
                            disabled={!row.estado}
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

            {/* Mientras carga por primera vez, un spinner; luego la tabla. */}
            {cargando && productos.length === 0 ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : (
                <DataTablePortafolio data={productos} columns={columnas} fileName="Productos" />
            )}

            {/* El modal SIEMPRE está montado; su prop `opened` decide si se ve. Al guardar,
                onGuardado dispara cargar() para que la tabla refleje el cambio. */}
            <ProductoFormModal
                opened={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onGuardado={cargar}
                producto={productoEditar}
            />
        </Stack>
    );
}
