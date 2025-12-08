import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGA4Visitors = () => {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitorCount = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('ga4-realtime');
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (data?.error) {
          throw new Error(data.error);
        }
        
        setVisitorCount(data?.count || 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching GA4 visitor count:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchVisitorCount();

    // Then poll every 30 seconds (GA4 real-time has some delay)
    const interval = setInterval(fetchVisitorCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { visitorCount, isLoading, error };
};
