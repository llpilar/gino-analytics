import { ShootingStars } from "@/components/ui/shooting-stars";
import { useVisualEffects } from "@/contexts/VisualEffectsContext";
import { useTheme } from "@/contexts/ThemeContext";

export const StarsBackground = () => {
  const { premiumEffects } = useVisualEffects();
  const { theme } = useTheme();

  // Don't show stars on light theme
  if (theme === 'clean-blue') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0)_70%)]" />
      
      {/* Static stars */}
      <div className="stars absolute inset-0" />

      {/* Shooting stars - only when premium effects enabled */}
      {premiumEffects && (
        <>
          <ShootingStars
            starColor="hsl(var(--primary))"
            trailColor="hsl(var(--secondary))"
            minSpeed={15}
            maxSpeed={35}
            minDelay={2000}
            maxDelay={5000}
          />
          <ShootingStars
            starColor="hsl(var(--neon-pink))"
            trailColor="hsl(var(--neon-cyan))"
            minSpeed={10}
            maxSpeed={25}
            minDelay={3000}
            maxDelay={6000}
          />
          <ShootingStars
            starColor="hsl(var(--neon-purple))"
            trailColor="hsl(var(--neon-green))"
            minSpeed={20}
            maxSpeed={40}
            minDelay={4000}
            maxDelay={7000}
          />
        </>
      )}

      <style>{`
        .stars {
          background-image: 
            radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.25), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1.5px 1.5px at 160px 120px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 200px 50px, rgba(255,255,255,0.25), transparent),
            radial-gradient(1.5px 1.5px at 250px 180px, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 300px 90px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 350px 140px, rgba(255,255,255,0.25), transparent);
          background-repeat: repeat;
          background-size: 400px 300px;
          animation: twinkle 8s ease-in-out infinite;
          opacity: 0.6;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
