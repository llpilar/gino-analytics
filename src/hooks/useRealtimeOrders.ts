import { useEffect, useState } from 'react';
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

export const useRealtimeOrders = () => {
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    // Play celebration sound
    const playNotificationSound = () => {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWm98OScTgwOUKXh8LdjHAU7k9j0y3hrBSJ2x+/dj0AKFV+16OuoVRQKRp/g8r1sIQYqf8/y2ogzBxprwO/mnEoMElGj4fC4bCUGPJPY9Mt3bAUidbzr3Y9AChZftersnFgbDUeh4/K8bSMGKn/P8tuIMQcZbb/w5p5MDRBUo+LwuW0iBjuX1/TNci0JI3jK8d6TTwoWYrfq6qZjGg5Lpefxu24kByuBzvLaiDcIF2m78uScTgwOUKXi8LZhHAU7ktj0y3hrBSF2xu/dj0AKFV+16OuoVRQKRp/g8r1sIQYqf8/y2ogzBxprwO/mnEoMElGj4fC5bCUGOpPX9Mt3bAUidbzr3Y9AChZftersnFgbDUeh4/K8bSMGKn/P8tuIMQcZbb/w5p5MDRBUo+LwuW0iBjuX1/TNci0JI3jK8d6STwoWYrfq6qZjGg5Lpefxu24kByuBzvLaiDcIF2m78uScTgwOUKXh8LZhHAU7ktj0y3hrBSF2xu/dj0AKFV+16OuoVRQKRp/g8r1sIQYqf8/y2ogzBxprwO/mnEoMElGj4fC5bCUGOpPX9Mt3bAUidbzr3Y9AChZftersnFgbDUeh4/K8bSMGKn/P8tuIMQcZbb/w5p5MDRBUo+LwuW0iBjuX1/TNci0JI3jK8d6STwoWYrfq6qZjGg5Lpefxu24kByuBzvLaiDcIF2m78uScTgwOUKXh8LZhHAU7ktj0y3hrBSF2xu/dj0AKFV+16OuoVRQKRp/g8r1sIQYqf8/y2ogzBxprwO/mnEoMElGj4fC5bCUGOpPX9Mt3bAUidbzr3Y9AChZftersnFgbDUeh4/K8bSMGKn/P8tuIMQcZbb/w5p5MDRBUo+LwuW0iBjuX1/TNci0JI3jK8d6STwoWYrfq6qZjGg5Lpefxu24kByuBzvLaiDcIF2m78uScTgwOUKXh8LZhHAU7ktj0y3hrBSF2xu/dj0AK');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    };

    // Trigger celebration animation
    const triggerCelebration = () => {
      // Simple visual celebration without external library
      const style = document.createElement('style');
      style.textContent = `
        @keyframes celebrate {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
      setTimeout(() => document.head.removeChild(style), 1000);
    };

    // Simulate real-time order notifications (in production, this would be from Supabase Realtime)
    const checkForNewOrders = setInterval(() => {
      // This is a mock - in production you'd use Supabase Realtime
      const shouldNotify = Math.random() > 0.95; // 5% chance every check
      
      if (shouldNotify) {
        const mockOrder: Order = {
          id: `order-${Date.now()}`,
          name: `#${Math.floor(Math.random() * 10000)}`,
          totalPrice: (Math.random() * 500 + 50).toFixed(2),
          createdAt: new Date().toISOString(),
          customer: {
            displayName: ['Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Lima'][Math.floor(Math.random() * 4)]
          }
        };

        setLatestOrder(mockOrder);
        setOrderCount(prev => prev + 1);
        
        playNotificationSound();
        triggerCelebration();
        
        const priceFormatted = parseFloat(mockOrder.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        
        toast({
          title: "🎉 Nova Venda!",
          description: `Pedido ${mockOrder.name} - Cliente: ${mockOrder.customer?.displayName} - $${priceFormatted}`,
          duration: 5000,
        });
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(checkForNewOrders);
    };
  }, []);

  return { latestOrder, orderCount };
};
