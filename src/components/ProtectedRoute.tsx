import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isApproved, isPending, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Não logado -> login
    if (!user) {
      navigate("/auth");
      return;
    }

    // Conta suspensa ou rejeitada
    if (profile?.status === 'suspended' || profile?.status === 'rejected') {
      navigate("/conta-bloqueada");
      return;
    }

    // Conta pendente de aprovação (exceto admins)
    if (isPending && !isAdmin && location.pathname !== "/aguardando-aprovacao") {
      navigate("/aguardando-aprovacao");
      return;
    }

    // Rota requer admin mas user não é admin
    if (requireAdmin && !isAdmin) {
      navigate("/dashboard");
      return;
    }
  }, [user, loading, isAdmin, isApproved, isPending, profile, navigate, location.pathname, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  // Se não está logado, não renderiza nada
  if (!user) return null;

  // Se está pendente e não é admin, não renderiza (vai redirecionar)
  if (isPending && !isAdmin && location.pathname !== "/aguardando-aprovacao") return null;

  // Se requer admin e não é admin, não renderiza
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}
