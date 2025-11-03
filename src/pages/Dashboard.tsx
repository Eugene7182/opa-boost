import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileNav } from '@/components/MobileNav';
import { OfflineSync } from '@/components/OfflineSync';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';

// Lazy load dashboard components for code-splitting
const DashboardPromoter = lazy(() => import('./dashboards/DashboardPromoter'));
const DashboardSupervisor = lazy(() => import('./dashboards/DashboardSupervisor'));
const DashboardOffice = lazy(() => import('./dashboards/DashboardOffice'));
const DashboardTrainer = lazy(() => import('./dashboards/DashboardTrainer'));

export default function Dashboard() {
  const { userRole, signOut } = useAuth();
  const { t } = useLanguage();

  const renderDashboard = () => {
    const LoadingFallback = () => (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );

    switch (userRole) {
      case 'promoter':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPromoter />
          </Suspense>
        );
      case 'supervisor':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardSupervisor />
          </Suspense>
        );
      case 'trainer':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardTrainer />
          </Suspense>
        );
      case 'office':
      case 'admin':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardOffice />
          </Suspense>
        );
      default:
        return (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">{t('dashboard.roleUndefined')}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-sm opacity-90">{userRole ? t(`role.${userRole}`) : t('dashboard.roleUndefined')}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary/90">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
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
