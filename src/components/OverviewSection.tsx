import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  AnomalyRecord,
  AnomalyStatus,
  CrewAgentRuntimeState,
  DashboardOverview,
  NavSection,
} from '../types/anomalix.ts';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';
import {
  type OverviewReviewFilter,
  prioritizeAnomaliesForReview,
} from '../utils/tableFilters.ts';
import { SeverityBadge, StatusIndicator } from './SeverityBadge.tsx';

interface OverviewSectionProps {
  overview: DashboardOverview;
  anomalies: AnomalyRecord[];
  agents: CrewAgentRuntimeState[];
  onInspectAnomaly: (anomaly: AnomalyRecord) => void;
  onUpdateAnomalyStatus: (anomalyId: string, status: AnomalyStatus) => Promise<void>;
  onNavigate: (section: NavSection) => void;
}

export function OverviewSection({
  overview,
  anomalies,
  agents,
  onInspectAnomaly,
  onUpdateAnomalyStatus,
  onNavigate,
}: OverviewSectionProps) {
  const [reviewFilter, setReviewFilter] = useState<OverviewReviewFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const prioritizedAnomalies = useMemo(
    () => prioritizeAnomaliesForReview(anomalies, reviewFilter),
    [anomalies, reviewFilter]
  );

  const handleQuickTriage = async (
    e: React.MouseEvent,
    anomalyId: string,
    status: AnomalyStatus
  ) => {
    e.stopPropagation();
    setUpdatingId(anomalyId);
    try {
      await onUpdateAnomalyStatus(anomalyId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const kpiCards = [
    {
      label: 'Total Logs Analyzed',
      value: overview.totalLogsAnalyzed.toLocaleString(),
      trend: overview.trends.logsDelta,
      Icon: Database,
      surface: 'surface-blue-spill border-blue-300/80',
      valueColor: 'text-blue-800',
      iconColor: 'text-blue-800',
    },
    {
      label: 'Total Anomalies Detected',
      value: overview.totalAnomaliesDetected.toLocaleString(),
      trend: overview.trends.anomaliesDelta,
      Icon: FileWarning,
      surface: 'surface-silver-gold border-amber-300/80',
      valueColor: 'text-amber-800',
      iconColor: 'text-amber-800',
    },
    {
      label: 'Critical Threats',
      value: overview.criticalThreats.toLocaleString(),
      trend: overview.trends.criticalDelta,
      Icon: AlertOctagon,
      surface: 'surface-silver-gold border-amber-300/80',
      valueColor: overview.criticalThreats > 0 ? 'text-red-700' : 'text-slate-900',
      iconColor: 'text-red-700',
    },
    {
      label: 'High-Risk Events',
      value: overview.highRiskEvents.toLocaleString(),
      trend: overview.trends.highDelta,
      Icon: ShieldAlert,
      surface: 'surface-silver-gold border-amber-300/80',
      valueColor: overview.highRiskEvents > 0 ? 'text-amber-800' : 'text-slate-900',
      iconColor: 'text-amber-800',
    },
    {
      label: 'Medium-Risk Events',
      value: overview.mediumRiskEvents.toLocaleString(),
      trend: overview.trends.mediumDelta,
      Icon: AlertTriangle,
      surface: 'surface-blue-spill border-blue-300/80',
      valueColor: 'text-blue-800',
      iconColor: 'text-blue-800',
    },
    {
      label: 'System Security Score',
      value: `${overview.systemSecurityScore}/100`,
      trend: overview.trends.securityScoreDelta,
      Icon: ShieldCheck,
      surface: 'surface-green-spill border-emerald-300/80',
      valueColor: overview.systemSecurityScore >= 80 ? 'text-emerald-800' : 'text-amber-800',
      iconColor: 'text-emerald-800',
    },
  ];

  const filterTabs: Array<{ id: OverviewReviewFilter; label: string }> = [
    { id: 'all', label: `All (${anomalies.length})` },
    {
      id: 'needs_review',
      label: `Needs Review (${anomalies.filter((a) => a.status === 'Open' || a.status === 'Investigating' || a.status === 'Escalated').length})`,
    },
    { id: 'critical', label: `Critical (${overview.criticalThreats})` },
    { id: 'high', label: `High (${overview.highRiskEvents})` },
  ];

  return (
    <div className="space-y-6">
      {/* Apple-Inspired Spacious Hero Overview Header */}
      <div className="surface-silver-gold border border-amber-300/80 rounded-2xl px-7 py-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Executive Security Overview
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            Active Dataset: <span className="font-bold text-amber-800">{overview.activeLogSource}</span> · Sequential 5-Agent CrewAI Investigation Telemetry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('workflows')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Open Agent Workflows</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('investigations')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border border-emerald-400/70 bg-emerald-50/90 text-emerald-950 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>View Investigation Dossiers</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 6 KPI Metric Bento Cards */}
      <section aria-label="Security Key Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, trend, Icon, surface, valueColor, iconColor }) => (
          <div
            key={label}
            className={`${surface} border rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-3.5 transition-shadow duration-200 hover:shadow-md`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {label}
              </span>
              <span className="w-10 h-10 rounded-xl bg-white/90 border border-amber-300/70 flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
              </span>
            </div>
            <div className={`text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${valueColor}`}>
              {value}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 pt-2 border-t border-amber-300/45">
              <TrendingUp className="w-3.5 h-3.5 text-amber-800 shrink-0" aria-hidden="true" />
              <span>{trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Telemetry Split: Timeline Chart + CrewAI Sequential Agents Snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Timeline Chart (Blue Spill Card) */}
        <div className="xl:col-span-7 surface-blue-spill border border-blue-300/80 rounded-2xl p-6 flex flex-col shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Log Activity &amp; Anomaly Detection Timeline
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Log volume vs. detected statistical outliers across UTC windows
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('monitoring')}
              className="text-xs font-bold text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              Open Full Telemetry
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.timeline} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="lightBlueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lightAmberFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="timeBucket" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <YAxis stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#93c5fd',
                    color: '#0f172a',
                    fontFamily: 'Times New Roman, serif',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalLogs"
                  name="Total Logs"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#lightBlueFill)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="anomalies"
                  name="Anomalies"
                  stroke="#d97706"
                  strokeWidth={2}
                  fill="url(#lightAmberFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CrewAI Sequential Pipeline Snapshot (Green Spill Card) */}
        <div className="xl:col-span-5 surface-green-spill border border-emerald-300/80 rounded-2xl p-6 flex flex-col shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-800" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-900">CrewAI Agent Pipeline</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('workflows')}
              className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              Inspect Pipeline
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {agents.map((agent, idx) => (
              <div
                key={agent.id}
                className="bg-white/90 border border-emerald-300/70 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {idx + 1}. {agent.role}
                  </div>
                  <div className="text-xs text-slate-600 truncate mt-0.5">
                    Task: {agent.taskId}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-bold ${
                      agent.status === 'completed'
                        ? 'text-emerald-800'
                        : agent.status === 'running'
                          ? 'text-blue-800'
                          : agent.status === 'error'
                            ? 'text-red-700'
                            : 'text-slate-700'
                    }`}
                  >
                    {agent.outputStatus}
                  </div>
                  <div className="text-[11px] text-slate-600 tabular-nums">
                    {formatDuration(agent.durationMs)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgraded Prioritized Anomalies Requiring Review */}
      <section
        aria-label="Prioritized Anomalies Requiring Review"
        className="surface-silver-gold border border-amber-300/80 rounded-2xl overflow-hidden shadow-xs"
      >
        <div className="px-6 py-5 border-b border-amber-300/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Prioritized Anomalies Requiring Review
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Ranked by active triage priority and risk score · Filter severity, escalate or resolve inline, or open the full CrewAI dossier
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Filter Control */}
            <div
              role="group"
              aria-label="Filter prioritized anomalies"
              className="flex flex-wrap items-center gap-1 p-1 bg-white/90 border border-amber-300/80 rounded-xl"
            >
              {filterTabs.map((tab) => {
                const active = reviewFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReviewFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-amber-50/70 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('anomalies')}
              className="text-xs font-bold text-amber-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              View All Anomalies ({anomalies.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white/75">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/75 border-b border-amber-300/70 text-xs font-bold text-slate-900">
                <th className="py-3 px-3 whitespace-nowrap">Event &amp; Time</th>
                <th className="py-3 px-3 whitespace-nowrap">Source &amp; Asset</th>
                <th className="py-3 px-3">Threat Pattern</th>
                <th className="py-3 px-3 whitespace-nowrap">Signal</th>
                <th className="py-3 px-3 whitespace-nowrap">Risk</th>
                <th className="py-3 px-3 whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/70 text-sm">
              {prioritizedAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center space-y-2">
                    <div className="text-sm font-semibold text-slate-700">
                      No findings match this quick filter.
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewFilter('all')}
                      className="px-3.5 py-1.5 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-lg hover:bg-blue-100 cursor-pointer"
                    >
                      Show All Findings
                    </button>
                  </td>
                </tr>
              ) : (
                prioritizedAnomalies.slice(0, 6).map((anm) => {
                  const isBusy = updatingId === anm.id;
                  return (
                    <tr
                      key={anm.id}
                      onClick={() => onInspectAnomaly(anm)}
                      className="hover:bg-amber-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-amber-800 tabular-nums">{anm.eventId}</div>
                        <div className="text-[11px] text-slate-600 tabular-nums mt-0.5">
                          {formatTimestamp(anm.timestamp)}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[165px]">
                        <div className="text-slate-900 font-semibold tabular-nums whitespace-nowrap">
                          {anm.sourceIp}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5" title={`${anm.affectedAsset} · ${anm.username}`}>
                          {anm.affectedAsset}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[210px]">
                        <div className="font-semibold text-slate-900 truncate" title={anm.eventType}>
                          {anm.eventType}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5" title={anm.evidenceSummary}>
                          {anm.evidenceSummary}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-blue-800">
                            {anm.anomalyScore.toFixed(2)}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-700">
                            {anm.statisticalMetrics.zScore}σ
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">{anm.confidence}%</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-blue-600"
                            style={{ width: `${anm.confidence}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <SeverityBadge level={anm.riskLevel} score={anm.riskScore} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusIndicator status={anm.status} />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          {anm.status !== 'Escalated' && anm.status !== 'Resolved' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => handleQuickTriage(e, anm.id, 'Escalated')}
                              aria-label={`Escalate ${anm.eventId}`}
                              className="px-2 py-1 text-xs font-bold border border-red-300 bg-red-50/90 text-red-800 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Escalate
                            </button>
                          )}
                          {anm.status !== 'Resolved' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => handleQuickTriage(e, anm.id, 'Resolved')}
                              aria-label={`Resolve ${anm.eventId}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border border-emerald-400/70 bg-emerald-50/90 text-emerald-900 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              <span>Resolve</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectAnomaly(anm);
                            }}
                            aria-label={`Investigate ${anm.eventId}`}
                            className="px-2.5 py-1 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Investigate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
