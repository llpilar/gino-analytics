import logoImage from "@/assets/logo.png";

interface AnimatedLogoProps {
  className?: string;
  size?: number;
}

export const AnimatedLogo = ({ className, size = 200 }: AnimatedLogoProps) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer glow ring */}
      <div 
        className="absolute rounded-full animate-spin"
        style={{
          width: size + 60,
          height: size + 60,
          background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent, hsl(var(--chart-5)), transparent)',
          animationDuration: '4s',
          filter: 'blur(2px)',
          opacity: 0.6
        }}
      />
      
      {/* Inner glow ring */}
      <div 
        className="absolute rounded-full animate-spin"
        style={{
          width: size + 40,
          height: size + 40,
          background: 'conic-gradient(from 180deg, transparent, hsl(var(--primary)), transparent)',
          animationDuration: '3s',
          animationDirection: 'reverse',
          opacity: 0.4
        }}
      />
      
      {/* Pulse ring */}
      <div 
        className="absolute rounded-full animate-pulse"
        style={{
          width: size + 20,
          height: size + 20,
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Logo container with float animation */}
      <div 
        className="relative z-10 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          width: size,
          height: size,
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 0 40px hsl(var(--primary) / 0.4), 0 0 80px hsl(var(--chart-5) / 0.2)'
        }}
      >
        <img 
          src={logoImage} 
          alt="Dashfy Logo" 
          className="w-full h-full object-cover"
          style={{
            filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.5))'
          }}
        />
      </div>

      {/* Orbiting particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            animation: `orbit ${3 + i * 0.5}s linear infinite`,
            animationDelay: `${i * 0.5}s`,
            transformOrigin: `${size / 2 + 50}px center`,
            boxShadow: '0 0 10px hsl(var(--primary))',
            opacity: 0.8
          }}
        />
      ))}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
        }
        
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(${size / 2 + 40}px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(${size / 2 + 40}px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
};
