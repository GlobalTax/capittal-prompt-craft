import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";
import { ValuationList } from "@/components/valuation/ValuationList";
import { ValuationEditor } from "@/components/valuation/ValuationEditor";
import ReportGenerator from "@/components/ReportGenerator";
import CollaborationHub from "@/components/CollaborationHub";
import AdvancedSettings from "@/components/AdvancedSettings";
import FinancialDataIntegrator from "@/components/FinancialDataIntegrator";
import DataImporter from "@/components/DataImporter";
import AlertSystem from "@/components/AlertSystem";
import ZapierIntegration from "@/components/ZapierIntegration";
import DueDiligenceChecklist from "@/components/DueDiligenceChecklist";
import ComparableMultiples from "@/components/ComparableMultiples";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<ProtectedLayout />}>
                  <Route index element={<ExecutiveDashboard />} />
                  <Route path="valuation" element={<ValuationList />} />
                  <Route path="valuation/:id" element={<ValuationEditor />} />
                  <Route path="reports" element={<ReportGenerator />} />
                  <Route path="collaboration" element={<CollaborationHub />} />
                  <Route path="integrations/financial" element={<FinancialDataIntegrator />} />
                  <Route path="integrations/importer" element={<DataImporter />} />
                  <Route path="integrations/alerts" element={<AlertSystem />} />
                  <Route path="integrations/zapier" element={<ZapierIntegration />} />
                  <Route path="advanced/due-diligence" element={<DueDiligenceChecklist />} />
                  <Route path="advanced/multiples" element={<ComparableMultiples />} />
                  <Route path="settings" element={<AdvancedSettings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
