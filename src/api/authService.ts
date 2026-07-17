import { api } from "./axiosClient";
import type { LoginRequestDto, LoginResponseDto } from "./types";

export const authService = {
    // Creamos la función asíncrona de login y le decimos que envía un dto
    login: async (request: LoginRequestDto): Promise<LoginResponseDto> => {
        const response = await api.post<LoginResponseDto>('/api/auth/login', request);

        return response as unknown as LoginResponseDto;
    }
};