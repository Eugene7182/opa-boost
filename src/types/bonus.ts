export interface Network {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetworkPromoter {
  id: string;
  network_id: string;
  promoter_id: string;
  active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BonusScheme {
  id: string;
  name: string;
  network_id: string;
  product_id: string;
  bonus_percent: number;
  min_quantity: number;
  active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}