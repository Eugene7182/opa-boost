import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLanguage('ru')}
          className={language === 'ru' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇷🇺</span>
          Русский
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('kk')}
          className={language === 'kk' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇰🇿</span>
          Қазақша
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}