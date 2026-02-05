"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  Home,
  Layers,
  Flag,
  ExternalLink,
  XCircle,
  CheckCircle2,
  Eye,
  Shield,
  Lock,
} from "lucide-react";

export function AdminPageClient() {
  const { user, isLoading: authLoading, sessionToken } = useAuth();
  const cacheStats = useQuery(api.gameData.getCacheStats);
  const decorCategories = useQuery(api.gameData.getDecorCategories);
  const pendingReports = useQuery(api.reports.getPending, { limit: 50 });
  const syncFromEnv = useAction(api.gameData.syncFromEnv);
  const testBlizzardApi = useAction(api.gameData.testBlizzardApi);
  const updateReportStatus = useMutation(api.reports.updateStatus);

  const [syncing, setSyncing] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<Record<string, unknown> | null>(null);
  const [syncResult, setSyncResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingReport, setProcessingReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"moderation" | "gamedata">("moderation");

  // Loading state
  if (authLoading) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  // Access denied for non-admins
  if (!user || user.role !== "admin") {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <div className="empty-state-icon">
            <Lock size={48} />
          </div>
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Access Denied
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            You don&apos;t have permission to access this page.
          </p>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReportAction = async (
    reportId: Id<"reports">,
    status: "reviewed" | "dismissed" | "actioned"
  ) => {
    if (!sessionToken) return;
    setProcessingReport(reportId);
    try {
      await updateReportStatus({
        reportId,
        status,
        sessionToken, // Secured API
      });
    } catch (error) {
      console.error("Failed to update report:", error);
    } finally {
      setProcessingReport(null);
    }
  };

  const handleSync = async (type: "decor" | "fixtures" | "rooms" | "all") => {
    setSyncing(type);
    setSyncResult(null);

    try {
      const result = await syncFromEnv({ type, region: "us" });

      let message: string;
      if ("decor" in result) {
        message = `Sync complete!\n• Decor: ${result.decor.synced}/${result.decor.total}\n• Fixtures: ${result.fixtures.synced}/${result.fixtures.total}\n• Rooms: ${result.rooms.synced}/${result.rooms.total}`;
      } else {
        message = `Sync complete! ${result.synced}/${result.total} items synced.`;
      }

      setSyncResult({ type: "success", message });
    } catch (error) {
      setSyncResult({ type: "error", message: String(error) });
    } finally {
      setSyncing(null);
    }
  };

  const reasonLabels: Record<string, string> = {
    inappropriate: "Inappropriate content",
    spam: "Spam or misleading",
    stolen: "Stolen design",
    broken: "Broken/doesn't work",
    other: "Other",
  };

  return (
    <div className="container page-section">
      {/* Page Header */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <Shield size={28} />
          Admin Panel
        </h1>
        <p className="text-secondary">Manage reports and sync game data</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-xl)" }}>
        <button
          className={`btn ${activeTab === "moderation" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("moderation")}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
        >
          <Flag size={18} />
          Moderation
          {pendingReports && pendingReports.length > 0 && (
            <span
              style={{
                background: "var(--accent)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {pendingReports.length}
            </span>
          )}
        </button>
        <button
          className={`btn ${activeTab === "gamedata" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("gamedata")}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
        >
          <Database size={18} />
          Game Data
        </button>
      </div>

      {/* Moderation Tab */}
      {activeTab === "moderation" && (
        <div className="card" style={{ padding: "var(--space-lg)" }}>
          <h2 style={{ marginBottom: "var(--space-sm)" }}>Pending Reports</h2>
          <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
            Review user-submitted reports for inappropriate content
          </p>

          {pendingReports === undefined ? (
            <div className="text-muted" style={{ padding: "var(--space-xl)", textAlign: "center" }}>
              Loading reports...
            </div>
          ) : pendingReports.length === 0 ? (
            <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
              <CheckCircle2 size={48} style={{ color: "var(--accent)", marginBottom: "var(--space-md)" }} />
              <p className="text-secondary">No pending reports</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {pendingReports.map((report) => (
                <div
                  key={report._id}
                  className="card"
                  style={{ padding: "var(--space-md)", background: "var(--surface-elevated)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-sm)" }}>
                    <span className="badge">{reasonLabels[report.reason] || report.reason}</span>
                    <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <Link
                      href={`/design/${report.creationId}`}
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", color: "var(--accent)" }}
                    >
                      {report.creationTitle}
                      <ExternalLink size={14} />
                    </Link>
                    <div className="text-muted" style={{ fontSize: "0.875rem", marginTop: "var(--space-xs)" }}>
                      Reported by: {report.reporterName}
                    </div>
                    {report.details && (
                      <div
                        style={{
                          marginTop: "var(--space-sm)",
                          padding: "var(--space-sm)",
                          background: "var(--surface)",
                          borderRadius: "var(--radius)",
                          fontStyle: "italic",
                        }}
                      >
                        &quot;{report.details}&quot;
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleReportAction(report._id, "dismissed")}
                      disabled={processingReport === report._id}
                      style={{ flex: 1 }}
                    >
                      <XCircle size={16} />
                      Dismiss
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleReportAction(report._id, "reviewed")}
                      disabled={processingReport === report._id}
                      style={{ flex: 1 }}
                    >
                      <Eye size={16} />
                      Reviewed
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReportAction(report._id, "actioned")}
                      disabled={processingReport === report._id}
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={16} />
                      Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Game Data Tab */}
      {activeTab === "gamedata" && (
        <>
          {/* Cache Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
            <div className="card" style={{ padding: "var(--space-lg)", textAlign: "center" }}>
              <Package size={24} style={{ color: "var(--accent)", marginBottom: "var(--space-sm)" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{cacheStats?.decorCount ?? "..."}</div>
              <div className="text-muted">Decor Items</div>
            </div>
            <div className="card" style={{ padding: "var(--space-lg)", textAlign: "center" }}>
              <Layers size={24} style={{ color: "var(--accent)", marginBottom: "var(--space-sm)" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{cacheStats?.fixtureCount ?? "..."}</div>
              <div className="text-muted">Fixtures</div>
            </div>
            <div className="card" style={{ padding: "var(--space-lg)", textAlign: "center" }}>
              <Home size={24} style={{ color: "var(--accent)", marginBottom: "var(--space-sm)" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{cacheStats?.roomCount ?? "..."}</div>
              <div className="text-muted">Rooms</div>
            </div>
            <div className="card" style={{ padding: "var(--space-lg)", textAlign: "center" }}>
              <Clock size={24} style={{ color: "var(--accent)", marginBottom: "var(--space-sm)" }} />
              <div style={{ fontSize: "1rem", fontWeight: 500 }}>
                {cacheStats?.oldestCacheDate ? formatDate(cacheStats.oldestCacheDate) : "Never"}
              </div>
              <div className="text-muted">Last Sync</div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
            <h2 style={{ marginBottom: "var(--space-sm)" }}>Sync Game Data from Blizzard</h2>
            <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
              Fetch all decor items, fixtures, and rooms from Blizzard&apos;s API and cache locally.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
              <button
                className="btn btn-primary"
                onClick={() => handleSync("all")}
                disabled={syncing !== null}
              >
                <RefreshCw size={18} className={syncing === "all" ? "animate-spin" : ""} />
                Sync All Data
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleSync("decor")}
                disabled={syncing !== null}
              >
                {syncing === "decor" && <RefreshCw size={18} className="animate-spin" />}
                Sync Decor Only
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleSync("fixtures")}
                disabled={syncing !== null}
              >
                {syncing === "fixtures" && <RefreshCw size={18} className="animate-spin" />}
                Sync Fixtures Only
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleSync("rooms")}
                disabled={syncing !== null}
              >
                {syncing === "rooms" && <RefreshCw size={18} className="animate-spin" />}
                Sync Rooms Only
              </button>
            </div>

            {syncing && (
              <p className="text-muted" style={{ marginTop: "var(--space-md)" }}>
                Syncing... This may take a few minutes for large datasets.
              </p>
            )}

            {syncResult && (
              <div
                style={{
                  marginTop: "var(--space-md)",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius)",
                  background: syncResult.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${syncResult.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-sm)",
                }}
              >
                {syncResult.type === "success" ? (
                  <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
                )}
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.875rem" }}>
                  {syncResult.message}
                </pre>
              </div>
            )}
          </div>

          {/* Categories */}
          {decorCategories && decorCategories.length > 0 && (
            <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
              <h2 style={{ marginBottom: "var(--space-md)" }}>Cached Decor Categories</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                {decorCategories.map((cat) => (
                  <span key={cat} className="badge badge-outline">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* API Debug */}
          <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
            <h2 style={{ marginBottom: "var(--space-md)" }}>Debug: Test Single Item</h2>
            <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
              Fetch one decor item to see all data from Blizzard API + Wowhead URLs we generate.
            </p>
            <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  setTestingApi(true);
                  setApiTestResult(null);
                  try {
                    const result = await testBlizzardApi({ decorId: 533 });
                    setApiTestResult(result);
                  } catch (err) {
                    setApiTestResult({ error: String(err) });
                  } finally {
                    setTestingApi(false);
                  }
                }}
                disabled={testingApi}
              >
                {testingApi ? "Testing..." : "Test Item #533 (Pillar)"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  setTestingApi(true);
                  setApiTestResult(null);
                  try {
                    const result = await testBlizzardApi({ decorId: 383 });
                    setApiTestResult(result);
                  } catch (err) {
                    setApiTestResult({ error: String(err) });
                  } finally {
                    setTestingApi(false);
                  }
                }}
                disabled={testingApi}
              >
                {testingApi ? "Testing..." : "Test Item #383 (Lamp)"}
              </button>
            </div>
            {apiTestResult && (
              <div style={{ marginTop: "var(--space-md)" }}>
                <h4 style={{ marginBottom: "var(--space-sm)" }}>Complete Item Data:</h4>
                <pre
                  style={{
                    background: "var(--surface)",
                    padding: "var(--space-md)",
                    borderRadius: "var(--radius)",
                    overflow: "auto",
                    maxHeight: "500px",
                    fontSize: "0.75rem",
                  }}
                >
                  {JSON.stringify(apiTestResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="card" style={{ padding: "var(--space-lg)" }}>
            <h2 style={{ marginBottom: "var(--space-md)" }}>Setup Required</h2>
            <p style={{ marginBottom: "var(--space-md)" }}>
              Before syncing, set these environment variables in the{" "}
              <a
                href="https://dashboard.convex.dev"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                Convex Dashboard
              </a>{" "}
              → Settings → Environment Variables:
            </p>
            <ul style={{ paddingLeft: "var(--space-lg)", marginBottom: "var(--space-md)" }}>
              <li><code>BLIZZARD_CLIENT_ID</code> - Your Blizzard API client ID</li>
              <li><code>BLIZZARD_CLIENT_SECRET</code> - Your Blizzard API client secret</li>
            </ul>
            <p className="text-muted">
              Get your API credentials at{" "}
              <a
                href="https://develop.battle.net/access/clients"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                develop.battle.net
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
