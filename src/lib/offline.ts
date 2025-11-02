import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineSale {
  id: string;
  promoter_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  bonus_amount: number;
  bonus_extra: number;
  uuid_client: string;
  created_at: string;
}

interface OPADatabase extends DBSchema {
  sales: {
    key: string;
    value: OfflineSale;
    indexes: { 'by-uuid': string };
  };
}

let dbPromise: Promise<IDBPDatabase<OPADatabase>> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<OPADatabase>('opa-offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sales', { keyPath: 'id' });
        store.createIndex('by-uuid', 'uuid_client');
      },
    });
  }
  return dbPromise;
};

export const saveOfflineSale = async (sale: OfflineSale) => {
  const db = await initDB();
  await db.add('sales', sale);
};

export const getOfflineSales = async () => {
  const db = await initDB();
  return db.getAll('sales');
};

export const deleteOfflineSale = async (id: string) => {
  const db = await initDB();
  await db.delete('sales', id);
};

export const isOnline = () => navigator.onLine;
