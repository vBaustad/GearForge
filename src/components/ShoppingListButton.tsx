"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ShoppingCart } from "lucide-react";
import { ShoppingListModal } from "./ShoppingListModal";

interface ShoppingListButtonProps {
  sessionToken: string;
}

export function ShoppingListButton({ sessionToken }: ShoppingListButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const summary = useQuery(api.shoppingList.getListSummary, { sessionToken });

  const incompleteCount = summary?.incompleteCount ?? 0;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-ghost"
        style={{
          position: "relative",
          padding: "var(--space-xs)",
        }}
        title="Shopping List"
      >
        <ShoppingCart size={20} />
        {incompleteCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--bg-deep)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {incompleteCount > 99 ? "99+" : incompleteCount}
          </span>
        )}
      </button>

      {showModal && (
        <ShoppingListModal
          sessionToken={sessionToken}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
