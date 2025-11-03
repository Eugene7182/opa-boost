import { supabase } from '@/integrations/supabase/client';
import { getPendingSales, markSaleAsSynced } from '@/lib/offline';

export const syncOfflineSales = async () => {
  const pendingSales = await getPendingSales();
  
  if (pendingSales.length === 0) {
    return { success: true, synced: 0 };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const sale of pendingSales) {
    try {
      const { error } = await supabase.from('sales').insert({
        promoter_id: sale.promoter_id,
        product_id: sale.product_id,
        product_variant_id: sale.product_variant_id,
        quantity: sale.quantity,
        total_amount: sale.total_amount,
        bonus_amount: sale.bonus_amount,
        bonus_extra: sale.bonus_extra,
        uuid_client: sale.uuid_client,
        created_at: sale.created_at,
      });

      if (error) throw error;

      await markSaleAsSynced(sale.id);
      syncedCount++;
    } catch (error: any) {
      errors.push(`Sale ${sale.id}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    synced: syncedCount,
    errors,
  };
};
