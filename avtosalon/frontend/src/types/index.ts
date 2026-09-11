export type UserRole = "director" | "worker" | "customer";
export type CarStatus = "available" | "reserved" | "sold";
export type ApplicationStatus = "new" | "contacted" | "completed" | "cancelled";
export type PaymentType = "cash" | "card" | "bank";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  price: string;
  vin: string;
  mileage?: number | null;
  description?: string | null;
  image?: string | null;
  status: CarStatus;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  customer_id: number;
  car_id: number;
  worker_id?: number | null;
  phone?: string | null;
  message?: string | null;
  status: ApplicationStatus;
  created_at: string;
  car?: Car;
  customer?: User;
  worker?: User | null;
}

export interface Sale {
  id: number;
  car_id: number;
  customer_id: number;
  worker_id: number;
  price: string;
  payment_type: PaymentType;
  created_at: string;
  car?: Car;
  customer?: User;
  worker?: User;
}

export interface Payment {
  id: number;
  sale_id: number;
  amount: string;
  payment_type: PaymentType;
  created_at: string;
}

export interface Favorite {
  id: number;
  car_id: number;
  created_at: string;
  car: Car;
}

export interface DashboardStats {
  total_cars: number;
  available_cars: number;
  sold_cars: number;
  total_customers: number;
  total_workers: number;
  total_sales: number;
  total_revenue: string;
  recent_sales: Sale[];
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
