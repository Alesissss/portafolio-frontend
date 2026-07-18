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