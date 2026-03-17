/**
 * ThemeColorSync
 *
 * Keeps the <meta name="theme-color"> in sync with the active theme so the
 * Android/Chrome status bar and iOS Safari top bar match the app background.
 *
 * Dark  → #0c0a08  (--color-background in dark theme)
 * Light → #eceae6  (--color-background in light theme)
 *
 * Drop <ThemeColorSync /> anywhere inside the React tree (App.jsx is ideal).
 * It renders nothing — purely a side-effect component.
 */
import { useEffect } from 'react';

const DARK_BG  = '#0c0a08';
const LIGHT_BG = '#eceae6';

export default function ThemeColorSync() {
  useEffect(() => {
    function sync() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const color   = isLight ? LIGHT_BG : DARK_BG;

      // Standard theme-color (Android Chrome, Samsung Internet, etc.)
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = color;

      // Also update the apple status bar meta so iOS Safari tints correctly.
      // 'black-translucent' lets content bleed under the bar;
      // the theme-color then tints it.
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleMeta) {
        appleMeta.content = 'black-translucent';
      }
    }

    // Run once on mount
    sync();

    // Watch for theme attribute changes on <html>
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}