"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useChecklist } from "@/lib/checklistContext";
import {
  Package,
  ShoppingCart,
  Check,
  Trophy,
} from "lucide-react";

// Declare Wowhead tooltip refresh function
declare global {
  interface Window {
    $WowheadPower?: {
      refreshLinks: () => void;
    };
  }
}

interface EnrichedItem {
  decorId: number;
  quantity: number;
  name: string;
  iconUrl?: string;
  category?: string;
  subcategory?: string;
  wowItemId?: number;
  source?: string;
  sourceDetails?: string;
  // Vendor info
  vendorName?: string;
  vendorLocation?: string;
  // Cost info
  goldCost?: number; // in copper
  currencyType?: string;
  currencyCost?: number;
  // Achievement requirement
  achievementId?: number;
  achievementName?: string;
  // Profession crafting
  professionName?: string;
  professionSkillRequired?: number;
  // Quest info
  questId?: number;
  questName?: string;
  // Placement
  interiorOnly?: boolean;
  budgetCost?: number;
}

interface ItemsListProps {
  items: EnrichedItem[];
  itemsByCategory?: Record<string, EnrichedItem[]>; // kept for backwards compatibility
  totalItems: number;
  uniqueItems: number;
  creationId?: Id<"creations">;
  sessionToken?: string;
}



