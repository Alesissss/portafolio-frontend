import { api } from "./axiosClient";
import type { CategoriaDto, RegistrarRequestCategoriaDto } from "./types";

export const categoriaService = {
    // Listar todas las categorías
    listarCategorias: (): Promise<CategoriaDto[]> =>
        api.get<CategoriaDto[]>('/api/categoria'),

    // Listar una categoría
    listarUnaCategoria: (id: string): Promise<CategoriaDto> =>
        api.get<CategoriaDto>(`/api/categoria/${id}`),

    // Registrar
    registrarCategoria: (dto: RegistrarRequestCategoriaDto): Promise<void> =>
        api.post<void>('/api/categoria', dto),

    // Editar
    editarCategoria: (dto: CategoriaDto): Promise<void> =>
        api.put<void>('/api/categoria', dto),

    // Dar baja
    darBajaCategoria: (id: string): Promise<void> =>
        api.patch<void>(`/api/categoria/${id}`),

    // Eliminar
    eliminarCategoria: (id: string): Promise<void> =>
        api.delete<void>(`/api/categoria/${id}`),
};
