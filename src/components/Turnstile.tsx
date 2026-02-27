import React, { useEffect, useRef } from 'react';

// Cloudflare injects a global `turnstile` object once the script loads.
// We declare it here so TypeScript doesn't complain when we access it.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, any>) => void;
      reset: (widgetId: any) => void;
    };
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

const Turnstile: React.FC<TurnstileProps> = ({ siteKey, onVerify }) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = 'cf-turnstile-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      document.body.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.turnstile && widgetRef.current) {
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onVerify(token);
          },
          'error-callback': () => onVerify(''),
          'expired-callback': () => onVerify(''),
        });
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [siteKey, onVerify]);

  return <div ref={widgetRef} className="cf-turnstile" />;
};

export default Turnstile;
