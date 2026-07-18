// envoltura ApiResponse 
export interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

// Dtos de Login
export interface UsuarioDto {
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
    usuario: UsuarioDto;
}

// Dtos para controller de Categoria
export interface CategoriaDto {
    idCategoria: string;
    nombre: string;
    descripcion?: string;
    estado: boolean;
}

export type RegistrarRequestCategoriaDto = CategoriaDto;