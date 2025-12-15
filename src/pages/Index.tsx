import { LiveCommandCenter } from "@/components/LiveCommandCenter";
import { CombinedDashboard } from "@/components/CombinedDashboard";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";

const Index = () => {
  const { viewMode } = useDashboardSettings();
  
  if (viewMode === "combined") {
    return <CombinedDashboard />;
  }
  
  return <LiveCommandCenter />;
};

export default Index;
