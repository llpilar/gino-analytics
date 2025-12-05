import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: 'sale' | 'stock' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'sale': return 'from-chart-4/20 to-chart-4/5 border-chart-4/40';
      case 'stock': return 'from-chart-3/20 to-chart-3/5 border-chart-3/40';
      default: return 'from-primary/20 to-primary/5 border-primary/40';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative bg-card border border-border hover:bg-accent"
          aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        >
          <Bell className="h-5 w-5 text-foreground" aria-hidden="true" />
          {unreadCount > 0 && (
            <span 
              className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" 
              aria-hidden="true"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-popover/95 border-border backdrop-blur-xl" 
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-bold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/40">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary hover:bg-primary/10"
            >
              Marcar todas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" aria-hidden="true" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <ul className="p-2 space-y-2" role="list" aria-label="Lista de notificações">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  onKeyDown={(e) => e.key === 'Enter' && markAsRead(notification.id)}
                  tabIndex={0}
                  role="button"
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-br ${getTypeColor(notification.type)} border-2 ${
                    !notification.read ? 'opacity-100' : 'opacity-60'
                  } hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary`}
                  aria-label={`${notification.title}. ${notification.message}. ${!notification.read ? 'Não lida.' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-sm text-foreground">{notification.title}</h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                  <time className="text-[10px] text-muted-foreground/60">
                    {format(notification.timestamp, "HH:mm - dd/MM")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
