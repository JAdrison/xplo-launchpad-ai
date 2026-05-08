import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import AdminUsers from "./pages/AdminUsers";
import AdminVendas from "./pages/AdminVendas";
import Dashboard from "./pages/Dashboard";
import ClientDetails from "./pages/ClientDetails";
import ClientNew from "./pages/ClientNew";
import ClientRegister from "./pages/ClientRegister";
import Onboarding from "./pages/Onboarding";
import OnboardingExternal from "./pages/OnboardingExternal";
import Workspace from "./pages/Workspace";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CrmKanban from "./pages/CrmKanban";
import CrmActivities from "./pages/CrmActivities";
import CrmContacts from "./pages/CrmContacts";
import CrmConfig from "./pages/CrmConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/register" element={<ClientRegister />} />
            <Route path="/onboarding/external/:token" element={<OnboardingExternal />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />

              {/* Workspace unifica Clientes + Onboarding + Gerador + Ativos */}
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/clients" element={<Navigate to="/workspace" replace />} />
              <Route path="/assets" element={<Navigate to="/workspace" replace />} />
              <Route path="/generator" element={<Navigate to="/workspace" replace />} />

              <Route path="/clients/new" element={<ClientNew />} />
              <Route path="/clients/:id" element={<ClientDetails />} />

              {/* Onboarding wizard (com ?client=...) */}
              <Route path="/onboarding" element={<Onboarding />} />

              <Route path="/crm" element={<CrmKanban />} />
              <Route path="/crm/atividades" element={<CrmActivities />} />
              <Route path="/crm/contatos" element={<CrmContacts />} />
              <Route path="/crm/config" element={<CrmConfig />} />
              <Route path="/settings" element={<Settings />} />

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/vendas"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminVendas />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
