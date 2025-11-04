declare global { interface Window { Telegram: any } }

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export const ready = () => {
  tg?.expand();
  tg?.ready();
};

export const getInitDataRaw = () => tg?.initData || "";
export const getUser = () => tg?.initDataUnsafe?.user || null;

export const useMainButton = (text: string, onClick: () => void) => {
  if (!tg) return () => {};
  const mb = tg.MainButton;
  mb.setText(text);
  mb.onClick(onClick);
  mb.show();
  return () => mb.offClick(onClick);
};
