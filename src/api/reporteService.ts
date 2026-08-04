import { api } from "./axiosClient";
import type { ReporteDashboardDto } from "./types";

// Filtros que viajan como query string. Los vacíos se mandan como undefined para que
// axios los omita de la URL en vez de enviar "estado=" (que el backend leería como "").
export interface ReporteFiltros {
    desde: string;              // ISO 8601
    hasta: string;              // ISO 8601
    estado?: string | null;     // BO | GEN | PAG | AN
    vendedor?: string | null;   // Guid del usuario
}

export const reporteService = {
    obtenerDashboard: (filtros: ReporteFiltros): Promise<ReporteDashboardDto> =>
        api.get<ReporteDashboardDto>("/api/reporte/dashboard", {
            params: {
                desde: filtros.desde,
                hasta: filtros.hasta,
                estado: filtros.estado || undefined,
                vendedor: filtros.vendedor || undefined,
            },
        }),
};
