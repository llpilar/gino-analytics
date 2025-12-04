import * as React from "react";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "./glowing-effect";

interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spread?: number;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
}

const GlowingCard = React.forwardRef<HTMLDivElement, GlowingCardProps>(
  ({ className, children, spread = 40, proximity = 64, inactiveZone = 0.01, borderWidth = 3, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[1.25rem] border-[0.75px] border-border p-2",
          className
        )}
        {...props}
      >
        <GlowingEffect
          spread={spread}
          glow={true}
          disabled={false}
          proximity={proximity}
          inactiveZone={inactiveZone}
          borderWidth={borderWidth}
        />
        <div className="relative flex flex-col gap-3 rounded-xl border-[0.75px] bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
          {children}
        </div>
      </div>
    );
  }
);

GlowingCard.displayName = "GlowingCard";

export { GlowingCard };
