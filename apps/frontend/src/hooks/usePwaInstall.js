import { useCallback, useEffect, useState } from 'react';

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator?.standalone === true;
}

export function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(isStandaloneDisplay);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setDismissed(false);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return;

    const event = installEvent;
    setInstallEvent(null);
    await event.prompt();
    await event.userChoice.catch(() => undefined);
  }, [installEvent]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    canInstall: Boolean(installEvent) && !dismissed && !installed && !isStandaloneDisplay(),
    promptInstall,
    dismissInstall,
  };
}
