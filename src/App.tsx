import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QuickSale from "./pages/QuickSale";
import SalesHistory from "./pages/SalesHistory";
import Analytics from "./pages/Analytics";
import Products from "./pages/Products";
import BonusSchemes from "./pages/BonusSchemes";
import Motivations from "./pages/Motivations";
import RetailPrices from "./pages/RetailPrices";
import KefSchemes from "./pages/KefSchemes";
import Inventories from "./pages/Inventories";
import MapView from "./pages/MapView";
import Chat from "./pages/Chat";
import Tasks from "./pages/Tasks";
import Training from "./pages/Training";
import Users from "./pages/Users";
import OrgStructure from "./pages/OrgStructure";
import Profile from "./pages/Profile";
import AIAssistant from "./pages/AIAssistant";
import DecisionHub from "./pages/DecisionHub";
import Simulator from "./pages/Simulator";
import Notifications from "./pages/Notifications";
import FocusCampaigns from "./pages/FocusCampaigns";
import Networks from "./pages/Networks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Promoter only */}
            <Route
              path="/sales/quick"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['promoter']}>
                    <QuickSale />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            
            {/* Multiple roles */}
            <Route
              path="/sales/history"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor', 'promoter']}>
                    <SalesHistory />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor']}>
                    <Analytics />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            
            {/* Admin and Office only */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <Products />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bonus"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <BonusSchemes />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/motivations"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <Motivations />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/retail-prices"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <RetailPrices />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kef"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <KefSchemes />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventories"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor', 'promoter']}>
                    <Inventories />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor']}>
                    <MapView />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor', 'promoter']}>
                    <Chat />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor', 'promoter']}>
                    <Tasks />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/training"
              element={
                <ProtectedRoute>
                  <Training />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <Users />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/org-structure"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <OrgStructure />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/decision-hub"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor']}>
                    <DecisionHub />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulator"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'supervisor']}>
                    <Simulator />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/focus-campaigns"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office', 'promoter']}>
                    <FocusCampaigns />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/networks"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'office']}>
                    <Networks />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
