import { Select } from "@mantine/core";
import type { SelectProps } from "@mantine/core";

// Select reutilizable con buscador (el equivalente moderno a select2 de jQuery).
// Envuelve el <Select searchable> de Mantine con defaults pensados para que SIEMPRE sea
// responsive: ocupa el ancho de su contenedor y jamás lo desborda (ideal dentro de un modal).
//
// Acepta TODAS las props de un <Select> de Mantine (data, value, onChange, label, error...),
// así que funciona directo con {...form.getInputProps("campo")} de @mantine/form.
export type SearchableSelectPortafolioProps = SelectProps;

export function SearchableSelectPortafolio(props: SearchableSelectPortafolioProps) {
    return (
        <Select
            // --- Defaults (el caller puede sobrescribir cualquiera) ---
            searchable
            clearable
            nothingFoundMessage="Sin resultados"
            checkIconPosition="right"
            maxDropdownHeight={260}
            // Limita cuántas opciones se pintan a la vez: fluido aunque la lista sea enorme.
            limit={100}
            comboboxProps={{
                // withinPortal saca el desplegable del flujo del modal para que no lo recorte
                // el overflow del modal; su ancho se ajusta al del input (no lo excede).
                withinPortal: true,
            }}
            {...props}
            // El ancho va DESPUÉS del spread para garantizar responsividad: por defecto 100%
            // del contenedor, pero si el caller pasa un `w` explícito, se respeta.
            w={props.w ?? "100%"}
        />
    );
}
