"use client";

import { useState } from "react";
import {
  Hammer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface BuildCostsProps {
  buildCosts: {
    totalGoldCost?: number;
    totalBudgetCost: number;
    currencyCosts: Record<string, number>;
    requiredAchievements: Array<{ id?: number; name: string }>;
    requiredQuests?: Array<{ id?: number; name: string }>;
    requiredProfessions: Array<{ name: string; skill?: number }>;
    requiredReputations?: Array<{ faction: string; standing: string }>;
  };
  completedAchievements?: number[];
  completedQuests?: number[];
}

// Convert quest name to URL slug (lowercase, spaces to hyphens)
function questNameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function BuildCosts({ buildCosts, completedAchievements = [], completedQuests = [] }: BuildCostsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    totalBudgetCost,
    currencyCosts,
    requiredAchievements,
    requiredQuests = [],
    requiredProfessions,
    requiredReputations = [],
  } = buildCosts;

  // Create sets for O(1) lookup
  const completedAchievementSet = new Set(completedAchievements);
  const completedQuestSet = new Set(completedQuests);

  // Count completed items
  const completedAchievementCount = requiredAchievements.filter(a => a.id && completedAchievementSet.has(a.id)).length;
  const completedQuestCount = requiredQuests.filter(q => q.id && completedQuestSet.has(q.id)).length;

  const hasCosts = totalBudgetCost > 0 || Object.keys(currencyCosts).length > 0;
  const hasRequirements = requiredAchievements.length > 0 || requiredQuests.length > 0 || requiredProfessions.length > 0 || requiredReputations.length > 0;

  if (!hasCosts && !hasRequirements) {
    return null;
  }

  const currencyEntries = Object.entries(currencyCosts).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className="card"
      style={{
        marginTop: "var(--space-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          padding: "var(--space-md) var(--space-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <img
            src="https://wow.zamimg.com/images/wow/TextureAtlas/live/house-decor-budget-icon.webp"
            alt=""
            style={{ width: 24, height: 24 }}
          />
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontVariant: "small-caps",
            }}
          >
            Build Costs & Requirements
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {isExpanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "var(--space-lg)",
            display: "grid",
            gridTemplateColumns: hasRequirements && hasCosts ? "1fr 1fr" : "1fr",
            gap: "var(--space-xl)",
          }}
        >
          {/* Left Column: Vendor Costs */}
          {hasCosts && (
            <div>
              <h4
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "var(--space-md)",
                }}
              >
                Vendor Costs
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {/* Budget Cost */}
                {totalBudgetCost > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-sm) 0",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", color: "var(--text-secondary)" }}>
                      <img
                        src="https://wow.zamimg.com/images/wow/TextureAtlas/live/house-decor-budget-icon.webp"
                        alt=""
                        style={{ width: 18, height: 18, opacity: 0.8 }}
                      />
                      Budget Cost
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "1.125rem", color: "var(--text-primary)" }}>
                      {totalBudgetCost.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Currency Costs */}
                {currencyEntries.map(([currency, amount]) => (
                  <div
                    key={currency}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-sm) 0",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {currency}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "1.125rem", color: "var(--accent)" }}>
                      {amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Requirements */}
          {hasRequirements && (
            <div>
              {/* Achievements */}
              {requiredAchievements.length > 0 && (
                <div style={{ marginBottom: requiredQuests.length > 0 || requiredProfessions.length > 0 || requiredReputations.length > 0 ? "var(--space-lg)" : 0 }}>
                  <h4
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "rgb(255, 128, 0)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "var(--space-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <span>🏆</span>
                    Required Achievements
                    {completedAchievements.length > 0 ? (
                      <span style={{ color: completedAchievementCount === requiredAchievements.length ? "#22c55e" : "inherit" }}>
                        ({completedAchievementCount}/{requiredAchievements.length})
                      </span>
                    ) : (
                      <span>({requiredAchievements.length})</span>
                    )}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {requiredAchievements.slice(0, 15).map((achievement, i) => {
                      const isCompleted = achievement.id && completedAchievementSet.has(achievement.id);
                      return (
                        <a
                          key={i}
                          href={achievement.id ? `https://www.wowhead.com/achievement=${achievement.id}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "var(--space-xs) 0",
                            color: isCompleted ? "#22c55e" : "rgb(255, 128, 0)",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            transition: "opacity 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                            {isCompleted ? (
                              <CheckCircle size={16} style={{ color: "#22c55e" }} />
                            ) : (
                              <span style={{ opacity: 0.7 }}>🏆</span>
                            )}
                            <span style={{ textDecoration: isCompleted ? "line-through" : "none", opacity: isCompleted ? 0.7 : 1 }}>
                              {achievement.name}
                            </span>
                          </span>
                          {achievement.id && <ExternalLink size={14} style={{ opacity: 0.5, flexShrink: 0 }} />}
                        </a>
                      );
                    })}
                    {requiredAchievements.length > 15 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "var(--space-xs) 0" }}>
                        +{requiredAchievements.length - 15} more achievements
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Quests */}
              {requiredQuests.length > 0 && (
                <div style={{ marginBottom: requiredProfessions.length > 0 || requiredReputations.length > 0 ? "var(--space-lg)" : 0 }}>
                  <h4
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "rgb(255, 209, 0)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "var(--space-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <span>📜</span>
                    Required Quests
                    {completedQuests.length > 0 ? (
                      <span style={{ color: completedQuestCount === requiredQuests.length ? "#22c55e" : "inherit" }}>
                        ({completedQuestCount}/{requiredQuests.length})
                      </span>
                    ) : (
                      <span>({requiredQuests.length})</span>
                    )}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {requiredQuests.slice(0, 15).map((quest, i) => {
                      const isCompleted = quest.id && completedQuestSet.has(quest.id);
                      // Use direct quest link if we have ID, otherwise search by name
                      const questUrl = quest.id
                        ? `https://www.wowhead.com/quest=${quest.id}/${questNameToSlug(quest.name)}`
                        : `https://www.wowhead.com/search?q=${encodeURIComponent(quest.name)}`;
                      return (
                        <a
                          key={i}
                          href={questUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "var(--space-xs) 0",
                            color: isCompleted ? "#22c55e" : "rgb(255, 209, 0)",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            transition: "opacity 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                            {isCompleted ? (
                              <CheckCircle size={16} style={{ color: "#22c55e" }} />
                            ) : (
                              <span style={{ opacity: 0.7 }}>📜</span>
                            )}
                            <span style={{ textDecoration: isCompleted ? "line-through" : "none", opacity: isCompleted ? 0.7 : 1 }}>
                              {quest.name}
                            </span>
                          </span>
                          <ExternalLink size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                        </a>
                      );
                    })}
                    {requiredQuests.length > 15 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "var(--space-xs) 0" }}>
                        +{requiredQuests.length - 15} more quests
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Professions */}
              {requiredProfessions.length > 0 && (
                <div style={{ marginBottom: requiredReputations.length > 0 ? "var(--space-lg)" : 0 }}>
                  <h4
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "#fd7e14",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "var(--space-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <Hammer size={14} />
                    Crafting Professions
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
                    {requiredProfessions.map((prof, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "rgba(253, 126, 20, 0.15)",
                          color: "#fd7e14",
                          borderRadius: "var(--radius)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        <Hammer size={14} />
                        {prof.name}
                        {prof.skill && <span style={{ opacity: 0.7 }}>({prof.skill})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reputations / Renown */}
              {requiredReputations.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "#8b5cf6",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "var(--space-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <span>⚔️</span>
                    Required Reputation / Renown
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {requiredReputations.map((rep, i) => {
                      const isRenown = rep.standing.toLowerCase().startsWith("renown");
                      // Renown uses teal/cyan, regular rep uses purple
                      const color = isRenown ? "#06b6d4" : "#8b5cf6";
                      const bgColor = isRenown ? "rgba(6, 182, 212, 0.15)" : "rgba(139, 92, 246, 0.15)";

                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "var(--space-xs) 0",
                            fontSize: "0.875rem",
                          }}
                        >
                          <span style={{ color }}>{rep.faction}</span>
                          <span
                            style={{
                              padding: "2px 8px",
                              background: bgColor,
                              color,
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {rep.standing}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
