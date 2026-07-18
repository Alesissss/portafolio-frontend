import { Badge, Button, Center, Group, Loader, Stack, Title, ActionIcon, Tooltip, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconPencil, IconTrash, IconPlus, IconBan } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoriaService } from "../../api/categoriaService";
import type { CategoriaDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { CategoriaFormModal } from "./CategoriaFormModal";

export function Categorias() {
    const queryClient = useQueryClient();

    // Cambiar categorías afecta a DOS cachés: la lista de categorías y el combo de categorías
    // (que usa el form de Productos). Por eso invalidamos ambas: los <Select> se refrescan solos.
    function invalidarCategorias() {
        queryClient.invalidateQueries({ queryKey: ["categorias"] });
        queryClient.invalidateQueries({ queryKey: ["combos", "categorias"] });
    }

    // Estado de UI del modal.
    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoriaEditar, setCategoriaEditar] = useState<CategoriaDto | null>(null);

    // Estado de servidor: la lista de categorías.
    const {
        data: categorias = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["categorias"],
        queryFn: categoriaService.listarCategorias,
    });

    // --- Mutaciones ---
    const darBajaMutation = useMutation({
        mutationFn: (id: string) => categoriaService.darBajaCategoria(id),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Categoría dada de baja." });
            invalidarCategorias();
        },
        onError: (e) =>
            notifications.show({
                color: "red",
                message: e instanceof Error ? e.message : "No se pudo dar de baja la categoría.",
            }),
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: string) => categoriaService.eliminarCategoria(id),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Categoría eliminada." });
            invalidarCategorias();
        },
        onError: (e) =>
            notifications.show({
                color: "red",
                message: e instanceof Error ? e.message : "No se pudo eliminar la categoría.",
            }),
    });

    // --- Handlers de la UI ---

    function abrirCrear() {
        setCategoriaEditar(null);
        setModalAbierto(true);
    }

    function abrirEditar(categoria: CategoriaDto) {
        setCategoriaEditar(categoria);
        setModalAbierto(true);
    }

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
            onConfirm: () => eliminarMutation.mutate(categoria.idCategoria),
        });
    }

    // --- Columnas de la tabla ---
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
            accessor: "idCategoria",
            sortable: false,
            render: (row) => (
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" color="brand" onClick={() => abrirEditar(row)}>
                            <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={row.estado ? "Dar de baja" : "Ya está inactiva"}>
                        <ActionIcon
                            variant="light"
                            color="yellow"
                            onClick={() => darBajaMutation.mutate(row.idCategoria)}
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
                <Title order={2}>Mantenimiento de Categorías</Title>
                <Button leftSection={<IconPlus size={18} stroke={1.5} />} onClick={abrirCrear}>
                    Nueva categoría
                </Button>
            </Group>

            {isLoading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : isError ? (
                <Center py="xl">
                    <Text c="red">
                        {error instanceof Error ? error.message : "No se pudieron cargar las categorías."}
                    </Text>
                </Center>
            ) : (
                <DataTablePortafolio data={categorias} columns={columnas} fileName="Categorias" />
            )}

            <CategoriaFormModal
                opened={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onGuardado={invalidarCategorias}
                categoria={categoriaEditar}
            />
        </Stack>
    );
}
