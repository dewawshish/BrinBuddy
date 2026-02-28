import React, { useEffect, useRef, useImperativeHandle } from 'react';

/**
 * Type definitions for Cloudflare Turnstile
 */

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
}

type TurnstileWidgetId = string;

interface TurnstileAPI {
  render: (
    el: HTMLElement,
    opts: TurnstileRenderOptions
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove?: (widgetId: TurnstileWidgetId) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

/**
 * Public handle exposed to callers via `ref`.
 */
export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileProps {
  /**
   * Site key for the Cloudflare Turnstile widget.
   * If omitted the value from VITE_TURNSTILE_SITE_KEY will be used.
   */
  siteKey?: string;
  onVerify: (token: string) => void;
}

const Turnstile = React.forwardRef<TurnstileHandle, TurnstileProps>(
  ({ siteKey, onVerify }, ref) => {
    const widgetRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<TurnstileWidgetId | null>(null);

    // expose imperative methods
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      // resolve site key (prop takes precedence)
      const rawKey = siteKey ?? (import.meta.env.VITE_TURNSTILE_SITE_KEY as string);
      const resolvedKey = typeof rawKey === 'string' ? rawKey.trim() : '';

      if (!resolvedKey) {
        console.warn(
          '[Turnstile] missing or invalid site key, widget will not initialize',
          rawKey,
        );
        return; // nothing to do without a key
      }

      // dynamically add script if necessary
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
        // only attempt to render when the global and element are ready and we haven't already
        if (window.turnstile && widgetRef.current && !widgetIdRef.current) {
          const id = window.turnstile.render(widgetRef.current, {
            sitekey: resolvedKey,
            callback: (token: string) => onVerify(token),
            'error-callback': () => onVerify(''),
            'expired-callback': () => onVerify(''),
          });
          widgetIdRef.current = id;
          clearInterval(interval);
        }
      }, 100);

      return () => {
        clearInterval(interval);
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
        }
      };
    }, [siteKey, onVerify]);

    return <div ref={widgetRef} className="cf-turnstile" />;
  },
);

// name helps with debugging and React warnings
Turnstile.displayName = 'Turnstile';

export default Turnstile;
