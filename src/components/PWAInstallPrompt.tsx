import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(iOS);

    // Check last shown timestamp
    const lastShown = localStorage.getItem('install_prompt_last_shown');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    if (lastShown && parseInt(lastShown) > sevenDaysAgo) {
      return; // Don't show if shown in last 7 days
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Android PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS - show after 3 seconds
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
    
    localStorage.setItem('install_prompt_last_shown', Date.now().toString());
    setShowPrompt(false);
  };

  const handleClose = () => {
    localStorage.setItem('install_prompt_last_shown', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 p-4 shadow-lg animate-in slide-in-from-bottom-5 z-50 bg-card border-border">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Download className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Установить OPPO</h3>
          
          {isIOS ? (
            <div className="text-xs text-muted-foreground space-y-2">
              <p>Для установки на iPhone:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Нажмите <Share className="w-3 h-3 inline" /> (Поделиться)</li>
                <li>Выберите "Добавить на экран Домой"</li>
              </ol>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-3">
              Добавьте приложение на главный экран для быстрого доступа
            </p>
          )}
          
          {!isIOS && deferredPrompt && (
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="w-full mt-2"
            >
              Установить
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
