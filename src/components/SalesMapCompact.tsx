import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesLocation } from "@/hooks/useSalesLocation";
import { useCurrency } from "@/contexts/CurrencyContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface SalesMapCompactProps {
  className?: string;
}

export const SalesMapCompact = ({ className }: SalesMapCompactProps) => {
  const [mapboxToken, setMapboxToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { data, isLoading } = useSalesLocation();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        });
        
        if (response.ok) {
          const { token } = await response.json();
          if (token) {
            setMapboxToken(token);
            setIsTokenSet(true);
            return;
          }
        }
      } catch (error) {
        console.log('Token not configured in backend');
      }

      const savedToken = localStorage.getItem('MAPBOX_PUBLIC_TOKEN');
      if (savedToken) {
        setMapboxToken(savedToken);
        setIsTokenSet(true);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if (!mapboxToken || !isTokenSet || !mapContainer.current || !data) return;

    const getHslValues = (varName: string) => {
      const style = getComputedStyle(document.documentElement);
      const value = style.getPropertyValue(varName).trim();
      if (!value) return null;
      const parts = value.split(' ');
      if (parts.length >= 3) {
        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1]) / 100;
        const l = parseFloat(parts[2]) / 100;
        return { h, s, l };
      }
      return null;
    };

    const hslToRgb = (h: number, s: number, l: number) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1/3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1/3);
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    };

    const hslValues = getHslValues("--primary");
    const rgb = hslValues ? hslToRgb(hslValues.h, hslValues.s, hslValues.l) : { r: 29, g: 161, b: 242 };
    const primaryColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const primaryRgba = (opacity: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;

    mapboxgl.accessToken = mapboxToken;
    
    const bgStyle = getComputedStyle(document.documentElement);
    const bgValue = bgStyle.getPropertyValue("--background").trim();
    const isDark = bgValue ? parseInt(bgValue.split(' ')[2]) < 50 : true;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 4.711],
      zoom: 4,
      projection: 'mercator',
      interactive: false
    });

    map.current.on('load', () => {
      if (!map.current || !data.sales) return;

      data.sales.forEach((sale, index) => {
        if (!sale.coordinates) return;

        const el = document.createElement('div');
        const size = 8 + Math.min(sale.amount / 20000, 15);
        el.className = 'sale-marker-compact';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = primaryRgba(0.7);
        el.style.borderRadius = '50%';
        el.style.border = `1px solid ${primaryColor}`;
        el.style.boxShadow = `0 0 6px ${primaryRgba(0.5)}`;
        el.style.animation = `pulse-compact 2s infinite ${index * 0.1}s`;

        new mapboxgl.Marker(el)
          .setLngLat([sale.coordinates.lng, sale.coordinates.lat])
          .addTo(map.current!);
      });

      // Heatmap
      if (data.sales.length > 0) {
        const features = data.sales
          .filter(sale => sale.coordinates)
          .map(sale => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [sale.coordinates!.lng, sale.coordinates!.lat]
            },
            properties: { amount: sale.amount }
          }));

        map.current!.addSource('sales-heat', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        map.current!.addLayer({
          id: 'sales-heat',
          type: 'heatmap',
          source: 'sales-heat',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'amount'], 0, 0, 100000, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.2, primaryRgba(0.3),
              0.4, primaryRgba(0.5),
              0.6, primaryRgba(0.7),
              0.8, primaryRgba(0.85),
              1, primaryColor
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 9, 30],
            'heatmap-opacity': 0.6
          }
        }, 'waterway-label');
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isTokenSet, data]);

  // Calculate stats
  const totalSales = data?.sales?.length || 0;
  const topCity = data?.topCities?.[0]?.city || '-';
  const totalRevenue = data?.metrics?.reduce((acc, m) => acc + m.totalRevenue, 0) || 0;

  if (!isTokenSet) {
    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center gap-2 ${className}`}>
        <MapPin className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground text-center px-4">
          Configure o Mapbox Token
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className={`w-full h-full ${className}`} />;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Stats Overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px]">
        <div className="bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">
          <span className="text-muted-foreground">Vendas: </span>
          <span className="font-bold text-primary">{totalSales}</span>
        </div>
        {topCity !== '-' && (
          <div className="bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">
            <span className="text-muted-foreground">Top: </span>
            <span className="font-bold text-foreground">{topCity}</span>
          </div>
        )}
      </div>

      <style>{`
        .sale-marker-compact {
          transition: transform 0.3s ease;
        }
        @keyframes pulse-compact {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};
