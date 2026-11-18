import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Loader2,
  Play,
  Upload,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  CrewAgentConfig,
  CrewAgentRuntimeState,
  CrewExecutionRun,
  NavSection,
} from '../types/anomalix.ts';
import type { SampleDatasetOption } from './AnalyzeModal.tsx';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';

interface AgentWorkflowsSectionProps {
  agentConfigs: CrewAgentConfig[];
  runtimeAgents: CrewAgentRuntimeState[];
  crewRun: CrewExecutionRun;
  processType: string;
  sampleDatasets: SampleDatasetOption[];
  useAiEnrichment: boolean;
  onExecutePipeline: (payload: {
    datasetKey: string;
    useAiEnrichment: boolean;
  }) => Promise<void>;
  onOpenAnalyzeModal: () => void;
  onNavigate: (section: NavSection) => void;
}

export function AgentWorkflowsSection({
  agentConfigs,
  runtimeAgents,
  crewRun,
  processType,
  sampleDatasets,
  useAiEnrichment,
  onExecutePipeline,
  onOpenAnalyzeModal,
  onNavigate,
}: AgentWorkflowsSectionProps) {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDatasetKey, setSelectedDatasetKey] = useState(
    sampleDatasets[0]?.key || 'auth_gateway_sample'
  );
  const [executing, setExecuting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const stages = runtimeAgents.map((runtime, index) => {
    const config = agentConfigs.find((c) => c.id === runtime.id);
    return {
      index,
      runtime,
      config,
    };
  });

  const activeStage = stages[selectedStageIndex] || stages[0];
  const completedCount = runtimeAgents.filter((a) => a.status === 'completed').length;
  const progressPct =
    runtimeAgents.length > 0 ? Math.round((completedCount / runtimeAgents.length) * 100) : 0;

  const formattedProcessLabel = processType
    ? `${processType.charAt(0).toUpperCase()}${processType.slice(1)}`
    : 'Sequential';

  const handleTriggerPipeline = async () => {
    setExecuting(true);
    setRunError(null);
    try {
      await onExecutePipeline({
        datasetKey: selectedDatasetKey,
        useAiEnrichment,
      });
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Pipeline execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const renderStatusLabel = (status: CrewAgentRuntimeState['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Completed</span>
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 whitespace-nowrap">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            <span>Executing</span>
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Queued</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Error</span>
          </span>
        );
      default:
        return <span className="text-xs font-semibold text-slate-600">Idle</span>;
    }
  };

  const findStageIndexByTaskId = (taskId: string) =>
    stages.findIndex((s) => s.runtime.taskId === taskId);

  return (
    <div className="space-y-8">
      {/* Apple-Inspired Editorial Workflow Showcase Header */}
      <section className="surface-silver-gold border border-amber-300/70 rounded-3xl px-8 py-8 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-bold tracking-wide text-amber-800">
              {formattedProcessLabel} Orchestration · {stages.length}-Stage Pipeline
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              AI Agent Workflows &amp; Execution Pipeline
            </h2>
            <p className="text-base text-slate-700 leading-relaxed">
              Structured sequential handoff across {stages.length} specialized agents—transforming raw server telemetry into validated records, statistical outliers, root-cause findings, risk classifications, and structured reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {sampleDatasets.length > 0 && (
              <select
                value={selectedDatasetKey}
                onChange={(e) => setSelectedDatasetKey(e.target.value)}
                aria-label="Select pipeline log dataset"
                className="w-full sm:w-auto max-w-full px-4 py-2.5 text-xs font-bold bg-white/95 border border-amber-300/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
              >
                {sampleDatasets.map((ds) => (
                  <option key={ds.key} value={ds.key}>
                    {ds.label} ({ds.format})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleTriggerPipeline}
              disabled={executing || crewRun.status === 'running'}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all duration-200 disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-[0_4px_14px_rgba(217,119,6,0.22)]"
            >
              {executing || crewRun.status === 'running' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              )}
              <span>
                {executing || crewRun.status === 'running'
                  ? 'Running Pipeline...'
                  : 'Run Live Pipeline'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAnalyzeModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
              <span>Custom Logs</span>
            </button>
          </div>
        </div>

        {runError && (
          <div className="mt-5 px-4 py-3 text-xs font-semibold text-red-800 bg-red-50/95 border border-red-300 rounded-xl">
            {runError}
          </div>
        )}

        {/* Quiet Metadata & Progress Bar */}
        <div className="mt-7 pt-6 border-t border-amber-300/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-700 tabular-nums">
            <span>
              Active Source: <strong className="text-amber-800">{crewRun.logFilePath}</strong>
            </span>
            <span className="hidden sm:inline text-amber-700/50" aria-hidden="true">·</span>
            <span>
              Total Latency: <strong className="text-blue-800">{formatDuration(crewRun.totalDurationMs)}</strong>
            </span>
            <span className="hidden sm:inline text-amber-700/50" aria-hidden="true">·</span>
            <span>
              Stages Completed: <strong className="text-emerald-800">{completedCount} of {stages.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="flex-1 h-2 bg-white/95 border border-amber-300/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-900 tabular-nums">{progressPct}%</span>
          </div>
        </div>
      </section>

      {/* Card-Based Visual Groupings for Each Agent Stage */}
      <section aria-label="Sequential Agent Pipeline Stages" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Pipeline Stages
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Select an agent card to inspect its instructions, upstream dependencies, and verified output
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('investigations')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-emerald-400/70 bg-emerald-50/90 text-emerald-950 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
            <span>View Final Dossiers</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
          {stages.map((stage, idx) => {
            const isSelected = idx === selectedStageIndex;
            const { runtime } = stage;
            return (
              <button
                key={runtime.id}
                type="button"
                onClick={() => setSelectedStageIndex(idx)}
                aria-pressed={isSelected}
                className={`text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[178px] ${
                  isSelected
                    ? 'surface-silver-gold border-amber-500 shadow-[0_14px_32px_rgba(217,119,6,0.14)] -translate-y-0.5 ring-1 ring-amber-400/60'
                    : runtime.status === 'running'
                      ? 'surface-blue-spill border-blue-400 shadow-[0_10px_28px_rgba(37,99,235,0.10)]'
                      : 'surface-green-spill border-emerald-300/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:border-amber-400'
                }`}
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-800 tabular-nums whitespace-nowrap">
                      Stage 0{idx + 1}
                    </span>
                    {renderStatusLabel(runtime.status)}
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-bold text-slate-900 leading-snug">
                      {runtime.role}
                    </div>
                    <div
                      className="text-xs font-semibold text-blue-800 truncate"
                      title={runtime.taskId}
                    >
                      {runtime.taskId}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
                  <span className="truncate">
                    {runtime.taskContext.length > 0
                      ? `${runtime.taskContext.length} upstream input${runtime.taskContext.length > 1 ? 's' : ''}`
                      : 'Entry stage'}
                  </span>
                  <span className="font-bold text-slate-900 shrink-0">
                    {formatDuration(runtime.durationMs)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Whitespace-Heavy Editorial Stage Inspector */}
      {activeStage && (
        <section
          aria-label="Selected Stage Workflow Inspector"
          className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch"
        >
          {/* Left Grouping: Stage Identity, Context Handoffs & Capabilities */}
          <div className="xl:col-span-5 surface-blue-spill border border-blue-300/75 rounded-3xl p-7 sm:p-8 flex flex-col justify-between gap-7 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold tracking-wide text-blue-800">
                    Stage 0{activeStage.index + 1} · {activeStage.runtime.id}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
                    {activeStage.runtime.role}
                  </h3>
                </div>
                {renderStatusLabel(activeStage.runtime.status)}
              </div>

              {/* Clean Metric Strip separated by whitespace & hairline dividers */}
              <div className="grid grid-cols-2 gap-6 py-4 border-y border-blue-200/80 text-xs tabular-nums">
                <div>
                  <div className="text-slate-600 font-semibold">Assigned Task</div>
                  <div className="text-sm font-bold text-blue-800 mt-1 truncate">
                    {activeStage.runtime.taskId}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 font-semibold">Execution Latency</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {formatDuration(activeStage.runtime.durationMs)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold tracking-wide text-amber-800">
                  Stage Objective
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeStage.config?.goal || activeStage.runtime.goal}
                </p>
              </div>

              {activeStage.config?.backstory && (
                <div className="space-y-2 pt-5 border-t border-blue-200/70">
                  <div className="text-xs font-bold tracking-wide text-blue-800">
                    Agent Specialization
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeStage.config.backstory}
                  </p>
                </div>
              )}

              <div className="space-y-2.5 pt-5 border-t border-blue-200/70">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
                  <span>Upstream Context Inputs</span>
                </div>
                {activeStage.runtime.taskContext.length === 0 ? (
                  <p className="text-sm text-slate-700">
                    Initial dataset input (<span className="font-bold text-slate-900">{crewRun.logFilePath}</span>)
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeStage.runtime.taskContext.map((ctxTask) => {
                      const targetIdx = findStageIndexByTaskId(ctxTask);
                      return (
                        <button
                          key={ctxTask}
                          type="button"
                          onClick={() => {
                            if (targetIdx >= 0) setSelectedStageIndex(targetIdx);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold bg-white/95 border border-blue-300 text-blue-900 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
                        >
                          {targetIdx >= 0 ? `Stage 0${targetIdx + 1}: ` : ''}
                          {ctxTask}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-blue-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-800">
                <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  Tools:{' '}
                  {activeStage.runtime.tools.length > 0
                    ? activeStage.runtime.tools.join(', ')
                    : 'Contextual Reasoning'}
                </span>
              </span>
              <span className="tabular-nums text-slate-600">
                {activeStage.runtime.completedAt
                  ? `Completed ${formatTimestamp(activeStage.runtime.completedAt)}`
                  : 'Awaiting completion'}
              </span>
            </div>
          </div>

          {/* Right Grouping: Task Specification, Expected Output & Live Stage Telemetry */}
          <div className="xl:col-span-7 surface-silver-gold border border-amber-300/75 rounded-3xl p-7 sm:p-8 flex flex-col justify-between gap-7 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-300/50">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-amber-800" aria-hidden="true" />
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Task Specification &amp; Verified Output
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  Runtime Engine: <strong className="text-slate-900">{activeStage.runtime.model}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold tracking-wide text-amber-800">
                  Execution Directives ({activeStage.runtime.taskId})
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {activeStage.config?.taskDescription || activeStage.runtime.currentTask}
                </p>
              </div>

              {activeStage.config?.expectedOutput && (
                <div className="space-y-2 pt-5 border-t border-amber-300/45">
                  <div className="text-xs font-bold tracking-wide text-blue-800">
                    Expected Deliverable
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeStage.config.expectedOutput}
                  </p>
                </div>
              )}

              <div className="surface-green-spill border border-emerald-300/80 rounded-2xl p-5 space-y-2 shadow-[0_4px_18px_rgba(5,150,105,0.06)]">
                <div className="text-xs font-bold tracking-wide text-emerald-800">
                  Verified Stage Output ({activeStage.runtime.outputStatus})
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {activeStage.runtime.outputSummary}
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-amber-300/50 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeStage.index <= 0}
                onClick={() => setSelectedStageIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2.5 text-xs font-bold border border-amber-300 bg-white/95 text-slate-800 rounded-xl hover:bg-amber-50 disabled:opacity-40 cursor-pointer transition-colors"
              >
                Previous Stage
              </button>
              <button
                type="button"
                disabled={activeStage.index >= stages.length - 1}
                onClick={() =>
                  setSelectedStageIndex((i) => Math.min(stages.length - 1, i + 1))
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-xl hover:bg-blue-100 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <span>Next Pipeline Stage</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
