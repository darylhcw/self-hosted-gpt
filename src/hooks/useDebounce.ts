import { useEffect, useRef, useMemo } from 'react';

/**
 * General debounce hook.
 * - Function passed in is stored as ref so it's always fresh and works
 *   with functions that depend on state.
 * - Wait is in ms.
 */
function useDebounce(callback: Function, wait: number=1000) {
  const ref = useRef<Function>();

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.();
    };

    return debounce(func, wait);
  }, []);

  return debouncedCallback;
};

const debounce = (callback: Function, wait: number) => {
  let timer : number;

  const debouncedFunc = () => {
    if (!timer || (Date.now() - timer) > wait) {
      callback();
    } else {
      timer = Date.now();
    }
  }

  return debouncedFunc;
}

export {
  useDebounce
}