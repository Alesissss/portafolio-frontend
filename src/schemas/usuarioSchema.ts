import { z } from "zod";

// Campos comunes a crear y editar usuario.
export const usuarioBaseSchema = z.object({
    nombres: z.string().trim().min(1, "Los nombres son obligatorios"),
    apellidoPaterno: z.string().trim().min(1, "El apellido paterno es obligatorio"),
    apellidoMaterno: z.string().trim().min(1, "El apellido materno es obligatorio"),
    correo: z.string().trim().min(1, "El correo es obligatorio").pipe(z.email("El correo no es válido")),
    username: z.string().trim().min(1, "El nombre de usuario es obligatorio"),
    idRol: z.string().min(1, "El rol es obligatorio"),
});

// Al CREAR se exige contraseña (con reglas) y su confirmación; al editar no se toca aquí.
export const usuarioCrearSchema = usuarioBaseSchema
    .extend({
        password: z
            .string()
            .min(8, "La contraseña debe tener al menos 8 caracteres")
            .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
            .regex(/[a-z]/, "Debe contener al menos una minúscula")
            .regex(/[0-9]/, "Debe contener al menos un número")
            .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un carácter especial"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });
