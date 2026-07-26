import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ActionIcon,
    Badge,
    Button,
    Divider,
    Group,
    NumberInput,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
    Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { IconArrowLeft, IconPlus, IconTrash } from "@tabler/icons-react";
import { SearchableSelectPortafolio } from "../../components/SearchableSelectPortafolio";
import { ventaFormSchema, type VentaFormValues } from "../../schemas/ventaSchema";
import type { EditarRequestVentaDto, ProductoComboDto, RegistrarRequestVentaDto } from "../../api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { comboService } from "../../api/comboService";
import { ventaService } from "../../api/ventaService";

// Formatea soles peruanos: 1234.5 -> "S/ 1,234.50" (mismo helper que la lista/detalle).
const soles = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);

// Cómo se pinta CADA fila del desplegable de productos: nombre a la izquierda,
// precio y stock a la derecha. Así el vendedor decide sin salir del combo.
// Mantine solo conoce value/label de cada opción, así que el precio/stock se
// buscan en el arreglo original (por eso recibe el `producto` ya resuelto).
function OpcionProducto({ producto, label }: { producto?: ProductoComboDto; label: string }) {
    const sinStock = producto?.stock === 0;
    return (
        <Group justify="space-between" wrap="nowrap" gap="sm" w="100%">
            <Text size="sm" truncate>{label}</Text>
            {producto && (
                <Group gap="xs" wrap="nowrap">
                    <Text size="xs" c="dimmed">{soles(producto.precio)}</Text>
                    <Badge
                        size="sm"
                        variant="light"
                        color={sinStock ? "red" : producto.stock <= 5 ? "yellow" : "gray"}
                    >
                        {sinStock ? "Sin stock" : `Stock ${producto.stock}`}
                    </Badge>
                </Group>
            )}
        </Group>
    );
}

