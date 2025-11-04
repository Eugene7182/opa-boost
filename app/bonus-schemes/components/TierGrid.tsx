import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { listTiers, deleteTier } from "../actions";
import { formatCurrency } from "@/lib/format/currency";
import { Button } from "@/components/ui/button";

export function TierGrid() {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: tiers, isLoading, refetch } = useQuery({
    queryKey: ["tiers"],
    queryFn: () => listTiers()
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить коридор? Это действие нельзя отменить.')) return;
    try {
      setIsDeleting(id);
      await deleteTier(id);
      refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Ошибка при удалении');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сеть</TableHead>
              <TableHead>От (%)</TableHead>
              <TableHead>До (%)</TableHead>
              <TableHead>Бонус (₸)</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Загрузка...</TableCell>
              </TableRow>
            ) : tiers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Нет данных</TableCell>
              </TableRow>
            ) : (
              tiers?.map((tier: any) => (
                <TableRow key={tier.id}>
                  <TableCell>{tier.networks?.name}</TableCell>
                  <TableCell>{tier.min_percent}%</TableCell>
                  <TableCell>{tier.max_percent !== null ? `${tier.max_percent}%` : '∞'}</TableCell>
                  <TableCell>{formatCurrency(tier.bonus_amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { /* edit handled in parent page */ }}>
                        Изменить
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(tier.id)} disabled={isDeleting === tier.id}>
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
