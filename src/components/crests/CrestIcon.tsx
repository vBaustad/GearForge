import { CREST_ICON_SRC, type Crest } from "../../features/optimizer/types/crests";

export function CrestIcon({
  tier,
  size = 16,
  className,
  title,
}: {
  tier: Crest;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={CREST_ICON_SRC[tier]}
      width={size}
      height={size}
      alt={`${tier} Crest`}
      title={title ?? `${tier} Crest`}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ display: "inline-block", verticalAlign: "text-bottom", borderRadius: 3 }}
    />
  );
}
