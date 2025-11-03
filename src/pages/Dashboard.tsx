import { useAuth } from '@/contexts/AuthContext';
import { MobileNav } from '@/components/MobileNav';
import { OfflineSync } from '@/components/OfflineSync';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import DashboardPromoter from './dashboards/DashboardPromoter';
import DashboardRegion from './dashboards/DashboardRegion';
import DashboardOrg from './dashboards/DashboardOrg';

export default function Dashboard() {
  const { userRole, signOut } = useAuth();

  const renderDashboard = () => {
    switch (userRole) {
      case 'promoter':
        return <DashboardPromoter />;
      case 'supervisor':
        return <DashboardRegion />;
      case 'office':
      case 'admin':
        return <DashboardOrg />;
      default:
        return (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Роль не определена</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold">OPPO Dashboard</h1>
            <p className="text-sm opacity-90">{userRole || 'Пользователь'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-hover">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        <OfflineSync />
      </header>

      <main>
        {renderDashboard()}
      </main>

      <PWAInstallPrompt />
      <MobileNav />
    </div>
  );
}
