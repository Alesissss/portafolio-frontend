import { api, BASE_URL } from "./axiosClient";
import type { ProductoDto, RegistrarRequestProductoDto } from "./types";

// La foto viaja junto a los campos, así que la petición ya no puede ser JSON:
// debe ser multipart/form-data. FormData solo acepta strings y File, por eso los
// números y booleanos se convierten con String(...).
function aFormData(dto: Record<string, unknown>, foto?: File | null): FormData {
    const formData = new FormData();

    for (const [clave, valor] of Object.entries(dto)) {
        if (valor === undefined || valor === null) continue;
        formData.append(clave, String(valor));
    }

    // Sin archivo no se manda el campo: el backend lo interpreta como "sin foto"
    // al registrar y como "conservar la actual" al editar.
    if (foto) formData.append("foto", foto);

    return formData;
}

// Content-Type en undefined para que axios detecte el FormData y ponga
// multipart/form-data con su boundary (mismo truco que en pagarVenta).
const configMultipart = { headers: { "Content-Type": undefined } };

// URL pública de la foto. Devuelve null si el producto no tiene: no requiere JWT,
// el archivo se sirve directo desde wwwroot.
export function urlFotoProducto(archivoFoto?: string | null): string | null {
    return archivoFoto ? `${BASE_URL}/${archivoFoto}` : null;
}

export const productoService = {
    // Listar productos
    listarProductos: (): Promise<ProductoDto[]> =>
        api.get<ProductoDto[]>('/api/producto'),

    // Obtener un producto
    obtenerUnProducto: (id: number): Promise<ProductoDto> =>
        api.get<ProductoDto>(`/api/producto/${id}`),

    // Registrar (la foto es opcional)
    registrarProducto: (dto: RegistrarRequestProductoDto, foto?: File | null): Promise<void> =>
        api.post<void>('/api/producto', aFormData({ ...dto }, foto), configMultipart),

    // Editar (sin foto nueva se conserva la actual)
    editarProducto: (dto: ProductoDto, foto?: File | null): Promise<void> =>
        api.put<void>(`/api/producto`, aFormData({ ...dto }, foto), configMultipart),

    // Dar baja
    darBajaProducto: (id: number): Promise<void> =>
        api.patch<void>(`/api/producto/${id}`),

    // Eliminara
    eliminarProducto: (id: number): Promise<void> =>
        api.delete<void>(`/api/producto/${id}`)
}