export function ItemsList({
  items,
  itemsByCategory,
  totalItems,
  uniqueItems,
  creationId,
  sessionToken,
}: ItemsListProps) {
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);

  // Checklist panel context
  const { open: openChecklist } = useChecklist();

  // Shopping list queries and mutations
  const isInList = useQuery(
    api.shoppingList.isDesignInList,
    sessionToken && creationId ? { sessionToken, creationId } : "skip"
  );
  const addDesign = useMutation(api.shoppingList.addDesign);
  const removeDesign = useMutation(api.shoppingList.removeDesign);

  const handleToggleShoppingList = async () => {
    if (!sessionToken || !creationId || isAddingToList) {
      console.log("Cannot add to checklist:", { sessionToken: !!sessionToken, creationId, isAddingToList });
      return;
    }
    setIsAddingToList(true);
    try {
      if (isInList) {
        await removeDesign({ sessionToken, creationId });
      } else {
        const result = await addDesign({ sessionToken, creationId });
        console.log("Added to checklist:", result);
        setAddedToList(true);
        // Open the checklist panel to show the added items
        openChecklist();
        setTimeout(() => setAddedToList(false), 2000);
      }
    } catch (err: any) {
      console.error("Failed to update shopping list:", err);
      alert(err?.message || "Failed to update checklist. The design may not have any items.");
    } finally {
      setIsAddingToList(false);
    }
  };

  // Sort items by quantity (highest first)
  const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity);

  // Calculate total budget cost (accounting for quantity)
  const totalBudgetCost = items.reduce((sum, item) => {
    if (item.budgetCost !== undefined && item.budgetCost !== null) {
      return sum + (item.budgetCost * item.quantity);
    }
    return sum;
  }, 0);

  // Count items with special requirements
  const achievementRequiredCount = items.filter(item => item.achievementId).length;

  // Refresh Wowhead tooltips when items change
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        window.$WowheadPower?.refreshLinks();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items]);

  if (items.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "var(--space-lg)",
          marginTop: "var(--space-xl)",
          textAlign: "center",
        }}
      >
        <Package
          size={32}
          style={{ color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}
        />
        <p className="text-muted">No item list available for this build</p>
        <p
          className="text-muted"
          style={{ fontSize: "0.875rem", marginTop: "var(--space-xs)" }}
        >
          The creator has not tagged the items used in this design yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="card items-list-card"
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--space-md)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <Package size={18} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 600 }}>Items</span>
            <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
              {uniqueItems} unique • {totalItems} total
            </span>
          </div>

          {/* Add to Checklist Button */}
          {creationId && sessionToken && (
            <button
              onClick={handleToggleShoppingList}
              disabled={isAddingToList || isInList === undefined}
              className={`btn btn-sm ${isInList === true ? "btn-primary" : "btn-ghost"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                fontSize: "0.75rem",
              }}
              title={isInList === true ? "Remove from checklist" : "Add to checklist"}
            >
              {addedToList ? (
                <Check size={14} />
              ) : (
                <ShoppingCart size={14} />
              )}
              {addedToList ? "Added!" : isInList === true ? "In List" : "Add to List"}
            </button>
          )}
        </div>

        {/* Stats row - only show if we have data */}
        {(totalBudgetCost > 0 || achievementRequiredCount > 0) && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginTop: "var(--space-sm)" }}>
            {/* Budget cost */}
            {totalBudgetCost > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                }}
                title="Total placement budget cost"
              >
                <img
                  src="https://wow.zamimg.com/images/wow/TextureAtlas/live/house-decor-budget-icon.webp"
                  alt=""
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontWeight: 600 }}>{totalBudgetCost.toLocaleString()}</span>
              </span>
            )}

            {/* Achievement requirements */}
            {achievementRequiredCount > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.75rem",
                  color: "rgb(255, 128, 0)",
                  background: "rgba(255, 128, 0, 0.1)",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                }}
                title={`${achievementRequiredCount} item${achievementRequiredCount > 1 ? "s" : ""} require achievement`}
              >
                <Trophy size={12} />
                <span style={{ fontWeight: 500 }}>{achievementRequiredCount}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Items List */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--space-sm)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {sortedItems.map((item, index) => (
            <MinimalItemRow key={`${item.decorId}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Minimal Item Row - compact display for sidebar
function MinimalItemRow({ item }: { item: EnrichedItem }) {
  const hasRequirement = item.questId || item.achievementId;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-sm)",
        padding: "6px 8px",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {/* Icon */}
      {item.iconUrl ? (
        <img
          src={item.iconUrl}
          alt=""
          style={{
            width: 28,
            height: 28,
            borderRadius: "4px",
            objectFit: "cover",
            flexShrink: 0,
            marginTop: hasRequirement ? 2 : 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "4px",
            background: "var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: hasRequirement ? 2 : 0,
          }}
        >
          <Package size={14} style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {/* Name + Requirements + Cost */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.wowItemId ? (
          <a
            href={`https://www.wowhead.com/item=${item.wowItemId}`}
            target="_blank"
            rel="noopener noreferrer"
            data-wowhead={`item=${item.wowItemId}`}
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontSize: "0.8125rem",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </a>
        ) : (
          <span
            style={{
              fontSize: "0.8125rem",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </span>
        )}

        {/* Quest requirement */}
        {item.questId && item.questName && (
          <a
            href={`https://www.wowhead.com/quest=${item.questId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.6875rem",
              color: "rgb(255, 209, 0)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ flexShrink: 0, fontSize: "0.625rem" }}>📜</span>
            {item.questName}
          </a>
        )}

        {/* Achievement requirement */}
        {item.achievementId && item.achievementName && (
          <a
            href={`https://www.wowhead.com/achievement=${item.achievementId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.6875rem",
              color: "rgb(255, 128, 0)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Trophy size={10} style={{ flexShrink: 0 }} />
            {item.achievementName}
          </a>
        )}
      </div>

      {/* Right side: Budget cost + Quantity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {/* Budget cost with icon - styled like wowdb */}
        {item.budgetCost !== undefined && item.budgetCost !== null && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
            title={`Placement cost: ${item.budgetCost} budget${item.quantity > 1 ? ` (${item.budgetCost * item.quantity} total)` : ""}`}
          >
            <img
              src="https://wow.zamimg.com/images/wow/TextureAtlas/live/house-decor-budget-icon.webp"
              alt=""
              style={{ width: 14, height: 14 }}
            />
            <span style={{ fontWeight: 500 }}>{item.budgetCost}</span>
          </span>
        )}

        {/* Quantity */}
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            minWidth: "28px",
            textAlign: "right",
          }}
        >
          ×{item.quantity}
        </span>
      </div>
    </div>
  );
}
