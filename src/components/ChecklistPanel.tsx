"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { useChecklist } from "@/lib/checklistContext";
import {
  X,
  Check,
  Trash2,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export function ChecklistPanel() {
  const { isOpen, close } = useChecklist();
  const { sessionToken, isAuthenticated, isLoading } = useAuth();
  const [expandedDesigns, setExpandedDesigns] = useState<Set<string>>(new Set());

  // Only query when we have a valid session token
  const shouldQuery = isAuthenticated && sessionToken && !isLoading;

  const items = useQuery(
    api.shoppingList.getList,
    shouldQuery ? { sessionToken } : "skip"
  );
  const summary = useQuery(
    api.shoppingList.getListSummary,
    shouldQuery ? { sessionToken } : "skip"
  );

  const toggleComplete = useMutation(api.shoppingList.toggleItemComplete);
  const updateAcquired = useMutation(api.shoppingList.updateAcquired);
  const removeItem = useMutation(api.shoppingList.removeItem);
  const removeDesign = useMutation(api.shoppingList.removeDesign);
  const clearCompleted = useMutation(api.shoppingList.clearCompleted);

  const handleToggle = async (decorId: number) => {
    if (!sessionToken) return;
    try {
      await toggleComplete({ sessionToken, decorId });
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const handleUpdateQuantity = async (decorId: number, value: number) => {
    if (!sessionToken) return;
    try {
      await updateAcquired({ sessionToken, decorId, quantityAcquired: value });
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRemoveItem = async (decorId: number) => {
    if (!sessionToken) return;
    try {
      await removeItem({ sessionToken, decorId });
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  const handleClearCompleted = async () => {
    if (!sessionToken) return;
    if (!confirm("Remove all completed items from your checklist?")) return;
    try {
      await clearCompleted({ sessionToken });
    } catch (err) {
      console.error("Failed to clear:", err);
    }
  };

  const handleRemoveDesign = async (creationId: string) => {
    if (!sessionToken) return;
    if (!confirm("Remove this design from your checklist?")) return;
    try {
      await removeDesign({ sessionToken, creationId: creationId as any });
    } catch (err) {
      console.error("Failed to remove design:", err);
    }
  };

  const toggleDesignExpand = (designId: string) => {
    const newExpanded = new Set(expandedDesigns);
    if (newExpanded.has(designId)) {
      newExpanded.delete(designId);
    } else {
      newExpanded.add(designId);
    }
    setExpandedDesigns(newExpanded);
  };

  // Group items by their source designs
  const itemsByDesign = items?.reduce((acc, item) => {
    item.sourceDesigns.forEach((source) => {
      const key = source.creationId;
      if (!acc[key]) {
        acc[key] = {
          title: source.title,
          creationId: source.creationId,
          exists: source.exists,
          items: [],
        };
      }
      acc[key].items.push({
        ...item,
        quantityForDesign: source.quantity,
      });
    });
    return acc;
  }, {} as Record<string, { title: string; creationId: string; exists: boolean; items: (typeof items extends (infer T)[] | undefined ? T & { quantityForDesign: number } : never)[] }>) || {};

  const completedCount = items?.filter((i) => i.isComplete).length ?? 0;
  const incompleteItems = items?.filter((i) => !i.isComplete) ?? [];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 998,
          }}
          onClick={close}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px, 90vw)",
          background: "var(--bg-deep)",
          borderLeft: "1px solid var(--border)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease-out",
          boxShadow: isOpen ? "-4px 0 24px rgba(0,0,0,0.3)" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <ShoppingCart size={20} style={{ color: "var(--accent)" }} />
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Checklist</h3>
              {summary && (
                <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {summary.totalQuantityAcquired}/{summary.totalQuantityNeeded} items
                </p>
              )}
            </div>
          </div>
          <button
            onClick={close}
            className="btn btn-ghost"
            style={{ padding: "var(--space-xs)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        {summary && summary.totalQuantityNeeded > 0 && (
          <div style={{ padding: "var(--space-sm) var(--space-lg)", background: "var(--bg-surface)" }}>
            <div
              style={{
                height: 6,
                background: "var(--bg-elevated)",
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
            <p className="text-muted" style={{ fontSize: "0.6875rem", marginTop: "4px", textAlign: "center" }}>
              {Math.round((summary.totalQuantityAcquired / summary.totalQuantityNeeded) * 100)}% complete
            </p>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-md)" }}>
          {isLoading || !shouldQuery ? (
            <div className="text-muted" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              Loading...
            </div>
          ) : items === undefined ? (
            <div className="text-muted" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              <Package size={40} style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }} />
              <p className="text-muted" style={{ marginBottom: "var(--space-xs)" }}>
                Your checklist is empty
              </p>
              <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                Add items from any design page
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {/* Grouped by Design */}
              {Object.entries(itemsByDesign).map(([designId, design]) => (
                <div
                  key={designId}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                  }}
                >
                  {/* Design Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <button
                      onClick={() => toggleDesignExpand(designId)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "var(--space-sm) var(--space-md)",
                        paddingRight: "var(--space-xs)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", minWidth: 0 }}>
                        {design.exists ? (
                          <Link
                            href={`/design/${design.creationId}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: "var(--accent)",
                              textDecoration: "none",
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {design.title}
                          </Link>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                            {design.title}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {design.items.filter((i) => i.isComplete).length}/{design.items.length}
                        </span>
                        {expandedDesigns.has(designId) ? (
                          <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                        ) : (
                          <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleRemoveDesign(designId)}
                      style={{
                        padding: "var(--space-xs)",
                        paddingRight: "var(--space-sm)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        opacity: 0.5,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                      title="Remove design from checklist"
                    >
                      <Trash2 size={14} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>

                  {/* Design Items */}
                  {expandedDesigns.has(designId) && (
                    <div style={{ padding: "0 var(--space-sm) var(--space-sm)" }}>
                      {design.items.map((item) => (
                        <div
                          key={item.decorId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-xs)",
                            padding: "var(--space-xs)",
                            opacity: item.isComplete ? 0.5 : 1,
                          }}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggle(item.decorId)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "4px",
                              border: item.isComplete ? "none" : "2px solid var(--border)",
                              background: item.isComplete ? "var(--accent)" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {item.isComplete && <Check size={12} style={{ color: "var(--bg-deep)" }} />}
                          </button>

                          {/* Icon */}
                          {item.iconUrl ? (
                            <img
                              src={item.iconUrl}
                              alt=""
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "4px",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "4px",
                                background: "var(--bg-elevated)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Package size={12} style={{ color: "var(--text-muted)" }} />
                            </div>
                          )}

                          {/* Name */}
                          {item.wowItemId ? (
                            <a
                              href={`https://www.wowhead.com/item=${item.wowItemId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                flex: 1,
                                fontSize: "0.8125rem",
                                textDecoration: item.isComplete ? "line-through" : "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "var(--text-primary)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.name}
                            </a>
                          ) : (
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.8125rem",
                                textDecoration: item.isComplete ? "line-through" : "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.name}
                            </span>
                          )}

                          {/* Quantity */}
                          <span className="text-muted" style={{ fontSize: "0.75rem", flexShrink: 0 }}>
                            {item.quantityAcquired}/{item.quantityForDesign}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items && items.length > 0 && completedCount > 0 && (
          <div
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-surface)",
            }}
          >
            <button
              onClick={handleClearCompleted}
              className="btn btn-ghost"
              style={{ width: "100%", fontSize: "0.8125rem" }}
            >
              <CheckCircle size={14} />
              Clear Completed ({completedCount})
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Floating toggle button
export function ChecklistToggle() {
  const { isOpen, toggle } = useChecklist();
  const { sessionToken, isAuthenticated, isLoading } = useAuth();

  const shouldQuery = isAuthenticated && sessionToken && !isLoading;

  const summary = useQuery(
    api.shoppingList.getListSummary,
    shouldQuery ? { sessionToken } : "skip"
  );

  if (!isAuthenticated || isLoading) {
    return null;
  }

  const incompleteCount = summary?.incompleteCount ?? 0;

  return (
    <button
      onClick={toggle}
      style={{
        position: "fixed",
        right: isOpen ? "min(400px, 90vw)" : 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1000,
        padding: "var(--space-sm) var(--space-xs)",
        background: "var(--accent)",
        border: "none",
        borderRadius: "var(--radius) 0 0 var(--radius)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        transition: "right 0.25s ease-out",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
      }}
      title={isOpen ? "Close checklist" : "Open checklist"}
    >
      <ShoppingCart size={18} style={{ color: "var(--bg-deep)" }} />
      {incompleteCount > 0 && (
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            color: "var(--bg-deep)",
            minWidth: 16,
            textAlign: "center",
          }}
        >
          {incompleteCount > 99 ? "99+" : incompleteCount}
        </span>
      )}
    </button>
  );
}
