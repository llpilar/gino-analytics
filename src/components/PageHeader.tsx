import { ReactNode } from "react";
import { DateFilter } from "./DateFilter";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const PageHeader = ({ title, subtitle, icon }: PageHeaderProps) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title Section */}
      <div className="flex items-center gap-4">
        {icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 text-sm md:text-base mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold hidden md:block">
          Período:
        </span>
        <DateFilter />
      </div>
    </div>
  );
};
