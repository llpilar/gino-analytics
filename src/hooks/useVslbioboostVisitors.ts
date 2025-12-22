import { useState, useEffect } from "react";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";

const VISITOR_COUNT_URL = "https://zoegvqshotxxhgcuhpwh.supabase.co/functions/v1/visitor-count";

// IDs dos usuários que podem ver o contador de visitantes do VSL Bioboost
const ALLOWED_USER_IDS = [
  "107a97e5-fe39-489c-8710-e5efdff87a9b", // Lucas Pilar
  "7af96144-e67b-4504-a71f-9059b679109e", // Bioboost
];

export const useVslbioboostVisitors = () => {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { effectiveUserId } = useUserIntegrations();

  // Verifica se o usuário tem permissão para ver esses dados
  const isAllowed = effectiveUserId && ALLOWED_USER_IDS.includes(effectiveUserId);

  useEffect(() => {
    // Se não tem permissão, retorna zerado
    if (!isAllowed) {
      setVisitorCount(0);
      setIsLoading(false);
      return;
    }

    const fetchVisitorCount = async () => {
      try {
        const response = await fetch(VISITOR_COUNT_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch visitor count");
        }
        const data = await response.json();
        setVisitorCount(data.count || 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching visitor count:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchVisitorCount();

    // Then poll every 5 seconds for real-time updates
    const interval = setInterval(fetchVisitorCount, 5000);

    return () => clearInterval(interval);
  }, [isAllowed]);

  return { visitorCount, isLoading, error, isAllowed };
};
