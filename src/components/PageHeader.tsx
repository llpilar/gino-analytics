import { HyperText } from "@/components/ui/hyper-text";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <div>
      <HyperText 
        text={title} 
        className="text-2xl md:text-4xl font-black text-foreground tracking-tight"
      />
      {subtitle && (
        <p className="text-muted-foreground text-xs md:text-base mt-1">{subtitle}</p>
      )}
    </div>
  );
};
