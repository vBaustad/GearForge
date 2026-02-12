"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errorMessages";
import Link from "next/link";
import {
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
  Users,
  LayoutDashboard,
  Activity,
  FileText,
  Settings,
  Search,
  Ban,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  User,
  Image as ImageIcon,
} from "lucide-react";

type TabType = "dashboard" | "users" | "activity" | "reports" | "content" | "settings";

export function AdminPageClient() {
  const { user, isLoading: authLoading, sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

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
          <p className="text-secondary" style={{ marginBottom: "var(--space-md)" }}>
            You don&apos;t have permission to access this page.
          </p>
          {user && (
            <p className="text-muted" style={{ marginBottom: "var(--space-xl)", fontSize: "0.875rem" }}>
              Your current role: <strong>{user.role}</strong>
              <br />
              User ID: <code style={{ fontSize: "0.75rem" }}>{user.id}</code>
            </p>
          )}
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "users", label: "Users", icon: <Users size={18} /> },
    { id: "activity", label: "Activity", icon: <Activity size={18} /> },
    { id: "reports", label: "Reports", icon: <Flag size={18} /> },
    { id: "content", label: "Content", icon: <FileText size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="container page-section">
      {/* Page Header */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <Shield size={28} />
          Admin Panel
        </h1>
        <p className="text-secondary">Monitor and manage your platform</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--space-xs)", marginBottom: "var(--space-xl)", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {!sessionToken ? (
        <div className="card" style={{ padding: "var(--space-xl)", textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "#f59e0b", marginBottom: "var(--space-md)" }} />
          <p>No session token available. Please try logging out and back in.</p>
        </div>
      ) : (
        <>
          {activeTab === "dashboard" && <DashboardTab sessionToken={sessionToken} />}
          {activeTab === "users" && <UsersTab sessionToken={sessionToken} />}
          {activeTab === "activity" && <ActivityTab sessionToken={sessionToken} />}
          {activeTab === "reports" && <ReportsTab sessionToken={sessionToken} />}
          {activeTab === "content" && <ContentTab sessionToken={sessionToken} />}
          {activeTab === "settings" && <SettingsTab sessionToken={sessionToken} />}
        </>
      )}
    </div>
  );
}

