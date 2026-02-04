import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";
import { Navigate, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
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
} from "lucide-react";

export function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const cacheStats = useQuery(api.gameData.getCacheStats);
  const decorCategories = useQuery(api.gameData.getDecorCategories);
  const pendingReports = useQuery(api.reports.getPending, { limit: 50 });
  const syncFromEnv = useAction(api.gameData.syncFromEnv);
  const testApi = useAction(api.gameData.testBlizzardApi);
  const updateReportStatus = useMutation(api.reports.updateStatus);

  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingReport, setProcessingReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"moderation" | "gamedata">("moderation");

  // Only admins can access this page
  if (authLoading) {
    return (
      <div className="container page-section">
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
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
    if (!user) return;
    setProcessingReport(reportId);
    try {
      await updateReportStatus({
        reportId,
        status,
        reviewerId: user.id as Id<"users">,
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

      // Format the result message
      let message: string;
      if ("decor" in result) {
        // AllSyncResult
        message = `Sync complete!\n• Decor: ${result.decor.synced}/${result.decor.total}\n• Fixtures: ${result.fixtures.synced}/${result.fixtures.total}\n• Rooms: ${result.rooms.synced}/${result.rooms.total}`;
      } else {
        // SyncResult
        message = `Sync complete! ${result.synced}/${result.total} items synced.`;
      }

      setSyncResult({
        type: "success",
        message,
      });
    } catch (error) {
      setSyncResult({
        type: "error",
        message: String(error),
      });
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
    <>
      <SEO title="Admin Panel" noindex />
      <div className="container page-section">
        <div className="section-header">
          <h1 className="section-title">
            <Database size={24} />
            Admin Panel
          </h1>
        </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "moderation" ? "active" : ""}`}
          onClick={() => setActiveTab("moderation")}
        >
          <Flag size={18} />
          Moderation
          {pendingReports && pendingReports.length > 0 && (
            <span className="admin-tab-badge">{pendingReports.length}</span>
          )}
        </button>
        <button
          className={`admin-tab ${activeTab === "gamedata" ? "active" : ""}`}
          onClick={() => setActiveTab("gamedata")}
        >
          <Database size={18} />
          Game Data
        </button>
      </div>

      {/* Moderation Tab */}
      {activeTab === "moderation" && (
        <div className="admin-moderation">
          <div className="card">
            <div className="card-header">
              <h2>Pending Reports</h2>
              <p className="text-muted">
                Review user-submitted reports for inappropriate content
              </p>
            </div>

            {pendingReports === undefined ? (
              <div className="admin-loading">Loading reports...</div>
            ) : pendingReports.length === 0 ? (
              <div className="admin-empty">
                <CheckCircle2 size={32} />
                <p>No pending reports</p>
              </div>
            ) : (
              <div className="reports-list">
                {pendingReports.map((report) => (
                  <div key={report._id} className="report-card">
                    <div className="report-header">
                      <span className={`report-reason badge badge-${report.reason}`}>
                        {reasonLabels[report.reason] || report.reason}
                      </span>
                      <span className="report-date text-muted">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="report-content">
                      <div className="report-design">
                        <Link to={`/design/${report.creationId}`} className="report-design-link">
                          <span>{report.creationTitle}</span>
                          <ExternalLink size={14} />
                        </Link>
                      </div>

                      <div className="report-reporter text-muted">
                        Reported by: {report.reporterName}
                      </div>

                      {report.details && (
                        <div className="report-details">
                          "{report.details}"
                        </div>
                      )}
                    </div>

                    <div className="report-actions">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleReportAction(report._id, "dismissed")}
                        disabled={processingReport === report._id}
                        title="Dismiss report (no action needed)"
                      >
                        <XCircle size={16} />
                        Dismiss
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleReportAction(report._id, "reviewed")}
                        disabled={processingReport === report._id}
                        title="Mark as reviewed"
                      >
                        <Eye size={16} />
                        Reviewed
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleReportAction(report._id, "actioned")}
                        disabled={processingReport === report._id}
                        title="Take action (hide/remove design)"
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
        </div>
      )}

      {/* Game Data Tab */}
      {activeTab === "gamedata" && (
        <>
          {/* Cache Stats */}
      <div className="admin-stats-grid">
        <div className="card card-stat">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{cacheStats?.decorCount ?? "..."}</span>
            <span className="stat-label">Decor Items</span>
          </div>
        </div>

        <div className="card card-stat">
          <div className="stat-icon">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{cacheStats?.fixtureCount ?? "..."}</span>
            <span className="stat-label">Fixtures</span>
          </div>
        </div>

        <div className="card card-stat">
          <div className="stat-icon">
            <Home size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{cacheStats?.roomCount ?? "..."}</span>
            <span className="stat-label">Rooms</span>
          </div>
        </div>

        <div className="card card-stat">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {cacheStats?.oldestCacheDate
                ? formatDate(cacheStats.oldestCacheDate)
                : "Never"}
            </span>
            <span className="stat-label">Last Sync</span>
          </div>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <h2>Sync Game Data from Blizzard</h2>
          <p className="text-muted">
            Fetch all decor items, fixtures, and rooms from Blizzard's API and cache locally.
          </p>
        </div>

        <div className="sync-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleSync("all")}
            disabled={syncing !== null}
          >
            {syncing === "all" ? (
              <RefreshCw size={18} className="spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Sync All Data
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSync("decor")}
            disabled={syncing !== null}
          >
            {syncing === "decor" && <RefreshCw size={18} className="spin" />}
            Sync Decor Only
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSync("fixtures")}
            disabled={syncing !== null}
          >
            {syncing === "fixtures" && <RefreshCw size={18} className="spin" />}
            Sync Fixtures Only
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSync("rooms")}
            disabled={syncing !== null}
          >
            {syncing === "rooms" && <RefreshCw size={18} className="spin" />}
            Sync Rooms Only
          </button>
        </div>

        {syncing && (
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            Syncing... This may take a few minutes for large datasets.
          </p>
        )}

        {syncResult && (
          <div
            className={`sync-result ${syncResult.type}`}
            style={{ marginTop: "1rem" }}
          >
            {syncResult.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {syncResult.message}
            </pre>
          </div>
        )}
      </div>

      {/* Categories */}
      {decorCategories && decorCategories.length > 0 && (
        <div className="card" style={{ marginTop: "2rem" }}>
          <div className="card-header">
            <h2>Cached Decor Categories</h2>
          </div>
          <div className="category-tags">
            {decorCategories.map((cat) => (
              <span key={cat} className="badge">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* API Test */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <h2>Debug: Test Blizzard API</h2>
          <p className="text-muted">
            Test what the Blizzard API actually returns.
          </p>
        </div>
        <div className="sync-actions">
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              try {
                const result = await testApi({ endpoint: "/data/wow/decor/index" });
                setTestResult(result);
              } catch (e) {
                setTestResult({ error: String(e) });
              }
              setTesting(false);
            }}
            disabled={testing}
          >
            {testing ? <RefreshCw size={18} className="spin" /> : null}
            Test Decor Index
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              try {
                const result = await testApi({ endpoint: "/data/wow/fixture/index" });
                setTestResult(result);
              } catch (e) {
                setTestResult({ error: String(e) });
              }
              setTesting(false);
            }}
            disabled={testing}
          >
            Test Fixture Index
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              try {
                const result = await testApi({ endpoint: "/data/wow/room/index" });
                setTestResult(result);
              } catch (e) {
                setTestResult({ error: String(e) });
              }
              setTesting(false);
            }}
            disabled={testing}
          >
            Test Room Index
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              try {
                // Get first fixture detail to see full structure
                const result = await testApi({ endpoint: "/data/wow/fixture/1" });
                setTestResult(result);
              } catch (e) {
                setTestResult({ error: String(e) });
              }
              setTesting(false);
            }}
            disabled={testing}
          >
            Test Fixture #1 Detail
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              try {
                // Get decor item 80 detail (from API docs example)
                const result = await testApi({ endpoint: "/data/wow/decor/80" });
                setTestResult(result);
              } catch (e) {
                setTestResult({ error: String(e) });
              }
              setTesting(false);
            }}
            disabled={testing}
          >
            Test Decor #80 Detail
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              try {
                // Test item media for the fireplace (item 235994 from decor #80)
                const result = await testApi({ endpoint: "/data/wow/media/item/235994" });
                setTestResult(result);
              } catch (e) {
                setTestResult({ error: String(e) });
              }
              setTesting(false);
            }}
            disabled={testing}
          >
            Test Item #235994 Media (Fireplace)
          </button>
        </div>
        {testResult && (
          <pre className="code-block" style={{ marginTop: "1rem", maxHeight: "300px", overflow: "auto" }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Instructions */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <h2>Setup Required</h2>
        </div>
        <div className="instructions">
          <p style={{ marginBottom: "1rem" }}>
            Before syncing, set these environment variables in the{" "}
            <a
              href="https://dashboard.convex.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent"
            >
              Convex Dashboard
            </a>{" "}
            → Settings → Environment Variables:
          </p>
          <ul>
            <li><code>BLIZZARD_CLIENT_ID</code> - Your Blizzard API client ID</li>
            <li><code>BLIZZARD_CLIENT_SECRET</code> - Your Blizzard API client secret</li>
          </ul>
          <p style={{ marginTop: "1rem" }} className="text-muted">
            Get your API credentials at{" "}
            <a
              href="https://develop.battle.net/access/clients"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent"
            >
              develop.battle.net
            </a>
          </p>
        </div>
      </div>
        </>
      )}
      </div>
    </>
  );
}
