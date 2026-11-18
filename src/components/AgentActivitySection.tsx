import { ArrowRight, Bot, CheckCircle2, Clock, Loader2, Play, Wrench, XCircle } from 'lucide-react';
import type {
  CrewAgentConfig,
  CrewAgentRuntimeState,
  CrewExecutionRun,
} from '../types/anomalix.ts';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';

interface AgentActivitySectionProps {
  agentConfigs: CrewAgentConfig[];
  runtimeAgents: CrewAgentRuntimeState[];
  crewRun: CrewExecutionRun;
  processType: string;
  configPath: string;
  onRunCrew: () => void;
}

export function AgentActivitySection({
  agentConfigs,
  runtimeAgents,
  crewRun,
  processType,
  configPath,
  onRunCrew,
}: AgentActivitySectionProps) {
  const maxDuration = Math.max(1, ...runtimeAgents.map((a) => a.durationMs || 0));

  const getStatusBadge = (status: CrewAgentRuntimeState['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Completed</span>
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            <span>Executing</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Error</span>
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Queued</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">Idle</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Crew Execution Status */}
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            CrewAI Multi-Agent Orchestration Monitor
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Dynamically loaded from <span className="font-bold text-amber-800">agents.yaml</span> & <span className="font-bold text-amber-800">tasks.yaml</span> ({processType} process · {agentConfigs.length} configured agents)
          </p>
        </div>

        <button
          type="button"
          onClick={onRunCrew}
          disabled={crewRun.status === 'running'}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>{crewRun.status === 'running' ? 'Pipeline Executing...' : 'Execute CrewAI Run'}</span>
        </button>
      </div>

      {/* Crew Execution Metadata Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Crew Execution Status</div>
          <div className="text-lg font-bold text-emerald-800 mt-1 capitalize">{crewRun.status}</div>
          <div className="text-xs text-slate-600 mt-0.5 tabular-nums">Run ID: {crewRun.runId}</div>
        </div>
        <div className="surface-blue-spill border border-blue-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Process & Mode</div>
          <div className="text-lg font-bold text-blue-800 mt-1 capitalize">
            Process.{crewRun.processType}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">{crewRun.executionMode}</div>
        </div>
        <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Total Pipeline Duration</div>
          <div className="text-lg font-bold text-amber-800 mt-1 tabular-nums">
            {formatDuration(crewRun.totalDurationMs)}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Target: {crewRun.logFilePath}</div>
        </div>
        <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Last Completion</div>
          <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
            {crewRun.completedAt ? formatTimestamp(crewRun.completedAt) : 'In Progress'}
          </div>
          <div className="text-xs text-slate-600 mt-0.5 truncate" title={configPath}>
            YAML Config Active
          </div>
        </div>
      </div>

      {/* Sequential Agent Workflow Visualization */}
      <div className="surface-green-spill border border-emerald-300/80 rounded-lg p-5 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900">
          Sequential Agent Workflow & Task Context Dependencies
        </h3>
        <p className="text-xs text-slate-600 mb-5">
          Exact execution graph defined in <span className="font-bold text-emerald-800">AnomalixAiCrew</span> (each downstream task consumes upstream context)
        </p>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 overflow-x-auto pb-2">
          {runtimeAgents.map((agent, index) => (
            <div key={agent.id} className="flex flex-col lg:flex-row items-center gap-3 flex-1 min-w-[200px]">
              <div
                className={`w-full rounded-lg p-4 border transition-colors ${
                  agent.status === 'running'
                    ? 'bg-gradient-to-br from-amber-50 to-blue-50 border-blue-400'
                    : agent.status === 'completed'
                      ? 'bg-white/90 border-emerald-300/80'
                      : 'bg-white/75 border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-800 tabular-nums">
                    Stage 0{index + 1}
                  </span>
                  {getStatusBadge(agent.status)}
                </div>
                <div className="text-sm font-bold text-slate-900">{agent.role}</div>
                <div className="text-xs text-slate-700 mt-1">
                  Task: <span className="font-bold text-blue-800">{agent.taskId}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 tabular-nums">
                  Duration: {formatDuration(agent.durationMs)}
                </div>
              </div>
              {index < runtimeAgents.length - 1 && (
                <ArrowRight
                  className="w-5 h-5 text-amber-800 shrink-0 rotate-90 lg:rotate-0"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Execution Timeline Bars & Detailed Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Execution Timeline */}
        <div className="xl:col-span-5 surface-blue-spill border border-blue-300/80 rounded-lg p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Agent Execution Timeline</h3>
          <p className="text-xs text-slate-600 mb-4">
            Relative execution latency per CrewAI stage
          </p>
          <div className="space-y-4">
            {runtimeAgents.map((agent) => {
              const pct = Math.max(8, Math.round(((agent.durationMs || 0) / maxDuration) * 100));
              return (
                <div key={agent.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate">{agent.role}</span>
                    <span className="font-semibold text-blue-800 tabular-nums">
                      {formatDuration(agent.durationMs)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/90 border border-blue-300/70 rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        agent.status === 'completed'
                          ? 'bg-gradient-to-r from-amber-500 to-blue-600'
                          : agent.status === 'running'
                            ? 'bg-blue-600'
                            : agent.status === 'error'
                              ? 'bg-red-600'
                              : 'bg-slate-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {agent.taskId} · Output: {agent.outputStatus}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Configured Agents List */}
        <div className="xl:col-span-7 surface-silver-gold border border-amber-300/80 rounded-lg p-5 space-y-4 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Configured CrewAI Agents & Task Outputs
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Live roles, goals, tools, upstream context, and verified output summaries
            </p>
          </div>

          <div className="space-y-3">
            {runtimeAgents.map((agent) => {
              const cfg = agentConfigs.find((c) => c.id === agent.id);
              return (
                <div
                  key={agent.id}
                  className="bg-white/90 border border-amber-300/70 rounded-md p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                      <span className="text-sm font-bold text-slate-900">{agent.role}</span>
                      <span className="text-xs text-slate-600">({agent.id})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(agent.status)}
                      <span className="text-xs font-semibold text-slate-700 tabular-nums">
                        {formatDuration(agent.durationMs)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-amber-800">Goal:</strong> {cfg?.goal || agent.goal}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1">
                    <span>
                      <strong className="text-blue-800">Task:</strong> {agent.taskId}
                    </span>
                    <span>
                      <strong className="text-blue-800">Context:</strong>{' '}
                      {agent.taskContext.length > 0 ? agent.taskContext.join(', ') : 'Initial Input ({log_file_path})'}
                    </span>
                    {agent.tools.length > 0 && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                        <Wrench className="w-3 h-3" aria-hidden="true" />
                        <span>Tools: {agent.tools.join(', ')}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-amber-200/80 text-xs text-slate-700">
                    <strong className="text-emerald-800">Output ({agent.outputStatus}):</strong>{' '}
                    {agent.outputSummary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
