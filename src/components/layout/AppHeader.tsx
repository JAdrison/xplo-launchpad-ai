import { Menu, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Spacer for mobile alignment */}
      <div className="hidden md:block" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* User info */}
        {user && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="max-w-[150px] truncate">{user.email}</span>
            {isAdmin && (
              <Badge variant="default" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
        )}

        <Button asChild size="sm" className="gap-2">
          <Link to="/clients/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
