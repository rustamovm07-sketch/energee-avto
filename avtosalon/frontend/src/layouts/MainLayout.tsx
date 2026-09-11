import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useTheme } from "../context/ThemeContext";

const MainLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300`}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-8 animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
