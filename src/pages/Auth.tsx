import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, ArrowRight } from "lucide-react";

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
        password
      });
      if (error) throw error;
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-px bg-gradient-to-b from-zinc-700/50 to-zinc-800/50 rounded-2xl" />
          
          <div className="relative bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800/50">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 mb-4">
                <Lock className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Entrar na conta
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Acesso restrito
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-zinc-800/50 border-zinc-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-white placeholder:text-zinc-600 h-11 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-zinc-800/50 border-zinc-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-white placeholder:text-zinc-600 h-11 rounded-xl transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] group"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer info */}
            <div className="mt-6 pt-6 border-t border-zinc-800/50">
              <p className="text-zinc-600 text-xs text-center">
                Acesso apenas para usuários autorizados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
