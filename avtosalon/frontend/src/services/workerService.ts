import api from "./api";
import { User } from "../types";

export interface WorkerCreatePayload {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
}

export const workerService = {
  list: () => api.get<User[]>("/api/workers"),
  create: (payload: WorkerCreatePayload) => api.post<User>("/api/workers", payload),
  get: (id: number) => api.get<User>(`/api/workers/${id}`),
  toggleActive: (id: number) => api.patch<User>(`/api/workers/${id}/toggle-active`),
  remove: (id: number) => api.delete(`/api/workers/${id}`),
};
