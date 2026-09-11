import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "v1" | "v2";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("v1");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme || "v1";
    setThemeState(saved);
    document.documentElement.className = `theme-${saved}`;
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = `theme-${newTheme}`;
  };

  const toggleTheme = () => {
    setTheme(theme === "v1" ? "v2" : "v1");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};