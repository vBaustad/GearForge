export type IconPayload = { iconUrl: string; iconName?: string };

export async function fetchItemIcon(itemId: number): Promise<IconPayload | null> {
  try {
    const res = await fetch(`/api/wow/item/${itemId}/icon`);
    if (!res.ok) return null;
    return (await res.json()) as IconPayload;
  } catch {
    return null;
  }
}
