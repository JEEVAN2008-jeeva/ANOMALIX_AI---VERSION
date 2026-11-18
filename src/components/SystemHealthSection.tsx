import { CheckCircle2, Cpu, RefreshCw, Server, ShieldAlert } from 'lucide-react';
import type { SystemHealthStatus } from '../types/anomalix.ts';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';

interface SystemHealthSectionProps {
  health: SystemHealthStatus | null;
  onRefreshHealth: () => void;
}

export function SystemHealthSection({ health, onRefreshHealth }: SystemHealthSectionProps) {
  if (!health) {
    return (
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-8 text-center text-sm text-slate-700">
        Loading backend diagnostics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            System Health & Backend Integration
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Runtime verification for CrewAI YAML orchestration, API endpoints, and WebSocket telemetry
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshHealth}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-md hover:bg-blue-100 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
          <span>Run Health Check</span>
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Overall Status</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{health.status}</div>
          <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
            Uptime: {health.uptimeSeconds}s
          </div>
        </div>
        <div className="surface-blue-spill border border-blue-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">CrewAI YAML Agents</div>
          <div className="text-xl font-bold text-blue-800 mt-1 tabular-nums">
            {health.agentsConfigured} Agents · {health.tasksConfigured} Tasks
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Process: {health.processMode}</div>
        </div>
        <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">AI Investigation Layer</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">
            {health.geminiConfigured ? 'Gemini Connected' : 'Baseline Mode'}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            {health.geminiConfigured ? 'Live LLM enrichment active' : 'Statistical engine active'}
          </div>
        </div>
        <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Last Pipeline Duration</div>
          <div className="text-xl font-bold text-amber-800 mt-1 tabular-nums">
            {formatDuration(health.lastRunDurationMs)}
          </div>
          <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
            {formatTimestamp(health.lastScanTimestamp)}
          </div>
        </div>
      </div>

      {/* Component Diagnostics */}
      <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-emerald-800" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-900">Subsystem Diagnostics</h3>
        </div>
        {health.checks.map((chk) => (
          <div
            key={chk.component}
            className="bg-white/90 border border-emerald-300/70 rounded-md px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="text-sm font-bold text-slate-900">{chk.component}</div>
              <div className="text-xs text-slate-700 mt-0.5">{chk.detail}</div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border rounded-sm ${
                chk.status === 'Healthy'
                  ? 'text-emerald-800 border-emerald-400/80 bg-emerald-50'
                  : 'text-amber-900 border-amber-400/80 bg-amber-50'
              }`}
            >
              {chk.status === 'Healthy' ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{chk.status}</span>
            </span>
          </div>
        ))}

        <div className="bg-slate-100/95 border border-slate-300 rounded-md p-4 text-xs text-slate-800 flex items-start gap-2.5">
          <Cpu className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong className="text-slate-900">API & Python FastAPI Compatibility:</strong> Active layer runs{' '}
            <span className="font-bold text-blue-800">{health.apiLayer}</span> with persisted state at{' '}
            <code className="px-1 py-0.5 bg-white border border-slate-300 rounded-xs">{health.storageFile}</code>. A mirror FastAPI service wrapping{' '}
            <code className="px-1 py-0.5 bg-white border border-slate-300 rounded-xs">AnomalixAiCrew</code> is also bundled in{' '}
            <code className="px-1 py-0.5 bg-white border border-slate-300 rounded-xs">anomalix_ai_crew/backend/api.py</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
