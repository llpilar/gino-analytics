import { DashboardLayout } from "@/components/DashboardLayout";
import { LiveMetrics } from "@/components/LiveMetrics";
import { LiveMap } from "@/components/LiveMap";
import { ActiveSessions } from "@/components/ActiveSessions";

const LiveView = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Live View</h1>
          <p className="text-muted-foreground">Acompanhe sua loja em tempo real</p>
        </div>

        <LiveMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveMap />
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
