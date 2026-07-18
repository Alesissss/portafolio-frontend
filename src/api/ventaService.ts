import { api } from "./axiosClient";
import type { VentaDto } from "./types";

export const ventaService = {
    // Listar las ventas
    listarVentas: (): Promise<VentaDto[]> =>
        api.get<VentaDto[]>('/api/venta'),
}