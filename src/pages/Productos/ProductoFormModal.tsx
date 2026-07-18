import { useEffect, useState } from "react";
import { Modal, TextInput, Textarea, Switch, NumberInput, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { productoService } from "../../api/productoService";
import { comboService } from "../../api/comboService";
import type { ProductoDto, RegistrarRequestProductoDto, ComboDto } from "../../api/types";
import { SearchableSelectPortafolio } from "../../components/SearchableSelectPortafolio";

interface ProductoFormModalProps {
    opened: boolean;
    onClose: () => void;
    onGuardado: () => void;
    producto: ProductoDto | null;
}

export function ProductoFormModal({ opened, onClose, onGuardado, producto }: ProductoFormModalProps) {
    const esEdicion = producto !== null;
    const [cargando, setCargando] = useState(false);

    // Opciones del Select de categorías (ya vienen como { value, label } desde el combo).
    const [categorias, setCategorias] = useState<ComboDto[]>([]);

    const form = useForm({
        mode: "controlled",
        initialValues: {
            nombre: "",
            descripcion: "",
            stock: 0,
            precio: 0,
            estado: true,
            idCategoria: "",
        },
        validate: {
            nombre: (value: string) => {
                const v = value.trim();
                if (v.length === 0) return "El nombre es obligatorio";
                if (v.length > 50) return "Máximo 50 caracteres";
                return null;
            },
            descripcion: (value: string) => {
                const v = value.trim();
                if (v.length === 0) return "La descripción es obligatoria";
                if (v.length > 50) return "Máximo 50 caracteres";
                return null;
            },
            stock: (value: number) => (value < 0 ? "El stock no puede ser negativo" : null),
            precio: (value: number) => (value <= 0 ? "El precio debe ser mayor que 0" : null),
            idCategoria: (value: string) => (value ? null : "La categoría es obligatoria"),
        },
    });

    // Listar categorías
    useEffect(() => {
        comboService
            .listarCategoriasCombo()
            .then(setCategorias)
            .catch((error) =>
                notifications.show({
                    color: "red",
                    message: error instanceof Error ? error.message : "No se pudieron cargar las categorías.",
                })
            );
    }, [])

    // Form de crear/editar
    useEffect(() => {
        if (!opened) return;
        if (producto) {
            form.setValues({
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                stock: producto.stock,
                precio: producto.precio,
                estado: producto.estado,
                idCategoria: producto.idCategoria,
            });
        } else {
            form.setValues({ nombre: "", descripcion: "", stock: 0, precio: 0, estado: true, idCategoria: "" });
        }
        form.resetDirty();
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, producto]);

    async function guardar(values: typeof form.values) {
        try {
            setCargando(true);

            if (producto) {
                // EDITAR: arrastramos el idProducto original (no se edita; no es campo del form).
                const dto: ProductoDto = {
                    idProducto: producto.idProducto,
                    ...values,
                    nombre: values.nombre.trim(),
                    descripcion: values.descripcion.trim(),
                };
                await productoService.editarProducto(dto);
            } else {
                // CREAR: sin idProducto, lo genera la BD.
                const dto: RegistrarRequestProductoDto = {
                    ...values,
                    nombre: values.nombre.trim(),
                    descripcion: values.descripcion.trim(),
                };
                await productoService.registrarProducto(dto);
            }

            notifications.show({
                color: "green",
                message: esEdicion ? "Producto actualizado." : "Producto registrado.",
            });

            onGuardado();
            onClose();
        } catch (error) {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo guardar el producto.",
            });
        } finally {
            setCargando(false);
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={esEdicion ? "Editar producto" : "Nuevo producto"}
            centered
        >
            <form onSubmit={form.onSubmit(guardar)}>
                <Stack gap="md">

                    <SearchableSelectPortafolio
                        label="Categoría"
                        placeholder="Busca y elige una categoría"
                        data={categorias}
                        clearable={false}
                        {...form.getInputProps("idCategoria")}
                    />

                    <TextInput
                        label="Nombre"
                        placeholder="Laptop HP 15"
                        maxLength={50}
                        {...form.getInputProps("nombre")}
                    />

                    <Textarea
                        label="Descripción"
                        placeholder="Portátil 15 pulgadas, 16GB RAM"
                        autosize
                        minRows={2}
                        maxLength={50}
                        {...form.getInputProps("descripcion")}
                    />

                    <Group grow>
                        <NumberInput
                            label="Stock"
                            placeholder="0"
                            min={0}
                            allowNegative={false}
                            {...form.getInputProps("stock")}
                        />
                        <NumberInput
                            label="Precio"
                            placeholder="0.00"
                            min={0}
                            decimalScale={2}
                            fixedDecimalScale
                            prefix="S/ "
                            thousandSeparator=","
                            allowNegative={false}
                            {...form.getInputProps("precio")}
                        />
                    </Group>

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
