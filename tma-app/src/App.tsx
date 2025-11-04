import { useEffect, useState } from "react";
import { init, useMainButton, getUser, getInitDataRaw } from "./telegram";

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    init();
    setUser(getUser());
    const off = useMainButton("Войти", async () => {
      const res = await fetch("/api/auth/tma", {
        method: "POST",
        headers: {"Content-Type":"application/x-www-form-urlencoded"},
        body: `initData=${encodeURIComponent(getInitDataRaw())}`
      });
      const data = await res.json();
      alert(data?.status || "ok");
    });
    return () => { off && off(); };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Привет{user ? `, ${user.first_name}` : ""} 👋</h1>
      <p>Это Telegram Mini App. Цветовая схема: {window.Telegram?.WebApp?.colorScheme}</p>
    </div>
  );
}
