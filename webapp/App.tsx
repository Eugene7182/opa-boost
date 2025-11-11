import { useEffect, useState } from "react";
import { ready, initData } from "./telegram";
import { api, setAuthToken, API } from "./api";

// Читаем сохранённый access-токен из sessionStorage/localStorage, чтобы извлечь роль из JWT.
function getToken(): string | null {
  try {
    return (
      JSON.parse(sessionStorage.lastAuth || localStorage.lastAuth || "{}")
        .token || localStorage.getItem("token")
    );
  } catch {
    return localStorage.getItem("token");
  }
}

// Достаём роль из payload JWT; при ошибке возвращаем null, чтобы отработал дефолт.
function getRoleFromJWT(token?: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.role as string | undefined) || null;
  } catch {
    return null;
  }
}

type Region = { id: number; name: string };
type Store = { id: number; name: string };
type SKU = { id: number; code: string; name: string };
type AuthInfo = { ok: boolean; token?: string; error?: string };

export default function App() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [sku, setSku] = useState<SKU[]>([]);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("unknown");

  const apiBase = (API ?? "").replace(/\/$/, "");
  const storageKey = "opa-auth-token";

  useEffect(() => {
    ready();

    const ensureAuth = async () => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setAuthToken(stored);
        setAuthTokenState(stored);
      }

      const data = initData();
      if (!data) return;

      try {
        const response = await fetch(`${apiBase}/api/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ initData: data })
        });
        const auth: AuthInfo = await response.json();
        if (auth?.ok && auth.token) {
          localStorage.setItem(storageKey, auth.token);
          setAuthToken(auth.token);
          setAuthTokenState(auth.token);
          setAuthError(null);
        } else {
          setAuthError(auth?.error || "Auth failed");
        }
      } catch (error) {
        console.error("Failed to authorize via Telegram initData", error);
        setAuthError("Auth failed");
      }
    };

    ensureAuth();

    Promise.all([
      api.get("/api/refs/regions"),
      api.get("/api/refs/stores"),
      api.get("/api/refs/sku")
    ]).then(([r, s, k]) => {
      setRegions(r);
      setStores(s);
      setSku(k);
    });
  }, []);

  useEffect(() => {
    if (!authToken) return;
    api
      .get("/api/me")
      .then((resp) => {
        if (resp?.ok) {
          setUser(resp.user);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch profile", error);
      });
  }, [authToken]);

  useEffect(() => {
    const applyRole = (token: string | null) => {
      const tokenRole = getRoleFromJWT(token);
      if (tokenRole) {
        setRole(tokenRole.toLowerCase());
      } else {
        setRole("promoter");
      }
    };

    // Принудительно обновляем токен из бэка, чтобы Telegram WebView увидел свежую роль.
    fetch("/api/auth/telegram")
      .then((response) => response.json())
      .then((data) => {
        if (data?.token) {
          sessionStorage.lastAuth = JSON.stringify({ token: data.token });
          applyRole(data.token);
          return;
        }

        applyRole(getToken());
      })
      .catch((error) => {
        console.error("Failed to refresh auth token", error);
        applyRole(getToken());
      });
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>OPA Mini App ✔</h2>
      {authToken ? (
        <p>Authenticated as: {role}</p>
      ) : (
        <p style={{ color: "crimson" }}>
          {!authError ? "Awaiting Telegram authorization…" : `Auth error: ${authError}`}
        </p>
      )}
      <p>
        Regions: {regions.length} | Stores: {stores.length} | SKU: {sku.length}
      </p>
      <p>Это минимальный запуск. Продажи и остатки доступны по API.</p>
    </div>
  );
}
