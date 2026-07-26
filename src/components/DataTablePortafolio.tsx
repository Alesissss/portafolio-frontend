import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Table, Button, Group, Stack, TextInput, Text, UnstyledButton, ScrollArea } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración de una columna.
// - header:   el texto del <th>.
// - accessor: la propiedad EXACTA del objeto T (keyof T lo valida en tiempo de compilación).
// - render:   opcional. Si quieres pintar la celda distinto (un badge, una fecha formateada,
//             un botón), lo pones aquí. Para buscar/ordenar/exportar SIEMPRE se usa el valor
//             crudo del accessor, no lo que devuelva render (por eso render es solo visual).
// - sortable: opcional (por defecto true). Ponlo en false para columnas que no tenga sentido
//             ordenar (ej. una columna de acciones/botones).
export interface ColumnConfig<T> {
  header: string;
  accessor: keyof T;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

// El texto "plano" de una celda: usado por buscador, Excel, PDF y copiar. Vive fuera del
// componente porque solo depende de sus argumentos; así es estable y no ensucia deps de hooks.
function getCellText<T>(row: T, col: ColumnConfig<T>): string {
  return String(row[col.accessor] ?? '');
}

interface DataTablePortafolioProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  fileName?: string;
  // Alto máximo del área scrollable. Default '60vh' = 60% del alto de la ventana: RESPONSIVE,
  // escala solo con cada pantalla (a diferencia de un px fijo). Acepta cualquier unidad CSS
  // ('70vh', 'calc(100vh - 320px)', o un número si algún caso puntual necesitara px).
  maxHeight?: string | number;
}

type SortDir = 'asc' | 'desc';

export function DataTablePortafolio<T>({
  data,
  columns,
  fileName = 'Reporte',
  maxHeight = '60vh',
}: DataTablePortafolioProps<T>) {
  // 1) Estado de la UI: texto del buscador + criterio de orden.
  //    Fíjate que NUNCA guardamos "la data filtrada/ordenada" en estado; solo guardamos las
  //    INSTRUCCIONES (qué buscar, por qué columna ordenar) y derivamos el resultado abajo.
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // 2) Datos DERIVADOS, en dos pasos encadenados: primero filtrar, luego ordenar.

  // 2a) Filtrado global: una fila pasa si ALGUNA columna contiene el texto buscado.
  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => getCellText(row, col).toLowerCase().includes(q)),
    );
  }, [data, columns, debouncedSearch]);

  // 2b) Ordenamiento sobre lo ya filtrado. Copiamos el arreglo ([...]) porque Array.sort MUTA
  //     en sitio; si ordenáramos filteredData directamente estaríamos mutando datos derivados
  //     (mala práctica en React, puede causar renders inconsistentes).
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    const copia = [...filteredData];
    copia.sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      // Nulos/undefined siempre al final, sin importar la dirección.
      if (va == null) return 1;
      if (vb == null) return -1;
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb; // comparación numérica real (evita "10" < "9" del orden alfabético)
      } else {
        // localeCompare con numeric:true ordena bien acentos y números embebidos ("item2" < "item10").
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copia;
  }, [filteredData, sortBy, sortDir]);

  const hayFilas = sortedData.length > 0;

  const handleSort = (col: ColumnConfig<T>) => {
    if (col.sortable === false) return;
    if (sortBy === col.accessor) {
      // Mismo header: alternamos asc <-> desc.
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      // Header nuevo: ordenamos ascendente por esa columna.
      setSortBy(col.accessor);
      setSortDir('asc');
    }
  };

  // --- Acciones (todas operan sobre sortedData = lo que el usuario realmente ve) ---

  const exportarExcel = () => {
    // Construimos filas SOLO con las columnas visibles usando el header como clave,
    // en vez de json_to_sheet(data) que volcaría todas las propiedades del DTO.
    const filasPlanas = sortedData.map((row) => {
      const obj: Record<string, string> = {};
      columns.forEach((col) => {
        obj[col.header] = getCellText(row, col);
      });
      return obj;
    });

    const hoja = XLSX.utils.json_to_sheet(filasPlanas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Datos');
    XLSX.writeFile(libro, `${fileName}.xlsx`);
  };

  const exportarPdf = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: sortedData.map((row) => columns.map((col) => getCellText(row, col))),
      styles: { fontSize: 9 },
    });
    doc.save(`${fileName}.pdf`);
  };

  const copiarAlPortapapeles = async () => {
    // Formato TSV (separado por tabs): al pegar en Excel/Sheets respeta las columnas.
    const encabezados = columns.map((col) => col.header).join('\t');
    const filas = sortedData
      .map((row) => columns.map((col) => getCellText(row, col)).join('\t'))
      .join('\n');
    const texto = `${encabezados}\n${filas}`;

    try {
      await navigator.clipboard.writeText(texto);
      notifications.show({ color: 'green', message: 'Datos copiados al portapapeles.' });
    } catch {
      notifications.show({ color: 'red', message: 'No se pudo copiar al portapapeles.' });
    }
  };

  return (
    <Stack gap="md">
      {/* Barra superior: buscador a la izquierda, acciones a la derecha */}
      <Group justify="space-between" align="flex-end">
        <TextInput
          label="Buscar"
          placeholder="Buscar en todas las columnas..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={280}
        />
        <Group>
          <Button variant="light" color="gray" onClick={copiarAlPortapapeles} disabled={!hayFilas}>
            Copiar
          </Button>
          <Button color="red" onClick={exportarPdf} disabled={!hayFilas}>
            Exportar PDF
          </Button>
          <Button color="green" onClick={exportarExcel} disabled={!hayFilas}>
            Exportar Excel
          </Button>
        </Group>
      </Group>

      {/* ScrollArea.Autosize + mah: la tabla crece hasta maxHeight (default '60vh', responsive);
          pasado eso, el scroll ocurre DENTRO de la tabla (no en toda la página). stickyHeader deja
          el <thead> fijo arriba mientras el usuario scrollea las filas, sin perder los encabezados. */}
      <ScrollArea.Autosize mah={maxHeight}>
        <Table striped highlightOnHover withTableBorder withColumnBorders stickyHeader>
        <Table.Thead>
          <Table.Tr>
            {/* key = índice de la columna: es único aunque dos columnas compartan accessor
                (ej. la de datos y la de acciones apuntando ambas a 'idCategoria'). */}
            {columns.map((col, colIdx) => {
              const esOrdenable = col.sortable !== false;
              const activa = sortBy === col.accessor;
              // Indicador de orden sin dependencia de iconos: ▲ asc, ▼ desc, ↕ inactiva.
              const flecha = !esOrdenable ? '' : activa ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕';
              return (
                <Table.Th key={colIdx}>
                  {esOrdenable ? (
                    <UnstyledButton
                      onClick={() => handleSort(col)}
                      style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Text fw={600} fz="sm">
                        {col.header}
                        <Text span c="dimmed">{flecha}</Text>
                      </Text>
                    </UnstyledButton>
                  ) : (
                    col.header
                  )}
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {!hayFilas ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text ta="center" c="dimmed" py="md">
                  No se encontraron registros disponibles.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            sortedData.map((row, rowIdx) => (
              <Table.Tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <Table.Td key={colIdx}>
                    {/* Si la columna trae render personalizado lo usamos; si no, texto plano. */}
                    {col.render ? col.render(row) : getCellText(row, col)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Stack>
  );
}
