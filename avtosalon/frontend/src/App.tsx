import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import CarsPage from "./pages/Cars";
import CarDetailPage from "./pages/CarDetail";
import WorkersPage from "./pages/Workers";
import CustomersPage from "./pages/Customers";
import ApplicationsPage from "./pages/Applications";
import SalesPage from "./pages/Sales";
import PaymentsPage from "./pages/Payments";
import FavoritesPage from "./pages/Favorites";
import ProfilePage from "./pages/Profile";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted">Yuklanmoqda...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cars"
        element={
          <ProtectedRoute>
            <CarsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cars/:id"
        element={
          <ProtectedRoute>
            <CarDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute allowedRoles={["director", "worker"]}>
            <CustomersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workers"
        element={
          <ProtectedRoute allowedRoles={["director"]}>
            <WorkersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications"
        element={
          <ProtectedRoute allowedRoles={["director", "worker", "customer"]}>
            <ApplicationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={["director", "worker"]}>
            <SalesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={["director"]}>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["director"]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["director"]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export default App;
