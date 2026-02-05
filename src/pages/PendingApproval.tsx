import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, LogOut, Loader2 } from "lucide-react";
import logoXplo from "@/assets/logo-xplo.png";

export default function PendingApproval() {
  const { user, role, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth", { replace: true });
      } else if (role === "admin" || role === "user") {
        navigate("/", { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-500/10 p-4">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Seu cadastro foi recebido com sucesso!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sua solicitação de acesso está sendo analisada. Você receberá um
            email quando sua conta for aprovada.
          </p>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Email cadastrado:</strong>
              <br />
              {user?.email}
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
