// src/features/optimizer/components/WowheadLink.tsx
import { forwardRef, type ComponentPropsWithoutRef } from "react";

function buildWowheadHref(itemId: number, opts: { ilvl?: number; bonusIds?: number[] }) {
  const params: string[] = [];
  if (opts.ilvl && Number.isFinite(opts.ilvl)) params.push(`ilevel=${opts.ilvl}`);
  if (opts.bonusIds?.length) params.push(`bonus=${opts.bonusIds.join(":")}`);
  const qs = params.length ? `?${params.join("&")}` : "";
  return `https://www.wowhead.com/item=${itemId}${qs}`;
}

type AnchorBaseProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "id">;

export type WowheadLinkProps = AnchorBaseProps & {
  /** Numeric item id for Wowhead (renamed from `id` to avoid clash with HTML `id` string) */
  itemId: number;
  ilvl?: number;
  bonusIds?: number[];
  title?: string;
  className?: string;
};

export const WowheadLink = forwardRef<HTMLAnchorElement, WowheadLinkProps>(
  ({ itemId, ilvl, bonusIds, title, className, children, ...rest }, ref) => {
    const href = buildWowheadHref(itemId, { ilvl, bonusIds });
    return (
      <a ref={ref} href={href} title={title} className={className} {...rest}>
        {children}
      </a>
    );
  }
);

WowheadLink.displayName = "WowheadLink";
