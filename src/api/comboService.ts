import { api } from "./axiosClient";
import type { ComboDto } from "./types";

// Combos: listados mínimos (value + label) para poblar selects, sin depender de los
// permisos del CRUD dueño de esos datos.
export const comboService = {
    // Categorías activas para el <Select>
    listarCategoriasCombo: (): Promise<ComboDto[]> =>
        api.get<ComboDto[]>('/api/combo/categorias'),

    // Roles activos para el <Select>
    listarRolesCombo: (): Promise<ComboDto[]> =>
        api.get<ComboDto[]>('/api/combo/roles'),
};
