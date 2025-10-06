import { Card } from "@/components/ui/card";
import { CircleDot } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "success",
    title: "PEDIDO CONFIRMADO",
    message: "Novo pedido de R$ 1.247,00 foi confirmado com sucesso.",
    date: "10/10/2025",
    color: "green",
  },
  {
    id: 2,
    type: "info",
    title: "META ATINGIDA",
    message: "Você atingiu 80% da meta mensal de vendas!",
    date: "10/10/2025",
    color: "blue",
  },
  {
    id: 3,
    type: "warning",
    title: "GASTO ADS ALTO",
    message: "Seus gastos com anúncios estão 15% acima da média.",
    date: "10/10/2025",
    color: "orange",
  },
];

export const NotificationsPanel = () => {
  return (
    <Card className="bg-card border-border p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-secondary/20 border border-secondary flex items-center justify-center">
            <span className="text-secondary text-xs font-bold">3</span>
          </div>
          <h3 className="text-sm font-bold tracking-wider">NOTIFICAÇÕES</h3>
        </div>
        <button className="text-xs text-primary hover:underline font-bold">
          LIMPAR TUDO
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="border border-border rounded-lg p-4 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <CircleDot 
                className={`w-4 h-4 mt-1 ${
                  notification.color === "green"
                    ? "text-[hsl(var(--neon-green))]"
                    : notification.color === "blue"
                    ? "text-[hsl(var(--neon-blue))]"
                    : "text-[hsl(var(--neon-orange))]"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {notification.type === "warning" ? "MÉDIO" : ""}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {notification.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3 border border-border rounded-lg text-sm font-bold hover:bg-muted transition-all">
        MOSTRAR TODAS (3)
      </button>
    </Card>
  );
};
