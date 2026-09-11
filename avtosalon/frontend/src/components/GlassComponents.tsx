import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  onClick,
  animate = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass p-6 rounded-2xl transition-all duration-300 
        ${animate ? "hover:shadow-glass-lg hover:scale-105 hover:backdrop-blur-lg" : ""} 
        ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`glass-light p-8 rounded-3xl backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
};

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "glass";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}) => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    glass: "btn-glass",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

interface FloatingLabelInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  className = "",
  error,
}) => {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`input-glass w-full peer ${className} ${error ? "ring-2 ring-red-400" : ""}`}
      />
      <label className="absolute left-4 top-3 text-sm font-medium text-gray-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 transition-all duration-300 peer-focus:top-1 peer-focus:text-xs peer-focus:text-steel-light">
        {label}
      </label>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: "up" | "down" | null;
  animationDelay?: number;
}

export const StatBox: React.FC<StatBoxProps> = ({ icon, label, value, trend, animationDelay = 0 }) => {
  return (
    <GlassCard
      animate
      className={`animate-fade-in-up`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-gradient">{value}</h3>
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
      {trend && (
        <p className={`text-sm mt-3 ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
          {trend === "up" ? "↑" : "↓"} {trend === "up" ? "+5%" : "-3%"}
        </p>
      )}
    </GlassCard>
  );
};

interface CardGridProps {
  items: React.ReactNode[];
  cols?: number;
}

export const CardGrid: React.FC<CardGridProps> = ({ items, cols = 3 }) => {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridClass[cols as keyof typeof gridClass]} gap-6`}>
      {items}
    </div>
  );
};

interface BadgeProps {
  text: string;
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = "primary", className = "" }) => {
  const variants = {
    primary: "bg-steel bg-opacity-30 text-steel-light border border-steel border-opacity-30",
    success: "bg-leaf bg-opacity-30 text-green-300 border border-leaf border-opacity-30",
    warning: "bg-signal bg-opacity-30 text-signal-light border border-signal border-opacity-30",
    danger: "bg-rust bg-opacity-30 text-red-300 border border-rust border-opacity-30",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {text}
    </span>
  );
};