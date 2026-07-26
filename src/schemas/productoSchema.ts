import { z } from "zod";

// Schema de registro/edición de producto.
export const productoSchema = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(50, "Máximo 50 caracteres"),
    descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(50, "Máximo 50 caracteres"),
    stock: z.number().min(0, "El stock no puede ser negativo"),
    precio: z.number().positive("El precio debe ser mayor que 0"),
    idCategoria: z.string().min(1, "La categoría es obligatoria"),
});

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];

// La foto NO es parte de los valores del form (es un File aparte), por eso su schema
// va suelto y se valida a mano al elegir el archivo. Es opcional en ambos modos.
export const fotoProductoSchema = z
    .instanceof(File)
    .refine((f) => f.size <= MAX_BYTES, "La imagen no debe superar los 2 MB.")
    .refine((f) => TIPOS_OK.includes(f.type), "Solo se permite JPG, PNG o WEBP.");
