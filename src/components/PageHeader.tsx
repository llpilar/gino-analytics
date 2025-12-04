import { HyperText } from "@/components/ui/hyper-text";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <div className="mb-8">
      <HyperText 
        text={title} 
        className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
      />
      {subtitle && (
        <p className="text-gray-400 text-sm md:text-base mt-1">{subtitle}</p>
      )}
    </div>
  );
};
