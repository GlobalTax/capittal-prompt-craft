import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";
import ValuationCalculator from "@/components/ValuationCalculator";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";
import ReportGenerator from "@/components/ReportGenerator";
import CollaborationHub from "@/components/CollaborationHub";
import AdvancedSettings from "@/components/AdvancedSettings";
import FinancialDataIntegrator from "@/components/FinancialDataIntegrator";
import DataImporter from "@/components/DataImporter";
import AlertSystem from "@/components/AlertSystem";
import ZapierIntegration from "@/components/ZapierIntegration";
import DueDiligenceChecklist from "@/components/DueDiligenceChecklist";
import ComparableMultiples from "@/components/ComparableMultiples";
import Header from "@/components/Header";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1 min-w-0 flex flex-col">
                <Header />
                <main className="flex-1 p-6 overflow-x-hidden">
                  <div className="container mx-auto max-w-7xl">
                    <Routes>
                      <Route path="/" element={<ExecutiveDashboard />} />
                      <Route path="/valuation" element={<ValuationCalculator />} />
                      <Route path="/analytics" element={<PredictiveAnalytics />} />
                      <Route path="/reports" element={<ReportGenerator />} />
                      <Route path="/collaboration" element={<CollaborationHub />} />
                      <Route path="/integrations/financial" element={<FinancialDataIntegrator />} />
                      <Route path="/integrations/importer" element={<DataImporter />} />
                      <Route path="/integrations/alerts" element={<AlertSystem />} />
                      <Route path="/integrations/zapier" element={<ZapierIntegration />} />
                      <Route path="/advanced/due-diligence" element={<DueDiligenceChecklist />} />
                      <Route path="/advanced/multiples" element={<ComparableMultiples />} />
                      <Route path="/settings" element={<AdvancedSettings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
