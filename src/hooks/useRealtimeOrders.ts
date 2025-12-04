import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  name: string;
  totalPrice: string;
  createdAt: string;
  customer?: {
    displayName: string;
  };
}

// Audio instance para reutilização
let saleAudio: HTMLAudioElement | null = null;

export const useRealtimeOrders = () => {
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  // Play celebration sound
  const playNotificationSound = useCallback(() => {
    if (!saleAudio) {
      saleAudio = new Audio('/sounds/sale-notification.mp3');
      saleAudio.volume = 0.5;
    }
    saleAudio.currentTime = 0;
    saleAudio.play().catch(() => {});
  }, []);

  // Função para processar nova venda real
  const handleNewSale = useCallback((order: Order) => {
    setLatestOrder(order);
    setOrderCount(prev => prev + 1);
    
    playNotificationSound();
    
    const priceFormatted = parseFloat(order.totalPrice).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2 
    });
    
    toast({
      title: "🎉 Nova Venda!",
      description: `Pedido ${order.name} - Cliente: ${order.customer?.displayName || 'Cliente'} - R$ ${priceFormatted}`,
      duration: 8000,
    });
  }, [playNotificationSound]);

  useEffect(() => {
    // Aqui você pode conectar ao Supabase Realtime ou webhook do Shopify
    // Exemplo com Supabase Realtime (quando tiver uma tabela de pedidos):
    // 
    // const channel = supabase
    //   .channel('orders-realtime')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: 'INSERT',
    //       schema: 'public',
    //       table: 'orders'
    //     },
    //     (payload) => {
    //       const newOrder: Order = {
    //         id: payload.new.id,
    //         name: payload.new.order_number,
    //         totalPrice: payload.new.total_price,
    //         createdAt: payload.new.created_at,
    //         customer: {
    //           displayName: payload.new.customer_name
    //         }
    //       };
    //       handleNewSale(newOrder);
    //     }
    //   )
    //   .subscribe();
    //
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [handleNewSale]);

  // Exporta a função para poder chamar manualmente se necessário
  return { latestOrder, orderCount, handleNewSale };
};
