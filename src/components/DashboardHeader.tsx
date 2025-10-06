import { useEffect, useState } from "react";

export const DashboardHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastUpdated = () => {
    return currentTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <header className="border-b border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-secondary/20 border border-secondary flex items-center justify-center">
              <span className="text-secondary font-bold">O</span>
            </div>
            <h1 className="text-2xl font-bold tracking-wider">OVERVIEW</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            Last updated {getLastUpdated()}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase mb-1">
            {formatDate(currentTime).split(",")[0]}
          </div>
          <div className="text-4xl font-bold neon-text-blue">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatDate(currentTime).split(",").slice(1).join(",")}
          </div>
        </div>
      </div>
    </header>
  );
};
