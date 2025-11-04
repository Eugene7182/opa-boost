-- Insert default networks
INSERT INTO public.networks (name, description, active)
VALUES 
  ('Сеть А', 'Премиум сеть магазинов', true),
  ('Сеть Б', 'Стандартная розничная сеть', true),
  ('Сеть В', 'Дисконт сеть', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample bonus schemes for each network
WITH networks_data AS (
  SELECT id, name FROM public.networks
)
INSERT INTO public.bonus_schemes (
  name,
  network_id,
  product_id,
  bonus_percent,
  min_quantity,
  active,
  start_date
)
SELECT
  'Базовый бонус - ' || n.name,
  n.id,
  p.id,
  -- Разные проценты для разных сетей
  CASE 
    WHEN n.name = 'Сеть А' THEN 10.0
    WHEN n.name = 'Сеть Б' THEN 8.0
    ELSE 6.0
  END as bonus_percent,
  1,
  true,
  NOW()
FROM networks_data n
CROSS JOIN (
  SELECT id FROM public.products WHERE active = true LIMIT 1
) p
ON CONFLICT DO NOTHING;

-- Insert performance tiers for each network
WITH networks_data AS (
  SELECT id, name FROM public.networks
)
INSERT INTO public.plan_bonus_tiers (
  network_id,
  min_percent,
  max_percent,
  bonus_amount
)
SELECT
  n.id,
  tier.min_percent,
  tier.max_percent,
  -- Разные бонусы для разных сетей и уровней
  CASE 
    WHEN n.name = 'Сеть А' THEN tier.base_bonus * 1.2
    WHEN n.name = 'Сеть Б' THEN tier.base_bonus
    ELSE tier.base_bonus * 0.8
  END as bonus_amount
FROM networks_data n
CROSS JOIN (
  VALUES 
    (100, 110, 5000),  -- 100-110% выполнения плана
    (110, 120, 10000), -- 110-120% выполнения плана
    (120, NULL, 15000) -- 120%+ выполнения плана
) as tier(min_percent, max_percent, base_bonus)
ON CONFLICT DO NOTHING;