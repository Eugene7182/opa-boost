import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'en' | 'kk';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ru: {
    'app.title': 'OPPO',
    'nav.dashboard': 'Дашборд',
    'nav.analytics': 'Аналитика',
    'nav.sales': 'Продажи',
    'nav.stock': 'Остатки',
    'nav.training': 'Обучение',
    'nav.tasks': 'Задачи',
    'nav.products': 'Продукты',
    'nav.bonus': 'Бонусы',
    'nav.motivations': 'Мотивации',
    'nav.focus': 'Фокусы',
    'nav.settings': 'Настройки',
    'nav.profile': 'Профиль',
    'nav.users': 'Пользователи',
    'nav.orgStructure': 'Оргструктура',
    'nav.kefSchemes': 'KEF схемы',
    'nav.retailPrices': 'Розничные цены',
    'nav.inventories': 'Запасы',
    'nav.chat': 'Чат',
    'role.promoter': 'Промоутер',
    'role.supervisor': 'Супервайзер',
    'role.office': 'Офис',
    'role.admin': 'Админ',
    'role.trainer': 'Тренер',
    'filters.period': 'Период',
    'filters.network': 'Сеть',
    'filters.store': 'Магазин',
    'filters.product': 'Модель',
    'filters.variant': 'Память',
    'kpi.bonus': 'Мой бонус',
    'kpi.salesQty': 'Продажи (шт)',
    'kpi.salesAmt': 'Сумма продаж',
    'kpi.plan': 'План',
    'kpi.progress': 'Прогресс',
    'kpi.projection': 'Проекция',
    'stock.update': 'Обновить остатки',
    'stock.confirmNoChanges': 'Подтвердить без изменений',
    'sync.offline': 'Синхронизация офлайн',
    'actions.save': 'Сохранить',
    'actions.edit': 'Редактировать',
    'actions.delete': 'Удалить',
    'actions.add': 'Добавить',
    'actions.cancel': 'Отмена',
    'actions.back': 'Назад',
    'actions.logout': 'Выход',
    'confirm.delete': 'Подтвердите удаление',
    'reminder.stocksNeeded': 'Требуется обновить остатки',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',
    'theme.system': 'Системная',
    'currency': '₸',
  },
  en: {
    'app.title': 'OPPO',
    'nav.dashboard': 'Dashboard',
    'nav.analytics': 'Analytics',
    'nav.sales': 'Sales',
    'nav.stock': 'Stock',
    'nav.training': 'Training',
    'nav.tasks': 'Tasks',
    'nav.products': 'Products',
    'nav.bonus': 'Bonuses',
    'nav.motivations': 'Motivations',
    'nav.focus': 'Focus',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.users': 'Users',
    'nav.orgStructure': 'Org Structure',
    'nav.kefSchemes': 'KEF Schemes',
    'nav.retailPrices': 'Retail Prices',
    'nav.inventories': 'Inventories',
    'nav.chat': 'Chat',
    'role.promoter': 'Promoter',
    'role.supervisor': 'Supervisor',
    'role.office': 'Office',
    'role.admin': 'Admin',
    'role.trainer': 'Trainer',
    'filters.period': 'Period',
    'filters.network': 'Network',
    'filters.store': 'Store',
    'filters.product': 'Model',
    'filters.variant': 'Memory',
    'kpi.bonus': 'My Bonus',
    'kpi.salesQty': 'Sales (pcs)',
    'kpi.salesAmt': 'Sales Amount',
    'kpi.plan': 'Plan',
    'kpi.progress': 'Progress',
    'kpi.projection': 'Projection',
    'stock.update': 'Update Stock',
    'stock.confirmNoChanges': 'Confirm Without Changes',
    'sync.offline': 'Offline Sync',
    'actions.save': 'Save',
    'actions.edit': 'Edit',
    'actions.delete': 'Delete',
    'actions.add': 'Add',
    'actions.cancel': 'Cancel',
    'actions.back': 'Back',
    'actions.logout': 'Logout',
    'confirm.delete': 'Confirm Deletion',
    'reminder.stocksNeeded': 'Stock update required',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'currency': '₸',
  },
  kk: {
    'app.title': 'OPPO',
    'nav.dashboard': 'Бас бет',
    'nav.analytics': 'Талдау',
    'nav.sales': 'Сату',
    'nav.stock': 'Қорлар',
    'nav.training': 'Оқыту',
    'nav.tasks': 'Тапсырмалар',
    'nav.products': 'Өнімдер',
    'nav.bonus': 'Бонустар',
    'nav.motivations': 'Мотивациялар',
    'nav.focus': 'Фокустар',
    'nav.settings': 'Баптаулар',
    'nav.profile': 'Профиль',
    'nav.users': 'Пайдаланушылар',
    'nav.orgStructure': 'Ұйым құрылымы',
    'nav.kefSchemes': 'KEF схемалары',
    'nav.retailPrices': 'Бөлшек бағалар',
    'nav.inventories': 'Қорлар',
    'nav.chat': 'Чат',
    'role.promoter': 'Промоутер',
    'role.supervisor': 'Супервайзер',
    'role.office': 'Офис',
    'role.admin': 'Әкімші',
    'role.trainer': 'Тренер',
    'filters.period': 'Кезең',
    'filters.network': 'Желі',
    'filters.store': 'Дүкен',
    'filters.product': 'Модель',
    'filters.variant': 'Жад',
    'kpi.bonus': 'Менің бонусым',
    'kpi.salesQty': 'Сату (дана)',
    'kpi.salesAmt': 'Сату сомасы',
    'kpi.plan': 'Жоспар',
    'kpi.progress': 'Үдеріс',
    'kpi.projection': 'Болжам',
    'stock.update': 'Қорларды жаңарту',
    'stock.confirmNoChanges': 'Өзгертусіз растау',
    'sync.offline': 'Офлайн синхрондау',
    'actions.save': 'Сақтау',
    'actions.edit': 'Өңдеу',
    'actions.delete': 'Жою',
    'actions.add': 'Қосу',
    'actions.cancel': 'Болдырмау',
    'actions.back': 'Артқа',
    'actions.logout': 'Шығу',
    'confirm.delete': 'Жоюды растаңыз',
    'reminder.stocksNeeded': 'Қорларды жаңарту қажет',
    'theme.light': 'Жарық',
    'theme.dark': 'Қараңғы',
    'theme.system': 'Жүйелік',
    'currency': '₸',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('oppo-language');
    if (saved && ['ru', 'en', 'kk'].includes(saved)) {
      return saved as Language;
    }
    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('kk')) return 'kk';
    if (browserLang.startsWith('en')) return 'en';
    return 'ru'; // Default
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('oppo-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};