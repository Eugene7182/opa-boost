import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Sale {
  id: string;
  quantity: number;
  total_amount: number;
  bonus_amount: number;
  bonus_extra: number;
  created_at: string;
  products: {
    name: string;
    category: string;
  };
}

export default function SalesHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, [user]);

  const loadSales = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('sales')
      .select(`
        *,
        products (name, category)
      `)
      .eq('promoter_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSales(data as Sale[]);
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">История продаж</h1>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Загрузка...</p>
        ) : sales.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Нет продаж</p>
        ) : (
          sales.map((sale) => (
            <Card key={sale.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{sale.products.name}</h3>
                  <p className="text-sm text-muted-foreground">{sale.products.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{Number(sale.total_amount).toFixed(2)} ₽</p>
                  <p className="text-sm text-success">
                    +{(Number(sale.bonus_amount) + Number(sale.bonus_extra)).toFixed(2)} ₽
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Количество: {sale.quantity}</span>
                <span>{formatDate(sale.created_at)}</span>
              </div>
            </Card>
          ))
        )}
      </main>

      <MobileNav />
    </div>
  );
}
