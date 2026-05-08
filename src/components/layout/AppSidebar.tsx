import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  X,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Kanban,
  CheckSquare,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoXplo from "@/assets/logo-xplo.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Workspace", href: "/workspace", icon: Briefcase },
  { name: "CRM", href: "/crm", icon: Kanban },
  { name: "Atividades", href: "/crm/atividades", icon: CheckSquare },
];

const adminNavigation = [
  { name: "Usuários", href: "/admin/users", icon: Shield },
  { name: "Vendas", href: "/admin/vendas", icon: DollarSign },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

function SidebarContent({ 
  onClose, 
  showCloseButton = false,
  collapsed = false,
}: { 
  onClose?: () => void; 
  showCloseButton?: boolean;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const NavItem = ({ item, isActive }: { item: typeof navigation[0]; isActive: boolean }) => {
    const content = (
        <Link
          to={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
            collapsed && "justify-center px-2",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <item.icon className={cn(
            "shrink-0 transition-all duration-300",
            collapsed ? "h-6 w-6" : "h-5 w-5"
          )} />
          {!collapsed && <span className="transition-opacity duration-300">{item.name}</span>}
        </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Logo area */}
      <div className={cn(
        "flex h-16 items-center justify-between px-4",
        collapsed && "justify-center px-2"
      )}>
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <img 
            src={logoXplo} 
            alt="XPLO" 
            className={cn(
              "w-auto transition-all duration-300",
              collapsed ? "h-10" : "h-8"
            )} 
          />
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">Starter</span>
          )}
        </Link>
        {showCloseButton && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavItem key={item.name} item={item} isActive={isActive} />
          );
        })}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Administração
                </p>
              </div>
            )}
            {collapsed && <div className="pt-4" />}
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavItem key={item.name} item={item} isActive={isActive} />
              );
            })}
          </>
        )}
      </nav>

      {/* Footer with user info and logout */}
      <div className={cn(
        "border-t border-sidebar-border p-4 space-y-3",
        collapsed && "p-2 space-y-2"
      )}>
        {user && !collapsed && (
          <div className="text-xs text-sidebar-foreground/60 truncate">
            {user.email}
          </div>
        )}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 transition-all duration-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2 transition-all duration-300" />
            Sair
          </Button>
        )}
        {!collapsed && (
          <p className="text-xs text-sidebar-foreground/60">
            XPLO Starter v1.0
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

export function AppSidebar({ open, onClose, collapsed, onToggleCollapse }: AppSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar - static, scrolls with page */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0 transition-all duration-300 relative",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />
        
        {/* Toggle Button - Purple Circle */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar - fixed overlay */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={onClose} showCloseButton />
      </aside>
    </>
  );
}
