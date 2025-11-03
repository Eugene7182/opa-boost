import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/ui/card';

interface Store {
  id: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

interface CompetitorTracking {
  store_id: string;
  presence_type: string;
  competitors: { name: string } | null;
}

export default function MapView() {
  const [stores, setStores] = useState<Store[]>([]);
  const [tracking, setTracking] = useState<CompetitorTracking[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name, city, latitude, longitude')
      .eq('active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    const { data: trackingData } = await supabase
      .from('competitor_tracking')
      .select('store_id, presence_type, competitors(name)');

    if (storesData) setStores(storesData);
    if (trackingData) setTracking(trackingData);
  };

  const getStoreCompetitors = (storeId: string) => {
    return tracking.filter(t => t.store_id === storeId);
  };

  const getMapOption = () => {
    // Kazakhstan approximate center coordinates
    const kazakhstanCenter = [66.9237, 48.0196];

    const storeData = stores.map(store => {
      const competitors = getStoreCompetitors(store.id);
      const hasActiveCompetitors = competitors.some(c => c.presence_type === 'active');
      
      return {
        name: store.name,
        value: [store.longitude, store.latitude],
        itemStyle: {
          color: hasActiveCompetitors ? '#ef4444' : '#22c55e',
        },
        store: store,
        competitors: competitors,
      };
    });

    return {
      title: {
        text: 'Карта магазинов Казахстана',
        left: 'center',
        top: 10,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data.store) {
            const store = params.data.store;
            const competitors = params.data.competitors;
            let html = `<strong>${store.name}</strong><br/>${store.city}<br/>`;
            if (competitors.length > 0) {
              html += `<br/><strong>Конкуренты:</strong><br/>`;
              competitors.forEach((c: any) => {
                html += `- ${c.competitors?.name || 'Unknown'} (${c.presence_type})<br/>`;
              });
            } else {
              html += '<br/>Нет конкурентов';
            }
            return html;
          }
          return params.name;
        },
      },
      geo: {
        map: 'custom',
        roam: true,
        center: kazakhstanCenter,
        zoom: 1.2,
        itemStyle: {
          areaColor: '#f3f4f6',
          borderColor: '#d1d5db',
        },
        emphasis: {
          itemStyle: {
            areaColor: '#e5e7eb',
          },
        },
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: storeData,
          symbolSize: 15,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              formatter: '{b}',
              position: 'top',
            },
          },
        },
      ],
    };
  };

  // Register a simplified Kazakhstan map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const echarts = require('echarts');
      
      // Simplified Kazakhstan GeoJSON outline
      const kazakhstanGeoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Kazakhstan' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [46.5, 42], [55, 41], [62, 42.5], [69, 41.5], [75, 42], [80, 43],
                [85, 44], [87, 45.5], [87, 49], [85, 51], [83, 53], [80, 54],
                [75, 54], [70, 55.5], [65, 55], [58, 54], [53, 53], [49, 52],
                [47, 50], [46, 47], [46.5, 42]
              ]],
            },
          },
        ],
      };

      echarts.registerMap('custom', kazakhstanGeoJson);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <BackButton to="/dashboard" />
          <h1 className="text-xl font-bold">Карта Казахстана</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <Card className="p-3 bg-info/10 border-info">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Легенда:</p>
              <div className="flex gap-4 mt-1">
                <span><span className="inline-block w-3 h-3 rounded-full bg-success mr-1"></span>Без конкурентов</span>
                <span><span className="inline-block w-3 h-3 rounded-full bg-destructive mr-1"></span>Есть конкуренты</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <ReactECharts
            option={getMapOption()}
            style={{ height: '500px', width: '100%' }}
            onEvents={{
              click: (params: any) => {
                if (params.data?.store) {
                  setSelectedStore(params.data.store);
                }
              },
            }}
          />
        </Card>

        {selectedStore && (
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-2">{selectedStore.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{selectedStore.city}</p>
            
            <div className="space-y-2">
              <p className="font-semibold text-sm">Конкуренты в этом магазине:</p>
              {getStoreCompetitors(selectedStore.id).length > 0 ? (
                getStoreCompetitors(selectedStore.id).map((track, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-t">
                    <span className="text-sm">{track.competitors?.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      track.presence_type === 'active' 
                        ? 'bg-destructive/10 text-destructive' 
                        : track.presence_type === 'occasional'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted'
                    }`}>
                      {track.presence_type === 'active' ? 'Активный' : 
                       track.presence_type === 'occasional' ? 'Периодически' : 'Неактивный'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Нет данных о конкурентах</p>
              )}
            </div>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
