type LinkProps = {
  id: number;
  ilvl?: number;
  bonusIds?: number[]; // value is colon-separated, e.g. 123:456
  className?: string;
  title?: string;
  children: React.ReactNode;
};

function buildParams({ ilvl, bonusIds }: { ilvl?: number; bonusIds?: number[] }) {
  const parts: string[] = [];
  if (ilvl) parts.push(`ilvl=${ilvl}`);
  if (bonusIds?.length) parts.push(`bonus=${bonusIds.join(":")}`);
  return parts.join("&"); // keys use &, only bonus value uses :
}

export function WowheadLink({ id, ilvl, bonusIds, className, title, children }: LinkProps) {
  const params = buildParams({ ilvl, bonusIds });
  const href = `https://www.wowhead.com/item=${id}${params ? `?${params}` : ""}`;

  return (
    <a
      href={href}
      data-wowhead={params || undefined}      // tooltips read this
      data-wh-rename-link="false"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
    >
      {children}
    </a>
  );
}
