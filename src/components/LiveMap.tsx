import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Card } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";

interface Location {
  id: number;
  lat: number;
  lng: number;
  city: string;
  country: string;
  visitors: number;
}

export const LiveMap = () => {
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, lat: -23.5505, lng: -46.6333, city: "São Paulo", country: "Brasil", visitors: 15 },
    { id: 2, lat: -22.9068, lng: -43.1729, city: "Rio de Janeiro", country: "Brasil", visitors: 8 },
    { id: 3, lat: -19.9167, lng: -43.9345, city: "Belo Horizonte", country: "Brasil", visitors: 5 },
    { id: 4, lat: -25.4284, lng: -49.2733, city: "Curitiba", country: "Brasil", visitors: 4 },
    { id: 5, lat: -30.0346, lng: -51.2177, city: "Porto Alegre", country: "Brasil", visitors: 6 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocations(prev =>
        prev.map(loc => ({
          ...loc,
          visitors: Math.floor(Math.random() * 20) + 1,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Visitantes por Localização</h2>
      <div className="h-[500px] rounded-lg overflow-hidden">
        <MapContainer
          center={[-15.7801, -47.9292]}
          zoom={4}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((location) => (
            <CircleMarker
              key={location.id}
              center={[location.lat, location.lng]}
              radius={Math.max(location.visitors / 2, 5)}
              fillColor="#3b82f6"
              color="#1d4ed8"
              weight={2}
              fillOpacity={0.6}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{location.city}</p>
                  <p className="text-muted-foreground">{location.country}</p>
                  <p className="mt-1">
                    <span className="font-semibold">{location.visitors}</span> visitantes
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
};
