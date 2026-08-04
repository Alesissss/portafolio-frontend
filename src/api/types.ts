// envoltura ApiResponse 
export interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

// Dtos de Login. UsuarioAuthDto es INDEPENDIENTE del UsuarioDto del CRUD (cada contexto su DTO).
export interface UsuarioAuthDto {
    idUsuario: string; // Guid para C#, se recibe como string en el JSON del DTO
    idRol: string; // Guid
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    correo: string;
    username: string;
    estado: boolean;
}

export interface LoginRequestDto {
    username: string;
    password: string;
}

export interface LoginResponseDto {
    token: string;
    expiration: string;
    usuario: UsuarioAuthDto;
}

// Dtos para controller de Categoria
export interface CategoriaDto {
    idCategoria: string;
    nombre: string;
    descripcion?: string;
    estado: boolean;
}

export type RegistrarRequestCategoriaDto = CategoriaDto;

// Dtos para controller de producto
export interface ProductoDto {
    idProducto: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    estado: boolean;
    // Ruta relativa dentro de wwwroot ("imagenes/productos/abc.jpg") o null si no tiene foto.
    // Se concatena con BASE_URL para armar el <img src>. Es solo lectura: la foto se envía
    // como archivo aparte, no en este campo.
    archivoFoto?: string | null;
    idCategoria: string;
    nombreCategoria?: string; // solo lectura: el backend lo devuelve para mostrar el nombre en la tabla
}

export interface RegistrarRequestProductoDto {
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    estado: boolean;
    idCategoria: string;
}

// DTO genérico para combos (selects). Los nombres value/label calzan con Mantine.
export interface ComboDto {
    value: string;
    label: string;
}

export interface ProductoComboDto extends ComboDto {
    precio: number;
    stock: number;
}

// Dtos para controller de Usuario (CRUD; independientes del UsuarioAuthDto del login)
export interface UsuarioDto {
    idUsuario: string;
    idRol: string;
    nombreRol: string; // solo lectura: para mostrar el rol en la tabla
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    correo: string;
    username: string;
    estado: boolean;
}

export interface RegistrarRequestUsuarioDto {
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    correo: string;
    username: string;
    password: string;
    confirmPassword: string;
    idRol: string;
    estado: boolean;
}

export interface EditarRequestUsuarioDto {
    idUsuario: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    correo: string;
    username: string;
    idRol: string;
    estado: boolean;
}

// Dtos para controller de venta
export interface VentaDto {
    idVenta: string; // Guid
    fechaEmision: string; // ISO 8601 con offset (ej "2026-07-18T20:30:00+00:00"); convertir a Date solo al mostrar
    subtotal: number;
    igv: number;
    total: number;
    idVendedor: string; // Guid
    nombreVendedor: string; // solo lectura: para mostrar en la tabla
    idEstadoVenta: string;
    nombreEstadoVenta: string; // solo lectura: para mostrar en la tabla
    detalles: DetalleVentaDto[];
}

export interface DetalleVentaDto {
    idProducto: number; // int en el back (SERIAL)
    nombreProducto: string; // solo lectura
    precioVenta: number;
    cantidad: number;
    observacion?: string; // nullable en el back
}

export interface RegistrarRequestVentaDto {
    idVendedor: string;
    detalles: RegistrarDetalleVentaDto[];
}

export interface RegistrarDetalleVentaDto {
    idProducto: number;
    cantidad: number;
    observacion?: string;
}

export interface EditarRequestVentaDto {
    idVenta: string;
    idVendedor: string;
    detalles: EditarDetalleVentaDto[];
}

export interface EditarDetalleVentaDto {
    idProducto: number;
    cantidad: number;
    observacion?: string;
}

// ---------------------------------------------------------------------------
// REPORTES
// El backend devuelve TODO el dashboard en un solo objeto: si cada gráfico pidiera
// su propia llamada podrían llegar en momentos distintos y mostrar tajadas distintas.
// ---------------------------------------------------------------------------

export interface ResumenReporteDto {
    totalVendido: number;
    numeroVentas: number;
    ticketPromedio: number;
    porCobrar: number;
}

// 'fecha' llega como "2026-07-26" (DateOnly de C#), sin hora: así no hay corrimientos
// de huso horario al construir el Date en el navegador.
export interface PuntoSerieDto {
    fecha: string;
    total: number;
    ventas: number;
}

export interface TopProductoDto {
    idProducto: number;
    nombre: string;
    total: number;
    cantidad: number;
}

export interface VentasPorEstadoDto {
    idEstadoVenta: string;
    nombre: string;
    ventas: number;
    total: number;
}

export interface ReporteDashboardDto {
    resumen: ResumenReporteDto;
    granularidad: "dia" | "mes";
    serie: PuntoSerieDto[];
    topProductos: TopProductoDto[];
    porEstado: VentasPorEstadoDto[];
}
