import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
