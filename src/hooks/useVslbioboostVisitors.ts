import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVslbioboostVisitors = () => {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate a unique visitor ID for this session
    const visitorId = `visitor_${Math.random().toString(36).substring(7)}_${Date.now()}`;
    
    // Create a realtime channel for VSL visitors presence
    const channel = supabase.channel('vsl-bioboost-visitors', {
      config: {
        presence: {
          key: visitorId,
        },
      },
    });

    // Handle presence sync - fires when presence state changes
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const count = Object.keys(presenceState).length;
      console.log('VSL Visitors sync:', count, presenceState);
      setVisitorCount(count);
      setIsLoading(false);
    });

    // Handle when a new visitor joins
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('VSL Visitor joined:', key, newPresences);
    });

    // Handle when a visitor leaves
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('VSL Visitor left:', key, leftPresences);
    });

    // Subscribe and track this visitor's presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          visitor_id: visitorId,
        });
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        setError('Failed to connect to presence channel');
        setIsLoading(false);
      }
    });

    // Cleanup on unmount - this will automatically remove the visitor
    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { visitorCount, isLoading, error };
};
