import api from "./api";
import { DashboardStats, Favorite, Payment, PaymentType, Sale } from "../types";

export interface SaleFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
}

export const saleService = {
  list: (filters: SaleFilters = {}) => api.get<Sale[]>("/api/sales", { params: filters }),
  create: (payload: { car_id: number; customer_id: number; price: number; payment_type: PaymentType }) =>
    api.post<Sale>("/api/sales", payload),
  get: (id: number) => api.get<Sale>(`/api/sales/${id}`),
};

export const paymentService = {
  list: () => api.get<Payment[]>("/api/payments"),
};

export const favoriteService = {
  list: () => api.get<Favorite[]>("/api/favorites"),
  add: (carId: number) => api.post<Favorite>(`/api/favorites/${carId}`),
  remove: (carId: number) => api.delete(`/api/favorites/${carId}`),
};

export const dashboardService = {
  stats: () => api.get<DashboardStats>("/api/dashboard/stats"),
};
