import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  director: [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/cars", label: "Avtomobillar", icon: "🚘" },
    { to: "/customers", label: "Xaridorlar", icon: "👥" },
    { to: "/workers", label: "Ishchilar", icon: "👨‍💼" },
    { to: "/sales", label: "Sotuvlar", icon: "💰" },
    { to: "/payments", label: "To'lovlar", icon: "💳" },
    { to: "/reports", label: "Hisobotlar", icon: "📊" },
    { to: "/settings", label: "Sozlamalar", icon: "⚙️" },
  ],
  worker: [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/cars", label: "Avtomobillar", icon: "🚘" },
    { to: "/customers", label: "Xaridorlar", icon: "👥" },
    { to: "/applications", label: "Arizalar", icon: "📋" },
    { to: "/sales", label: "Mening sotuvlarim", icon: "💰" },
  ],
  customer: [
    { to: "/dashboard", label: "Bosh sahifa", icon: "🏠" },
    { to: "/cars", label: "Avtomobillar", icon: "🚘" },
    { to: "/favorites", label: "Sevimlilar", icon: "❤️" },
    { to: "/applications", label: "Mening arizalarim", icon: "📋" },
    { to: "/profile", label: "Profil", icon: "👤" },
  ],
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = navByRole[user.role];

  return (
    <aside className="glass-light flex h-screen w-64 flex-col backdrop-blur-xl border-r border-opacity-10 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-opacity-10 px-6 py-6 animate-slide-in-left">
        <span className="text-3xl animate-float">🚗</span>
        <div>
          <span className="font-display text-xl font-bold text-gradient">Avtosalon</span>
          <p className="text-xs text-gray-400">Pro v1 & v2</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {items.map((item, idx) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "glass-accent bg-opacity-30 text-steel-light shadow-lg"
                  : "text-gray-300 hover:glass hover:text-white"
              }`
            }
            style={{
              animation: `fadeInLeft 0.5s ease-out ${idx * 50}ms backwards`,
            }}
          >
            <span className="text-lg transition-transform group-hover:scale-125">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-opacity-10 px-4 py-4 animate-fade-in-up">
        {user.role !== "customer" && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "glass-accent text-steel-light"
                  : "text-gray-300 hover:glass hover:text-white"
              }`
            }
          >
            <span className="text-lg">👤</span>
            <span>Profil</span>
          </NavLink>
        )}
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-300 transition-all duration-300 hover:glass hover:text-red-400 hover:scale-105"
        >
          <span className="text-lg transition-transform group-hover:scale-125">🚪</span>
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
