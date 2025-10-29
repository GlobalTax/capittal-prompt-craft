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
const ReportGenerator = lazy(() => import("@/components/ReportGenerator"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const DocumentTemplates = lazy(() => import("./pages/DocumentTemplates"));
const FeeCalculator = lazy(() => import("./pages/FeeCalculator"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const MyCollaborationRequests = lazy(() => import("./pages/MyCollaborationRequests"));
const ClientLanding = lazy(() => import("./pages/ClientLanding"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));

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
                  <Route path="/reports" element={<LazyRoute component={ReportGenerator} />} />
                  <Route path="/security" element={<LazyRoute component={SecuritySettings} />} />
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
                  </Route>
                  
                  <Route path="/my-referrals" element={<LazyRoute component={MyCollaborationRequests} />} />
                </Route>
              </Route>
              
              {/* Public landing page */}
              <Route path="/sell-your-business" element={<LazyRoute component={ClientLanding} />} />

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
