import { openDB, IDBPDatabase } from 'idb';

export interface OfflineSale {
  id: string;
  promoter_id: string;
  product_id: string;
  product_variant_id?: string;
  quantity: number;
  total_amount: number;
  bonus_amount: number;
  bonus_extra: number;
  uuid_client: string;
  created_at: string;
  synced?: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB('oppo-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_sales')) {
          const store = db.createObjectStore('pending_sales', { keyPath: 'id' });
          store.createIndex('by-uuid', 'uuid_client', { unique: true });
          store.createIndex('by-synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
};

export const saveOfflineSale = async (sale: OfflineSale) => {
  const db = await initDB();
  const saleWithSync = { ...sale, synced: false };
  
  try {
    // Check if already exists
    const existing = await db.getFromIndex('pending_sales', 'by-uuid', sale.uuid_client);
    if (existing) {
      return; // Prevent duplicates
    }
    
    await db.add('pending_sales', saleWithSync);
  } catch (error) {
    console.error('Error saving offline sale:', error);
  }
};

export const getOfflineSales = async (): Promise<OfflineSale[]> => {
  const db = await initDB();
  return db.getAll('pending_sales');
};

export const getPendingSales = async (): Promise<OfflineSale[]> => {
  const db = await initDB();
  const all = await db.getAll('pending_sales');
  return all.filter((sale: OfflineSale) => !sale.synced);
};

export const markSaleAsSynced = async (id: string) => {
  const db = await initDB();
  const sale = await db.get('pending_sales', id) as OfflineSale | undefined;
  if (sale) {
    sale.synced = true;
    await db.put('pending_sales', sale);
  }
};

export const deleteOfflineSale = async (id: string) => {
  const db = await initDB();
  await db.delete('pending_sales', id);
};

export const isOnline = () => navigator.onLine;
