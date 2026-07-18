import { api } from "./axiosClient";
import type { ProductoDto, RegistrarRequestProductoDto } from "./types";

export const productoService = {
    // Listar productos
    listarProductos: (): Promise<ProductoDto[]> =>
        api.get<ProductoDto[]>('/api/producto'),

    // Obtener un producto
    obtenerUnProducto: (id: number): Promise<ProductoDto> =>
        api.get<ProductoDto>(`/api/producto/${id}`),

    // Registrar
    registrarProducto: (dto: RegistrarRequestProductoDto): Promise<void> =>
        api.post<void>('/api/producto', dto),

    // Editar
    editarProducto: (dto: ProductoDto): Promise<void> =>
        api.put<void>(`/api/producto`, dto),

    // Dar baja
    darBajaProducto: (id: number): Promise<void> =>
        api.patch<void>(`/api/producto/${id}`),

    // Eliminara
    eliminarProducto: (id: number): Promise<void> =>
        api.delete<void>(`/api/producto/${id}`)
}