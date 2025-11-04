import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BonusForm } from "./BonusForm";
import { BonusCsvImport } from "./BonusCsvImport";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileUp, FileDown, Search } from "lucide-react";
import { formatCurrency } from "@/lib/format/currency";
import { useQuery } from "@tanstack/react-query";
import { listBonuses } from "../actions";

interface BonusFilter {
  network_id?: string;
  product_id?: string;
  memory_gb?: number;
  search?: string;
}

export function BonusGrid() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<BonusFilter>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  const { data: bonuses, isLoading } = useQuery({
    queryKey: ["bonuses", filter],
    queryFn: () => listBonuses(filter)
  });

  const handleExportCsv = async () => {
    if (!bonuses) return;
    
    const csvContent = [
      "network_code,product_name,memory_gb,base_bonus,active",
      ...bonuses.map(b => 
        `${b.networks.code},${b.product_variants.products.name},${b.product_variants.memory_gb},${b.base_bonus},${b.active}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bonus_schemes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          value={filter.network_id}
          onValueChange={(value) => setFilter({ ...filter, network_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Все сети" />
          </SelectTrigger>
          <SelectContent>
            {/* Сети будут загружаться динамически */}
          </SelectContent>
        </Select>

        <Select
          value={filter.product_id}
          onValueChange={(value) => setFilter({ ...filter, product_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Все модели" />
          </SelectTrigger>
          <SelectContent>
            {/* Модели будут загружаться динамически */}
          </SelectContent>
        </Select>

        <Select
          value={filter.memory_gb?.toString()}
          onValueChange={(value) =>
            setFilter({ ...filter, memory_gb: value ? parseInt(value) : undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Вся память" />
          </SelectTrigger>
          <SelectContent>
            {/* Варианты памяти будут загружаться динамически */}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Поиск по модели/SKU"
            className="pl-9"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>
      </div>

      {/* Действия */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setIsFormOpen(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsImportOpen(true)}
          className="rounded-xl"
        >
          <FileUp className="w-4 h-4 mr-2" />
          Импорт CSV
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          className="rounded-xl"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Экспорт CSV
        </Button>
      </div>

      {/* Таблица */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сеть</TableHead>
              <TableHead>Модель</TableHead>
              <TableHead>Память (GB)</TableHead>
              <TableHead>Бонус (₸)</TableHead>
              <TableHead>Активен</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : bonuses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              bonuses?.map((bonus) => (
                <TableRow key={bonus.id}>
                  <TableCell>{bonus.networks.name}</TableCell>
                  <TableCell>{bonus.product_variants.products.name}</TableCell>
                  <TableCell>{bonus.product_variants.memory_gb}</TableCell>
                  <TableCell>{formatCurrency(bonus.base_bonus)}</TableCell>
                  <TableCell>{bonus.active ? "Да" : "Нет"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Редактирование
                        }}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          // Удаление
                        }}
                      >
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

      <BonusForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          // Обновить данные
        }}
      />

      <BonusCsvImport
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          setIsImportOpen(false);
          // Обновить данные
        }}
      />
    </div>
  );
}