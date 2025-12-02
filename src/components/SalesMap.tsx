import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';

export const SalesMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !tokenSaved || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-43.2, -22.9], // Rio de Janeiro
        zoom: 3,
        projection: { name: 'globe' } as any,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Mock sales locations
      const salesLocations = [
        { name: 'São Paulo', coordinates: [-46.6333, -23.5505], sales: 1250 },
        { name: 'Rio de Janeiro', coordinates: [-43.1729, -22.9068], sales: 890 },
        { name: 'Belo Horizonte', coordinates: [-43.9378, -19.9208], sales: 420 },
        { name: 'Brasília', coordinates: [-47.8825, -15.7942], sales: 380 },
        { name: 'Curitiba', coordinates: [-49.2643, -25.4284], sales: 340 },
      ];

      map.current.on('load', () => {
        // Add markers for each location
        salesLocations.forEach(location => {
          const el = document.createElement('div');
          el.className = 'marker';
          el.style.width = `${Math.max(20, location.sales / 30)}px`;
          el.style.height = `${Math.max(20, location.sales / 30)}px`;
          el.style.borderRadius = '50%';
          el.style.background = 'rgba(6, 182, 212, 0.6)';
          el.style.border = '2px solid rgba(6, 182, 212, 1)';
          el.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.5)';
          el.style.cursor = 'pointer';
          el.style.animation = 'pulse 2s infinite';

          new mapboxgl.Marker(el)
            .setLngLat(location.coordinates as [number, number])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="color: #000; padding: 8px;">
                    <h3 style="font-weight: bold; margin-bottom: 4px;">${location.name}</h3>
                    <p style="font-size: 14px;"><strong>${location.sales}</strong> vendas</p>
                  </div>
                `)
            )
            .addTo(map.current!);
        });
      });

      // Cleanup
      return () => {
        map.current?.remove();
      };
    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
    }
  }, [tokenSaved, mapboxToken]);

  const handleSaveToken = () => {
    if (mapboxToken.trim()) {
      setTokenSaved(true);
    }
  };

  if (!tokenSaved) {
    return (
      <div className="w-full h-[500px] rounded-xl bg-black/60 border-2 border-cyan-500/30 backdrop-blur-xl flex flex-col items-center justify-center p-8 gap-4">
        <MapPin className="h-16 w-16 text-cyan-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-200">Configure o Mapa de Vendas</h3>
        <p className="text-gray-400 text-center max-w-md mb-4">
          Para visualizar o mapa interativo de vendas, você precisa adicionar sua chave pública do Mapbox.
          <br />
          <a 
            href="https://account.mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline mt-2 inline-block"
          >
            Obter token do Mapbox →
          </a>
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input 
            type="text"
            placeholder="Cole seu Mapbox Public Token aqui..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="flex-1 bg-black/60 border-gray-700/50 focus:border-cyan-500/50"
          />
          <Button 
            onClick={handleSaveToken}
            disabled={!mapboxToken.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
      <div ref={mapContainer} className="absolute inset-0" />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};
