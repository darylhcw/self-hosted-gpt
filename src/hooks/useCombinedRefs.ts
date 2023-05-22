import { useEffect } from 'react';

export function useCombinedRefs<T = HTMLElement>(innerRef: React.MutableRefObject<T | null>,
                                                 forwardRef: React.ForwardedRef<T>) {
  useEffect(() => {
    for (const ref of [innerRef, forwardRef]) {
      if (!ref) continue;

      if (typeof ref === "function") {
        ref(innerRef.current || null);
      } else {
        ref.current = innerRef.current || null;
      }
    }
  }, [innerRef, forwardRef]);

  return innerRef;
}
