import { DashboardLayout } from "@/components/DashboardLayout";
import { LiveMetrics } from "@/components/LiveMetrics";
import { ActiveSessions } from "@/components/ActiveSessions";
import { PageHeader } from "@/components/PageHeader";

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
            <div className="text-center p-12 border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">Mapa em breve</p>
            </div>
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
