import { useEffect, useState } from 'react';
import { Check, Copy, Download, FileText, ShieldAlert } from 'lucide-react';
import type { InvestigationReport } from '../types/anomalix.ts';
import { downloadTextFile, formatTimestamp } from '../utils/formatters.ts';
import { SeverityBadge } from './SeverityBadge.tsx';

interface InvestigationReportsSectionProps {
  investigations: InvestigationReport[];
  masterMarkdownReport: string;
  initialSelectedAnomalyId?: string | null;
}

export function InvestigationReportsSection({
  investigations,
  masterMarkdownReport,
  initialSelectedAnomalyId,
}: InvestigationReportsSectionProps) {
  const [viewMode, setViewMode] = useState<'dossier' | 'master'>('dossier');
  const [selectedId, setSelectedId] = useState<string>(investigations[0]?.id || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialSelectedAnomalyId) {
      const match = investigations.find(
        (inv) => inv.anomalyId === initialSelectedAnomalyId || inv.id === initialSelectedAnomalyId
      );
      if (match) {
        setSelectedId(match.id);
        setViewMode('dossier');
      }
    } else if (!investigations.some((i) => i.id === selectedId) && investigations[0]) {
      setSelectedId(investigations[0].id);
    }
  }, [initialSelectedAnomalyId, investigations, selectedId]);

  const activeReport = investigations.find((i) => i.id === selectedId) || investigations[0];

  const handleCopy = async () => {
    const content =
      viewMode === 'master'
        ? masterMarkdownReport
        : activeReport?.markdownReport || '';
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (viewMode === 'master') {
      downloadTextFile('ANOMALIX_AI_Security_Investigation_Report.md', masterMarkdownReport);
    } else if (activeReport) {
      downloadTextFile(`ANOMALIX_${activeReport.id}_${activeReport.anomalyId}.md`, activeReport.markdownReport);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            AI Investigation Reports
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Authored by <span className="font-bold text-emerald-800">security_report_writer</span> · Evidence-grounded findings pending human review
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white/90 border border-amber-300/80 rounded-md">
            <button
              type="button"
              onClick={() => setViewMode('dossier')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer whitespace-nowrap ${
                viewMode === 'dossier'
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Finding Dossiers ({investigations.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('master')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer whitespace-nowrap ${
                viewMode === 'master'
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Executive Markdown Report
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-md hover:bg-blue-100 cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-blue-800" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md hover:from-amber-400 hover:to-yellow-400 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export .MD</span>
          </button>
        </div>
      </div>

      {viewMode === 'master' ? (
        <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-amber-300/60">
            <FileText className="w-5 h-5 text-amber-800" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-900">
              Complete CrewAI Security Investigation Report
            </h3>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed bg-slate-100/95 border border-slate-300 rounded-md p-5 overflow-x-auto">
            {masterMarkdownReport}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left list of reports */}
          <div className="lg:col-span-4 surface-silver-gold border border-amber-300/80 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-amber-300/70 bg-amber-50/70 text-sm font-bold text-slate-900">
              Investigation Dossiers
            </div>
            <div className="divide-y divide-amber-200/70">
              {investigations.length === 0 ? (
                <div className="p-6 text-sm text-slate-600">
                  No anomalies detected in the active log dataset.
                </div>
              ) : (
                investigations.map((inv) => {
                  const isActive = inv.id === activeReport?.id;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => setSelectedId(inv.id)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-100/90 via-yellow-50/90 to-blue-50/90'
                          : 'hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-800 tabular-nums">{inv.id}</span>
                        <SeverityBadge level={inv.riskClassification} score={inv.riskScore} />
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1.5">{inv.title}</div>
                      <div className="text-xs text-slate-600 mt-1 truncate">{inv.affectedSource}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right structured report viewer */}
          <div className="lg:col-span-8 surface-silver-gold border border-amber-300/80 rounded-lg p-6 space-y-5 shadow-xs">
            {activeReport ? (
              <>
                <div className="pb-4 border-b border-amber-300/70 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-amber-800 tabular-nums">
                      Investigation ID: {activeReport.id} · Anomaly: {activeReport.anomalyId}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      {activeReport.detectedAnomaly}
                    </h3>
                    <div className="text-xs text-slate-600 mt-1 tabular-nums">
                      Investigation Timestamp: {formatTimestamp(activeReport.investigationTimestamp)}
                    </div>
                  </div>
                  <SeverityBadge level={activeReport.riskClassification} score={activeReport.riskScore} />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="surface-blue-spill border border-blue-300/80 rounded-md p-3.5">
                    <div className="text-xs font-semibold text-slate-600">Affected Source</div>
                    <div className="text-sm font-bold text-blue-800 mt-1 break-all">
                      {activeReport.affectedSource}
                    </div>
                  </div>
                  <div className="bg-white/90 border border-amber-300/70 rounded-md p-3.5">
                    <div className="text-xs font-semibold text-slate-600">Affected Account(s)</div>
                    <div className="text-sm font-bold text-amber-800 mt-1">
                      {activeReport.affectedAccount}
                    </div>
                  </div>
                  <div className="surface-green-spill border border-emerald-300/80 rounded-md p-3.5">
                    <div className="text-xs font-semibold text-slate-600">Evidence & Confidence</div>
                    <div className="text-sm font-bold text-emerald-800 mt-1 tabular-nums">
                      {activeReport.evidenceStrength} · {activeReport.confidenceScore}%
                    </div>
                  </div>
                </div>

                {/* Evidence Summary */}
                <div className="bg-white/90 border border-amber-300/70 rounded-md p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900">Evidence Summary</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeReport.evidenceSummary}
                  </p>
                </div>

                {/* AI-Generated Explanation */}
                <div className="surface-green-spill border border-emerald-300/80 rounded-md p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-emerald-800">AI-Generated Explanation</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeReport.aiExplanation}
                  </p>
                </div>

                {/* Benign Explanations */}
                <div className="bg-white/90 border border-amber-300/70 rounded-md p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900">Alternative Benign Hypotheses</h4>
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {activeReport.benignAlternatives.map((alt, idx) => (
                      <li key={idx}>{alt}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Defensive Actions */}
                <div className="surface-blue-spill border border-blue-300/80 rounded-md p-4 space-y-2">
                  <h4 className="text-sm font-bold text-blue-800">Recommended Defensive Actions</h4>
                  <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1.5">
                    {activeReport.recommendedActions.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ol>
                </div>

                {/* Disclaimer */}
                <div className="bg-amber-50/90 border border-amber-300 rounded-md px-4 py-3 flex items-start gap-2.5 text-xs text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-amber-800">Governance Disclaimer:</strong> These findings represent detected statistical and behavioral anomalies generated by ANOMALIX AI, not confirmed security incidents. Human SOC analyst review is required prior to containment.
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600">Select an investigation dossier to inspect.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
