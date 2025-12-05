import { useEffect, useState } from "react";

export const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("Carregando...");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    // Detectar timezone automaticamente
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(detectedTimezone);
    
    // Tentar obter localização via geolocalização
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Usar API de geocoding reverso (exemplo com API pública)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            setLocation(`${data.address.city || data.address.town || data.address.village || ''}, ${data.address.country}`);
          } catch (error) {
            // Se falhar, usar apenas o timezone
            setLocation(detectedTimezone.replace('_', ' '));
          }
        },
        () => {
          // Se usuário negar, usar timezone
          setLocation(detectedTimezone.replace('_', ' '));
        }
      );
    } else {
      setLocation(detectedTimezone.replace('_', ' '));
    }

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('pt-BR', options).toUpperCase();
  };

  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
  };

  const getTimezoneOffset = () => {
    const offset = -time.getTimezoneOffset() / 60;
    return `UTC${offset >= 0 ? '+' : ''}${offset}`;
  };

  return (
    <div className="metric-card flex flex-col h-full">
      {/* Grid background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(158,255,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(158,255,94,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-zinc-400 tracking-widest">
            {getDayOfWeek(time)}
          </span>
          <span className="text-xs text-zinc-500 tracking-wider">
            {getTimezoneOffset()}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          {/* Decorative grid cube */}
          <div className="absolute w-24 h-24 border border-primary/20 rounded-lg transform rotate-45" />
          <div className="absolute w-20 h-20 border border-secondary/20 rounded-lg transform rotate-45" />
          
          <div className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight">
            {formatTime(time)}
          </div>
        </div>

        <div className="text-center space-y-2 mt-4">
          <div className="text-xs font-medium text-zinc-400 tracking-widest">
            {formatDate(time)}
          </div>
          <div className="text-xs text-primary tracking-wider uppercase font-semibold">
            {location}
          </div>
        </div>
      </div>
    </div>
  );
};
