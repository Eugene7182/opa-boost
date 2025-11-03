import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Package,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimulationResult {
  scenario: string;
  salesChange: number;
  revenueChange: number;
  profitChange: number;
  marketShareChange: number;
  risks: string[];
  opportunities: string[];
}

export default function Simulator() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const { toast } = useToast();

  // Simulation parameters
  const [priceChange, setPriceChange] = useState([0]);
  const [promoIntensity, setPromoIntensity] = useState([50]);
  const [teamSize, setTeamSize] = useState([10]);
  const [newRegions, setNewRegions] = useState('');

  const runSimulation = async () => {
    setIsSimulating(true);
    
    try {
      const scenario = `
        Изменение цены: ${priceChange[0] > 0 ? '+' : ''}${priceChange[0]}%
        Интенсивность промо: ${promoIntensity[0]}%
        Размер команды: ${teamSize[0]} промоутеров
        Новые регионы: ${newRegions || 'нет'}
      `;

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [{
            role: 'user',
            content: `Проанализируй следующий бизнес-сценарий и предскажи результаты: ${scenario}
            
            Дай прогноз по:
            - Изменению продаж (в %)
            - Изменению выручки (в %)
            - Изменению прибыли (в %)
            - Изменению рыночной доли (в %)
            - Основные риски (3-5 пунктов)
            - Основные возможности (3-5 пунктов)
            
            Формат: конкретные числа и краткие пояснения.`
          }],
          type: 'simulation'
        }),
      });

      if (!resp.ok) {
        throw new Error('Ошибка симуляции');
      }

      // Mock result for demo
      const mockResult: SimulationResult = {
        scenario,
        salesChange: priceChange[0] * -2 + promoIntensity[0] * 0.3 + teamSize[0] * 0.5,
        revenueChange: priceChange[0] * 1.5 + promoIntensity[0] * 0.2,
        profitChange: priceChange[0] * 2 - promoIntensity[0] * 0.1,
        marketShareChange: promoIntensity[0] * 0.05 + teamSize[0] * 0.1,
        risks: [
          'Возможная негативная реакция на повышение цен',
          'Увеличение затрат на промо-активности',
          'Риск снижения маржинальности'
        ],
        opportunities: [
          'Рост узнаваемости бренда',
          'Увеличение лояльности клиентов',
          'Расширение присутствия на рынке'
        ]
      };

      setResults(mockResult);
      
      toast({
        title: 'Симуляция завершена',
        description: 'Результаты готовы для анализа',
      });
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить симуляцию',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setPriceChange([0]);
    setPromoIntensity([50]);
    setTeamSize([10]);
    setNewRegions('');
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">What-If Симулятор</h1>
          <p className="text-sm text-muted-foreground">Моделирование бизнес-сценариев</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Параметры симуляции</CardTitle>
                <CardDescription>Настройте условия сценария</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Изменение цены</Label>
                    <Badge variant="outline">{priceChange[0] > 0 ? '+' : ''}{priceChange[0]}%</Badge>
                  </div>
                  <Slider
                    value={priceChange}
                    onValueChange={setPriceChange}
                    min={-30}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-30%</span>
                    <span>0%</span>
                    <span>+30%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Интенсивность промо</Label>
                    <Badge variant="outline">{promoIntensity[0]}%</Badge>
                  </div>
                  <Slider
                    value={promoIntensity}
                    onValueChange={setPromoIntensity}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Минимум</span>
                    <span>Максимум</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Размер команды</Label>
                    <Badge variant="outline">{teamSize[0]} чел.</Badge>
                  </div>
                  <Slider
                    value={teamSize}
                    onValueChange={setTeamSize}
                    min={5}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regions">Новые регионы (опционально)</Label>
                  <Input
                    id="regions"
                    placeholder="Например: Сибирь, Дальний Восток"
                    value={newRegions}
                    onChange={(e) => setNewRegions(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={runSimulation} disabled={isSimulating} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    {isSimulating ? 'Симуляция...' : 'Запустить'}
                  </Button>
                  <Button onClick={resetSimulation} variant="outline">
                    Сбросить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {results ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Прогнозируемые результаты</CardTitle>
                    <CardDescription>На основе заданных параметров</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Package className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Продажи</div>
                          <div className="text-lg font-bold flex items-center gap-1">
                            {results.salesChange > 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                            {results.salesChange > 0 ? '+' : ''}{results.salesChange.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <DollarSign className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Выручка</div>
                          <div className="text-lg font-bold flex items-center gap-1">
                            {results.revenueChange > 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                            {results.revenueChange > 0 ? '+' : ''}{results.revenueChange.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Прибыль</div>
                          <div className="text-lg font-bold flex items-center gap-1">
                            {results.profitChange > 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                            {results.profitChange > 0 ? '+' : ''}{results.profitChange.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <MapPin className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Доля рынка</div>
                          <div className="text-lg font-bold flex items-center gap-1">
                            {results.marketShareChange > 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                            {results.marketShareChange > 0 ? '+' : ''}{results.marketShareChange.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Анализ сценария</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="risks">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="risks">Риски</TabsTrigger>
                        <TabsTrigger value="opportunities">Возможности</TabsTrigger>
                      </TabsList>
                      <TabsContent value="risks" className="space-y-2">
                        {results.risks.map((risk, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10">
                            <TrendingDown className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{risk}</span>
                          </div>
                        ))}
                      </TabsContent>
                      <TabsContent value="opportunities" className="space-y-2">
                        {results.opportunities.map((opp, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-success/10">
                            <TrendingUp className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{opp}</span>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Настройте параметры</h3>
                  <p className="text-sm text-muted-foreground">
                    Задайте условия сценария и запустите симуляцию
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
