import { createContext, useContext, type ReactNode } from "react";

export type IconUrlMap = Record<number, string>;

const IconUrlsContext = createContext<IconUrlMap | null>(null);

export function IconUrlsProvider({ urls, children }: { urls: IconUrlMap; children: ReactNode }) {
  return <IconUrlsContext.Provider value={urls}>{children}</IconUrlsContext.Provider>;
}

/** Read a pre-fetched icon URL from context. */
// eslint-disable-next-line react-refresh/only-export-components
export function useIconUrl(id?: number): string | undefined {
  const map = useContext(IconUrlsContext);
  if (!id) return undefined;
  return map?.[id];
}
