import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { GlassCard } from "./GlassComponents";

const roleLabels: Record<string, string> = {
  director: "Direktor",
  worker: "Ishchi",
  customer: "Xaridor",
};

const Topbar: React.FC<{ title: string }> = ({ title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();

  return (
    <header className="glass-light backdrop-blur-md border-b border-opacity-10 px-6 py-4 animate-fade-in-down">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient">{title}</h1>
          <p className="text-xs text-gray-400 mt-1">Avtosalon boshqaruv tizimi</p>
        </div>
        <div className="flex items-center gap-6">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="group glass px-4 py-2 rounded-full transition-all duration-300 hover:scale-110 flex items-center gap-2"
            title={`Design ${theme === "v1" ? "Version 2" : "Version 1"}`}
          >
            {theme === "v1" ? (
              <>
                <span className="text-lg">🌙</span>
                <span className="text-xs text-gray-400">V2</span>
              </>
            ) : (
              <>
                <span className="text-lg">☀️</span>
                <span className="text-xs text-gray-400">V1</span>
              </>
            )}
          </button>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold bg-gradient-to-r from-steel to-steel-light bg-clip-text text-transparent">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-400">{roleLabels[user.role]}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-steel to-steel-light font-display text-sm font-semibold text-white shadow-lg animate-glow">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
