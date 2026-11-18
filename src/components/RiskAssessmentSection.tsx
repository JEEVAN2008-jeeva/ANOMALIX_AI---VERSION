import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RiskAssessmentSummary, RiskLevel } from '../types/anomalix.ts';
import { getRiskAccentHex } from '../utils/formatters.ts';
import { SeverityBadge } from './SeverityBadge.tsx';

interface RiskAssessmentSectionProps {
  riskAssessment: RiskAssessmentSummary;
}

export function RiskAssessmentSection({ riskAssessment }: RiskAssessmentSectionProps) {
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
            Security Risk Assessment & Scoring Rubric
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Prioritized scoring by <span className="font-bold text-amber-800">risk_assessment_specialist</span> · Anomaly Score, Evidence Strength & Asset Impact
          </p>
        </div>
        <div className="flex items-center gap-6 tabular-nums">
          <div>
            <div className="text-xs font-semibold text-slate-600">Average Finding Risk</div>
            <div className="text-2xl font-bold text-amber-800">{riskAssessment.overallRiskScore}/100</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">System Security Score</div>
            <div className="text-2xl font-bold text-emerald-800">{riskAssessment.systemSecurityScore}/100</div>
          </div>
        </div>
      </div>

      {/* 4 Rubric Cards: Critical 75-100, High 50-74, Medium 25-49, Low 0-24 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {riskAssessment.brackets.map((b) => (
          <div
            key={b.level}
            className={`${
              b.level === 'Low'
                ? 'surface-green-spill border-emerald-300/80'
                : b.level === 'Medium'
                  ? 'surface-blue-spill border-blue-300/80'
                  : 'surface-silver-gold border-amber-300/80'
            } border rounded-lg p-5 flex flex-col justify-between gap-3 shadow-xs`}
          >
            <div className="flex items-center justify-between gap-2">
              <SeverityBadge level={b.level as RiskLevel} />
              <span className="text-xs font-bold text-slate-700 tabular-nums">Score {b.range}</span>
            </div>
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-3xl font-bold text-slate-900">{b.count}</span>
              <span className="text-xs text-slate-600">findings ({b.percentage}%)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-amber-200/80 pt-2.5">
              {b.description}
            </p>
          </div>
        ))}
      </div>

      {/* Charts: Risk Score Distribution & Risk Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface-blue-spill border border-blue-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Severity Distribution by Bracket</h3>
          <p className="text-xs text-slate-600 mb-4">
            Finding counts across Critical (75–100), High (50–74), Medium (25–49), and Low (0–24)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskAssessment.brackets} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="level" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <YAxis stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Findings" isAnimationActive={false}>
                  {riskAssessment.brackets.map((entry) => (
                    <Cell key={entry.level} fill={getRiskAccentHex(entry.level)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Risk vs. Security Posture Trend</h3>
          <p className="text-xs text-slate-600 mb-4">
            Temporal correlation of average risk score and effective system security score
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskAssessment.riskTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="label" stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#334155" tick={{ fill: '#334155', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke="#d97706" strokeWidth={2.5} isAnimationActive={false} />
                <Line type="monotone" dataKey="securityScore" name="Security Score" stroke="#059669" strokeWidth={2.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Findings Risk Matrix */}
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-amber-300/60">
          <h3 className="text-lg font-bold text-slate-900">Prioritized Risk Matrix</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Evidence strength, asset impact, confidence score, and specialist justification per finding
          </p>
        </div>
        <div className="overflow-x-auto bg-white/85">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/75 border-b border-amber-300/70 text-xs font-bold text-slate-900">
                <th className="py-3 px-4">Finding</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Evidence Strength</th>
                <th className="py-3 px-4">Asset Impact</th>
                <th className="py-3 px-4 text-right">Confidence</th>
                <th className="py-3 px-4">Specialist Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/70 text-sm">
              {riskAssessment.findings.map((f) => (
                <tr key={f.id} className="hover:bg-amber-50/60">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{f.title}</div>
                    <div className="text-xs text-amber-800 font-semibold tabular-nums">{f.eventId}</div>
                  </td>
                  <td className="py-3 px-4 text-blue-800 font-semibold tabular-nums whitespace-nowrap">{f.sourceIp}</td>
                  <td className="py-3 px-4">
                    <SeverityBadge level={f.riskLevel} score={f.riskScore} />
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{f.evidenceStrength}</td>
                  <td className="py-3 px-4 text-amber-800 font-bold whitespace-nowrap">{f.assetImpact}</td>
                  <td className="py-3 px-4 text-right text-slate-800 font-semibold tabular-nums">{f.confidenceScore}%</td>
                  <td className="py-3 px-4 text-xs text-slate-700 max-w-md leading-relaxed">
                    {f.reasoning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
