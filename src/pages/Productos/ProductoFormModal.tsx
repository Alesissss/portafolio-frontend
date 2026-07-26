import { useEffect, useState } from "react";
import { Modal, TextInput, Textarea, Switch, NumberInput, Button, Group, Stack, FileInput, Image } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation } from "@tanstack/react-query";
import { productoService, urlFotoProducto } from "../../api/productoService";
import { comboService } from "../../api/comboService";
import type { ProductoDto, RegistrarRequestProductoDto } from "../../api/types";
import { SearchableSelectPortafolio } from "../../components/SearchableSelectPortafolio";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { productoSchema, fotoProductoSchema } from "../../schemas/productoSchema";

interface ProductoFormModalProps {
    opened: boolean;
    onClose: () => void;
    onGuardado: () => void;
    producto: ProductoDto | null;
}

export function ProductoFormModal({ opened, onClose, onGuardado, producto }: ProductoFormModalProps) {
    const esEdicion = producto !== null;

    // La foto va fuera de useForm: no es un valor del formulario sino un archivo que
    // viaja aparte en el FormData. Su error también se maneja aquí.
    const [foto, setFoto] = useState<File | null>(null);
    const [errorFoto, setErrorFoto] = useState<string | null>(null);

    // URL de la foto ya guardada (solo en edición). Si el usuario elige una nueva,
    // se muestra esa en su lugar como vista previa.
    const fotoActual = urlFotoProducto(producto?.archivoFoto);
    const previewUrl = foto ? URL.createObjectURL(foto) : fotoActual;

    function elegirFoto(archivo: File | null) {
        if (!archivo) {
            setFoto(null);
            setErrorFoto(null);
            return;
        }

        const resultado = fotoProductoSchema.safeParse(archivo);
        if (!resultado.success) {
            setFoto(null);
            setErrorFoto(resultado.error.issues[0].message);
            return;
        }

        setFoto(archivo);
        setErrorFoto(null);
    }

    // Opciones del Select de categorías. Con enabled:opened, solo se piden cuando el modal se abre
    // (y quedan cacheadas: reabrir el modal no vuelve a pegarle al backend si siguen frescas).
    const { data: categorias = [] } = useQuery({
        queryKey: ["combos", "categorias"],
        queryFn: comboService.listarCategoriasCombo,
        enabled: opened,
    });

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
        validate: zod4Resolver(productoSchema),
    });

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
        // Al reabrir el modal, la foto elegida en una sesión anterior no debe arrastrarse.
        setFoto(null);
        setErrorFoto(null);
        form.resetDirty();
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, producto]);

    const guardarMutation = useMutation({
        mutationFn: (values: typeof form.values) => {
            if (producto) {
                // EDITAR: arrastramos el idProducto original (no se edita; no es campo del form).
                const dto: ProductoDto = {
                    idProducto: producto.idProducto,
                    ...values,
                    nombre: values.nombre.trim(),
                    descripcion: values.descripcion.trim(),
                };
                return productoService.editarProducto(dto, foto);
            }
            // CREAR: sin idProducto, lo genera la BD.
            const dto: RegistrarRequestProductoDto = {
                ...values,
                nombre: values.nombre.trim(),
                descripcion: values.descripcion.trim(),
            };
            return productoService.registrarProducto(dto, foto);
        },
        onSuccess: () => {
            notifications.show({
                color: "green",
                message: esEdicion ? "Producto actualizado." : "Producto registrado.",
            });
            onGuardado();
            onClose();
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo guardar el producto.",
            });
        },
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={esEdicion ? "Editar producto" : "Nuevo producto"}
            centered
        >
            <form onSubmit={form.onSubmit((values) => guardarMutation.mutate(values))}>
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

                    {/* Foto opcional. En edición, dejarla vacía conserva la imagen actual;
                        para cambiarla basta elegir otra. */}
                    <Group align="flex-start" wrap="nowrap" gap="md">
                        <FileInput
                            style={{ flex: 1 }}
                            label="Foto del producto"
                            description="Opcional. JPG, PNG o WEBP, hasta 2 MB."
                            placeholder={esEdicion && fotoActual ? "Elige otra para reemplazarla" : "Sin foto"}
                            accept="image/jpeg,image/png,image/webp"
                            leftSection={<IconPhoto size={16} stroke={1.5} />}
                            clearable
                            value={foto}
                            onChange={elegirFoto}
                            error={errorFoto}
                        />

                        {previewUrl && (
                            <Image
                                src={previewUrl}
                                alt="Vista previa"
                                w={80}
                                h={80}
                                radius="md"
                                fit="cover"
                                mt={25}   // alinea con el input, que arrastra label + description
                            />
                        )}
                    </Group>

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
