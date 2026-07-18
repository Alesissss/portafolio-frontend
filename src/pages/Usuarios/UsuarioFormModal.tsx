import { useEffect, useState } from "react";
import { Modal, TextInput, PasswordInput, Switch, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { usuarioService } from "../../api/usuarioService";
import { comboService } from "../../api/comboService";
import type {
    UsuarioDto,
    RegistrarRequestUsuarioDto,
    EditarRequestUsuarioDto,
    ComboDto,
} from "../../api/types";
import { SearchableSelectPortafolio } from "../../components/SearchableSelectPortafolio";

interface UsuarioFormModalProps {
    opened: boolean;
    onClose: () => void;
    onGuardado: () => void;
    usuario: UsuarioDto | null;
}

// Tipamos los valores del form para poder validar confirmPassword contra password.
interface UsuarioFormValues {
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    correo: string;
    username: string;
    password: string;
    confirmPassword: string;
    idRol: string;
    estado: boolean;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function UsuarioFormModal({ opened, onClose, onGuardado, usuario }: UsuarioFormModalProps) {
    const esEdicion = usuario !== null;
    const [cargando, setCargando] = useState(false);
    const [roles, setRoles] = useState<ComboDto[]>([]);

    const form = useForm<UsuarioFormValues>({
        mode: "controlled",
        initialValues: {
            apellidoPaterno: "",
            apellidoMaterno: "",
            nombres: "",
            correo: "",
            username: "",
            password: "",
            confirmPassword: "",
            idRol: "",
            estado: true,
        },
        validate: {
            nombres: (v) => (v.trim().length === 0 ? "Los nombres son obligatorios" : null),
            apellidoPaterno: (v) => (v.trim().length === 0 ? "El apellido paterno es obligatorio" : null),
            apellidoMaterno: (v) => (v.trim().length === 0 ? "El apellido materno es obligatorio" : null),
            correo: (v) => {
                const t = v.trim();
                if (t.length === 0) return "El correo es obligatorio";
                if (!EMAIL_REGEX.test(t)) return "El correo no es válido";
                return null;
            },
            username: (v) => (v.trim().length === 0 ? "El nombre de usuario es obligatorio" : null),
            idRol: (v) => (v ? null : "El rol es obligatorio"),
            // La contraseña solo se valida al CREAR (en edición no se cambia aquí).
            password: (v) => {
                if (esEdicion) return null;
                if (v.length < 8) return "La contraseña debe tener al menos 8 caracteres";
                if (!/[A-Z]/.test(v)) return "Debe contener al menos una mayúscula";
                if (!/[a-z]/.test(v)) return "Debe contener al menos una minúscula";
                if (!/[0-9]/.test(v)) return "Debe contener al menos un número";
                if (!/[^a-zA-Z0-9]/.test(v)) return "Debe contener al menos un carácter especial";
                return null;
            },
            confirmPassword: (v, values) => {
                if (esEdicion) return null;
                return v === values.password ? null : "Las contraseñas no coinciden";
            },
        },
    });

    // Cargar los roles para el select (una vez).
    useEffect(() => {
        comboService
            .listarRolesCombo()
            .then(setRoles)
            .catch((error) =>
                notifications.show({
                    color: "red",
                    message: error instanceof Error ? error.message : "No se pudieron cargar los roles.",
                })
            );
    }, []);

    // Sincronizar el form al abrir. En edición NO precargamos password (no se edita aquí).
    useEffect(() => {
        if (!opened) return;
        if (usuario) {
            form.setValues({
                apellidoPaterno: usuario.apellidoPaterno,
                apellidoMaterno: usuario.apellidoMaterno,
                nombres: usuario.nombres,
                correo: usuario.correo,
                username: usuario.username,
                password: "",
                confirmPassword: "",
                idRol: usuario.idRol,
                estado: usuario.estado,
            });
        } else {
            form.setValues({
                apellidoPaterno: "",
                apellidoMaterno: "",
                nombres: "",
                correo: "",
                username: "",
                password: "",
                confirmPassword: "",
                idRol: "",
                estado: true,
            });
        }
        form.resetDirty();
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, usuario]);

    async function guardar(values: UsuarioFormValues) {
        try {
            setCargando(true);

            if (usuario) {
                // EDITAR: sin password. Arrastramos el idUsuario original.
                const dto: EditarRequestUsuarioDto = {
                    idUsuario: usuario.idUsuario,
                    apellidoPaterno: values.apellidoPaterno.trim(),
                    apellidoMaterno: values.apellidoMaterno.trim(),
                    nombres: values.nombres.trim(),
                    correo: values.correo.trim(),
                    username: values.username.trim(),
                    idRol: values.idRol,
                    estado: values.estado,
                };
                await usuarioService.editarUsuario(dto);
            } else {
                // CREAR: con password + confirmPassword.
                const dto: RegistrarRequestUsuarioDto = {
                    apellidoPaterno: values.apellidoPaterno.trim(),
                    apellidoMaterno: values.apellidoMaterno.trim(),
                    nombres: values.nombres.trim(),
                    correo: values.correo.trim(),
                    username: values.username.trim(),
                    password: values.password,
                    confirmPassword: values.confirmPassword,
                    idRol: values.idRol,
                    estado: values.estado,
                };
                await usuarioService.registrarUsuario(dto);
            }

            notifications.show({
                color: "green",
                message: esEdicion ? "Usuario actualizado." : "Usuario registrado.",
            });

            onGuardado();
            onClose();
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo guardar el usuario.",
            });
        } finally {
            setCargando(false);
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={esEdicion ? "Editar usuario" : "Nuevo usuario"}
            centered
        >
            <form onSubmit={form.onSubmit(guardar)}>
                <Stack gap="md">
                    <TextInput
                        label="Nombres"
                        placeholder="Jorge Alexis"
                        maxLength={30}
                        {...form.getInputProps("nombres")}
                    />

                    <Group grow>
                        <TextInput
                            label="Apellido paterno"
                            placeholder="Torres"
                            maxLength={30}
                            {...form.getInputProps("apellidoPaterno")}
                        />
                        <TextInput
                            label="Apellido materno"
                            placeholder="Cabrejos"
                            maxLength={30}
                            {...form.getInputProps("apellidoMaterno")}
                        />
                    </Group>

                    <TextInput
                        label="Correo"
                        placeholder="usuario@correo.com"
                        maxLength={255}
                        {...form.getInputProps("correo")}
                    />

                    <TextInput
                        label="Nombre de usuario"
                        placeholder="atorres"
                        maxLength={255}
                        {...form.getInputProps("username")}
                    />

                    <SearchableSelectPortafolio
                        label="Rol"
                        placeholder="Busca y elige un rol"
                        data={roles}
                        clearable={false}
                        {...form.getInputProps("idRol")}
                    />

                    {/* La contraseña solo aparece al CREAR. En edición se maneja en un flujo aparte. */}
                    {!esEdicion && (
                        <>
                            <PasswordInput
                                label="Contraseña"
                                placeholder="Mínimo 8 caracteres"
                                {...form.getInputProps("password")}
                            />
                            <PasswordInput
                                label="Confirmar contraseña"
                                placeholder="Repite la contraseña"
                                {...form.getInputProps("confirmPassword")}
                            />
                        </>
                    )}

                    {/* Estado visible al crear y editar (nace activo por defecto). */}
                    <Switch label="Activo" {...form.getInputProps("estado", { type: "checkbox" })} />

                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={onClose} disabled={cargando}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={cargando}>
                            {esEdicion ? "Guardar cambios" : "Registrar"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
