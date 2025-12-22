import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, ArrowRight, UserPlus } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar o cadastro."
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta."
        });
      }
    } catch (error: any) {
      let message = error.message;
      if (error.message === "Invalid login credentials") {
        message = "Email ou senha incorretos";
      } else if (error.message === "User already registered") {
        message = "Este email já está cadastrado";
      }
      toast({
        title: isSignUp ? "Erro ao criar conta" : "Erro ao entrar",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-px bg-gradient-to-b from-border/50 to-border/30 rounded-2xl" />
          
          <div className="relative bg-card/90 backdrop-blur-xl rounded-2xl p-8 border border-border/50">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 mb-4">
                {isSignUp ? <UserPlus className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-primary" />}
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {isSignUp ? "Criar conta" : "Entrar na conta"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isSignUp ? "Preencha os dados abaixo" : "Acesso restrito"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-input border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground h-11 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-input border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground h-11 rounded-xl transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] group"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isSignUp ? "Criando..." : "Entrando..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isSignUp ? "Criar conta" : "Entrar"}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                {isSignUp ? (
                  <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
                ) : (
                  <>Não tem conta? <span className="text-primary font-medium">Criar conta</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}