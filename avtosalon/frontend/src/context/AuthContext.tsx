import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import { LoginPayload, RegisterPayload, User } from "../types";
import { extractErrorMessage } from "../services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrap = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await authService.me();
      setUser(data);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("current_user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: LoginPayload) => {
    try {
      const { data } = await authService.login(payload);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("current_user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      await authService.register(payload);
      await login({ identifier: payload.email, password: payload.password });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await authService.me();
    setUser(data);
    localStorage.setItem("current_user", JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
