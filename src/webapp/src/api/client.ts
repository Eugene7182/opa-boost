export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ??
  `${window.location.origin}/api/v1`;

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<{ status: string }>("/health"),
  getVersion: () => request<{ version: string }>("/version"),
  authenticate: (initData: string) =>
    request<{
      token: string;
      userId: string;
      role: string;
      profile: { firstName?: string | null; lastName?: string | null; username?: string | null };
    }>("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData }),
    }),
  listSales: () => request<{ sales: unknown[] }>("/sales"),
  listInventory: () => request<{ inventory: unknown[] }>("/inventory"),
  listBonuses: () => request<{ bonuses: unknown[] }>("/bonuses"),
};
