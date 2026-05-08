import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  UserCheck,
  UserX,
  Shield,
  User,
  Clock,
  RefreshCw,
  Mail,
  KeyRound,
  Ban,
  Play,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserJobFunctionsManager } from "@/components/admin/UserJobFunctionsManager";

const MASTER_EMAIL = "xplolabcreator@gmail.com";

interface UserRow {
  id: string;
  user_id: string;
  role: "admin" | "user" | "pending";
  created_at: string;
  email?: string;
  banned_until?: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pwDialogUser, setPwDialogUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/", { replace: true });
  }, [isAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = data.map((u) => u.user_id);
      const { data: emailMapping, error: emailError } = await supabase.functions.invoke(
        "get-user-emails",
        { body: { userIds } }
      );
      if (emailError) console.error("Error fetching emails:", emailError);

      const usersWithEmails: UserRow[] = data.map((u) => {
        const info = emailMapping?.[u.user_id];
        // Backward compatibility: if old shape (string), wrap it
        const email = typeof info === "string" ? info : info?.email ?? "Email não disponível";
        const banned_until = typeof info === "string" ? null : info?.banned_until ?? null;
        return { ...u, email, banned_until };
      });

      setUsers(usersWithEmails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "user" })
        .eq("user_id", userId);
      if (error) throw error;
      toast({ title: "Usuário aprovado!", description: "O usuário agora pode acessar o sistema." });
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível aprovar." });
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (userId: string, newRole: "admin" | "user") => {
    setActionLoading(userId + "role");
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
      toast({ title: "Função atualizada", description: `Usuário agora é ${newRole === "admin" ? "Admin" : "Usuário"}.` });
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível alterar a função." });
    } finally {
      setActionLoading(null);
    }
  };

  const callAdminAction = async (
    userId: string,
    action: "delete" | "ban" | "unban" | "reset_password" | "set_password",
    extra?: { password?: string }
  ) => {
    setActionLoading(userId + action);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action, userId, ...extra },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: data?.message ?? "Ação concluída." });
      fetchUsers();
      return true;
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: (error as Error).message ?? "Falha na ação.",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const rejectPending = (userId: string) => callAdminAction(userId, "delete");

  const handleSetPassword = async () => {
    if (!pwDialogUser) return;
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Senha curta",
        description: "Mínimo de 8 caracteres.",
      });
      return;
    }
    const ok = await callAdminAction(pwDialogUser.user_id, "set_password", {
      password: newPassword,
    });
    if (ok) {
      setPwDialogUser(null);
      setNewPassword("");
      setShowPassword(false);
    }
  };

  const pendingUsers = users.filter((u) => u.role === "pending");
  const activeUsers = users.filter((u) => u.role !== "pending");

  const isSuspended = (u: UserRow) =>
    !!u.banned_until && new Date(u.banned_until) > new Date();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
        );
      case "user":
        return (
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" /> Usuário
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3" /> Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Aprove, suspenda, redefina senhas ou revogue acessos
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Pending Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Usuários Pendentes
            {pendingUsers.length > 0 && (
              <Badge variant="secondary">{pendingUsers.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Usuários aguardando aprovação para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum usuário pendente</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Cadastro:{" "}
                      {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveUser(user.user_id)}
                      disabled={actionLoading === user.user_id}
                    >
                      {actionLoading === user.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aprovar
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <UserX className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rejeitar usuário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá remover permanentemente o cadastro deste usuário.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => rejectPending(user.user_id)}>
                            Sim, rejeitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Usuários Ativos
            <Badge variant="secondary">{activeUsers.length}</Badge>
          </CardTitle>
          <CardDescription>Usuários com acesso ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum usuário ativo</p>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((user) => {
                const suspended = isSuspended(user);
                const isMaster = user.email === MASTER_EMAIL;
                const busyKey = (suffix: string) => actionLoading === user.user_id + suffix;
                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 p-4 rounded-lg border bg-card md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{user.email}</p>
                        {getRoleBadge(user.role)}
                        {suspended && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-orange-600 border-orange-600"
                          >
                            <Ban className="h-3 w-3" /> Suspenso
                          </Badge>
                        )}
                        {isMaster && (
                          <Badge variant="outline" className="text-xs">
                            Master
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Desde:{" "}
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {user.role !== "pending" && (
                        <div className="pt-2">
                          <UserJobFunctionsManager userId={user.user_id} disabled={isMaster} />
                        </div>
                      )}
                    </div>
                    {!isMaster && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyKey("reset_password")}
                          onClick={() => callAdminAction(user.user_id, "reset_password")}
                        >
                          {busyKey("reset_password") ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1" /> Enviar reset
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPwDialogUser(user);
                            setNewPassword("");
                            setShowPassword(false);
                          }}
                        >
                          <KeyRound className="h-4 w-4 mr-1" /> Definir senha
                        </Button>
                        {suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyKey("unban")}
                            onClick={() => callAdminAction(user.user_id, "unban")}
                          >
                            {busyKey("unban") ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" /> Reativar
                              </>
                            )}
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" disabled={busyKey("ban")}>
                                <Ban className="h-4 w-4 mr-1" /> Suspender
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspender usuário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O usuário não conseguirá fazer login até ser reativado. A
                                  conta e os dados são preservados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => callAdminAction(user.user_id, "ban")}
                                >
                                  Sim, suspender
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyKey("delete")}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Revogar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revogar acesso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação remove permanentemente o usuário, seu login e seu
                                papel. Não é possível desfazer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => callAdminAction(user.user_id, "delete")}
                              >
                                Sim, revogar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set password dialog */}
      <Dialog
        open={!!pwDialogUser}
        onOpenChange={(open) => {
          if (!open) {
            setPwDialogUser(null);
            setNewPassword("");
            setShowPassword(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir nova senha</DialogTitle>
            <DialogDescription>
              Para {pwDialogUser?.email}. Mínimo de 8 caracteres. A senha não será exibida
              novamente após salvar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialogUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSetPassword}
              disabled={
                newPassword.length < 8 ||
                actionLoading === (pwDialogUser?.user_id ?? "") + "set_password"
              }
            >
              {actionLoading === (pwDialogUser?.user_id ?? "") + "set_password" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
