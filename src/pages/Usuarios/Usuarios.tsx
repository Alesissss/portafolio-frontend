import { Badge, Button, Center, Group, Loader, Stack, Title, ActionIcon, Tooltip, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconPencil, IconTrash, IconPlus, IconBan } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usuarioService } from "../../api/usuarioService";
import type { UsuarioDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { UsuarioFormModal } from "./UsuarioFormModal";

export function Usuarios() {
    // queryClient: lo usamos para invalidar la caché tras una mutación (que la lista se refresque sola).
    const queryClient = useQueryClient();

    // Estado de UI del modal (esto SÍ sigue siendo useState: es estado de la UI, no del servidor).
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState<UsuarioDto | null>(null);

    // Estado de SERVIDOR: la lista de usuarios. Reemplaza a useState + cargar + useEffect.
    const {
        data: usuarios = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["usuarios"],
        queryFn: usuarioService.listarUsuarios,
    });

    // --- Mutaciones ---
    // Cada acción que CAMBIA datos es un useMutation. En onSuccess invalidamos ["usuarios"]:
    // TanStack Query re-fetchea la lista y la tabla se actualiza sola (adiós al cargar() manual).
    const darBajaMutation = useMutation({
        mutationFn: (id: string) => usuarioService.darBajaUsuario(id),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Usuario dado de baja." });
            queryClient.invalidateQueries({ queryKey: ["usuarios"] });
        },
        onError: (e) =>
            notifications.show({
                color: "red",
                message: e instanceof Error ? e.message : "No se pudo dar de baja al usuario.",
            }),
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: string) => usuarioService.eliminarUsuario(id),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Usuario eliminado." });
            queryClient.invalidateQueries({ queryKey: ["usuarios"] });
        },
        onError: (e) =>
            notifications.show({
                color: "red",
                message: e instanceof Error ? e.message : "No se pudo eliminar el usuario.",
            }),
    });

    // --- Handlers de la UI ---

    function abrirCrear() {
        setUsuarioEditar(null);
        setModalAbierto(true);
    }

    function abrirEditar(usuario: UsuarioDto) {
        setUsuarioEditar(usuario);
        setModalAbierto(true);
    }

    function confirmarEliminar(usuario: UsuarioDto) {
        modals.openConfirmModal({
            title: "Eliminar usuario",
            centered: true,
            children: (
                <Text size="sm">
                    ¿Seguro que deseas eliminar al usuario <b>{usuario.username}</b>? Esta acción no se
                    puede deshacer.
                </Text>
            ),
            labels: { confirm: "Eliminar", cancel: "Cancelar" },
            confirmProps: { color: "red" },
            onConfirm: () => eliminarMutation.mutate(usuario.idUsuario),
        });
    }

    // --- Columnas de la tabla ---
    const columnas: ColumnConfig<UsuarioDto>[] = [
        { header: "Nombres", accessor: "nombres" },
        {
            header: "Apellidos",
            accessor: "apellidoPaterno",
            render: (row) => `${row.apellidoPaterno} ${row.apellidoMaterno}`,
        },
        { header: "Usuario", accessor: "username" },
        { header: "Correo", accessor: "correo" },
        { header: "Rol", accessor: "nombreRol" },
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
            accessor: "idUsuario", // apunta a un campo real, aunque no mostramos su texto
            sortable: false,
            render: (row) => (
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" color="brand" onClick={() => abrirEditar(row)}>
                            <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    {/* Solo desactiva; se deshabilita si el usuario ya está inactivo o si la baja está en curso. */}
                    <Tooltip label={row.estado ? "Dar de baja" : "Ya está inactivo"}>
                        <ActionIcon
                            variant="light"
                            color="yellow"
                            onClick={() => darBajaMutation.mutate(row.idUsuario)}
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
                <Title order={2}>Mantenimiento de Usuarios</Title>
                <Button leftSection={<IconPlus size={18} stroke={1.5} />} onClick={abrirCrear}>
                    Nuevo Usuario
                </Button>
            </Group>

            {isLoading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : isError ? (
                <Center py="xl">
                    <Text c="red">
                        {error instanceof Error ? error.message : "No se pudieron cargar los usuarios."}
                    </Text>
                </Center>
            ) : (
                <DataTablePortafolio data={usuarios} columns={columnas} fileName="Usuarios" />
            )}

            {/* onGuardado ya no llama a cargar(): invalida la caché y Query re-fetchea solo. */}
            <UsuarioFormModal
                opened={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onGuardado={() => queryClient.invalidateQueries({ queryKey: ["usuarios"] })}
                usuario={usuarioEditar}
            />
        </Stack>
    );
}
