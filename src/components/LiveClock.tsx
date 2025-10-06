import { useEffect, useState } from "react";

export const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  };

  return (
    <div className="glass-card relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(142,233,144,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(142,233,144,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-muted-foreground tracking-wider">
            {getDayOfWeek(time)}
          </span>
          <span className="text-sm text-muted-foreground tracking-wider">
            UTC-3
          </span>
        </div>

        <div className="flex items-center justify-center mb-6 relative">
          {/* Grid cube behind time */}
          <div className="absolute w-32 h-32 border-2 border-primary/30 rounded-lg transform rotate-45 -z-10" />
          <div className="absolute w-28 h-28 border-2 border-blue-500/30 rounded-lg transform rotate-45 -z-10" />
          
          <div className="text-6xl md:text-7xl font-black text-white tracking-tight neon-glow">
            {formatTime(time).split(' ')[0]}
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-sm font-semibold text-muted-foreground tracking-widest">
            {formatDate(time)}
          </div>
          <div className="text-xs text-muted-foreground tracking-wider">
            BUENOS AIRES, ARGENTINA
          </div>
        </div>
      </div>
    </div>
  );
};
