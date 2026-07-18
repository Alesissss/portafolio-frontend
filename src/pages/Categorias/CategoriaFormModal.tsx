import { useEffect, useState } from "react";
import { Modal, TextInput, Textarea, Switch, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { categoriaService } from "../../api/categoriaService";
import type { CategoriaDto } from "../../api/types";

// --- Props: el "contrato" de comunicación con la página padre (Categorias.tsx) ---
// Datos bajan (opened, categoria), eventos suben (onClose, onGuardado). El modal no sabe
// recargar la lista: solo avisa "guardé" y el padre decide.
interface CategoriaFormModalProps {
    opened: boolean;                 // ¿el modal está visible? Lo decide el padre.
    onClose: () => void;             // avisar al padre "quiero cerrarme".
    onGuardado: () => void;          // avisar al padre "guardé algo, recarga tu lista".
    categoria: CategoriaDto | null;  // null = CREANDO; un objeto = EDITANDO esa fila.
}

export function CategoriaFormModal({ opened, onClose, onGuardado, categoria }: CategoriaFormModalProps) {
    // ¿Estamos editando? Lo deducimos de si nos pasaron una categoría o no.
    const esEdicion = categoria !== null;

    // `cargando` sigue siendo un useState normal (es estado de la LLAMADA, no del formulario).
    const [cargando, setCargando] = useState(false);

    // --- @mantine/form: un solo objeto en vez de un useState por campo ---
    // Nos da values, onChange y validación en un paquete. `mode: "controlled"` re-renderiza en
    // cada tecleo (como tus inputs controlados del Login); para formularios cortos es lo más simple.
    const form = useForm({
        mode: "controlled",
        initialValues: {
            idCategoria: "",
            nombre: "",
            descripcion: "",
            estado: true,
        },
        // Cada validador devuelve un string (mensaje de error) o null (campo válido).
        // Mantine pinta el error bajo el input y BLOQUEA el submit si algo falla.
        // Los límites espejan a los FluentValidation del backend (CategoriaValidator.cs):
        // idCategoria máx 3, nombre máx 30, descripcion máx 255. Validamos aquí para dar feedback
        // inmediato, pero el backend sigue siendo la última palabra.
        validate: {
            idCategoria: (value: string) => {
                const v = value.trim();
                if (v.length === 0) return "El código es obligatorio";
                if (v.length > 3) return "Máximo 3 caracteres";
                return null;
            },
            nombre: (value: string) => {
                const v = value.trim();
                if (v.length === 0) return "El nombre es obligatorio";
                if (v.length > 30) return "Máximo 30 caracteres";
                return null;
            },
            descripcion: (value: string) =>
                value.trim().length > 255 ? "Máximo 255 caracteres" : null,
        },
    });

    // --- Sincronizar el formulario cada vez que se abre ---
    // EDITAR: precargar los campos. CREAR: dejarlos en blanco. setValues rellena; resetDirty/clearErrors
    // dejan el form "limpio" (sin errores viejos ni marca de modificado).
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
        // `form` es estable entre renders; lo omitimos de las deps a propósito.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, categoria]);

    // --- Guardar ---
    // form.onSubmit(guardar) valida PRIMERO; solo si todo pasa llama a `guardar` con los values
    // ya listos. Por eso aquí ya no recibimos ni manejamos el evento del formulario.
    async function guardar(values: typeof form.values) {
        const dto: CategoriaDto = {
            idCategoria: values.idCategoria.trim(),
            nombre: values.nombre.trim(),
            descripcion: values.descripcion.trim() || undefined,
            estado: values.estado,
        };

        try {
            setCargando(true);

            // Tu axiosClient desenvuelve el ApiResponse: si el backend responde status:false,
            // estas llamadas LANZAN un Error y caemos al catch.
            if (esEdicion) {
                await categoriaService.editarCategoria(dto);
            } else {
                await categoriaService.registrarCategoria(dto);
            }

            notifications.show({
                color: "green",
                message: esEdicion ? "Categoría actualizada." : "Categoría registrada.",
            });

            onGuardado(); // el padre recarga la lista
            onClose();    // cerramos el modal
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo guardar la categoría.",
            });
        } finally {
            setCargando(false);
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={esEdicion ? "Editar categoría" : "Nueva categoría"}
            centered
        >
            {/* getInputProps conecta cada input con el form (value + onChange + error).
                Ya no necesitamos value/onChange manuales por campo. */}
            <form onSubmit={form.onSubmit(guardar)}>
                <Stack gap="md">
                    <TextInput
                        label="Código"
                        description="Identificador corto y fácil de recordar. Ej: LAP, COM, 001"
                        placeholder="LAP"
                        maxLength={3}
                        // En edición el código es la clave primaria: no debe cambiarse.
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
