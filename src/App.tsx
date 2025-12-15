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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Analises from "./pages/Analises";
import Configuracoes from "./pages/Configuracoes";
import LiveView from "./pages/LiveView";
import Contas from "./pages/Contas";
import Envios from "./pages/Envios";
import Lucratividade from "./pages/Lucratividade";
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
            <DateFilterProvider>
              <CurrencyProvider>
                <VisualEffectsProvider>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/analises" element={<ProtectedRoute><Analises /></ProtectedRoute>} />
                    <Route path="/live-view" element={<ProtectedRoute><LiveView /></ProtectedRoute>} />
                    <Route path="/contas" element={<ProtectedRoute><Contas /></ProtectedRoute>} />
                    <Route path="/envios" element={<ProtectedRoute><Envios /></ProtectedRoute>} />
                    <Route path="/lucratividade" element={<ProtectedRoute><Lucratividade /></ProtectedRoute>} />
                    <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </VisualEffectsProvider>
              </CurrencyProvider>
            </DateFilterProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
