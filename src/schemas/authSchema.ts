import { z } from "zod";

// Schema del login. El tipo de los valores sale del propio schema.
export const loginSchema = z.object({
    username: z.string().trim().min(1, "El nombre de usuario es obligatorio"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginValues = z.infer<typeof loginSchema>;
