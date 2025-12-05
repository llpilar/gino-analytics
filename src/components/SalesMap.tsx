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

    mapboxgl.accessToken = mapboxToken;
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
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
        el.style.backgroundColor = 'rgba(34, 197, 94, 0.6)';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid rgba(34, 197, 94, 1)';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.5)';
        el.style.animation = `pulse 2s infinite ${index * 0.1}s`;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-3 bg-black/90 rounded-lg border border-green-500/30">
              <h3 class="font-bold text-green-400">${sale.orderName}</h3>
              ${sale.city ? `<p class="text-sm text-gray-300">${sale.city}${sale.province ? `, ${sale.province}` : ''}</p>` : ''}
              <p class="text-xs text-gray-400">${sale.country}</p>
              <p class="text-lg font-bold text-green-400 mt-2">
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
              0, 'rgba(0, 0, 255, 0)',
              0.2, 'rgb(34, 197, 94)',
              0.4, 'rgb(251, 191, 36)',
              0.6, 'rgb(249, 115, 22)',
              0.8, 'rgb(239, 68, 68)',
              1, 'rgb(220, 38, 38)'
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
        <p className="text-gray-400 text-sm mb-4">
          Para visualizar o mapa de vendas, adicione seu token público do Mapbox.
          <br />
          Obtenha em: <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">mapbox.com</a>
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Cole seu Mapbox Public Token"
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
            className="flex-1 bg-black/50 border-cyan-500/30 text-white"
          />
          <Button onClick={handleSetToken} className="bg-cyan-500 hover:bg-cyan-600">
            Salvar
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full bg-cyan-500/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-cyan-500/10" />
          <Skeleton className="h-24 bg-cyan-500/10" />
          <Skeleton className="h-24 bg-cyan-500/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border-2 border-cyan-500/30">
        <div ref={mapContainer} className="w-full h-[500px]" />
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
            border-top-color: rgba(0, 0, 0, 0.9) !important;
          }
        `}</style>
      </div>

      {/* Top Countries and Cities - 2x2 Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: 1 Country + 1 City */}
          <div className="space-y-4">
            {data.metrics && data.metrics.length > 0 && (
              <SectionCard color="green">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 shrink-0">
                      <span className="text-xs font-bold text-green-400">#1</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Top País</p>
                      <h3 className="font-bold text-white truncate">{data.metrics[0].country}</h3>
                    </div>
                  </div>
                  <MapPin className="h-4 w-4 text-green-400 shrink-0" />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Receita:</span>
                    <span className="text-sm font-bold text-green-400">
                      {formatCurrency(data.metrics[0].totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Pedidos:</span>
                    <span className="text-sm font-bold text-white">{data.metrics[0].orderCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Ticket:</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {formatCurrency(data.metrics[0].avgOrderValue)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                </div>
              </SectionCard>
            )}

            {data.topCities && data.topCities.length > 0 && (
              <SectionCard color="cyan">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shrink-0">
                      <span className="text-xs font-bold text-cyan-400">#1</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Top Cidade</p>
                      <h3 className="font-bold text-white truncate">{data.topCities[0].city}</h3>
                      <p className="text-xs text-gray-400 truncate">{data.topCities[0].country}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Receita:</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {formatCurrency(data.topCities[0].totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Pedidos:</span>
                    <span className="text-sm font-bold text-white">{data.topCities[0].orderCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Ticket:</span>
                    <span className="text-sm font-bold text-purple-400">
                      {formatCurrency(data.topCities[0].avgOrderValue)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                </div>
              </SectionCard>
            )}
          </div>

          {/* Right Column: 2 Cities */}
          <div className="space-y-4">
            {data.topCities && data.topCities.slice(1, 3).map((city: any, index: number) => (
              <SectionCard key={`${city.city}-${city.countryCode}`} color="cyan">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shrink-0">
                      <span className="text-xs font-bold text-cyan-400">#{index + 2}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate">{city.city}</h3>
                      <p className="text-xs text-gray-400 truncate">{city.country}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Receita:</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {formatCurrency(city.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Pedidos:</span>
                    <span className="text-sm font-bold text-white">{city.orderCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Ticket:</span>
                    <span className="text-sm font-bold text-purple-400">
                      {formatCurrency(city.avgOrderValue)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((city.totalRevenue / (data.topCities[0]?.totalRevenue || 1)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </SectionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
