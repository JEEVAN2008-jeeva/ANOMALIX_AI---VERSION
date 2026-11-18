import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardOverview, RiskLevel } from '../types/anomalix.ts';
import { getRiskAccentHex } from '../utils/formatters.ts';

interface SecurityMonitoringSectionProps {
  overview: DashboardOverview;
}

export function SecurityMonitoringSection({ overview }: SecurityMonitoringSectionProps) {
  const [chartFocus, setChartFocus] = useState<'all' | 'anomalies'>('all');

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    borderColor: '#f59e0b',
    color: '#0f172a',
    fontFamily: 'Times New Roman, serif',
  };

  return (
    <div className="space-y-6">
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Security Threat Monitoring
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Real-time anomaly activity, severity distribution, log throughput, and risk trajectory
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white/90 border border-amber-300/80 rounded-md">
          <button
            type="button"
            onClick={() => setChartFocus('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition-colors ${
              chartFocus === 'all'
                ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Logs & Anomalies
          </button>
          <button
            type="button"
            onClick={() => setChartFocus('anomalies')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition-colors ${
              chartFocus === 'anomalies'
                ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Severity Breakdown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Anomaly Detection Timeline & Log Activity Over Time */}
        <div className="surface-blue-spill border border-blue-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">
            {chartFocus === 'all' ? 'Log Activity & Anomaly Detection Timeline' : 'Real-Time Anomaly Activity by Severity'}
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Interactive time-bucketed telemetry derived from the latest CrewAI run
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartFocus === 'all' ? (
                <AreaChart data={overview.timeline} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="timeBucket" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                  <YAxis stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="totalLogs" name="Total Logs" stroke="#2563eb" fill="#2563eb" fillOpacity={0.18} isAnimationActive={false} />
                  <Area type="monotone" dataKey="anomalies" name="Anomalies" stroke="#d97706" fill="#d97706" fillOpacity={0.28} isAnimationActive={false} />
                </AreaChart>
              ) : (
                <BarChart data={overview.timeline} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="timeBucket" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                  <YAxis stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="critical" name="Critical" stackId="sev" fill="#dc2626" isAnimationActive={false} />
                  <Bar dataKey="high" name="High" stackId="sev" fill="#d97706" isAnimationActive={false} />
                  <Bar dataKey="medium" name="Medium" stackId="sev" fill="#2563eb" isAnimationActive={false} />
                  <Bar dataKey="low" name="Low" stackId="sev" fill="#059669" isAnimationActive={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Threat Severity Distribution */}
        <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Threat Severity Distribution</h3>
          <p className="text-xs text-slate-600 mb-4">
            Proportion of findings across Critical, High, Medium, and Low risk tiers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.severityDistribution.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={4}
                    isAnimationActive={false}
                  >
                    {overview.severityDistribution
                      .filter((d) => d.count > 0)
                      .map((entry) => (
                        <Cell key={entry.level} fill={getRiskAccentHex(entry.level as RiskLevel)} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {overview.severityDistribution.map((item) => (
                <div
                  key={item.level}
                  className="bg-white/90 border border-amber-300/60 rounded-md px-3.5 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: getRiskAccentHex(item.level) }}
                    />
                    <span className="text-sm font-bold text-slate-800">{item.level}</span>
                  </div>
                  <div className="text-sm font-bold text-amber-800 tabular-nums">
                    {item.count} <span className="text-xs text-slate-600">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Event Type Volume vs Anomalies */}
        <div className="surface-blue-spill border border-blue-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Log Event Category Distribution</h3>
          <p className="text-xs text-slate-600 mb-4">
            Total log counts compared to flagged anomalies per event classification
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overview.eventTypeBreakdown.slice(0, 7)}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis type="number" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="eventType"
                  width={148}
                  stroke="#334155"
                  tick={{ fill: '#334155', fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="count" name="Total Events" fill="#2563eb" isAnimationActive={false} />
                <Bar dataKey="anomalies" name="Anomalous Events" fill="#d97706" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk Score Trajectory */}
        <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Risk Distribution Over Time</h3>
          <p className="text-xs text-slate-600 mb-4">
            Average risk score progression across observed activity buckets
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.timeline} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="timeBucket" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgRiskScore"
                  name="Average Risk Score (0-100)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#d97706', stroke: '#0f172a' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
