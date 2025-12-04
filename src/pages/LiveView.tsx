import { DashboardLayout } from "@/components/DashboardLayout";
import { LiveMetrics } from "@/components/LiveMetrics";
import { ActiveSessions } from "@/components/ActiveSessions";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/ui/stats-card";
import { MapPin } from "lucide-react";

const LiveView = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <PageHeader 
          title="Ao Vivo"
          subtitle="Acompanhe sua loja em tempo real"
        />

        <LiveMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionCard title="Mapa de Vendas" icon={MapPin} color="cyan" className="h-[500px]">
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">Mapa em breve</p>
              </div>
            </SectionCard>
          </div>
          <div>
            <ActiveSessions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveView;
