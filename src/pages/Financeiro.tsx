import { DashboardWrapper } from "@/components/DashboardWrapper";
import { DollarSign } from "lucide-react";

export default function Financeiro() {
  return (
    <DashboardWrapper>
      <div className="w-full h-full flex flex-col px-4 py-6 pb-24 md:pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Planilha de controle financeiro</p>
          </div>
        </div>

        {/* Google Sheets Embed */}
        <div className="flex-1 w-full min-h-[600px] rounded-xl overflow-hidden border border-border bg-card">
          <iframe
            src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQNySsnxWwznHjDeyXT7KJfCwvs-bD1IfKOLoyBnJ4-c2Qvln2qFct7S5j3arSRsU4R197-MKegeTBx/pubhtml?widget=true&amp;headers=false"
            className="w-full h-full min-h-[600px]"
            title="Planilha Financeiro"
          />
        </div>
      </div>
    </DashboardWrapper>
  );
}
