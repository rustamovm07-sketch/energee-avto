import api from "./api";
import { Application, ApplicationStatus, User } from "../types";

export const customerService = {
  list: (search?: string) => api.get<User[]>("/api/customers", { params: { search } }),
  get: (id: number) => api.get<User>(`/api/customers/${id}`),
  getApplications: (id: number) => api.get<Application[]>(`/api/customers/${id}/applications`),
  getSales: (id: number) => api.get(`/api/customers/${id}/sales`),
  updateMyProfile: (payload: Partial<Pick<User, "first_name" | "last_name" | "phone" | "email">>) =>
    api.put<User>("/api/customers/me", payload),
};

export const applicationService = {
  list: () => api.get<Application[]>("/api/applications"),
  create: (payload: { car_id: number; phone: string; message?: string }) =>
    api.post<Application>("/api/applications", payload),
  get: (id: number) => api.get<Application>(`/api/applications/${id}`),
  update: (id: number, payload: { status?: ApplicationStatus; worker_id?: number }) =>
    api.put<Application>(`/api/applications/${id}`, payload),
};
