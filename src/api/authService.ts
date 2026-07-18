import { api } from "./axiosClient";
import type { LoginRequestDto, LoginResponseDto } from "./types";

export const authService = {
    // El cliente 'api' ya está tipado para devolver el dato desenvuelto (ver axiosClient.ts),
    // así que con un solo genérico basta: post<LoginResponseDto> => Promise<LoginResponseDto>.
    login: (request: LoginRequestDto): Promise<LoginResponseDto> =>
        api.post<LoginResponseDto>('/api/auth/login', request),
};
