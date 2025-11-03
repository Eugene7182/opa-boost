import { 
  Home, 
  TrendingUp, 
  History, 
  BarChart3, 
  Package, 
  Gift, 
  Target,
  Building2,
  Users,
  GraduationCap,
  MessageSquare,
  Tag,
  Calculator,
  Users2,
  Map,
  CheckSquare,
  Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = {
  path: string;
  icon: typeof Home;
  label: string;
  roles: string[];
};

export const MobileNav = () => {
  const location = useLocation();
  const { userRole } = useAuth();

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: Home, label: 'Главная', roles: ['admin', 'office', 'supervisor', 'trainer', 'promoter'] },
    { path: '/sales/quick', icon: TrendingUp, label: 'Продажа', roles: ['promoter'] },
    { path: '/sales/history', icon: History, label: 'История', roles: ['admin', 'office', 'supervisor', 'promoter'] },
    { path: '/analytics', icon: BarChart3, label: 'Аналитика', roles: ['admin', 'office', 'supervisor'] },
    { path: '/products', icon: Package, label: 'Продукты', roles: ['admin', 'office'] },
    { path: '/retail-prices', icon: Tag, label: 'Прайс-книга', roles: ['admin', 'office'] },
    { path: '/kef', icon: Calculator, label: 'КЭФ', roles: ['admin', 'office'] },
    { path: '/bonus', icon: Gift, label: 'Бонусы', roles: ['admin', 'office'] },
    { path: '/motivations', icon: Target, label: 'Мотивации', roles: ['admin', 'office'] },
    { path: '/competitors', icon: Users2, label: 'Конкуренты', roles: ['admin', 'office', 'supervisor'] },
    { path: '/map', icon: Map, label: 'Карта', roles: ['admin', 'office', 'supervisor'] },
    { path: '/tasks', icon: CheckSquare, label: 'Задачи', roles: ['admin', 'office', 'supervisor', 'promoter'] },
    { path: '/meetings', icon: Calendar, label: 'Собрания', roles: ['admin', 'office', 'supervisor', 'trainer'] },
    { path: '/chat', icon: MessageSquare, label: 'Чат', roles: ['admin', 'office', 'supervisor', 'promoter'] },
    { path: '/office/structure', icon: Building2, label: 'Структура', roles: ['admin', 'office'] },
    { path: '/supervisor/requests', icon: Users, label: 'Заявки', roles: ['supervisor'] },
    { path: '/training/materials', icon: GraduationCap, label: 'Обучение', roles: ['admin', 'office', 'trainer'] },
  ];

  const visibleItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  // Показываем не более 5 элементов в нижней навигации
  const displayItems = visibleItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {displayItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                isActive 
                  ? 'text-primary scale-105' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
