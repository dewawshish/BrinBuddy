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
  /**
   * Site key for the Cloudflare Turnstile widget.  If omitted the
   * value from `import.meta.env.VITE_TURNSTILE_SITE_KEY` will be used.
   */
  siteKey?: string;
  onVerify: (token: string) => void;
}

const Turnstile = React.forwardRef<HTMLDivElement, TurnstileProps>(
  ({ siteKey, onVerify }, forwardedRef) => {
    const widgetRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // if a parent passed a ref, mirror it to our div as well
    useEffect(() => {
      if (forwardedRef) {
        if (typeof forwardedRef === 'function') {
          forwardedRef(widgetRef.current);
        } else if (forwardedRef) {
          // @ts-ignore - forwardedRef is React.RefObject
          forwardedRef.current = widgetRef.current;
        }
      }
    }, [forwardedRef]);

  useEffect(() => {
    // resolve site key: prop overrides env, otherwise fall back
    const rawKey = siteKey ?? import.meta.env.VITE_TURNSTILE_SITE_KEY;
    const resolvedKey = typeof rawKey === 'string' ? rawKey.trim() : '';

    if (!resolvedKey) {
      console.warn(
        '[Turnstile] missing or invalid site key, widget will not initialize',
        rawKey,
      );
      return; // abort effect, don't even load script
    }

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
        const id = window.turnstile.render(widgetRef.current, {
          sitekey: resolvedKey,
          callback: (token: string) => {
            onVerify(token);
          },
          'error-callback': () => onVerify(''),
          'expired-callback': () => onVerify(''),
        });
        widgetIdRef.current = id;
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [siteKey, onVerify]);

  return <div ref={widgetRef} className="cf-turnstile" />;
  }
);

// name helps with debugging and React warnings
Turnstile.displayName = 'Turnstile';

export default Turnstile;
