import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'office' | 'supervisor' | 'trainer' | 'promoter';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleGuardProps) => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole as AppRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
