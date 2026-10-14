import { useEffect } from "react";

/**
 * Gives the page its own browser-tab title while it is on screen, and puts
 * the previous one back on the way out. With client-side routing nothing
 * else changes the title, and screen readers rely on it to know where they are.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Pebble Math`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
