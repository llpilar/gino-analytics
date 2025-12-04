import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";

interface LiveGlobeProps {
  className?: string;
}

export const LiveGlobe = ({ className }: LiveGlobeProps) => {
  const globeEl = useRef<any>();
  const [arcsData, setArcsData] = useState<any[]>([]);

  useEffect(() => {
    // Auto-rotate and disable user interactions
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = false;
      globeEl.current.controls().enablePan = false;
      globeEl.current.controls().enableRotate = false;
    }

    // Generate random arcs to simulate live activity
    const generateArcs = () => {
      const newArcs = Array.from({ length: 20 }, () => ({
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: [
          ['#a3e635', '#22c55e'][Math.round(Math.random())],
          ['#a3e635', '#22c55e'][Math.round(Math.random())]
        ]
      }));
      setArcsData(newArcs);
    };

    generateArcs();
    const interval = setInterval(generateArcs, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={3000}
        arcStroke={0.5}
        atmosphereColor="#a3e635"
        atmosphereAltitude={0.15}
        pointsData={[]}
      />
    </div>
  );
};
