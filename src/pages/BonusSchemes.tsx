import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import { z } from 'zod';
import { formatCurrency } from '@/lib/formatters';

const bonusSchema = z.object({
  network_id: z.string().uuid(),
  product_variant_id: z.string().uuid(),
  base_bonus: z.number().min(0, 'Бонус не может быть отрицательным').max(1000000, 'Максимум 1,000,000'),
});

const tierSchema = z.object({
  network_id: z.string().uuid(),
  min_percent: z.number().min(0).max(500),
  max_percent: z.number().min(0).max(500).nullable(),
  bonus_amount: z.number().min(0).max(10000000),
});

interface NetworkBonus {
  id: string;
  network_id: string;
  product_variant_id: string;
  base_bonus: number;
  networks: { name: string };
  product_variants: { memory_gb: number; storage_gb: number; products: { name: string } };
}

interface PlanTier {
  id: string;
  network_id: string;
  min_percent: number;
  max_percent: number | null;
  bonus_amount: number;
  networks: { name: string };
}

export default function BonusSchemes() {
  const { toast } = useToast();
  const [bonuses, setBonuses] = useState<NetworkBonus[]>([]);
  const [tiers, setTiers] = useState<PlanTier[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [bonusForm, setBonusForm] = useState({ network_id: '', product_id: '', product_variant_id: '', base_bonus: '' });
  const [tierForm, setTierForm] = useState({ network_id: '', min_percent: '', max_percent: '', bonus_amount: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bonusForm.product_id) {
      loadVariants(bonusForm.product_id);
    }
  }, [bonusForm.product_id]);

  const loadData = async () => {
    const { data: bonusData } = await supabase
      .from('network_product_bonuses')
      .select('*, networks(name), product_variants(memory_gb, storage_gb, products(name))')
      .eq('active', true)
      .order('networks(name)');

    const { data: tierData } = await supabase
      .from('plan_bonus_tiers')
      .select('*, networks(name)')
      .order('networks(name), min_percent');

    const { data: networkData } = await supabase.from('networks').select('*').eq('active', true).order('name');
    const { data: productData } = await supabase.from('products').select('*').eq('active', true).order('name');

    if (bonusData) setBonuses(bonusData as any);
    if (tierData) setTiers(tierData as any);
    if (networkData) setNetworks(networkData);
    if (productData) setProducts(productData);
  };

  const loadVariants = async (productId: string) => {
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('active', true)
      .order('memory_gb, storage_gb');
    
    if (data) setVariants(data);
  };

  const handleBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = bonusSchema.safeParse({
      network_id: bonusForm.network_id,
      product_variant_id: bonusForm.product_variant_id,
      base_bonus: parseFloat(bonusForm.base_bonus),
    });

    if (!validation.success) {
      toast({
        title: 'Ошибка валидации',
        description: validation.error.errors.map(e => e.message).join(', '),
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('network_product_bonuses')
      .upsert([{
        network_id: bonusForm.network_id,
        product_variant_id: bonusForm.product_variant_id,
        base_bonus: parseFloat(bonusForm.base_bonus),
      }], { onConflict: 'network_id,product_variant_id' });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Бонус сохранён' });
    setBonusDialogOpen(false);
    setBonusForm({ network_id: '', product_id: '', product_variant_id: '', base_bonus: '' });
    loadData();
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = tierSchema.safeParse({
      network_id: tierForm.network_id,
      min_percent: parseFloat(tierForm.min_percent),
      max_percent: tierForm.max_percent ? parseFloat(tierForm.max_percent) : null,
      bonus_amount: parseFloat(tierForm.bonus_amount),
    });

    if (!validation.success) {
      toast({
        title: 'Ошибка валидации',
        description: validation.error.errors.map(e => e.message).join(', '),
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('plan_bonus_tiers')
      .insert([{
        network_id: tierForm.network_id,
        min_percent: parseFloat(tierForm.min_percent),
        max_percent: tierForm.max_percent ? parseFloat(tierForm.max_percent) : null,
        bonus_amount: parseFloat(tierForm.bonus_amount),
      }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Коридор создан' });
    setTierDialogOpen(false);
    setTierForm({ network_id: '', min_percent: '', max_percent: '', bonus_amount: '' });
    loadData();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <BackButton to="/dashboard" />
          <h1 className="text-xl font-bold">Бонусные схемы</h1>
        </div>
      </header>

      <main className="p-4">
        <Tabs defaultValue="base" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="base">Базовые бонусы</TabsTrigger>
            <TabsTrigger value="tiers">Перевыполнение</TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="space-y-4 mt-4">
            <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => setBonusForm({ network_id: '', product_id: '', product_variant_id: '', base_bonus: '' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить бонус
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить базовый бонус</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBonusSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Сеть</Label>
                    <Select value={bonusForm.network_id} onValueChange={(v) => setBonusForm({ ...bonusForm, network_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Выберите сеть" /></SelectTrigger>
                      <SelectContent>{networks.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Продукт</Label>
                    <Select value={bonusForm.product_id} onValueChange={(v) => setBonusForm({ ...bonusForm, product_id: v, product_variant_id: '' })}>
                      <SelectTrigger><SelectValue placeholder="Выберите продукт" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {bonusForm.product_id && variants.length > 0 && (
                    <div className="space-y-2">
                      <Label>Вариант</Label>
                      <Select value={bonusForm.product_variant_id} onValueChange={(v) => setBonusForm({ ...bonusForm, product_variant_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Выберите вариант" /></SelectTrigger>
                        <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{v.memory_gb}GB / {v.storage_gb}GB</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Базовый бонус (₸)</Label>
                    <Input
                      type="number"
                      value={bonusForm.base_bonus}
                      onChange={(e) => setBonusForm({ ...bonusForm, base_bonus: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <Button type="submit" className="w-full">Сохранить</Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {bonuses.map((bonus) => (
                <Card key={bonus.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{(bonus.product_variants as any).products.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {bonus.product_variants.memory_gb}GB / {bonus.product_variants.storage_gb}GB
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{bonus.networks.name}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(bonus.base_bonus)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-4 mt-4">
            <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => setTierForm({ network_id: '', min_percent: '', max_percent: '', bonus_amount: '' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить коридор
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить коридор перевыполнения</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTierSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Сеть</Label>
                    <Select value={tierForm.network_id} onValueChange={(v) => setTierForm({ ...tierForm, network_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Выберите сеть" /></SelectTrigger>
                      <SelectContent>{networks.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>От (%, включительно)</Label>
                    <Input
                      type="number"
                      value={tierForm.min_percent}
                      onChange={(e) => setTierForm({ ...tierForm, min_percent: e.target.value })}
                      required
                      min="0"
                      max="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>До (%, включительно, пусто = без лимита)</Label>
                    <Input
                      type="number"
                      value={tierForm.max_percent}
                      onChange={(e) => setTierForm({ ...tierForm, max_percent: e.target.value })}
                      min="0"
                      max="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Бонус (₸)</Label>
                    <Input
                      type="number"
                      value={tierForm.bonus_amount}
                      onChange={(e) => setTierForm({ ...tierForm, bonus_amount: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <Button type="submit" className="w-full">Создать</Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {tiers.map((tier) => (
                <Card key={tier.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{tier.networks.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tier.min_percent}% - {tier.max_percent !== null ? `${tier.max_percent}%` : '∞'}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(tier.bonus_amount)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />
    </div>
  );
}
