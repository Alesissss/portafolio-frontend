import { useEffect } from "react";
import { Modal, TextInput, PasswordInput, Switch, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usuarioService } from "../../api/usuarioService";
import { comboService } from "../../api/comboService";
import type {
    UsuarioDto,
    RegistrarRequestUsuarioDto,
    EditarRequestUsuarioDto,
} from "../../api/types";
import { SearchableSelectPortafolio } from "../../components/SearchableSelectPortafolio";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod";

const usuarioBaseSchema = z.object({
    nombres: z.string().trim().min(1, "Los nombres son obligatorios"),
    apellidoPaterno: z.string().trim().min(1, "El apellido paterno es obligatorio"),
    apellidoMaterno: z.string().trim().min(1, "El apellido materno es obligatorio"),
    correo: z.string().trim().min(1, "El correo es obligatorio").pipe(z.email("El correo no es válido")),
    username: z.string().trim().min(1, "El nombre de usuario es obligatorio"),
    idRol: z.string().min(1, "El rol es obligatorio"),
});

const usuarioCrearSchema = usuarioBaseSchema
    .extend({
        password: z
            .string()
            .min(8, "La contraseña debe tener al menos 8 caracteres")
            .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
            .regex(/[a-z]/, "Debe contener al menos una minúscula")
            .regex(/[0-9]/, "Debe contener al menos un número")
            .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un carácter especial"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

interface UsuarioFormModalProps {
    opened: boolean;
    onClose: () => void;
    onGuardado: () => void;
    usuario: UsuarioDto | null;
}

// Tipamos los valores del form para poder validar confirmPassword contra password.
type UsuarioFormValues = {
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    correo: string;
    username: string;
    password: string;
    confirmPassword: string;
    idRol: string;
    estado: boolean;
};

export function UsuarioFormModal({ opened, onClose, onGuardado, usuario }: UsuarioFormModalProps) {
    const esEdicion = usuario !== null;

    // Roles para el Select. Solo se piden cuando el modal se abre (enabled:opened) y quedan cacheados.
    const { data: roles = [] } = useQuery({
        queryKey: ["combos", "roles"],
        queryFn: comboService.listarRolesCombo,
        enabled: opened,
    });

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
        validate: zod4Resolver(esEdicion ? usuarioBaseSchema : usuarioCrearSchema),
    });

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

    const guardarMutation = useMutation({
        mutationFn: (values: UsuarioFormValues) => {
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
                return usuarioService.editarUsuario(dto);
            }
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
            return usuarioService.registrarUsuario(dto);
        },
        onSuccess: () => {
            notifications.show({
                color: "green",
                message: esEdicion ? "Usuario actualizado." : "Usuario registrado.",
            });
            onGuardado();
            onClose();
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo guardar el usuario.",
            });
        },
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={esEdicion ? "Editar usuario" : "Nuevo usuario"}
            centered
        >
            <form onSubmit={form.onSubmit((values) => guardarMutation.mutate(values))}>
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
                        <Button variant="default" onClick={onClose} disabled={guardarMutation.isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={guardarMutation.isPending}>
                            {esEdicion ? "Guardar cambios" : "Registrar"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
