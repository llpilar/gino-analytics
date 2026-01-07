import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { DollarSign, Maximize2 } from "lucide-react";

const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1pIIuLWojZBy6xxaMrnFcRHyuyWN4966tk0-qx3pTjZk/edit?gid=1204621446";

export default function Financeiro() {
  const handleOpenFullscreen = () => {
    window.open(SPREADSHEET_URL, "_blank");
  };

  return (
    <DashboardWrapper>
      <div className="w-full h-full flex flex-col px-4 py-6 pb-24 md:pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
              <p className="text-sm text-muted-foreground">Planilha de controle financeiro</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenFullscreen}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Tela cheia</span>
          </Button>
        </div>

        {/* Google Sheets Embed */}
        <div className="flex-1 w-full min-h-[700px] rounded-xl overflow-hidden border border-border bg-card">
          <iframe
            src={`${SPREADSHEET_URL}&rm=minimal`}
            className="w-full h-full min-h-[700px]"
            title="Planilha Financeiro"
            allow="clipboard-write"
          />
        </div>
      </div>
    </DashboardWrapper>
  );
}
