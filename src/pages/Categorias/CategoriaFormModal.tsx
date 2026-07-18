import { useEffect } from "react";
import { Modal, TextInput, Textarea, Switch, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { categoriaService } from "../../api/categoriaService";
import type { CategoriaDto } from "../../api/types";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod";

const categoriaSchema = z.object({
    idCategoria: z.string().trim().min(1, "El código es obligatorio").max(3, "Máximo 3 caracteres"),
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(30, "Máximo 30 caracteres"),
    descripcion: z.string().trim().max(255, "Máximo 255 caracteres"),
});

interface CategoriaFormModalProps {
    opened: boolean;
    onClose: () => void;
    onGuardado: () => void;
    categoria: CategoriaDto | null;
}

export function CategoriaFormModal({ opened, onClose, onGuardado, categoria }: CategoriaFormModalProps) {
    // ¿Estamos editando? Lo deducimos de si nos pasaron una categoría o no.
    const esEdicion = categoria !== null;

    const form = useForm({
        mode: "controlled",
        initialValues: {
            idCategoria: "",
            nombre: "",
            descripcion: "",
            estado: true,
        },
        // Zod valida todo el form contra categoriaSchema (reemplaza las 3 funciones manuales).
        validate: zod4Resolver(categoriaSchema),
    });

    useEffect(() => {
        if (!opened) return;
        if (categoria) {
            form.setValues({
                idCategoria: categoria.idCategoria,
                nombre: categoria.nombre,
                descripcion: categoria.descripcion ?? "",
                estado: categoria.estado,
            });
        } else {
            form.setValues({ idCategoria: "", nombre: "", descripcion: "", estado: true });
        }
        form.resetDirty();
        form.clearErrors();
    }, [opened, categoria]);

    const guardarMutation = useMutation({
        mutationFn: (values: typeof form.values) => {
            const dto: CategoriaDto = {
                idCategoria: values.idCategoria.trim(),
                nombre: values.nombre.trim(),
                descripcion: values.descripcion.trim() || undefined,
                estado: values.estado,
            };
            return esEdicion
                ? categoriaService.editarCategoria(dto)
                : categoriaService.registrarCategoria(dto);
        },
        onSuccess: () => {
            notifications.show({
                color: "green",
                message: esEdicion ? "Categoría actualizada." : "Categoría registrada.",
            });
            onGuardado();
            onClose();
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo guardar la categoría.",
            });
        },
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={esEdicion ? "Editar categoría" : "Nueva categoría"}
            centered
        >
            {/* getInputProps conecta cada input con el form (value + onChange + error).
                Ya no necesitamos value/onChange manuales por campo. */}
            <form onSubmit={form.onSubmit((values) => guardarMutation.mutate(values))}>
                <Stack gap="md">
                    <TextInput
                        label="Código"
                        description="Identificador corto y fácil de recordar. Ej: LAP, COM, 001"
                        placeholder="LAP"
                        maxLength={3}
                        disabled={esEdicion}
                        {...form.getInputProps("idCategoria")}
                    />

                    <TextInput
                        label="Nombre"
                        placeholder="Laptops"
                        maxLength={30}
                        {...form.getInputProps("nombre")}
                    />

                    <Textarea
                        label="Descripción"
                        placeholder="Equipos portátiles y accesorios"
                        autosize
                        minRows={2}
                        {...form.getInputProps("descripcion")}
                    />

                    {/* Para checkbox/switch se usa type:"checkbox": así getInputProps usa `checked`. */}
                    <Switch label="Activa" {...form.getInputProps("estado", { type: "checkbox" })} />

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
