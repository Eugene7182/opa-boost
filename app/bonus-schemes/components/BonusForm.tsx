import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createBonus, updateBonus } from "../actions";
import { createServerClient } from "@/lib/supabase/server";

interface BonusFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function BonusForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: BonusFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [networks, setNetworks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [form, setForm] = useState({
    network_id: "",
    product_id: "",
    product_variant_id: "",
    base_bonus: "",
    active: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        network_id: initialData.network_id,
        product_id: initialData.product_variants.products.id,
        product_variant_id: initialData.product_variant_id,
        base_bonus: initialData.base_bonus.toString(),
        active: initialData.active,
      });
    }
  }, [initialData]);

  useEffect(() => {
    loadNetworks();
    loadProducts();
  }, []);

  useEffect(() => {
    if (form.product_id) {
      loadVariants(form.product_id);
    }
  }, [form.product_id]);

  const loadNetworks = async () => {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("networks")
      .select("id, name")
      .eq("active", true)
      .order("name");
    if (data) setNetworks(data);
  };

  const loadProducts = async () => {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("products")
      .select("id, name")
      .eq("active", true)
      .order("name");
    if (data) setProducts(data);
  };

  const loadVariants = async (productId: string) => {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("product_variants")
      .select("id, memory_gb")
      .eq("product_id", productId)
      .eq("active", true)
      .order("memory_gb");
    if (data) setVariants(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        network_id: form.network_id,
        product_variant_id: form.product_variant_id,
        base_bonus: parseFloat(form.base_bonus),
        active: form.active,
      };

      if (initialData) {
        await updateBonus(initialData.id, payload);
        toast({ title: "Бонус обновлен" });
      } else {
        await createBonus(payload);
        toast({ title: "Бонус создан" });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Редактировать" : "Добавить"} бонус
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Сеть</Label>
            <Select
              value={form.network_id}
              onValueChange={(value) =>
                setForm({ ...form, network_id: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите сеть" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Модель</Label>
            <Select
              value={form.product_id}
              onValueChange={(value) =>
                setForm({ ...form, product_id: value, product_variant_id: "" })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.product_id && (
            <div className="space-y-2">
              <Label>Память (GB)</Label>
              <Select
                value={form.product_variant_id}
                onValueChange={(value) =>
                  setForm({ ...form, product_variant_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите объем памяти" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.memory_gb} GB
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Базовый бонус (₸)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              required
              value={form.base_bonus}
              onChange={(e) =>
                setForm({ ...form, base_bonus: e.target.value })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={form.active}
              onCheckedChange={(checked) =>
                setForm({ ...form, active: checked })
              }
            />
            <Label>Активен</Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Сохранение..."
              : initialData
              ? "Сохранить"
              : "Добавить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}