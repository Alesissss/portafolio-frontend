import { useEffect, useState } from "react";
import { Badge, Button, Center, Group, Loader, Stack, Title, ActionIcon, Tooltip, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconPencil, IconTrash, IconPlus, IconBan } from "@tabler/icons-react";
import { usuarioService } from "../../api/usuarioService";
import type { UsuarioDto } from "../../api/types";
import { DataTablePortafolio, type ColumnConfig } from "../../components/DataTablePortafolio";
import { UsuarioFormModal } from "./UsuarioFormModal";

export function Usuarios() {
    const [usuarios, setUsuarios] = useState<UsuarioDto[]>([]);
    const [cargando, setCargando] = useState(true);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState<UsuarioDto | null>(null);

    async function cargar() {
        try {
            setCargando(true);
            const data = await usuarioService.listarUsuarios();
            setUsuarios(data);
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudieron cargar los usuarios.",
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
        setUsuarioEditar(null);
        setModalAbierto(true);
    }

    function abrirEditar(usuario: UsuarioDto) {
        setUsuarioEditar(usuario);
        setModalAbierto(true);
    }

    async function darBaja(usuario: UsuarioDto) {
        try {
            await usuarioService.darBajaUsuario(usuario.idUsuario);
            notifications.show({ color: "green", message: "Usuario dado de baja." });
            cargar();
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo dar de baja al usuario.",
            });
        }
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
            onConfirm: () => eliminar(usuario),
        });
    }

    async function eliminar(usuario: UsuarioDto) {
        try {
            await usuarioService.eliminarUsuario(usuario.idUsuario);
            notifications.show({ color: "green", message: "Usuario eliminado." });
            cargar();
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo eliminar el usuario.",
            });
        }
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
                    {/* Solo desactiva; se deshabilita si el usuario ya está inactivo. */}
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
                <Title order={2}>Mantenimiento de Usuarios</Title>
                <Button leftSection={<IconPlus size={18} stroke={1.5} />} onClick={abrirCrear}>
                    Nuevo Usuario
                </Button>
            </Group>

            {cargando && usuarios.length === 0 ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : (
                <DataTablePortafolio data={usuarios} columns={columnas} fileName="Usuarios" />
            )}

            <UsuarioFormModal
                opened={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onGuardado={cargar}
                usuario={usuarioEditar}
            />
        </Stack>
    );
}
