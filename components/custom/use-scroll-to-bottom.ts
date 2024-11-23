import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const topRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const top = topRef.current;

    if (container && top) {
      const observer = new MutationObserver(() => {
        top.scrollIntoView({ behavior: "instant", block: "start" });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, topRef];
}
