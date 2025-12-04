import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Lock, Clock, Shield } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/3 to-orange-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-orange-500/20 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <Zap className="w-10 h-10 text-cyan-400" />
              </div>
            </div>
            <p className="text-zinc-400 text-lg">
              Painel de controle
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 font-medium text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800/50 border border-zinc-700 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-zinc-500 h-12 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 font-medium text-sm">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-zinc-800/50 border border-zinc-700 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-zinc-500 h-12 rounded-xl transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-900 font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Entrar
                </span>
              )}
            </Button>
          </form>

          {/* Info cards */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-zinc-400 text-sm">
                Cadastro não disponível. Acesso apenas para usuários autorizados.
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-zinc-400 text-sm">
                Sessão expira após 24 horas de inatividade.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
