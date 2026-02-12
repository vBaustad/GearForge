"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  X,
  Check,
  Trash2,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Copy,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface ShoppingListModalProps {
  sessionToken: string;
  onClose: () => void;
}

export function ShoppingListModal({ sessionToken, onClose }: ShoppingListModalProps) {
  const [filter, setFilter] = useState<"all" | "incomplete" | "complete">("all");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [copiedList, setCopiedList] = useState(false);

  const items = useQuery(api.shoppingList.getList, { sessionToken });
  const summary = useQuery(api.shoppingList.getListSummary, { sessionToken });

  const toggleComplete = useMutation(api.shoppingList.toggleItemComplete);
  const updateAcquired = useMutation(api.shoppingList.updateAcquired);
  const removeItem = useMutation(api.shoppingList.removeItem);
  const clearCompleted = useMutation(api.shoppingList.clearCompleted);
  const clearAll = useMutation(api.shoppingList.clearAll);

  const handleToggle = async (decorId: number) => {
    try {
      await toggleComplete({ sessionToken, decorId });
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const handleUpdateQuantity = async (decorId: number, value: number) => {
    try {
      await updateAcquired({ sessionToken, decorId, quantityAcquired: value });
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRemoveItem = async (decorId: number) => {
    try {
      await removeItem({ sessionToken, decorId });
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  const handleClearCompleted = async () => {
    if (!confirm("Remove all completed items from your list?")) return;
    try {
      await clearCompleted({ sessionToken });
    } catch (err) {
      console.error("Failed to clear:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear your entire shopping list? This cannot be undone.")) return;
    try {
      await clearAll({ sessionToken });
    } catch (err) {
      console.error("Failed to clear:", err);
    }
  };

  const toggleExpand = (decorId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(decorId)) {
      newExpanded.delete(decorId);
    } else {
      newExpanded.add(decorId);
    }
    setExpandedItems(newExpanded);
  };

  const handleCopyList = async () => {
    if (!items) return;
    const lines = items
      .filter((i) => !i.isComplete)
      .map((i) => `[ ] ${i.quantityNeeded}x ${i.name}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(lines || "Shopping list is empty!");
      setCopiedList(true);
      setTimeout(() => setCopiedList(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Filter items
  const filteredItems = items?.filter((item) => {
    if (filter === "incomplete") return !item.isComplete;
    if (filter === "complete") return item.isComplete;
    return true;
  });

  const completedCount = items?.filter((i) => i.isComplete).length ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-lg)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-deep)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: 600,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--space-lg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-xs)" }}>
              <ShoppingCart size={24} />
              Shopping List
            </h2>
            {summary && (
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                {summary.totalQuantityAcquired}/{summary.totalQuantityNeeded} items acquired
                {summary.designCount > 0 && ` from ${summary.designCount} design${summary.designCount > 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "var(--space-xs)" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        {summary && summary.totalQuantityNeeded > 0 && (
          <div style={{ padding: "0 var(--space-lg)", marginTop: "var(--space-md)" }}>
            <div
              style={{
                height: 8,
                background: "var(--bg-surface)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(summary.totalQuantityAcquired / summary.totalQuantityNeeded) * 100}%`,
                  background: "var(--accent)",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "var(--space-xs)", textAlign: "center" }}>
              {Math.round((summary.totalQuantityAcquired / summary.totalQuantityNeeded) * 100)}% complete
            </p>
          </div>
        )}

        {/* Toolbar */}
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            display: "flex",
            gap: "var(--space-sm)",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Filter */}
          <div style={{ display: "flex", gap: "var(--space-xs)" }}>
            {(["all", "incomplete", "complete"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "4px 12px", fontSize: "0.8125rem" }}
              >
                {f === "all" ? "All" : f === "incomplete" ? "To Get" : "Acquired"}
                {f === "incomplete" && summary && ` (${summary.incompleteCount})`}
                {f === "complete" && ` (${completedCount})`}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Actions */}
          <button
            onClick={handleCopyList}
            className="btn btn-ghost"
            style={{ padding: "4px 8px", fontSize: "0.8125rem" }}
          >
            {copiedList ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copiedList ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-md) var(--space-lg)" }}>
          {items === undefined ? (
            <div className="text-muted" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              Loading...
            </div>
          ) : filteredItems?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              <Package size={48} style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }} />
              <p className="text-muted">
                {filter === "all"
                  ? "Your shopping list is empty"
                  : filter === "incomplete"
                  ? "All items acquired!"
                  : "No completed items"}
              </p>
              {filter === "all" && (
                <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "var(--space-sm)" }}>
                  Add items from any design page
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
              {filteredItems?.map((item) => (
                <div
                  key={item.decorId}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                    opacity: item.isComplete ? 0.6 : 1,
                  }}
                >
                  {/* Main row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      padding: "var(--space-sm) var(--space-md)",
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(item.decorId)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "var(--radius-sm)",
                        border: item.isComplete ? "none" : "2px solid var(--border)",
                        background: item.isComplete ? "var(--accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {item.isComplete && <Check size={14} style={{ color: "var(--bg-deep)" }} />}
                    </button>

                    {/* Icon */}
                    {item.iconUrl ? (
                      <img
                        src={item.iconUrl}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-elevated)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Package size={16} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}

                    {/* Name & Quantity */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                        {item.wowItemId ? (
                          <a
                            href={`https://www.wowhead.com/item=${item.wowItemId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--text-primary)",
                              textDecoration: item.isComplete ? "line-through" : "none",
                              fontWeight: 500,
                              fontSize: "0.875rem",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              textDecoration: item.isComplete ? "line-through" : "none",
                            }}
                          >
                            {item.name}
                          </span>
                        )}
                      </div>
                      {item.source && (
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {item.source}
                          {item.sourceDetails && `: ${item.sourceDetails}`}
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                      <input
                        type="number"
                        min={0}
                        max={item.quantityNeeded}
                        value={item.quantityAcquired}
                        onChange={(e) => handleUpdateQuantity(item.decorId, parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: 50,
                          padding: "2px 4px",
                          textAlign: "center",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.875rem",
                        }}
                      />
                      <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                        / {item.quantityNeeded}
                      </span>
                    </div>

                    {/* Expand/Actions */}
                    <button
                      onClick={() => toggleExpand(item.decorId)}
                      className="btn btn-ghost"
                      style={{ padding: "4px" }}
                    >
                      {expandedItems.has(item.decorId) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button
                      onClick={() => handleRemoveItem(item.decorId)}
                      className="btn btn-ghost"
                      style={{ padding: "4px", color: "var(--text-muted)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded: Source designs */}
                  {expandedItems.has(item.decorId) && (
                    <div
                      style={{
                        padding: "var(--space-sm) var(--space-md)",
                        paddingTop: 0,
                        paddingLeft: 72, // Align with name
                      }}
                    >
                      <p className="text-muted" style={{ fontSize: "0.75rem", marginBottom: "var(--space-xs)" }}>
                        Needed for:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                        {item.sourceDesigns.map((source) => (
                          <Link
                            key={source.creationId}
                            href={`/design/${source.creationId}`}
                            onClick={onClose}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              background: "var(--bg-elevated)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              color: source.exists ? "var(--accent)" : "var(--text-muted)",
                              textDecoration: "none",
                            }}
                          >
                            {source.title}
                            <span className="text-muted">({source.quantity}x)</span>
                            <ExternalLink size={10} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items && items.length > 0 && (
          <div
            style={{
              padding: "var(--space-md) var(--space-lg)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "var(--space-sm)",
              justifyContent: "flex-end",
            }}
          >
            {completedCount > 0 && (
              <button onClick={handleClearCompleted} className="btn btn-ghost" style={{ fontSize: "0.875rem" }}>
                Clear Completed ({completedCount})
              </button>
            )}
            <button onClick={handleClearAll} className="btn btn-ghost" style={{ fontSize: "0.875rem", color: "#ef4444" }}>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
