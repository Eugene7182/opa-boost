import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Target, Plus, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  title: string;
  product_id: string;
  products: { name: string };
  start_date: string;
  end_date: string;
  goal_qty: number;
  goal_amount: number;
  current_qty: number;
  current_amount: number;
  variant_required: boolean;
}

export default function FocusCampaigns() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    product_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    goal_qty: '',
    goal_amount: '',
    variant_required: false,
  });

  const canManage = ['admin', 'office'].includes(userRole || '');

  useEffect(() => {
    if (user) {
      loadCampaigns();
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    setProducts(data || []);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data: campaignsData } = await supabase
        .from('focus_campaigns')
        .select(`
          *,
          products(name)
        `)
        .order('start_date', { ascending: false });

      if (campaignsData) {
        const enriched = await Promise.all(
          campaignsData.map(async (campaign) => {
            const { data: sales } = await supabase
              .from('sales')
              .select('quantity, total_amount')
              .eq('product_id', campaign.product_id)
              .gte('created_at', campaign.start_date)
              .lte('created_at', campaign.end_date);

            const current_qty = sales?.reduce((sum, s) => sum + s.quantity, 0) || 0;
            const current_amount = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

            return { ...campaign, current_qty, current_amount };
          })
        );

        setCampaigns(enriched);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: t('error.title'),
        description: t('campaigns.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('focus_campaigns').insert({
        title: formData.title,
        product_id: formData.product_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        goal_qty: parseInt(formData.goal_qty) || null,
        goal_amount: parseFloat(formData.goal_amount) || null,
        variant_required: formData.variant_required,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: t('campaigns.created'),
        description: t('campaigns.createdSuccess'),
      });

      setDialogOpen(false);
      setFormData({
        title: '',
        product_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        goal_qty: '',
        goal_amount: '',
        variant_required: false,
      });
      loadCampaigns();
    } catch (error: any) {
      toast({
        title: t('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          <h1 className="text-2xl font-bold">{t('campaigns.title')}</h1>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('campaigns.create')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('campaigns.create')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t('campaigns.title')}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('campaigns.product')}</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(v) => setFormData({ ...formData, product_id: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('campaigns.startDate')}</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t('campaigns.endDate')}</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('campaigns.goalQty')}</Label>
                    <Input
                      type="number"
                      value={formData.goal_qty}
                      onChange={(e) => setFormData({ ...formData, goal_qty: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('campaigns.goalAmount')}</Label>
                    <Input
                      type="number"
                      value={formData.goal_amount}
                      onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {t('campaigns.create')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('campaigns.noCampaigns')}</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign);
            const qtyProgress = campaign.goal_qty
              ? (campaign.current_qty / campaign.goal_qty) * 100
              : 0;
            const amountProgress = campaign.goal_amount
              ? (campaign.current_amount / campaign.goal_amount) * 100
              : 0;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{campaign.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(campaign.products as any)?.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        status === 'active'
                          ? 'default'
                          : status === 'upcoming'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {t(`campaigns.status.${status}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(campaign.start_date), 'dd.MM.yyyy')} -{' '}
                    {format(new Date(campaign.end_date), 'dd.MM.yyyy')}
                  </div>

                  {campaign.goal_qty && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t('campaigns.quantity')}</span>
                        <span className="font-semibold">
                          {formatNumber(campaign.current_qty)} / {formatNumber(campaign.goal_qty)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(qtyProgress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPercent(qtyProgress / 100, 0)}
                      </p>
                    </div>
                  )}

                  {campaign.goal_amount && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t('campaigns.amount')}</span>
                        <span className="font-semibold">
                          {formatCurrency(campaign.current_amount)} /{' '}
                          {formatCurrency(campaign.goal_amount)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${Math.min(amountProgress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPercent(amountProgress / 100, 0)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
