import { api } from "./axiosClient";
import type { PaginacionResponse, VentaDto, RegistrarRequestVentaDto, EditarRequestVentaDto } from "./types";

export const ventaService = {
    // Listar las ventas
    listarVentas: async (pagina: number = 1, registrosPorPagina: number = 10, search?: string): Promise<PaginacionResponse<VentaDto>> => {
        return await api.get<PaginacionResponse<VentaDto>>('/api/venta', {
            params: { pagina, registrosPorPagina, search }
        });
    },

    obtenerUnaVenta: (id: string): Promise<VentaDto> =>
        api.get<VentaDto>(`/api/venta/${id}`),

    registrarVenta: (dto: RegistrarRequestVentaDto): Promise<void> =>
        api.post<void>(`/api/venta`, dto),

    editarVenta: (dto: EditarRequestVentaDto): Promise<void> =>
        api.put<void>(`/api/venta`, dto),

    eliminarVenta: (id: string): Promise<void> =>
        api.delete<void>(`/api/venta/${id}`),

    // Borrador -> Generada (descuenta stock)
    generarVenta: (id: string): Promise<void> =>
        api.patch<void>(`/api/venta/${id}/generar`),

    // Generada -> Pagada. Sube el comprobante como archivo (multipart/form-data),
    // El nombre del campo ('comprobante') debe calzar con el IFormFile del backend.
    pagarVenta: (id: string, comprobante: File): Promise<void> => {
        const formData = new FormData();
        formData.append('comprobante', comprobante);
        return api.patch<void>(`/api/venta/${id}/pagar`, formData, {
            // Sobrescribimos el 'application/json' por defecto. Al pasar undefined,
            // axios detecta el FormData y pone multipart/form-data con su boundary.
            headers: { 'Content-Type': undefined },
        });
    },

    // Generada -> Anulada (devuelve stock).
    anularVenta: (id: string): Promise<void> =>
        api.patch<void>(`/api/venta/${id}/anular`),

    // El comprobante es un archivo PRIVADO: el endpoint exige JWT, así que no sirve
    // ponerlo en un <a href> (el navegador no manda la cabecera Authorization).
    // responseType 'blob' porque la respuesta es binaria, no el ApiResponse JSON de siempre.
    descargarComprobante: (id: string): Promise<Blob> =>
        api.get<Blob>(`/api/venta/${id}/comprobante`, { responseType: "blob" }),
}