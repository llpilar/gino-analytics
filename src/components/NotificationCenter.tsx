import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";
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

  // Notificações virão de fonte real (Supabase Realtime, webhooks, etc)
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('notifications')
  //     .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
  //       (payload) => {
  //         // Adicionar nova notificação ao estado
  //       }
  //     )
  //     .subscribe();
  //   
  //   return () => { supabase.removeChannel(channel); };
  // }, []);

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
      case 'sale': return 'from-green-500/20 to-emerald-500/10 border-green-500/40';
      case 'stock': return 'from-orange-500/20 to-red-500/10 border-orange-500/40';
      default: return 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative glass-card hover:bg-zinc-800/50"
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900/95 border-zinc-800 backdrop-blur-xl" align="end">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-white">Notificações</h3>
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
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-br ${getTypeColor(notification.type)} border-2 ${
                    !notification.read ? 'opacity-100' : 'opacity-60'
                  } hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-sm text-white">{notification.title}</h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{notification.message}</p>
                  <p className="text-[10px] text-gray-600">
                    {format(notification.timestamp, "HH:mm - dd/MM")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
