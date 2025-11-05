import { useEffect, useState } from "react";

import { api } from "@/api/client";

type Session = {
  token: string;
  userId: string;
  role: string;
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  };
};

type HealthState = {
  status?: string;
  version?: string;
  error?: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [health, setHealth] = useState<HealthState>({});
  const [loading, setLoading] = useState(false);
  const [salesCount, setSalesCount] = useState<number | null>(null);
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [bonusCount, setBonusCount] = useState<number | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [healthResponse, versionResponse] = await Promise.all([
          api.getHealth(),
          api.getVersion(),
        ]);
        setHealth({ status: healthResponse.status, version: versionResponse.version });
      } catch (error) {
        setHealth({ error: (error as Error).message });
      }
    };

    loadMeta();
  }, []);

  const authenticate = async () => {
    const telegram = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    if (!telegram?.initData) {
      setHealth((current) => ({ ...current, error: "initData не найден. Откройте приложение в Telegram." }));
      return;
    }

    setLoading(true);
    try {
      const response = await api.authenticate(telegram.initData);
      setSession(response);
      setHealth((current) => ({ ...current, error: undefined }));
    } catch (error) {
      setHealth((current) => ({ ...current, error: (error as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const [salesResponse, inventoryResponse, bonusResponse] = await Promise.all([
        api.listSales(),
        api.listInventory(),
        api.listBonuses(),
      ]);
      setSalesCount(salesResponse.sales.length);
      setInventoryCount(inventoryResponse.inventory.length);
      setBonusCount(bonusResponse.bonuses.length);
    } catch (error) {
      setHealth((current) => ({ ...current, error: (error as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "24px", maxWidth: 640, margin: "0 auto" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>OPPO Mini App</h1>
        <p style={{ margin: 0 }}>
          Статус API: <strong>{health.status ?? "—"}</strong> | Версия: <strong>{health.version ?? "—"}</strong>
        </p>
        {health.error && (
          <p style={{ color: "#b91c1c" }}>Ошибка: {health.error}</p>
        )}
      </header>

      {!session ? (
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Вход через Telegram</h2>
          <p style={{ marginBottom: "1rem" }}>
            Авторизация выполняется через initData Mini App. Откройте приложение внутри Telegram и нажмите кнопку
            ниже.
          </p>
          <button
            onClick={authenticate}
            disabled={loading}
            style={{
              padding: "12px 20px",
              backgroundColor: "#10b981",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Авторизация..." : "Войти"}
          </button>
        </section>
      ) : (
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Добро пожаловать</h2>
          <p style={{ margin: 0 }}>
            Пользователь: <strong>{session.profile.firstName ?? session.profile.username ?? session.userId}</strong>
          </p>
          <p style={{ margin: "0.5rem 0 0" }}>
            Роль: <strong>{session.role}</strong>
          </p>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Сводки</h2>
        <p style={{ marginBottom: "1rem" }}>Запросите агрегированные данные по продажам, остаткам и бонусам.</p>
        <button
          onClick={loadSummaries}
          disabled={loading}
          style={{
            padding: "12px 20px",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Загрузка..." : "Обновить"}
        </button>

        <ul style={{ marginTop: "1.5rem", lineHeight: 1.6 }}>
          <li>Продажи: <strong>{salesCount ?? "—"}</strong></li>
          <li>Остатки: <strong>{inventoryCount ?? "—"}</strong></li>
          <li>Бонусы: <strong>{bonusCount ?? "—"}</strong></li>
        </ul>
      </section>
    </main>
  );
}
