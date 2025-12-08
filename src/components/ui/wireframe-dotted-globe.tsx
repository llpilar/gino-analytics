import earthHoneycomb from "@/assets/earth-honeycomb.png";

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function RotatingEarth({ width = 800, height = 600, className = "" }: RotatingEarthProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={earthHoneycomb}
        alt="3D Earth Globe"
        className="w-full h-auto max-w-[500px] object-contain"
        style={{ maxWidth: width, maxHeight: height }}
      />
    </div>
  );
}
