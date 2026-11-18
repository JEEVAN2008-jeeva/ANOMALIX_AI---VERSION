import { useState } from 'react';
import { Bot, Download, RotateCcw } from 'lucide-react';
import type { AnomalixFullState } from '../types/anomalix.ts';
import { downloadTextFile } from '../utils/formatters.ts';

interface SettingsSectionProps {
  state: AnomalixFullState;
  useAiEnrichment: boolean;
  onToggleAiEnrichment: (enabled: boolean) => void;
  onResetBaseline: () => Promise<void>;
}

export function SettingsSection({
  state,
  useAiEnrichment,
  onToggleAiEnrichment,
  onResetBaseline,
}: SettingsSectionProps) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await onResetBaseline();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-silver-gold border border-amber-300/80 rounded-2xl px-7 py-5 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          SOC Configuration & Governance Settings
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          Manage CrewAI runtime enrichment, JSON snapshot export, and baseline dataset restoration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-6 surface-green-spill border border-emerald-300/80 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-emerald-800 shrink-0" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-900">CrewAI Execution Engine</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Control how the 5-agent sequential CrewAI pipeline evaluates incoming logs. Statistical Z-score and IQR outlier detection always executes deterministically on the backend.
            </p>
            <label
              htmlFor="toggle-ai-enrichment"
              className="flex items-center justify-between gap-4 bg-white/90 border border-emerald-300/80 rounded-xl p-4 cursor-pointer"
            >
              <div>
                <div className="text-sm font-bold text-emerald-800">
                  Enable AI Narrative Enrichment
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  Augment Threat Investigator &amp; Report Writer outputs via server-side Gemini API
                </div>
              </div>
              <input
                id="toggle-ai-enrichment"
                type="checkbox"
                checked={useAiEnrichment}
                onChange={(e) => onToggleAiEnrichment(e.target.checked)}
                aria-label="Enable AI Narrative Enrichment"
                className="w-5 h-5 accent-amber-600 cursor-pointer shrink-0"
              />
            </label>
          </div>

          <div className="pt-4 border-t border-emerald-300/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 tabular-nums">
            <span>Active Source: <strong className="text-slate-900">{state.overview.activeLogSource}</strong></span>
            <span>Agents Loaded: <strong className="text-emerald-800">{state.agents.length}</strong></span>
          </div>
        </div>

        <div className="lg:col-span-6 surface-blue-spill border border-blue-300/80 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xs">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">Telemetry Archive &amp; Reset</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Export the full persisted SOC investigation snapshot (normalized logs, statistical anomaly metrics, risk brackets, and CrewAI agent outputs) or restore the baseline enterprise gateway dataset.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  'anomalix_soc_snapshot.json',
                  JSON.stringify(state, null, 2),
                  'application/json'
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-800" aria-hidden="true" />
              <span>Export Complete SOC JSON Snapshot</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-800 bg-red-50/90 border border-red-400/70 rounded-xl hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{resetting ? 'Restoring Baseline...' : 'Restore Baseline Dataset'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
