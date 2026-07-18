import { useEffect, useState } from "react";
import { Badge, Button, Center, Group, Loader, Stack, Title, ActionIcon, Tooltip, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconPencil, IconTrash, IconPlus, IconBan } from "@tabler/icons-react";
import { categoriaService } from "../../api/categoriaService";
import type { CategoriaDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { CategoriaFormModal } from "./CategoriaFormModal";

export function Categorias() {
    // --- Estado de la página ---
    // En jQuery pintabas <tr> en el DOM a mano tras el $.ajax. En React es al revés: guardas los
    // DATOS en estado y React re-pinta la tabla solo. Tú nunca tocas el DOM; cambias el estado.
    const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
    const [cargando, setCargando] = useState(true);

    // Estado del modal: si está abierto y a QUÉ categoría edita (null = crear una nueva).
    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoriaEditar, setCategoriaEditar] = useState<CategoriaDto | null>(null);

    // --- Cargar la lista desde el backend ---
    // La declaramos como función para poder reusarla: al montar Y después de cada cambio.
    async function cargar() {
        try {
            setCargando(true);
            // Tu service resuelve directo a CategoriaDto[] (el axiosClient ya sacó el .data).
            const data = await categoriaService.listarCategorias();
            setCategorias(data);
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudieron cargar las categorías.",
            });
        } finally {
            setCargando(false);
        }
    }

    // useEffect con [] = "corre UNA vez, al montar el componente". Es tu equivalente a
    // $(document).ready(): el momento de pedir los datos iniciales.
    useEffect(() => {
        cargar();
    }, []);

    // --- Handlers de la UI ---

    function abrirCrear() {
        setCategoriaEditar(null); // sin categoría => el modal entra en modo "crear"
        setModalAbierto(true);
    }

    function abrirEditar(categoria: CategoriaDto) {
        setCategoriaEditar(categoria); // con categoría => el modal entra en modo "editar"
        setModalAbierto(true);
    }

    // Dar de baja: SOLO desactiva (estado -> false). No es toggle: reactivar se hace desde el
    // Editar (marcando el Switch "Activa"). El backend rechaza si ya está inactiva (YaEsBaja).
    async function darBaja(categoria: CategoriaDto) {
        try {
            await categoriaService.darBajaCategoria(categoria.idCategoria);
            notifications.show({ color: "green", message: "Categoría dada de baja." });
            cargar(); // recargamos para ver el estado nuevo
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo dar de baja la categoría.",
            });
        }
    }

    // Abre el modal de confirmación (tematizado, reemplaza al window.confirm). Solo pregunta;
    // el borrado real vive en `eliminar`, que se dispara en onConfirm.
    function confirmarEliminar(categoria: CategoriaDto) {
        modals.openConfirmModal({
            title: "Eliminar categoría",
            centered: true,
            children: (
                <Text size="sm">
                    ¿Seguro que deseas eliminar la categoría <b>{categoria.nombre}</b>? Esta acción no se
                    puede deshacer.
                </Text>
            ),
            labels: { confirm: "Eliminar", cancel: "Cancelar" },
            confirmProps: { color: "red" },
            onConfirm: () => eliminar(categoria),
        });
    }

    async function eliminar(categoria: CategoriaDto) {
        try {
            await categoriaService.eliminarCategoria(categoria.idCategoria);
            notifications.show({ color: "green", message: "Categoría eliminada." });
            cargar();
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo eliminar la categoría.",
            });
        }
    }

    // --- Columnas de la tabla ---
    // Le decimos a tu DataTablePortafolio qué mostrar. `render` es solo para pintar distinto
    // (badge, botones); el buscar/ordenar/exportar sigue usando el valor crudo del accessor.
    const columnas: ColumnConfig<CategoriaDto>[] = [
        { header: "Código", accessor: "idCategoria" },
        { header: "Nombre", accessor: "nombre" },
        { header: "Descripción", accessor: "descripcion" },
        {
            header: "Estado",
            accessor: "estado",
            render: (row) => (
                <Badge color={row.estado ? "brand" : "gray"} variant="light">
                    {row.estado ? "Activa" : "Inactiva"}
                </Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "idCategoria", // apunta a un campo real, aunque no mostramos su texto
            sortable: false,         // no tiene sentido ordenar por la columna de botones
            render: (row) => (
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" color="brand" onClick={() => abrirEditar(row)}>
                            <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    {/* Solo desactiva; se deshabilita si la categoría ya está inactiva. */}
                    <Tooltip label={row.estado ? "Dar de baja" : "Ya está inactiva"}>
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
                <Title order={2}>Mantenimiento de Categorías</Title>
                <Button leftSection={<IconPlus size={18} stroke={1.5} />} onClick={abrirCrear}>
                    Nueva categoría
                </Button>
            </Group>

            {/* Mientras carga por primera vez, un spinner; luego la tabla. */}
            {cargando && categorias.length === 0 ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : (
                <DataTablePortafolio data={categorias} columns={columnas} fileName="Categorias" />
            )}

            {/* El modal SIEMPRE está montado; su prop `opened` decide si se ve. Al guardar,
                onGuardado dispara cargar() para que la tabla refleje el cambio. */}
            <CategoriaFormModal
                opened={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onGuardado={cargar}
                categoria={categoriaEditar}
            />
        </Stack>
    );
}
