import { useEffect, useMemo, useState } from "react";

type Options = { timeoutMs?: number };

export function useImagePreload(urls: string[], { timeoutMs = 2500 }: Options = {}) {
  const deduped = useMemo(
    () => Array.from(new Set(urls.filter((u): u is string => Boolean(u)))),
    [urls]
  );

  const [ready, setReady] = useState(deduped.length === 0);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    if (deduped.length === 0) {
      setReady(true);
      return;
    }
    let canceled = false;
    let done = 0;

    const onDone = () => {
      if (canceled) return;
      done += 1;
      setLoaded(done);
      if (done >= deduped.length) setReady(true);
    };

    const imgs: HTMLImageElement[] = deduped.map((url) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.setAttribute("fetchpriority", "high");
      img.onload = onDone;
      img.onerror = onDone;
      img.src = url;
      return img;
    });

    const t = window.setTimeout(() => {
      if (!canceled) setReady(true);
    }, timeoutMs);

    return () => {
      canceled = true;
      window.clearTimeout(t);
      imgs.forEach((i) => {
        i.onload = null;
        i.onerror = null;
      });
    };
  }, [deduped, timeoutMs]);

  return { ready, loaded, total: deduped.length };
}
