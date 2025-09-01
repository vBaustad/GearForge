// src/features/optimizer/components/CrestBar.tsx
import type { CrestCapResult } from "../services/crests";

export function CrestBar({ caps }: { caps: CrestCapResult[] }) {
  if (!caps?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {caps.map((c) => (
        <span key={c.tier} className="badge" title={`Opened ${c.weeksOpen} weeks · +${c.weeklyIncrement}/wk`}>
          {c.tier}: {c.currentCap}
        </span>
      ))}
    </div>
  );
}
