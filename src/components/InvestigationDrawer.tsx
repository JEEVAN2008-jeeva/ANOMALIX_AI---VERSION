import { CheckCircle2, FileText, ShieldAlert, X } from 'lucide-react';
import type { AnomalyRecord, AnomalyStatus } from '../types/anomalix.ts';
import { formatTimestamp } from '../utils/formatters.ts';
import { SeverityBadge, StatusIndicator } from './SeverityBadge.tsx';

interface InvestigationDrawerProps {
  anomaly: AnomalyRecord | null;
  onClose: () => void;
  onUpdateStatus: (anomalyId: string, status: AnomalyStatus) => Promise<void>;
  onOpenFullReport: (anomalyId: string) => void;
}

const STATUS_OPTIONS: AnomalyStatus[] = [
  'Open',
  'Investigating',
  'Escalated',
  'Resolved',
  'False Positive',
];

export function InvestigationDrawer({
  anomaly,
  onClose,
  onUpdateStatus,
  onOpenFullReport,
}: InvestigationDrawerProps) {
  if (!anomaly) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Investigation details for ${anomaly.eventId}`}
    >
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-2xl surface-silver-gold border-l border-amber-300 h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-amber-300/70 bg-gradient-to-r from-[#f8f8fa]/95 via-[#fdf9ec]/95 to-[#eff5fb]/95 flex items-start justify-between gap-4 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-amber-800 tabular-nums">
                {anomaly.id} · {anomaly.eventId}
              </span>
              <SeverityBadge level={anomaly.riskLevel} score={anomaly.riskScore} />
              <StatusIndicator status={anomaly.status} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">{anomaly.eventType}</h2>
            <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
              {formatTimestamp(anomaly.timestamp)} · Source IP {anomaly.sourceIp} · Account: {anomaly.username}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close investigation drawer"
            className="p-2 text-slate-700 hover:text-slate-900 bg-white border border-amber-300/80 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Statistical Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="surface-blue-spill border border-blue-300/80 rounded-md p-3">
              <div className="text-xs font-semibold text-slate-600">Anomaly Score</div>
              <div className="text-xl font-bold text-blue-800 tabular-nums mt-0.5">
                {anomaly.anomalyScore.toFixed(2)}
              </div>
            </div>
            <div className="surface-silver-gold border border-amber-300/80 rounded-md p-3">
              <div className="text-xs font-semibold text-slate-600">Risk Score</div>
              <div className="text-xl font-bold text-amber-800 tabular-nums mt-0.5">
                {anomaly.riskScore}/100
              </div>
            </div>
            <div className="surface-green-spill border border-emerald-300/80 rounded-md p-3">
              <div className="text-xs font-semibold text-slate-600">Confidence</div>
              <div className="text-xl font-bold text-emerald-800 tabular-nums mt-0.5">
                {anomaly.confidence}%
              </div>
            </div>
            <div className="surface-blue-spill border border-blue-300/80 rounded-md p-3">
              <div className="text-xs font-semibold text-slate-600">Z-Score</div>
              <div className="text-xl font-bold text-blue-800 tabular-nums mt-0.5">
                {anomaly.statisticalMetrics.zScore}σ
              </div>
            </div>
          </div>

          {/* Triage Status Control */}
          <div className="bg-white/90 border border-amber-300/80 rounded-md p-4">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Analyst Triage Status
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onUpdateStatus(anomaly.id, opt)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-sm border cursor-pointer transition-colors ${
                    anomaly.status === opt
                      ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border-amber-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:text-slate-900'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Summary */}
          <div className="pt-4 border-t border-amber-300/50 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Evidence Summary</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{anomaly.evidenceSummary}</p>
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 tabular-nums">
              <div>Detection Method: <span className="font-bold text-blue-800">{anomaly.detectionMethod}</span></div>
              <div>Affected Asset: <span className="font-bold text-amber-800">{anomaly.affectedAsset}</span></div>
              <div>Baseline Rate: <span className="font-bold text-slate-900">{anomaly.statisticalMetrics.baselineRate}</span></div>
              <div>Observed Rate: <span className="font-bold text-slate-900">{anomaly.statisticalMetrics.observedRate}</span></div>
              <div className="sm:col-span-2">
                Correlated Logs: <span className="font-bold text-blue-800">{anomaly.correlatedLogIds.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* AI Investigation Explanation */}
          <div className="surface-green-spill border border-emerald-300/80 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-800" aria-hidden="true" />
              <h3 className="text-sm font-bold text-emerald-800">
                CrewAI Threat Investigator Explanation
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{anomaly.aiExplanation}</p>
          </div>

          {/* Alternative Benign Explanations */}
          <div className="pt-4 border-t border-amber-300/50 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Alternative Benign Explanations</h3>
            <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
              {anomaly.benignExplanations.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Recommended Defensive Actions */}
          <div className="pt-4 border-t border-amber-300/50 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Recommended Defensive Actions</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {anomaly.recommendedActions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-300/70 bg-gradient-to-r from-[#f8f8fa]/95 via-[#fdf9ec]/95 to-[#eff5fb]/95 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-600">
            Detected anomaly pending human SOC review.
          </span>
          <button
            type="button"
            onClick={() => onOpenFullReport(anomaly.id)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md hover:from-amber-400 hover:to-yellow-400 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open Full Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
