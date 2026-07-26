import { z } from "zod";


const detalleSchema = z.object({
    idProducto: z.string().min(1, "Elige un producto"),
    cantidad: z
        .number()
        .int("Debe ser un número entero")
        .positive("La cantidad debe ser mayor que 0"),
    observacion: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

export const ventaFormSchema = z.object({
    idVendedor: z.string().min(1, "El vendedor es obligatorio"),
    detalles: z.array(detalleSchema).min(1, "Agrega al menos un producto a la venta"),
});

// El tipo de los valores del form sale del propio schema (una sola fuente de verdad).
export type VentaFormValues = z.infer<typeof ventaFormSchema>;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_OK = ["image/jpeg", "image/png", "application/pdf"];

export const pagarVentaSchema = z.object({
    comprobante: z
        .instanceof(File, { error: "Debes adjuntar el comprobante." })
        .refine((f) => f.size <= MAX_BYTES, "El archivo no debe superar los 5 MB.")
        .refine((f) => TIPOS_OK.includes(f.type), "Solo se permite JPG, PNG o PDF."),
});
