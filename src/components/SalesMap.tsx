import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesLocation } from "@/hooks/useSalesLocation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SectionCard, StatsCard } from "@/components/ui/stats-card";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export const SalesMap = () => {
  const [mapboxToken, setMapboxToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { data, isLoading } = useSalesLocation();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    // Try to get token from backend/secrets via edge function
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
        console.log('Token not configured in backend, using local storage fallback');
      }

      // Fallback to localStorage
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

    // Get theme colors from CSS variables and convert to RGB for Mapbox
    const getHslValues = (varName: string) => {
      const style = getComputedStyle(document.documentElement);
      const value = style.getPropertyValue(varName).trim();
      if (!value) return null;
      // Parse "85 100% 69%" format
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
    
    // Get background color for map style
    const bgStyle = getComputedStyle(document.documentElement);
    const bgValue = bgStyle.getPropertyValue("--background").trim();
    const isDark = bgValue ? parseInt(bgValue.split(' ')[2]) < 50 : true;
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 4.711], // Bogotá, Colombia
      zoom: 4,
      projection: 'mercator'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add markers for each sale
      data.sales.forEach((sale, index) => {
        if (!sale.coordinates) return;

        const el = document.createElement('div');
        const size = 15 + Math.min(sale.amount / 10000, 30);
        el.className = 'sale-marker';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = primaryRgba(0.6);
        el.style.borderRadius = '50%';
        el.style.border = `2px solid ${primaryColor}`;
        el.style.cursor = 'pointer';
        el.style.boxShadow = `0 0 10px ${primaryRgba(0.5)}`;
        el.style.animation = `pulse 2s infinite ${index * 0.1}s`;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-3 bg-card rounded-lg border border-border shadow-lg">
              <h3 class="font-bold text-primary">${sale.orderName}</h3>
              ${sale.city ? `<p class="text-sm text-muted-foreground">${sale.city}${sale.province ? `, ${sale.province}` : ''}</p>` : ''}
              <p class="text-xs text-muted-foreground">${sale.country}</p>
              <p class="text-lg font-bold text-primary mt-2">
                $${sale.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          `);

        new mapboxgl.Marker(el)
          .setLngLat([sale.coordinates.lng, sale.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Add heatmap layer
      if (data.sales.length > 0) {
        const features = data.sales
          .filter(sale => sale.coordinates)
          .map(sale => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [sale.coordinates!.lng, sale.coordinates!.lat]
            },
            properties: {
              amount: sale.amount
            }
          }));

        map.current!.addSource('sales-heat', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          }
        });

        map.current!.addLayer({
          id: 'sales-heat',
          type: 'heatmap',
          source: 'sales-heat',
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'amount'],
              0, 0,
              100000, 1
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              9, 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.2, primaryRgba(0.3),
              0.4, primaryRgba(0.5),
              0.6, primaryRgba(0.7),
              0.8, primaryRgba(0.85),
              1, primaryColor
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 20,
              9, 40
            ],
            'heatmap-opacity': 0.7
          }
        }, 'waterway-label');
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isTokenSet, data]);

  const handleSetToken = () => {
    if (tempToken) {
      localStorage.setItem('MAPBOX_PUBLIC_TOKEN', tempToken);
      setMapboxToken(tempToken);
      setIsTokenSet(true);
    }
  };

  if (!isTokenSet) {
    return (
      <SectionCard title="Configurar Mapa" icon={MapPin} color="cyan">
        <p className="text-muted-foreground text-sm mb-4">
          Para visualizar o mapa de vendas, adicione seu token público do Mapbox.
          <br />
          Obtenha em: <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Cole seu Mapbox Public Token"
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
            className="flex-1 bg-card border-border"
          />
          <Button onClick={handleSetToken} className="bg-primary hover:bg-primary/90">
            Salvar
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-muted" />
          <Skeleton className="h-24 bg-muted" />
          <Skeleton className="h-24 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border-2 border-primary/30 relative">
        <div ref={mapContainer} className="w-full h-[300px] md:h-[400px] lg:h-[500px]" />
        <style>{`
          .sale-marker {
            transition: transform 0.3s ease;
          }
          .sale-marker:hover {
            transform: scale(1.2);
            z-index: 1000;
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.15);
            }
          }
          .mapboxgl-popup-content {
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: white !important;
          }
        `}</style>
      </div>

      {/* Top Countries and Cities - 2x2 Grid */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Top País */}
          {data.metrics && data.metrics.length > 0 && (
            <SectionCard color="green" className="h-full">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-chart-4/20 flex items-center justify-center border border-chart-4/30 shrink-0">
                    <span className="text-[10px] md:text-xs font-bold text-chart-4">#1</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Top País</p>
                    <h3 className="text-sm md:text-base font-bold text-foreground truncate">{data.metrics[0].country}</h3>
                  </div>
                </div>
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-chart-4 shrink-0" />
              </div>
              
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Receita</span>
                  <span className="text-xs md:text-sm font-bold text-chart-4 truncate block">
                    {formatCurrency(data.metrics[0].totalRevenue)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Pedidos</span>
                  <span className="text-xs md:text-sm font-bold text-foreground">{data.metrics[0].orderCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Ticket</span>
                  <span className="text-xs md:text-sm font-bold text-primary truncate block">
                    {formatCurrency(data.metrics[0].avgOrderValue)}
                  </span>
                </div>
              </div>

              <div className="mt-2 md:mt-3 h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-chart-4 to-chart-4/70 rounded-full" />
              </div>
            </SectionCard>
          )}

          {/* Top Cidade #1 */}
          {data.topCities && data.topCities.length > 0 && (
            <SectionCard color="cyan" className="h-full">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                    <span className="text-[10px] md:text-xs font-bold text-primary">#1</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Top Cidade</p>
                    <h3 className="text-sm md:text-base font-bold text-foreground truncate">{data.topCities[0].city}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">{data.topCities[0].country}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Receita</span>
                  <span className="text-xs md:text-sm font-bold text-primary truncate block">
                    {formatCurrency(data.topCities[0].totalRevenue)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Pedidos</span>
                  <span className="text-xs md:text-sm font-bold text-foreground">{data.topCities[0].orderCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Ticket</span>
                  <span className="text-xs md:text-sm font-bold text-chart-5 truncate block">
                    {formatCurrency(data.topCities[0].avgOrderValue)}
                  </span>
                </div>
              </div>

              <div className="mt-2 md:mt-3 h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-primary to-primary/70 rounded-full" />
              </div>
            </SectionCard>
          )}

          {/* Top Cidade #2 */}
          {data.topCities && data.topCities.length > 1 && (
            <SectionCard color="cyan" className="h-full">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                    <span className="text-[10px] md:text-xs font-bold text-primary">#2</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Top Cidade</p>
                    <h3 className="text-sm md:text-base font-bold text-foreground truncate">{data.topCities[1].city}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">{data.topCities[1].country}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Receita</span>
                  <span className="text-xs md:text-sm font-bold text-primary truncate block">
                    {formatCurrency(data.topCities[1].totalRevenue)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Pedidos</span>
                  <span className="text-xs md:text-sm font-bold text-foreground">{data.topCities[1].orderCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Ticket</span>
                  <span className="text-xs md:text-sm font-bold text-chart-5 truncate block">
                    {formatCurrency(data.topCities[1].avgOrderValue)}
                  </span>
                </div>
              </div>

              <div className="mt-2 md:mt-3 h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((data.topCities[1].totalRevenue / (data.topCities[0]?.totalRevenue || 1)) * 100, 100)}%` 
                  }}
                />
              </div>
            </SectionCard>
          )}

          {/* Top Cidade #3 */}
          {data.topCities && data.topCities.length > 2 && (
            <SectionCard color="cyan" className="h-full">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                    <span className="text-[10px] md:text-xs font-bold text-primary">#3</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Top Cidade</p>
                    <h3 className="text-sm md:text-base font-bold text-foreground truncate">{data.topCities[2].city}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">{data.topCities[2].country}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Receita</span>
                  <span className="text-xs md:text-sm font-bold text-primary truncate block">
                    {formatCurrency(data.topCities[2].totalRevenue)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Pedidos</span>
                  <span className="text-xs md:text-sm font-bold text-foreground">{data.topCities[2].orderCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground block">Ticket</span>
                  <span className="text-xs md:text-sm font-bold text-chart-5 truncate block">
                    {formatCurrency(data.topCities[2].avgOrderValue)}
                  </span>
                </div>
              </div>

              <div className="mt-2 md:mt-3 h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((data.topCities[2].totalRevenue / (data.topCities[0]?.totalRevenue || 1)) * 100, 100)}%` 
                  }}
                />
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
};
