import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import ClientNew from "./pages/ClientNew";
import ClientRegister from "./pages/ClientRegister";
import Onboarding from "./pages/Onboarding";
import OnboardingExternal from "./pages/OnboardingExternal";
import Generator from "./pages/Generator";
import Assets from "./pages/Assets";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes (no layout) */}
          <Route path="/register" element={<ClientRegister />} />
          <Route path="/onboarding/external/:token" element={<OnboardingExternal />} />

          {/* Internal routes (with layout) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientNew />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