// Pantalla ÚNICA para registrar y editar (según haya :id en la URL). Es pantalla
// completa —no modal— porque el detalle de productos crece y necesita espacio.
export function VentaForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const esEdicion = id !== undefined;

    // Listado de vendedores
    const { data: vendedores = [] } = useQuery({
        queryKey: ["combos", "vendedores"],
        queryFn: comboService.listarVendedoresCombo,
    });

    // Listado de productos
    const { data: productos = [] } = useQuery({
        queryKey: ["combos", "productos"],
        queryFn: comboService.listarProductosCombo,
    });
    // const productos: ProductoComboDto[] = [];

    // Índice precio/stock por id, para mostrar el precio al elegir (O(1) por línea).
    const productoPorId = new Map(productos.map((p) => [p.value, p]));

    const form = useForm<VentaFormValues>({
        mode: "controlled",
        initialValues: {
            idVendedor: "",
            detalles: [],
        },
        validate: zod4Resolver(ventaFormSchema),
    });

    const { data: ventaEditar } = useQuery({
            queryKey: ["ventas", id],
            queryFn: () => ventaService.obtenerUnaVenta(id!),
            enabled: esEdicion,
        });

    // En edición: precargar el form con la venta traída del backend.
    // Basta con vigilar `ventaEditar`: en el primer render la petición sigue en vuelo
    // y vale undefined, así que el efecto se corta y se vuelve a ejecutar solo cuando
    // los datos llegan.
    useEffect(() => {
        if (!ventaEditar) return;

        // Viaje de VUELTA del DTO al formulario, el inverso exacto de construirDto:
        // el backend manda idProducto como número y el <Select> solo entiende strings.
        // Además el DTO trae campos de solo lectura (nombreProducto, precioVenta) que
        // el form no maneja: por eso se mapea campo por campo en vez de asignar el
        // arreglo entero.
        form.setValues({
            idVendedor: ventaEditar.idVendedor,
            detalles: ventaEditar.detalles.map((d) => ({
                idProducto: String(d.idProducto),
                cantidad: d.cantidad,
                // El back puede mandarlo null/undefined; el <TextInput> necesita string.
                observacion: d.observacion ?? "",
            })),
        });

        // Lo recién traído pasa a ser el "estado original" del form: así no se considera
        // modificado hasta que el usuario toque algo de verdad.
        form.resetDirty();

        // `form` NO va en las dependencias: useForm devuelve un objeto nuevo en cada
        // render y el efecto se dispararía en bucle infinito.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ventaEditar]);

    function agregarDetalle() {
        // Mantine gestiona la lista: inserta un renglón vacío listo para llenar.
        form.insertListItem("detalles", { idProducto: "", cantidad: 1, observacion: "" });
    }

    // El form habla en STRINGS (los <Select> solo manejan strings); el backend espera
    // idProducto como número. Esta función es el único punto donde se traduce.
    // OJO: idVendedor NO se convierte, es un Guid y viaja como string.
    function construirDto(values: VentaFormValues): RegistrarRequestVentaDto {
        return {
            idVendedor: values.idVendedor,
            detalles: values.detalles.map((d) => ({
                idProducto: Number(d.idProducto),
                cantidad: d.cantidad,
                // "" es un valor que el backend no necesita: mejor no mandar el campo.
                observacion: d.observacion?.trim() || undefined,
            })),
        };
    }

    // Mismo mapeo que construirDto, pero el editar identifica la venta por idVenta
    // (viene de la URL, no del formulario).
    function construirDtoEditar(values: VentaFormValues): EditarRequestVentaDto {
        return {
            idVenta: id!,
            idVendedor: values.idVendedor,
            detalles: values.detalles.map((d) => ({
                idProducto: Number(d.idProducto),
                cantidad: d.cantidad,
                observacion: d.observacion?.trim() || undefined,
            })),
        };
    }

    const registrarMutation = useMutation({
        mutationFn: (values: VentaFormValues) => ventaService.registrarVenta(construirDto(values)),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Venta registrada como borrador." });
            // La lista de ventas quedó vieja: la marcamos como obsoleta y TanStack Query
            // la vuelve a pedir sola cuando la pantalla de Ventas se monte.
            // El combo de productos NO se invalida: registrar deja la venta en BO y
            // todavía no toca el stock (eso ocurre al generarla).
            queryClient.invalidateQueries({ queryKey: ["ventas"] });
            navigate("/ventas");
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo registrar la venta.",
            });
        },
    });

    const editarMutation = useMutation({
        mutationFn: (values: VentaFormValues) => ventaService.editarVenta(construirDtoEditar(values)),
        onSuccess: () => {
            notifications.show({ color: "green", message: "Venta actualizada." });
            // Quedan DOS cachés viejas: la lista ["ventas"] y el detalle ["ventas", id].
            // Basta una llamada porque invalidateQueries hace match por PREFIJO:
            // ["ventas"] alcanza a toda query cuya clave EMPIECE así.
            queryClient.invalidateQueries({ queryKey: ["ventas"] });
            navigate(`/ventas/${id}`);
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                message: error instanceof Error ? error.message : "No se pudo actualizar la venta.",
            });
        },
    });

    // Una sola mutación "activa" según el modo: así el botón y el submit no tienen
    // que preguntar dos veces por esEdicion.
    const mutacionActiva = esEdicion ? editarMutation : registrarMutation;

    function handleSubmit(values: VentaFormValues) {
        // Aquí los valores YA pasaron por Zod. mutate dispara la petición y actualiza
        // isPending, que el botón usa para mostrarse cargando.
        mutacionActiva.mutate(values);
    }

    // Leemos la lista para pintar los renglones (getValues evita re-render extra).
    const detalles = form.getValues().detalles;

    // Total REFERENCIAL calculado en el front solo para que el vendedor lo vea.
    // El total oficial (con IGV) lo calcula el backend con su propio precio.
    const totalEstimado = detalles.reduce((acc, d) => {
        const prod = productoPorId.get(d.idProducto);
        return acc + (prod ? prod.precio * (d.cantidad || 0) : 0);
    }, 0);

    return (
        <Stack gap="lg">
            <Group gap="sm">
                <ActionIcon variant="subtle" onClick={() => navigate("/ventas")} aria-label="Volver">
                    <IconArrowLeft size={20} stroke={1.5} />
                </ActionIcon>
                <Title order={2}>{esEdicion ? "Editar Venta" : "Nueva Venta"}</Title>
            </Group>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                    {/* ── Cabecera ── */}
                    <Paper withBorder p="md" radius="md">
                        <Stack gap="md">
                            <Text fw={600}>Datos de la venta</Text>
                            <SearchableSelectPortafolio
                                label="Vendedor"
                                placeholder="Elige el vendedor"
                                data={vendedores}
                                {...form.getInputProps("idVendedor")}
                            />
                        </Stack>
                    </Paper>

                    {/* ── Detalles ── */}
                    <Paper withBorder p="md" radius="md">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={600}>Detalle de productos</Text>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconPlus size={16} stroke={1.5} />}
                                    onClick={agregarDetalle}
                                >
                                    Agregar producto
                                </Button>
                            </Group>

                            {/* Error a nivel de arreglo (ej. "agrega al menos un producto") */}
                            {typeof form.errors.detalles === "string" && (
                                <Text c="red" size="sm">
                                    {form.errors.detalles}
                                </Text>
                            )}

                            {detalles.length === 0 ? (
                                <Text c="dimmed" size="sm" ta="center" py="sm">
                                    Aún no has agregado productos. Usa “Agregar producto”.
                                </Text>
                            ) : (
                                <Stack gap="sm">
                                    {detalles.map((detalle, index) => {
                                        // Precio/stock del producto elegido (si ya eligió uno).
                                        const prod = productoPorId.get(detalle.idProducto);
                                        const subtotalLinea = prod ? prod.precio * (detalle.cantidad || 0) : 0;
                                        const excedeStock = prod ? (detalle.cantidad || 0) > prod.stock : false;

                                        return (
                                            <Stack key={index} gap={4}>
                                                <Group align="flex-start" wrap="nowrap" gap="sm">
                                                    <SearchableSelectPortafolio
                                                        label={index === 0 ? "Producto" : undefined}
                                                        placeholder="Producto"
                                                        data={productos}
                                                        style={{ flex: 2 }}
                                                        renderOption={({ option }) => (
                                                            <OpcionProducto producto={productoPorId.get(option.value)} label={option.label} />
                                                        )}
                                                        {...form.getInputProps(`detalles.${index}.idProducto`)}
                                                    />
                                                    <NumberInput
                                                        label={index === 0 ? "Cantidad" : undefined}
                                                        placeholder="1"
                                                        min={1}
                                                        allowNegative={false}
                                                        allowDecimal={true}
                                                        style={{ flex: 1 }}
                                                        {...form.getInputProps(`detalles.${index}.cantidad`)}
                                                    />
                                                    <TextInput
                                                        label={index === 0 ? "Observación" : undefined}
                                                        placeholder="Opcional"
                                                        maxLength={200}
                                                        style={{ flex: 2 }}
                                                        {...form.getInputProps(`detalles.${index}.observacion`)}
                                                    />
                                                    <Tooltip label="Quitar">
                                                        <ActionIcon
                                                            color="red"
                                                            variant="light"
                                                            // Empuja el ícono para alinearlo con los inputs cuando hay label (primer renglón).
                                                            mt={index === 0 ? 25 : 0}
                                                            onClick={() => form.removeListItem("detalles", index)}
                                                            aria-label="Quitar producto"
                                                        >
                                                            <IconTrash size={16} stroke={1.5} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>

                                                {/* Precio y subtotal de la línea: para que NO se venda a ciegas.
                                                    Solo aparece cuando ya hay un producto elegido. */}
                                                {prod && (
                                                    <Group gap="xs" pl={4}>
                                                        <Text size="xs" c="dimmed">
                                                            {soles(prod.precio)} c/u · Subtotal {soles(subtotalLinea)}
                                                        </Text>
                                                        <Text size="xs" c={excedeStock ? "red" : "dimmed"}>
                                                            · Stock: {prod.stock}
                                                            {excedeStock ? " (insuficiente)" : ""}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            )}

                            {/* Total referencial (el backend calcula el IGV y el total definitivos) */}
                            {detalles.length > 0 && (
                                <>
                                    <Divider />
                                    <Group justify="flex-end" gap="xs">
                                        <Text c="dimmed">Total estimado:</Text>
                                        <Text fw={700} size="lg">{soles(totalEstimado)}</Text>
                                    </Group>
                                    <Text size="xs" c="dimmed" ta="right">
                                        Referencial. El IGV y el total definitivos los calcula el backend.
                                    </Text>
                                </>
                            )}
                        </Stack>
                    </Paper>

                    <Divider />

                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => navigate("/ventas")}
                            disabled={mutacionActiva.isPending}
                        >
                            Cancelar
                        </Button>
                        {/* isPending: mientras la petición está en vuelo el botón se ve cargando
                            y queda deshabilitado, así nadie registra la venta dos veces. */}
                        <Button type="submit" loading={mutacionActiva.isPending}>
                            {esEdicion ? "Guardar cambios" : "Registrar venta"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
}
