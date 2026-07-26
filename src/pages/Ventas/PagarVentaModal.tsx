import { Button, FileInput, Group, Modal, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { IconUpload } from "@tabler/icons-react";
import { pagarVentaSchema } from "../../schemas/ventaSchema";

interface PagarVentaModalProps {
    opened: boolean;
    onClose: () => void;
    // El padre conecta la mutation: este modal solo VALIDA el archivo y lo entrega.
    onPagar: (comprobante: File) => void;
    loading?: boolean;
}

// Modal de subida del comprobante. Es UI + validación puras; la mutation
// (ventaService.pagarVenta) vive en el padre, que decide qué hacer al pagar.
export function PagarVentaModal({ opened, onClose, onPagar, loading = false }: PagarVentaModalProps) {
    const form = useForm<{ comprobante: File | null }>({
        mode: "controlled",
        initialValues: { comprobante: null },
        validate: zod4Resolver(pagarVentaSchema),
    });

    function handleClose() {
        form.reset();
        onClose();
    }

    function handleSubmit(values: { comprobante: File | null }) {
        // El schema ya garantizó que no es null; el padre arma el FormData + mutation.
        onPagar(values.comprobante as File);
    }

    return (
        <Modal opened={opened} onClose={handleClose} title="Registrar pago" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Adjunta el comprobante de pago (JPG, PNG o PDF, máx. 5 MB) para marcar la
                        venta como pagada. Esta acción es irreversible.
                    </Text>

                    <FileInput
                        label="Comprobante"
                        placeholder="Selecciona el archivo"
                        accept="image/jpeg,image/png,application/pdf"
                        leftSection={<IconUpload size={16} stroke={1.5} />}
                        clearable
                        {...form.getInputProps("comprobante")}
                    />

                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={handleClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={loading}>
                            Confirmar pago
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
