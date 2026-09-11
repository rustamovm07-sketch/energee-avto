import api from "./api";
import { Car, CarStatus } from "../types";

export interface CarFilters {
  brand?: string;
  model?: string;
  status?: CarStatus | "";
  min_price?: number;
  max_price?: number;
  search?: string;
}

export interface CarPayload {
  brand: string;
  model: string;
  year: number;
  color?: string;
  price: number;
  vin: string;
  mileage?: number;
  description?: string;
  image?: string;
}

export const carService = {
  list: (filters: CarFilters = {}) =>
    api.get<Car[]>("/api/cars", { params: filters }),
  get: (id: number) => api.get<Car>(`/api/cars/${id}`),
  create: (payload: CarPayload) => api.post<Car>("/api/cars", payload),
  update: (id: number, payload: Partial<CarPayload & { status: CarStatus }>) =>
    api.put<Car>(`/api/cars/${id}`, payload),
  remove: (id: number) => api.delete(`/api/cars/${id}`),
};
