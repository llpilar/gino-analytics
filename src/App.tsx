import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DateFilterProvider } from "@/contexts/DateFilterContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VisualEffectsProvider } from "@/contexts/VisualEffectsContext";
import { DashboardSettingsProvider } from "@/contexts/DashboardSettingsContext";
import { ImpersonateProvider } from "@/contexts/ImpersonateContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ImpersonateBanner } from "@/components/ImpersonateBanner";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Analises from "./pages/Analises";
import Configuracoes from "./pages/Configuracoes";

import Financeiro from "./pages/Financeiro";
import Envios from "./pages/Envios";

import Cloaker from "./pages/Cloaker";
import CloakerLogs from "./pages/CloakerLogs";
import CloakerRedirect from "./pages/CloakerRedirect";
import Admin from "./pages/Admin";
import AguardandoAprovacao from "./pages/AguardandoAprovacao";
import ContaBloqueada from "./pages/ContaBloqueada";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ImpersonateProvider>
              <DateFilterProvider>
                <CurrencyProvider>
                  <VisualEffectsProvider>
                    <DashboardSettingsProvider>
                      <SidebarProvider>
                        <ImpersonateBanner />
                        <Routes>
                          <Route path="/" element={<Landing />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />
                          <Route path="/conta-bloqueada" element={<ContaBloqueada />} />
                          <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                          <Route path="/analises" element={<ProtectedRoute><Analises /></ProtectedRoute>} />
                          
                          <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
                          <Route path="/envios" element={<ProtectedRoute><Envios /></ProtectedRoute>} />
                          
                          <Route path="/cloaker" element={<ProtectedRoute><Cloaker /></ProtectedRoute>} />
                          <Route path="/cloaker/logs" element={<ProtectedRoute><CloakerLogs /></ProtectedRoute>} />
                          <Route path="/go/:slug" element={<CloakerRedirect />} />
                          <Route path="/c/:slug" element={<CloakerRedirect />} />
                          <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </SidebarProvider>
                    </DashboardSettingsProvider>
                  </VisualEffectsProvider>
                </CurrencyProvider>
              </DateFilterProvider>
            </ImpersonateProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
