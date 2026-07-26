import { api } from "./axiosClient";
import type { UsuarioDto, RegistrarRequestUsuarioDto, EditarRequestUsuarioDto } from "./types";

export const usuarioService = {
    // Listar usuarios
    listarUsuarios: (): Promise<UsuarioDto[]> =>
        api.get<UsuarioDto[]>('/api/usuario'),

    // Obtener un usuario
    obtenerUnUsuario: (id: string): Promise<UsuarioDto> =>
        api.get<UsuarioDto>(`/api/usuario/${id}`),

    // Registrar
    registrarUsuario: (dto: RegistrarRequestUsuarioDto): Promise<void> =>
        api.post<void>('/api/usuario', dto),

    // Editar
    editarUsuario: (dto: EditarRequestUsuarioDto): Promise<void> =>
        api.put<void>('/api/usuario', dto),

    // Dar baja
    darBajaUsuario: (id: string): Promise<void> =>
        api.patch<void>(`/api/usuario/${id}`),

    // Eliminar
    eliminarUsuario: (id: string): Promise<void> =>
        api.delete<void>(`/api/usuario/${id}`),
};
