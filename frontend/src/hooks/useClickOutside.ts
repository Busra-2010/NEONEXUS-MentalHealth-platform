import { useEffect, RefObject } from 'react';

/**
 * Custom hook that handles clicks outside of a specified element
 * Useful for closing modals, dropdowns, and other overlay components
 * 
 * @param ref - React ref to the element
 * @param handler - Callback function to execute when clicking outside
 */
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: Event) => void
): void {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }

      handler(event); // Call the handler only if the click is outside of the element
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Reload only if ref or handler changes
}

export default useClickOutside;