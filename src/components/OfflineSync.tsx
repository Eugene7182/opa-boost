import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPendingSales, markSaleAsSynced, isOnline } from '@/lib/offline';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineSync = () => {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  const checkPendingCount = async () => {
    const pending = await getPendingSales();
    setPendingCount(pending.length);
  };

  const syncPendingSales = async () => {
    if (!isOnline() || syncing) return;

    setSyncing(true);
    try {
      const pending = await getPendingSales();
      
      for (const sale of pending) {
        try {
          const { error } = await supabase.from('sales').insert({
            promoter_id: sale.promoter_id,
            product_id: sale.product_id,
            quantity: sale.quantity,
            total_amount: sale.total_amount,
            bonus_amount: sale.bonus_amount,
            bonus_extra: sale.bonus_extra,
            uuid_client: sale.uuid_client,
            created_at: sale.created_at,
          });

          if (!error) {
            await markSaleAsSynced(sale.id);
          }
        } catch (err) {
          console.error('Sync error for sale:', sale.id, err);
        }
      }

      await checkPendingCount();
      
      if (pending.length > 0) {
        toast({
          title: 'Синхронизация завершена',
          description: `Синхронизировано продаж: ${pending.length}`,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      syncPendingSales();
    };

    const handleOffline = () => {
      setOnline(false);
      toast({
        title: 'Нет соединения',
        description: 'Продажи будут сохранены локально',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingCount();

    // Sync every 30 seconds when online
    const syncInterval = setInterval(() => {
      if (isOnline()) {
        syncPendingSales();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {online ? (
        <div className="flex items-center gap-1 text-success">
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-medium">Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs font-medium">Offline</span>
        </div>
      )}
      
      {syncing && (
        <div className="flex items-center gap-1 text-primary">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">
            Syncing {pendingCount > 0 ? `${pendingCount}` : ''}
          </span>
        </div>
      )}
      
      {!syncing && pendingCount > 0 && (
        <span className="text-xs font-medium text-warning">
          {pendingCount} pending
        </span>
      )}
    </div>
  );
};
