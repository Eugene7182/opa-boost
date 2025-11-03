import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function DashboardTrainer() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [promoters, setPromoters] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadTrainerData();
  }, [user]);

  useEffect(() => {
    if (selectedRegion) {
      loadPromoters();
    }
  }, [selectedRegion]);

  const loadTrainerData = async () => {
    setLoading(true);
    try {
      // Загружаем профиль тренера для получения его регионов
      const { data: profile } = await supabase
        .from('profiles')
        .select('trainer_region_ids')
        .eq('id', user?.id)
        .single();

      if (profile?.trainer_region_ids) {
        const { data: regionsData } = await supabase
          .from('regions')
          .select('*')
          .in('id', profile.trainer_region_ids)
          .eq('active', true);
        setRegions(regionsData || []);
      }

      // Загружаем тесты тренера
      const { data: testsData } = await supabase
        .from('tests')
        .select('*, test_assignments(status, user_id)')
        .eq('created_by', user?.id);
      setTests(testsData || []);

      // Загружаем материалы тренера
      const { data: materialsData } = await supabase
        .from('training_materials_new')
        .select('*')
        .eq('created_by', user?.id);
      setMaterials(materialsData || []);

    } catch (error) {
      console.error('Error loading trainer data:', error);
      toast({
        title: t('error.title'),
        description: t('error.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPromoters = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*, user_roles!inner(role)')
        .eq('user_roles.role', 'promoter');

      if (selectedRegion !== 'all') {
        query = query.eq('region_id', selectedRegion);
      }

      const { data } = await query;
      setPromoters(data || []);
    } catch (error) {
      console.error('Error loading promoters:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Фильтр регионов */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.selectRegion')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder={t('dashboard.region')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.allRegions')}</SelectItem>
              {regions.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('trainer.promoters')}</p>
                <p className="text-2xl font-bold">{promoters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('trainer.tests')}</p>
                <p className="text-2xl font-bold">{tests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('trainer.materials')}</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список промоутеров */}
      {promoters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('trainer.promotersList')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {promoters.map(promoter => (
              <div key={promoter.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{promoter.full_name}</p>
                  <p className="text-sm text-muted-foreground">{promoter.phone || t('common.noPhone')}</p>
                </div>
                <Badge variant="outline">{t('role.promoter')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Активные тесты */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('trainer.activeTests')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tests.map(test => {
              const assignments = (test as any).test_assignments || [];
              const completed = assignments.filter((a: any) => a.status === 'completed').length;
              const total = assignments.length;

              return (
                <div key={test.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{test.title}</p>
                      {test.description && (
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                      )}
                    </div>
                  </div>
                  {total > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span>{completed}</span>
                      </div>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{total}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
