import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout";
import { RouteLoading } from "@/components/RouteLoading";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

// Critical routes - load immediately
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy load all other routes
const ExecutiveDashboard = lazy(() => import("@/components/ExecutiveDashboard"));
const ValuationList = lazy(() => import("@/components/valuation/ValuationList").then(m => ({ default: m.ValuationList })));
const ValuationEditor = lazy(() => import("@/components/valuation/ValuationEditor").then(m => ({ default: m.ValuationEditor })));
// NOTA: Generador de reportes oculto temporalmente para fase futura
// const ReportGenerator = lazy(() => import("@/components/ReportGenerator"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const DocumentTemplates = lazy(() => import("./pages/DocumentTemplates"));
const FeeCalculator = lazy(() => import("./pages/FeeCalculator"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const AdvancedSettings = lazy(() => import("@/components/AdvancedSettings"));
const MyReferredLeads = lazy(() => import("./pages/MyReferredLeads"));
const ClientLanding = lazy(() => import("./pages/ClientLanding"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Admin routes - separate chunk
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("./pages/admin/UserManagement"));
const TemplateManagement = lazy(() => import("./pages/admin/TemplateManagement"));
const SecurityDashboard = lazy(() => import("./pages/admin/SecurityDashboard"));
const SellBusinessLeads = lazy(() => import("./pages/admin/SellBusinessLeads"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AlertSettings = lazy(() => import("./pages/admin/AlertSettings"));
const FunnelAnalytics = lazy(() => import("./pages/admin/FunnelAnalytics"));
const CommissionSettings = lazy(() => import("./pages/admin/CommissionSettings"));
const OrganizationManagement = lazy(() => import("./pages/admin/OrganizationManagement"));
const SectorMultiplesManagement = lazy(() => import("./pages/admin/SectorMultiplesManagement"));
const AdvisorCollaborations = lazy(() => import("./pages/admin/AdvisorCollaborations"));

const queryClient = new QueryClient();

// Wrapper component for lazy routes
const LazyRoute = ({ component: Component }: { component: React.ComponentType }) => (
  <Suspense fallback={<RouteLoading />}>
    <Component />
  </Suspense>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <EmailVerificationBanner />
            <Routes>
              {/* Public routes - no lazy loading */}
              <Route path="/" element={<Landing />} />
              <Route path="/terms" element={<LazyRoute component={TermsAndConditions} />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/invite" element={<LazyRoute component={AcceptInvitation} />} />
              
              {/* Auth routes - no lazy loading for better UX */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected routes - lazy loaded */}
              <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<LazyRoute component={ExecutiveDashboard} />} />
                <Route path="/valuations" element={<LazyRoute component={ValuationList} />} />
                <Route path="/valuation/:id" element={<LazyRoute component={ValuationEditor} />} />
                  {/* NOTA: Generador de reportes oculto temporalmente para fase futura */}
                  {/* <Route path="/reports" element={<LazyRoute component={ReportGenerator} />} /> */}
                  <Route path="/security" element={<LazyRoute component={SecuritySettings} />} />
                  <Route path="/settings" element={<LazyRoute component={AdvancedSettings} />} />
                  <Route path="/resources/templates" element={<LazyRoute component={DocumentTemplates} />} />
                  <Route path="/resources/fee-calculator" element={<LazyRoute component={FeeCalculator} />} />
                  
                  {/* Admin routes - separate chunk */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<LazyRoute component={AdminDashboard} />} />
                    <Route path="/admin/users" element={<LazyRoute component={AdminUsersPage} />} />
                    <Route path="/admin/templates" element={<LazyRoute component={TemplateManagement} />} />
                    <Route path="/admin/security" element={<LazyRoute component={SecurityDashboard} />} />
                    <Route path="/admin/audit-logs" element={<LazyRoute component={AuditLogs} />} />
                    <Route path="/admin/alert-settings" element={<LazyRoute component={AlertSettings} />} />
                    <Route path="/admin/sell-leads" element={<LazyRoute component={SellBusinessLeads} />} />
                    <Route path="/admin/funnel-analytics" element={<LazyRoute component={FunnelAnalytics} />} />
                    <Route path="/admin/commissions" element={<LazyRoute component={CommissionSettings} />} />
                    <Route path="/admin/organizations" element={<LazyRoute component={OrganizationManagement} />} />
                    <Route path="/admin/sector-multiples" element={<LazyRoute component={SectorMultiplesManagement} />} />
                    <Route path="/admin/advisor-collaborations" element={<LazyRoute component={AdvisorCollaborations} />} />
                  </Route>
                  
                  <Route path="/my-referrals" element={<LazyRoute component={MyReferredLeads} />} />
                </Route>
              </Route>
              
              {/* Public landing page */}
              <Route path="/sell-your-business" element={<LazyRoute component={ClientLanding} />} />
              
              {/* Email verification page */}
              <Route path="/verify-email" element={<LazyRoute component={VerifyEmail} />} />

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
