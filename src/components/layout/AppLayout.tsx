import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex flex-1 flex-col md:ml-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