// ===== DASHBOARD TAB =====
function DashboardTab({ sessionToken }: { sessionToken: string }) {
  console.log("[DashboardTab] sessionToken:", sessionToken ? "present" : "missing");
  const stats = useQuery(api.admin.getDashboardStats, { sessionToken });
  console.log("[DashboardTab] stats:", stats);

  if (stats === undefined) {
    return (
      <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
        <div className="text-muted">Loading dashboard...</div>
        <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: "var(--space-sm)" }}>
          Session token: {sessionToken ? "✓" : "✗"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
        <StatCard
          icon={<Users size={24} />}
          value={stats.users.total}
          label="Total Users"
          subtext={`+${stats.users.newToday} today`}
          color="var(--accent)"
        />
        <StatCard
          icon={<ImageIcon size={24} />}
          value={stats.creations.published}
          label="Published Designs"
          subtext={`+${stats.creations.newToday} today`}
          color="#22c55e"
        />
        <StatCard
          icon={<Flag size={24} />}
          value={stats.reports.pending}
          label="Pending Reports"
          subtext={`${stats.reports.today} new today`}
          color={stats.reports.pending > 0 ? "#ef4444" : "var(--text-muted)"}
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          value={stats.engagement.totalViews.toLocaleString()}
          label="Total Views"
          subtext={`${stats.engagement.totalLikes.toLocaleString()} likes`}
          color="#8b5cf6"
        />
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-xl)" }}>
        {/* User Activity */}
        <div className="card" style={{ padding: "var(--space-lg)" }}>
          <h3 style={{ marginBottom: "var(--space-md)" }}>User Overview</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Active today</span>
              <span style={{ fontWeight: 500 }}>{stats.users.activeToday}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">New this week</span>
              <span style={{ fontWeight: 500 }}>{stats.users.newThisWeek}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Banned</span>
              <span style={{ fontWeight: 500, color: stats.users.banned > 0 ? "#ef4444" : undefined }}>{stats.users.banned}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Admins</span>
              <span style={{ fontWeight: 500 }}>{stats.users.admins}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Moderators</span>
              <span style={{ fontWeight: 500 }}>{stats.users.moderators}</span>
            </div>
          </div>
        </div>

        {/* Content Stats */}
        <div className="card" style={{ padding: "var(--space-lg)" }}>
          <h3 style={{ marginBottom: "var(--space-md)" }}>Content Overview</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Published</span>
              <span style={{ fontWeight: 500, color: "#22c55e" }}>{stats.creations.published}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Hidden</span>
              <span style={{ fontWeight: 500, color: "#f59e0b" }}>{stats.creations.hidden}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">Deleted</span>
              <span style={{ fontWeight: 500, color: "#ef4444" }}>{stats.creations.deleted}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-secondary">New this week</span>
              <span style={{ fontWeight: 500 }}>{stats.creations.newThisWeek}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Events */}
      {stats.recentCriticalEvents.length > 0 && (
        <div className="card" style={{ padding: "var(--space-lg)", marginTop: "var(--space-xl)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <h3 style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: "var(--space-sm)", color: "#ef4444" }}>
            <AlertTriangle size={20} />
            Recent Critical Events
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {stats.recentCriticalEvents.map((event: { _id: string; action: string; actorIdentifier: string; createdAt: number }) => (
              <div key={event._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-sm)", background: "var(--surface-elevated)", borderRadius: "var(--radius)" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{event.action}</span>
                  <span className="text-muted" style={{ marginLeft: "var(--space-sm)" }}>{event.actorIdentifier}</span>
                </div>
                <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== USERS TAB =====
function UsersTab({ sessionToken }: { sessionToken: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "admins" | "moderators">("all");
  const [offset, setOffset] = useState(0);

  const usersData = useQuery(api.admin.getUsers, {
    sessionToken,
    limit: 20,
    offset,
    filter,
    search: search || undefined,
  });

  const banUser = useMutation(api.admin.banUser);
  const unbanUser = useMutation(api.admin.unbanUser);
  const changeRole = useMutation(api.admin.changeUserRole);

  const handleBan = async (userId: Id<"users">) => {
    const reason = prompt("Enter reason for ban:");
    if (!reason) return;
    try {
      await banUser({ sessionToken, userId, reason });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleUnban = async (userId: Id<"users">) => {
    if (!confirm("Unban this user?")) return;
    try {
      await unbanUser({ sessionToken, userId });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleRoleChange = async (userId: Id<"users">, newRole: "user" | "moderator" | "admin") => {
    const reason = prompt(`Change role to ${newRole}. Enter reason:`);
    if (!reason) return;
    try {
      await changeRole({ sessionToken, userId, newRole, reason });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      {/* Search & Filters */}
      <div className="card" style={{ padding: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by BattleTag..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
              className="input"
              style={{ width: "100%", paddingLeft: 40 }}
            />
          </div>
          <select
            className="input"
            value={filter}
            onChange={(e) => { setFilter(e.target.value as "all" | "banned" | "admins" | "moderators"); setOffset(0); }}
            style={{ width: 150 }}
          >
            <option value="all">All Users</option>
            <option value="banned">Banned</option>
            <option value="admins">Admins</option>
            <option value="moderators">Moderators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-elevated)", textAlign: "left" }}>
              <th style={{ padding: "var(--space-md)", fontWeight: 500 }}>User</th>
              <th style={{ padding: "var(--space-md)", fontWeight: 500 }}>Role</th>
              <th style={{ padding: "var(--space-md)", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "var(--space-md)", fontWeight: 500 }}>Designs</th>
              <th style={{ padding: "var(--space-md)", fontWeight: 500 }}>Joined</th>
              <th style={{ padding: "var(--space-md)", fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersData?.users.map((user) => (
              <tr key={user._id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "var(--space-md)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-elevated)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User size={16} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                    <Link href={`/user/${user._id}`} style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                      {user.battleTag}
                    </Link>
                  </div>
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  <span className={`badge ${user.role === "admin" ? "badge-gold" : user.role === "moderator" ? "" : "badge-outline"}`}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  {user.banned ? (
                    <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                      <Ban size={14} /> Banned
                    </span>
                  ) : (
                    <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                      <UserCheck size={14} /> Active
                    </span>
                  )}
                </td>
                <td style={{ padding: "var(--space-md)" }}>{user.stats.creationsCount}</td>
                <td style={{ padding: "var(--space-md)", color: "var(--text-muted)" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                    {user.banned ? (
                      <button className="btn btn-ghost" onClick={() => handleUnban(user._id)} style={{ padding: "4px 8px", fontSize: "0.875rem" }}>
                        Unban
                      </button>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => handleBan(user._id)} style={{ padding: "4px 8px", fontSize: "0.875rem", color: "#ef4444" }}>
                        Ban
                      </button>
                    )}
                    <select
                      className="input"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value as "user" | "moderator" | "admin")}
                      style={{ padding: "4px 8px", fontSize: "0.875rem", width: 110 }}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {usersData && (
          <div style={{ padding: "var(--space-md)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="text-muted">
              Showing {offset + 1}-{Math.min(offset + 20, usersData.total)} of {usersData.total}
            </span>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button className="btn btn-ghost" onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0}>
                Previous
              </button>
              <button className="btn btn-ghost" onClick={() => setOffset(offset + 20)} disabled={!usersData.hasMore}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ACTIVITY TAB =====
function ActivityTab({ sessionToken }: { sessionToken: string }) {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [offset, setOffset] = useState(0);

  const auditStats = useQuery(api.auditLog.getStats, { sessionToken, timeRange });
  const auditLogs = useQuery(api.auditLog.getRecent, {
    sessionToken,
    limit: 50,
    offset,
    filters: actionFilter ? { action: actionFilter } : undefined,
  });

  const severityColors: Record<string, string> = {
    info: "var(--text-muted)",
    warning: "#f59e0b",
    error: "#ef4444",
    critical: "#dc2626",
  };

  return (
    <div>
      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
        <StatCard
          icon={<Activity size={24} />}
          value={auditStats?.total ?? 0}
          label="Total Events"
          subtext={`in ${timeRange}`}
          color="var(--accent)"
        />
        <StatCard
          icon={<Users size={24} />}
          value={auditStats?.uniqueActors ?? 0}
          label="Unique Users"
          subtext="active"
          color="#22c55e"
        />
        <StatCard
          icon={<AlertTriangle size={24} />}
          value={auditStats?.bySeverity.warning ?? 0}
          label="Warnings"
          subtext={`${auditStats?.bySeverity.error ?? 0} errors`}
          color="#f59e0b"
        />
        <StatCard
          icon={<AlertCircle size={24} />}
          value={auditStats?.bySeverity.critical ?? 0}
          label="Critical"
          subtext="events"
          color="#ef4444"
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
          <select
            className="input"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "24h" | "7d" | "30d")}
            style={{ width: 150 }}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <select
            className="input"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setOffset(0); }}
            style={{ width: 200 }}
          >
            <option value="">All Actions</option>
            <optgroup label="Auth">
              <option value="auth.login">Login</option>
              <option value="auth.logout">Logout</option>
              <option value="auth.session_rotated">Session Rotated</option>
            </optgroup>
            <optgroup label="Admin">
              <option value="admin.user_banned">User Banned</option>
              <option value="admin.user_unbanned">User Unbanned</option>
              <option value="admin.user_role_changed">Role Changed</option>
            </optgroup>
            <optgroup label="Content">
              <option value="content.created">Content Created</option>
              <option value="content.deleted">Content Deleted</option>
              <option value="content.hidden">Content Hidden</option>
            </optgroup>
            <optgroup label="Security">
              <option value="security.rate_limited">Rate Limited</option>
              <option value="security.suspicious_activity">Suspicious Activity</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card" style={{ padding: "var(--space-lg)" }}>
        <h3 style={{ marginBottom: "var(--space-md)" }}>Activity Log</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {auditLogs?.logs.map((log: { _id: string; action: string; actorIdentifier: string; targetIdentifier?: string; severity: string; createdAt: number; metadata?: { reason?: string } }) => (
            <div
              key={log._id}
              style={{
                padding: "var(--space-md)",
                background: "var(--surface-elevated)",
                borderRadius: "var(--radius)",
                borderLeft: `3px solid ${severityColors[log.severity]}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-xs)" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{log.action}</span>
                  <span className="text-muted" style={{ marginLeft: "var(--space-sm)" }}>
                    by {log.actorIdentifier}
                  </span>
                </div>
                <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {log.targetIdentifier && (
                <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                  Target: {log.targetIdentifier}
                </div>
              )}
              {log.metadata?.reason && (
                <div style={{ marginTop: "var(--space-xs)", fontSize: "0.875rem", fontStyle: "italic" }}>
                  Reason: {log.metadata.reason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {auditLogs && (
          <div style={{ marginTop: "var(--space-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="text-muted">
              Showing {offset + 1}-{Math.min(offset + 50, auditLogs.total)} of {auditLogs.total}
            </span>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button className="btn btn-ghost" onClick={() => setOffset(Math.max(0, offset - 50))} disabled={offset === 0}>
                Previous
              </button>
              <button className="btn btn-ghost" onClick={() => setOffset(offset + 50)} disabled={!auditLogs.hasMore}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== REPORTS TAB =====
function ReportsTab({ sessionToken }: { sessionToken: string }) {
  const pendingReports = useQuery(api.reports.getPending, { limit: 50 });
  const updateReportStatus = useMutation(api.reports.updateStatus);
  const hideCreation = useMutation(api.admin.hideCreation);
  const [processingReport, setProcessingReport] = useState<string | null>(null);

  const handleReportAction = async (
    reportId: Id<"reports">,
    status: "reviewed" | "dismissed" | "actioned",
    creationId?: Id<"creations">
  ) => {
    setProcessingReport(reportId);
    try {
      await updateReportStatus({ reportId, status, sessionToken });

      // If actioned, also hide the creation
      if (status === "actioned" && creationId) {
        await hideCreation({ sessionToken, creationId, reason: "Content reported and actioned by moderator" });
      }
    } catch (error) {
      console.error("Failed to update report:", error);
      alert(error instanceof Error ? error.message : "Failed to update report");
    } finally {
      setProcessingReport(null);
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
          <CheckCircle2 size={48} style={{ color: "#22c55e", marginBottom: "var(--space-md)" }} />
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
                  onClick={() => handleReportAction(report._id, "actioned", report.creationId)}
                  disabled={processingReport === report._id}
                  style={{ flex: 1 }}
                >
                  <CheckCircle size={16} />
                  Hide Content
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== CONTENT TAB =====
function ContentTab({ sessionToken }: { sessionToken: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "hidden" | "deleted">("all");
  const [offset, setOffset] = useState(0);

  const creationsData = useQuery(api.admin.getCreations, {
    sessionToken,
    limit: 20,
    offset,
    status,
    search: search || undefined,
  });

  const hideCreation = useMutation(api.admin.hideCreation);
  const restoreCreation = useMutation(api.admin.restoreCreation);

  const handleHide = async (creationId: Id<"creations">) => {
    const reason = prompt("Enter reason for hiding:");
    if (!reason) return;
    try {
      await hideCreation({ sessionToken, creationId, reason });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleRestore = async (creationId: Id<"creations">) => {
    if (!confirm("Restore this design?")) return;
    try {
      await restoreCreation({ sessionToken, creationId });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const statusColors: Record<string, string> = {
    published: "#22c55e",
    hidden: "#f59e0b",
    deleted: "#ef4444",
  };

  return (
    <div>
      {/* Search & Filters */}
      <div className="card" style={{ padding: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search designs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
              className="input"
              style={{ width: "100%", paddingLeft: 40 }}
            />
          </div>
          <select
            className="input"
            value={status}
            onChange={(e) => { setStatus(e.target.value as "all" | "published" | "hidden" | "deleted"); setOffset(0); }}
            style={{ width: 150 }}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-md)" }}>
        {creationsData?.creations.map((creation) => (
          <div key={creation._id} className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              {/* Thumbnail */}
              <div style={{ width: 120, height: 80, background: "var(--surface-elevated)", flexShrink: 0 }}>
                {creation.thumbnailUrl && (
                  <img src={creation.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: "var(--space-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Link href={`/design/${creation._id}`} style={{ fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>
                    {creation.title}
                  </Link>
                  <span style={{ color: statusColors[creation.status], fontSize: "0.75rem", textTransform: "uppercase" }}>
                    {creation.status}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.875rem", marginTop: "var(--space-xs)" }}>
                  by {creation.creator?.battleTag || "Unknown"}
                </div>
                <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-sm)", fontSize: "0.875rem" }}>
                  <span className="text-muted">{creation.likeCount} likes</span>
                  <span className="text-muted">{creation.viewCount} views</span>
                  {creation.pendingReports > 0 && (
                    <span style={{ color: "#ef4444" }}>{creation.pendingReports} reports</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "var(--space-sm)", borderTop: "1px solid var(--border)", display: "flex", gap: "var(--space-xs)" }}>
              {creation.status === "published" ? (
                <button className="btn btn-ghost" onClick={() => handleHide(creation._id)} style={{ flex: 1, fontSize: "0.875rem" }}>
                  Hide
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={() => handleRestore(creation._id)} style={{ flex: 1, fontSize: "0.875rem" }}>
                  Restore
                </button>
              )}
              <Link href={`/design/${creation._id}`} className="btn btn-ghost" style={{ flex: 1, fontSize: "0.875rem", textAlign: "center" }}>
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {creationsData && (
        <div style={{ marginTop: "var(--space-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="text-muted">
            Showing {offset + 1}-{Math.min(offset + 20, creationsData.total)} of {creationsData.total}
          </span>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button className="btn btn-ghost" onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0}>
              Previous
            </button>
            <button className="btn btn-ghost" onClick={() => setOffset(offset + 20)} disabled={!creationsData.hasMore}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== SETTINGS TAB (Game Data) =====
function SettingsTab({ sessionToken: _sessionToken }: { sessionToken: string }) {
  const cacheStats = useQuery(api.gameData.getCacheStats);
  const questCacheStats = useQuery(api.gameData.getQuestCacheStats);
  const decorCategories = useQuery(api.gameData.getDecorCategories);
  const syncFromEnv = useAction(api.gameData.syncFromEnv);
  const syncQuests = useAction(api.gameData.syncQuests);
  const testBlizzardApi = useAction(api.gameData.testBlizzardApi);
  const testWowheadTooltip = useAction(api.gameData.testWowheadTooltip);
  const enrichFromWowhead = useAction(api.gameData.enrichFromWowhead);
  const testCharacterAchievements = useAction(api.gameData.testCharacterAchievements);

  // Seed data actions
  const seedDatabase = useAction(api.seed.seedDatabase);
  const clearSeedData = useMutation(api.seed.clearSeedData);

  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Seed data state
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [clearing, setClearing] = useState(false);

  // Unified test state
  const [testType, setTestType] = useState<"blizzard" | "wowhead" | "character">("blizzard");
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Test input states
  const [testDecorId, setTestDecorId] = useState("533");
  const [testWowItemId, setTestWowItemId] = useState("246867");
  const [testCharRealm, setTestCharRealm] = useState("area-52");
  const [testCharName, setTestCharName] = useState("");
  const [testCharRegion, setTestCharRegion] = useState("us");
  const [testCharAchievementIds, setTestCharAchievementIds] = useState("41186");

  // Wowhead enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<any>(null);
  const [resetting, setResetting] = useState(false);
  const resetEnrichment = useMutation(api.gameData.resetEnrichmentTimestamps);

  // Quest sync state
  const [syncingQuests, setSyncingQuests] = useState(false);
  const [questSyncResult, setQuestSyncResult] = useState<{ synced?: number; error?: string } | null>(null);

  // Quest linking state
  const linkQuestIds = useMutation(api.gameData.linkQuestIds);
  const [linkingQuests, setLinkingQuests] = useState(false);
  const [linkQuestResult, setLinkQuestResult] = useState<{ processed?: number; skipped?: number; linked?: number; notFound?: number; notFoundQuests?: string[]; error?: string } | null>(null);

  // Manual quest ID mapping state
  const setQuestIdByName = useMutation(api.gameData.setQuestIdByName);
  const [manualQuestName, setManualQuestName] = useState("");
  const [manualQuestId, setManualQuestId] = useState("");
  const [settingQuestId, setSettingQuestId] = useState(false);
  const [manualQuestResult, setManualQuestResult] = useState<{ updated?: number; questName?: string; questId?: number; error?: string } | null>(null);

  // Unmatched quest items query
  const unmatchedQuestItems = useQuery(api.gameData.getUnmatchedQuestItems, { limit: 50 });
  const deleteDecorItems = useMutation(api.gameData.deleteDecorItems);

  // Suppress unused variable warning - sessionToken reserved for future authenticated operations
  void _sessionToken;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <>
      {/* Cache Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
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
          <FileText size={24} style={{ color: "rgb(255, 209, 0)", marginBottom: "var(--space-sm)" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{questCacheStats?.count ?? "..."}</div>
          <div className="text-muted">Quests</div>
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

      {/* Sync Quests */}
      <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
        <h2 style={{ marginBottom: "var(--space-sm)" }}>Sync Quest Database</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
          Fetch all quest names and IDs from Blizzard API for linking quest requirements to Wowhead.
          {questCacheStats?.count ? ` Currently cached: ${questCacheStats.count.toLocaleString()} quests.` : ""}
        </p>

        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", marginBottom: "var(--space-md)" }}>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setSyncingQuests(true);
              setQuestSyncResult(null);
              try {
                const result = await syncQuests({ region: "us" });
                setQuestSyncResult(result);
              } catch (error) {
                setQuestSyncResult({ error: String(error) });
              } finally {
                setSyncingQuests(false);
              }
            }}
            disabled={syncingQuests}
          >
            {syncingQuests ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
            Sync Quests
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              setLinkingQuests(true);
              setLinkQuestResult(null);
              try {
                const result = await linkQuestIds({});
                setLinkQuestResult(result);
              } catch (error) {
                setLinkQuestResult({ error: String(error) });
              } finally {
                setLinkingQuests(false);
              }
            }}
            disabled={linkingQuests || syncingQuests}
          >
            {linkingQuests ? <RefreshCw size={16} className="animate-spin" /> : null}
            Link Quest IDs
          </button>
        </div>

        {syncingQuests && (
          <p className="text-muted">Syncing quests from Blizzard API... This may take a while.</p>
        )}

        {questSyncResult && (
          <div
            style={{
              background: questSyncResult.error ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
              borderRadius: "var(--radius)",
              padding: "var(--space-md)",
              marginBottom: "var(--space-md)",
            }}
          >
            {questSyncResult.error ? (
              <p style={{ color: "#ef4444", margin: 0 }}>{questSyncResult.error}</p>
            ) : (
              <p style={{ color: "#22c55e", margin: 0 }}>
                Synced {questSyncResult.synced?.toLocaleString()} quests
              </p>
            )}
          </div>
        )}

        {linkQuestResult && (
          <div
            style={{
              background: linkQuestResult.error ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
              borderRadius: "var(--radius)",
              padding: "var(--space-md)",
            }}
          >
            {linkQuestResult.error ? (
              <p style={{ color: "#ef4444", margin: 0 }}>{linkQuestResult.error}</p>
            ) : (
              <div>
                <p style={{ color: "#22c55e", margin: 0, marginBottom: "var(--space-sm)" }}>
                  Linked {linkQuestResult.linked} quest IDs (processed {linkQuestResult.processed}, skipped {linkQuestResult.skipped} already linked)
                </p>
                {linkQuestResult.notFound !== undefined && linkQuestResult.notFound > 0 && (
                  <div style={{ fontSize: "0.875rem" }}>
                    <p style={{ color: "#f59e0b", margin: 0, marginBottom: "var(--space-xs)" }}>
                      {linkQuestResult.notFound} quests not found in database:
                    </p>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {linkQuestResult.notFoundQuests?.map((name, i) => (
                        <div key={i}>{name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Quest ID Setter */}
        <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ marginBottom: "var(--space-sm)", fontSize: "1rem" }}>Manual Quest ID Override</h3>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)", fontSize: "0.875rem" }}>
            For quests not found in the database, manually set the Wowhead quest ID.
          </p>
          <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Quest Name (exact)</label>
              <input
                type="text"
                value={manualQuestName}
                onChange={(e) => setManualQuestName(e.target.value)}
                placeholder="I TAKE Candle!"
                className="input"
                style={{ width: 200 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Quest ID</label>
              <input
                type="number"
                value={manualQuestId}
                onChange={(e) => setManualQuestId(e.target.value)}
                placeholder="26229"
                className="input"
                style={{ width: 120 }}
              />
            </div>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                if (!manualQuestName.trim() || !manualQuestId.trim()) return;
                setSettingQuestId(true);
                setManualQuestResult(null);
                try {
                  const result = await setQuestIdByName({
                    questName: manualQuestName.trim(),
                    questId: parseInt(manualQuestId, 10),
                  });
                  setManualQuestResult(result);
                  setManualQuestName("");
                  setManualQuestId("");
                } catch (error) {
                  setManualQuestResult({ error: String(error) });
                } finally {
                  setSettingQuestId(false);
                }
              }}
              disabled={settingQuestId || !manualQuestName.trim() || !manualQuestId.trim()}
            >
              {settingQuestId ? <RefreshCw size={14} className="animate-spin" /> : null}
              Set Quest ID
            </button>
          </div>
          {manualQuestResult && (
            <div style={{ marginTop: "var(--space-sm)", fontSize: "0.875rem" }}>
              {manualQuestResult.error ? (
                <span style={{ color: "#ef4444" }}>{manualQuestResult.error}</span>
              ) : (
                <span style={{ color: "#22c55e" }}>
                  Updated {manualQuestResult.updated} items: &quot;{manualQuestResult.questName}&quot; → Quest ID {manualQuestResult.questId}
                </span>
              )}
            </div>
          )}

          {/* Unmatched Quest Items */}
          {unmatchedQuestItems && unmatchedQuestItems.total > 0 && (
            <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-md)", borderTop: "1px solid var(--border)" }}>
              <h4 style={{ marginBottom: "var(--space-sm)", fontSize: "0.875rem", color: "#f59e0b" }}>
                Decor items with unmatched quests ({unmatchedQuestItems.total})
                {unmatchedQuestItems.hasMore && <span className="text-muted"> (showing first {unmatchedQuestItems.items.length})</span>}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", maxHeight: 300, overflow: "auto" }}>
                {unmatchedQuestItems.items.map((item) => (
                  <div
                    key={item.blizzardId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      padding: "var(--space-sm)",
                      background: "var(--surface-elevated)",
                      borderRadius: "var(--radius)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {item.iconUrl && (
                      <img
                        src={item.iconUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: "var(--radius)", objectFit: "cover" }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ color: "rgb(255, 209, 0)", fontSize: "0.75rem" }}>
                        Quest: {item.questName}
                        {item.questId && <span style={{ color: "var(--text-muted)" }}> (ID: {item.questId} - not in DB)</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                      {item.wowItemId && (
                        <a
                          href={`https://www.wowhead.com/item=${item.wowItemId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        >
                          Item
                        </a>
                      )}
                      <a
                        href={`https://www.wowhead.com/search?q=${encodeURIComponent(item.questName || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: "0.75rem", color: "rgb(255, 209, 0)" }}
                      >
                        Search Quest
                      </a>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#ef4444" }}
                        onClick={async () => {
                          if (confirm(`Delete "${item.name}" (ID: ${item.blizzardId})?`)) {
                            await deleteDecorItems({ blizzardIds: [item.blizzardId] });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enrich from Wowhead */}
      <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
        <h2 style={{ marginBottom: "var(--space-sm)" }}>Enrich from Wowhead</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
          Fetch budget costs, quest requirements, reputation/renown, and profession requirements from Wowhead tooltips.
        </p>

        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", marginBottom: "var(--space-md)" }}>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setEnriching(true);
              setEnrichResult(null);
              try {
                const result = await enrichFromWowhead({ limit: 100, onlyMissingBudget: true });
                setEnrichResult(result);
              } catch (error) {
                setEnrichResult({ error: String(error) });
              } finally {
                setEnriching(false);
              }
            }}
            disabled={enriching}
          >
            {enriching ? <RefreshCw size={16} className="animate-spin" /> : null}
            Enrich Missing (100)
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              setEnriching(true);
              setEnrichResult(null);
              try {
                const result = await enrichFromWowhead({ limit: 200, onlyMissingBudget: false, onlyMissingNewFields: true });
                setEnrichResult(result);
              } catch (error) {
                setEnrichResult({ error: String(error) });
              } finally {
                setEnriching(false);
              }
            }}
            disabled={enriching}
          >
            {enriching ? <RefreshCw size={16} className="animate-spin" /> : null}
            Re-Enrich (200)
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              setResetting(true);
              try {
                const result = await resetEnrichment({});
                setEnrichResult({ reset: result.reset, message: `Reset ${result.reset} items for re-enrichment` });
              } catch (error) {
                setEnrichResult({ error: String(error) });
              } finally {
                setResetting(false);
              }
            }}
            disabled={resetting || enriching}
            style={{ color: "var(--text-muted)" }}
          >
            {resetting ? <RefreshCw size={16} className="animate-spin" /> : null}
            Reset All
          </button>
        </div>

        {enriching && (
          <p className="text-muted">Fetching Wowhead tooltips... This may take a moment.</p>
        )}

        {enrichResult && (
          <div
            style={{
              background: "var(--bg-deep)",
              borderRadius: "var(--radius)",
              padding: "var(--space-md)",
              maxHeight: 300,
              overflow: "auto",
            }}
          >
            {enrichResult.error ? (
              <p style={{ color: "#ef4444" }}>{enrichResult.error}</p>
            ) : (
              <>
                <p style={{ marginBottom: "var(--space-sm)" }}>
                  <strong>Processed:</strong> {enrichResult.processed} |
                  <strong> Enriched:</strong> {enrichResult.enriched} |
                  <strong> Failed:</strong> {enrichResult.failed}
                </p>
                <div style={{ fontSize: "0.75rem" }}>
                  {enrichResult.results?.map((r: any, i: number) => {
                    const hasData = r.budgetCost || r.quest || r.reputation || r.profession;
                    return (
                      <div key={i} style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", opacity: hasData ? 1 : 0.5, marginBottom: 4 }}>
                        <span style={{ minWidth: 200 }}>{r.name}</span>
                        {r.budgetCost !== null && (
                          <span style={{ color: "#22c55e" }}>
                            <img src="https://wow.zamimg.com/images/wow/TextureAtlas/live/house-decor-budget-icon.webp" alt="" style={{ width: 12, height: 12, verticalAlign: "middle" }} /> {r.budgetCost}
                          </span>
                        )}
                        {r.quest && (
                          <span style={{ color: "rgb(255, 209, 0)" }}>Quest: {r.quest}</span>
                        )}
                        {r.reputation && (
                          <span style={{ color: "#8b5cf6" }}>Rep: {r.reputation}</span>
                        )}
                        {r.profession && (
                          <span style={{ color: "#fd7e14" }}>Prof: {r.profession}</span>
                        )}
                        {r.error && !hasData && (
                          <span style={{ color: "#ef4444" }}>{r.error}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Seed Data */}
      <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
        <h2 style={{ marginBottom: "var(--space-sm)" }}>Seed Database</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
          Generate dummy users, designs, likes, follows, and comments for testing.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
          <button
            className="btn btn-primary"
            onClick={async () => {
              setSeeding(true);
              setSeedResult(null);
              try {
                const result = await seedDatabase({ userCount: 10, designsPerUser: 3, addInteractions: true });
                setSeedResult({ type: "success", message: result.message });
              } catch (error) {
                setSeedResult({ type: "error", message: String(error) });
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding || clearing}
          >
            {seeding && <RefreshCw size={18} className="animate-spin" />}
            Seed Database
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              if (!confirm("Delete all seeded data? This will remove users with IDs starting with 'seed_' and all their content.")) return;
              setClearing(true);
              setSeedResult(null);
              try {
                const result = await clearSeedData({});
                setSeedResult({ type: "success", message: result.message });
              } catch (error) {
                setSeedResult({ type: "error", message: String(error) });
              } finally {
                setClearing(false);
              }
            }}
            disabled={seeding || clearing}
            style={{ color: "#ef4444" }}
          >
            {clearing && <RefreshCw size={18} className="animate-spin" />}
            Delete Seed Data
          </button>
        </div>

        {seedResult && (
          <div
            style={{
              marginTop: "var(--space-md)",
              padding: "var(--space-md)",
              borderRadius: "var(--radius)",
              background: seedResult.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${seedResult.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-sm)",
            }}
          >
            {seedResult.type === "success" ? (
              <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: "0.875rem" }}>{seedResult.message}</span>
          </div>
        )}
      </div>

      {/* API Testing */}
      <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
        <h2 style={{ marginBottom: "var(--space-sm)" }}>API Testing</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
          Test Blizzard API, Wowhead tooltips, and character achievements.
        </p>

        {/* Test Type Selector */}
        <div style={{ display: "flex", gap: "var(--space-xs)", marginBottom: "var(--space-lg)" }}>
          <button
            className={`btn ${testType === "blizzard" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setTestType("blizzard"); setTestResponse(null); }}
          >
            Blizzard API
          </button>
          <button
            className={`btn ${testType === "wowhead" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setTestType("wowhead"); setTestResponse(null); }}
          >
            Wowhead
          </button>
          <button
            className={`btn ${testType === "character" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setTestType("character"); setTestResponse(null); }}
          >
            Character Achievements
          </button>
        </div>

        {/* Blizzard API Test */}
        {testType === "blizzard" && (
          <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <input
              type="number"
              value={testDecorId}
              onChange={(e) => setTestDecorId(e.target.value)}
              placeholder="Decor ID (e.g. 533)"
              className="input"
              style={{ width: 150 }}
            />
            <button
              className="btn btn-secondary"
              onClick={async () => {
                setTestLoading(true);
                setTestResponse(null);
                try {
                  const result = await testBlizzardApi({ decorId: parseInt(testDecorId) || 533 });
                  setTestResponse(result);
                } catch (error) {
                  setTestResponse({ error: String(error) });
                } finally {
                  setTestLoading(false);
                }
              }}
              disabled={testLoading}
            >
              {testLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Test API
            </button>
          </div>
        )}

        {/* Wowhead Test */}
        {testType === "wowhead" && (
          <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <input
              type="number"
              value={testWowItemId}
              onChange={(e) => setTestWowItemId(e.target.value)}
              placeholder="WoW Item ID (e.g. 246867)"
              className="input"
              style={{ width: 180 }}
            />
            <button
              className="btn btn-secondary"
              onClick={async () => {
                setTestLoading(true);
                setTestResponse(null);
                try {
                  const result = await testWowheadTooltip({ wowItemId: parseInt(testWowItemId) || 246867 });
                  setTestResponse(result);
                } catch (error) {
                  setTestResponse({ error: String(error) });
                } finally {
                  setTestLoading(false);
                }
              }}
              disabled={testLoading}
            >
              {testLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Test Wowhead
            </button>
          </div>
        )}

        {/* Character Achievements Test */}
        {testType === "character" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", alignItems: "flex-end", marginBottom: "var(--space-md)" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Region</label>
              <select
                value={testCharRegion}
                onChange={(e) => setTestCharRegion(e.target.value)}
                className="input"
                style={{ width: 80 }}
              >
                <option value="us">US</option>
                <option value="eu">EU</option>
                <option value="kr">KR</option>
                <option value="tw">TW</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Realm</label>
              <input
                type="text"
                value={testCharRealm}
                onChange={(e) => setTestCharRealm(e.target.value)}
                placeholder="area-52"
                className="input"
                style={{ width: 140 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Character Name</label>
              <input
                type="text"
                value={testCharName}
                onChange={(e) => setTestCharName(e.target.value)}
                placeholder="charactername"
                className="input"
                style={{ width: 150 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Achievement IDs</label>
              <input
                type="text"
                value={testCharAchievementIds}
                onChange={(e) => setTestCharAchievementIds(e.target.value)}
                placeholder="41186,12345"
                className="input"
                style={{ width: 150 }}
              />
            </div>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                if (!testCharName.trim() || !testCharRealm.trim()) {
                  alert("Please enter character name and realm");
                  return;
                }
                setTestLoading(true);
                setTestResponse(null);
                try {
                  const achievementIds = testCharAchievementIds
                    .split(",")
                    .map((s) => parseInt(s.trim()))
                    .filter((n) => !isNaN(n));
                  const result = await testCharacterAchievements({
                    realmSlug: testCharRealm.trim().toLowerCase(),
                    characterName: testCharName.trim().toLowerCase(),
                    region: testCharRegion,
                    achievementIds: achievementIds.length > 0 ? achievementIds : undefined,
                  });
                  setTestResponse(result);
                } catch (error) {
                  setTestResponse({ error: String(error) });
                } finally {
                  setTestLoading(false);
                }
              }}
              disabled={testLoading}
            >
              {testLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Check
            </button>
          </div>
        )}

        {/* Unified Results Area */}
        {testResponse && (
          <div
            style={{
              background: "var(--bg-deep)",
              borderRadius: "var(--radius)",
              padding: "var(--space-md)",
              maxHeight: 500,
              overflow: "auto",
            }}
          >
            {testType === "character" && !testResponse.error ? (
              <div>
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <strong>Character:</strong> {testResponse.character?.name} - {testResponse.character?.realm}
                  {testResponse.character?.level && <span> (Level {testResponse.character.level})</span>}
                </div>
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <strong>Total Achievements:</strong> {testResponse.achievementSummary?.total} ({testResponse.achievementSummary?.points} points)
                </div>
                {testResponse.requestedAchievements && testResponse.requestedAchievements.length > 0 && (
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <strong>Requested Achievements:</strong>
                    <div style={{ marginTop: "var(--space-xs)" }}>
                      {testResponse.requestedAchievements.map((ach: any) => (
                        <div
                          key={ach.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-sm)",
                            padding: "var(--space-xs) 0",
                            color: ach.completed ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {ach.completed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          <a
                            href={`https://www.wowhead.com/achievement=${ach.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "inherit" }}
                          >
                            {ach.name || `Achievement ${ach.id}`}
                          </a>
                          {ach.completedAt && (
                            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                              ({new Date(ach.completedAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {testResponse.recentAchievements && testResponse.recentAchievements.length > 0 && (
                  <div>
                    <strong>Recent Achievements:</strong>
                    <div style={{ marginTop: "var(--space-xs)", fontSize: "0.8125rem" }}>
                      {testResponse.recentAchievements.slice(0, 5).map((ach: any) => (
                        <div key={ach.id} style={{ padding: "2px 0", color: "var(--text-secondary)" }}>
                          <a
                            href={`https://www.wowhead.com/achievement=${ach.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--accent)" }}
                          >
                            {ach.name}
                          </a>
                          <span style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "var(--space-xs)" }}>
                            {new Date(ach.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <pre style={{ margin: 0, fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Categories */}
      {decorCategories && decorCategories.length > 0 && (
        <div className="card" style={{ padding: "var(--space-lg)" }}>
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
    </>
  );
}

// ===== SHARED COMPONENTS =====
function StatCard({
  icon,
  value,
  label,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: "var(--space-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-sm)" }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value}</div>
      <div className="text-muted" style={{ fontSize: "0.875rem" }}>{label}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--space-xs)" }}>{subtext}</div>
    </div>
  );
}
