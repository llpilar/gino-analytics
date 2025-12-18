import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CloakerRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug) {
        setError("Link não encontrado");
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("cloaker-redirect", {
          body: { 
            slug,
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
        });

        if (fnError) throw fnError;

        if (data?.redirectUrl) {
          window.location.replace(data.redirectUrl);
        } else {
          setError("Link não encontrado");
        }
      } catch (err) {
        console.error("Redirect error:", err);
        setError("Erro ao processar redirecionamento");
      }
    };

    handleRedirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}