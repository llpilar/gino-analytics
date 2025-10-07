import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  location: string;
  device: string;
  duration: string;
  status: "viewing" | "checkout" | "purchased";
}

const statusColors = {
  viewing: "bg-blue-500",
  checkout: "bg-yellow-500",
  purchased: "bg-green-500",
};

const statusLabels = {
  viewing: "Navegando",
  checkout: "No Carrinho",
  purchased: "Comprou",
};

export const ActiveSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", location: "São Paulo, SP", device: "Mobile", duration: "2m", status: "viewing" },
    { id: "2", location: "Rio de Janeiro, RJ", device: "Desktop", duration: "5m", status: "checkout" },
    { id: "3", location: "Curitiba, PR", device: "Mobile", duration: "1m", status: "viewing" },
    { id: "4", location: "Belo Horizonte, MG", device: "Tablet", duration: "8m", status: "purchased" },
    { id: "5", location: "Porto Alegre, RS", device: "Desktop", duration: "3m", status: "checkout" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev => {
        const updated = [...prev];
        const randomIndex = Math.floor(Math.random() * updated.length);
        const statuses: ("viewing" | "checkout" | "purchased")[] = ["viewing", "checkout", "purchased"];
        updated[randomIndex] = {
          ...updated[randomIndex],
          status: statuses[Math.floor(Math.random() * statuses.length)],
        };
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 h-[500px]">
      <h2 className="text-xl font-bold mb-4">Sessões Ativas</h2>
      <ScrollArea className="h-[420px] pr-4">
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session.location.split(",")[0].substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{session.location}</p>
                  <Badge variant="outline" className="text-xs">
                    {session.duration}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{session.device}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      statusColors[session.status]
                    } animate-pulse`}
                  ></span>
                  <span className="text-xs text-muted-foreground">
                    {statusLabels[session.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
