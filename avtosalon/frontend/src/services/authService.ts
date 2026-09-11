import api from "./api";
import { AuthResponse, LoginPayload, RegisterPayload, User } from "../types";

export const authService = {
  login: (payload: LoginPayload) => api.post<AuthResponse>("/api/auth/login", payload),
  register: (payload: RegisterPayload) => api.post<User>("/api/auth/register", payload),
  me: () => api.get<User>("/api/auth/me"),
};
