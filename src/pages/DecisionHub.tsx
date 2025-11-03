import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Sparkles,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  status: 'new' | 'in-progress' | 'completed';
}

export default function DecisionHub() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'opportunity',
      priority: 'high',
      title: 'Рост спроса в Южном регионе',
      description: 'Продажи в Южном регионе выросли на 34% за последний месяц. Рекомендуется увеличить складские запасы и добавить 2 промоутеров.',
      impact: '+15% к выручке региона',
      status: 'new'
    },
    {
      id: '2',
      type: 'risk',
      priority: 'high',
      title: 'Снижение продаж в Западном регионе',
      description: 'Падение продаж на 18% за последние 2 недели. Активность конкурентов увеличилась. Требуется срочный анализ и корректировка стратегии.',
      impact: '-12% к выручке региона',
      status: 'new'
    },
    {
      id: '3',
      type: 'action',
      priority: 'medium',
      title: 'Оптимизация ассортимента',
      description: '5 SKU имеют низкую оборачиваемость и занимают складские площади. Рекомендуется пересмотр ассортиментной матрицы.',
      impact: 'Освобождение 12% склада',
      status: 'in-progress'
    }
  ]);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
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
            content: `Проанализируй текущую ситуацию с продажами и дай 3-5 конкретных рекомендаций.
            Формат ответа: для каждой рекомендации укажи тип (возможность/риск/действие), приоритет (высокий/средний/низкий), заголовок, описание и потенциальный эффект.`
          }],
          type: 'decisions'
        }),
      });

      if (!resp.ok) {
        throw new Error('Ошибка анализа');
      }

      toast({
        title: 'Анализ завершён',
        description: 'Получены новые рекомендации',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить анализ',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'action': return <Target className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Sparkles className="h-4 w-4 text-primary" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-warning" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return null;
    }
  };

  const filterByType = (type: string) => {
    if (type === 'all') return insights;
    return insights.filter(i => i.type === type);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Decision Hub</h1>
            <p className="text-sm text-muted-foreground">AI-аналитика и рекомендации</p>
          </div>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Анализ...' : 'Обновить'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Возможности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <div className="text-2xl font-bold">{insights.filter(i => i.type === 'opportunity').length}</div>
                  <div className="text-xs text-muted-foreground">для роста</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Риски</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <div className="text-2xl font-bold">{insights.filter(i => i.type === 'risk').length}</div>
                  <div className="text-xs text-muted-foreground">требуют внимания</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{insights.filter(i => i.type === 'action').length}</div>
                  <div className="text-xs text-muted-foreground">к выполнению</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="opportunity">Возможности</TabsTrigger>
            <TabsTrigger value="risk">Риски</TabsTrigger>
            <TabsTrigger value="action">Действия</TabsTrigger>
          </TabsList>

          {['all', 'opportunity', 'risk', 'action'].map(tab => (
            <TabsContent key={tab} value={tab}>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-4">
                  {filterByType(tab).map(insight => (
                    <Card key={insight.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(insight.type)}
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(insight.status)}
                            <Badge variant={getPriorityColor(insight.priority)}>
                              {insight.priority === 'high' ? 'Высокий' : insight.priority === 'medium' ? 'Средний' : 'Низкий'}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>{insight.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Потенциальный эффект:</span>
                            <span className="ml-2 font-semibold">{insight.impact}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            Подробнее
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
