import { z } from "zod";

// Schema de registro/edición de categoría.
export const categoriaSchema = z.object({
    idCategoria: z.string().trim().min(1, "El código es obligatorio").max(3, "Máximo 3 caracteres"),
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(30, "Máximo 30 caracteres"),
    descripcion: z.string().trim().max(255, "Máximo 255 caracteres"),
});
