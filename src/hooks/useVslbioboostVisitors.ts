import { useState, useEffect } from "react";

const VISITOR_COUNT_URL = "https://eyevvanvdvcxdqyxzwfr.supabase.co/functions/v1/visitor-count";

export const useVslbioboostVisitors = () => {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return { visitorCount, isLoading, error };
};
