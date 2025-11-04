import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { bulkUpsertBonuses } from "../actions";
import { createServerClient } from "@/lib/supabase/server";

interface BonusCsvImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BonusCsvImport({
  open,
  onOpenChange,
  onSuccess,
}: BonusCsvImportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  const parseCSV = async (content: string) => {
    const lines = content.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",");

    if (!headers.includes("network_code") || 
        !headers.includes("product_name") || 
        !headers.includes("memory_gb") || 
        !headers.includes("base_bonus")) {
      throw new Error("Неверный формат CSV. Требуются столбцы: network_code, product_name, memory_gb, base_bonus");
    }

    const supabase = createServerClient();
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim()]));

      // Получаем network_id по коду
      const { data: network } = await supabase
        .from("networks")
        .select("id")
        .eq("code", row.network_code)
        .single();

      if (!network) {
        throw new Error(`Сеть с кодом ${row.network_code} не найдена`);
      }

      // Получаем product_variant_id
      const { data: variant } = await supabase
        .from("product_variants")
        .select("id")
        .eq("memory_gb", parseInt(row.memory_gb))
        .eq("products.name", row.product_name)
        .single();

      if (!variant) {
        throw new Error(
          `Вариант ${row.product_name} ${row.memory_gb}GB не найден`
        );
      }

      result.push({
        network_id: network.id,
        product_variant_id: variant.id,
        base_bonus: parseFloat(row.base_bonus),
        active: row.active === "false" ? false : true,
      });
    }

    return result;
  };

  const handleParse = async () => {
    try {
      const parsed = await parseCSV(csvContent);
      setPreview(parsed);
    } catch (error: any) {
      toast({
        title: "Ошибка парсинга",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!preview.length) return;

    setLoading(true);
    try {
      await bulkUpsertBonuses(preview);
      toast({
        title: "Импорт завершен",
        description: `Обработано ${preview.length} строк`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Ошибка импорта",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Импорт бонусов из CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Вставьте содержимое CSV файла или скопированные данные из Excel:
            </p>
            <Textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="network_code,product_name,memory_gb,base_bonus,active
MECHTA,A5 Pro,256,4000,true"
              rows={10}
            />
          </div>

          {csvContent && (
            <Button onClick={handleParse} disabled={loading}>
              Предпросмотр
            </Button>
          )}

          {preview.length > 0 && (
            <>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Предпросмотр ({preview.length} строк):
                </h3>
                <pre className="text-xs overflow-auto max-h-[200px]">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>

              <Button onClick={handleImport} disabled={loading}>
                {loading ? "Импорт..." : "Импортировать"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}