import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";
import { ValuationList } from "@/components/valuation/ValuationList";
import { ValuationEditor } from "@/components/valuation/ValuationEditor";
import ReportGenerator from "@/components/ReportGenerator";
import AdvancedSettings from "@/components/AdvancedSettings";
import MonthlyBudget from "@/components/MonthlyBudget";
import ComparableMultiples from "@/components/ComparableMultiples";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import DocumentTemplates from "./pages/DocumentTemplates";
import SellBusinessContact from "./pages/SellBusinessContact";
import FeeCalculator from "./pages/FeeCalculator";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/UserManagement";
import TemplateManagement from "./pages/admin/TemplateManagement";
import SecuritySettings from "./pages/SecuritySettings";
import SecurityDashboard from "./pages/admin/SecurityDashboard";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/invite" element={<AcceptInvitation />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<ExecutiveDashboard />} />
                  <Route path="valuations/advisor" element={<ValuationList filterType="own_business" />} />
                  <Route path="valuations/clients" element={<ValuationList filterType="client_business" />} />
                  <Route path="valuation/:id" element={<ValuationEditor />} />
                  <Route path="reports" element={<ReportGenerator />} />
                  <Route path="advanced/budget" element={<MonthlyBudget />} />
                  <Route path="advanced/multiples" element={<ComparableMultiples />} />
                  <Route path="settings" element={<AdvancedSettings />} />
                  <Route path="security" element={<SecuritySettings />} />
                  <Route path="resources/templates" element={<DocumentTemplates />} />
                  <Route path="resources/sell-business" element={<SellBusinessContact />} />
                  <Route path="resources/fee-calculator" element={<FeeCalculator />} />
                  
                  {/* Admin routes */}
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="admin/users" element={<AdminUsersPage />} />
                  <Route path="admin/templates" element={<TemplateManagement />} />
                  <Route path="admin/security-dashboard" element={<SecurityDashboard />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
