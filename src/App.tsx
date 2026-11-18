import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AgentActivitySection } from './components/AgentActivitySection.tsx';
import { AgentWorkflowsSection } from './components/AgentWorkflowsSection.tsx';
import { AnalyzeModal, type SampleDatasetOption } from './components/AnalyzeModal.tsx';
import { AnomalyTableSection } from './components/AnomalyTableSection.tsx';
import { InvestigationDrawer } from './components/InvestigationDrawer.tsx';
import { InvestigationReportsSection } from './components/InvestigationReportsSection.tsx';
import { LogExplorerSection } from './components/LogExplorerSection.tsx';
import { OverviewSection } from './components/OverviewSection.tsx';
import { RiskAssessmentSection } from './components/RiskAssessmentSection.tsx';
import { SettingsSection } from './components/SettingsSection.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { SystemHealthSection } from './components/SystemHealthSection.tsx';
import { TopBar } from './components/TopBar.tsx';
import { SecurityMonitoringSection } from './components/SecurityMonitoringSection.tsx';
import type {
  AnomalixFullState,
  AnomalyRecord,
  AnomalyStatus,
  CrewAgentConfig,
  CrewAgentRuntimeState,
  CrewExecutionRun,
  DashboardOverview,
  InvestigationReport,
  LogValidationSummary,
  NavSection,
  NormalizedLogEntry,
  NotificationItem,
  RiskAssessmentSummary,
  SystemHealthStatus,
} from './types/anomalix.ts';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [agentConfigs, setAgentConfigs] = useState<CrewAgentConfig[]>([]);
  const [processType, setProcessType] = useState('sequential');
  const [configPath, setConfigPath] = useState('');
  const [runtimeAgents, setRuntimeAgents] = useState<CrewAgentRuntimeState[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationReport[]>([]);
  const [masterMarkdownReport, setMasterMarkdownReport] = useState('');
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentSummary | null>(null);
  const [logs, setLogs] = useState<NormalizedLogEntry[]>([]);
  const [validationSummary, setValidationSummary] = useState<LogValidationSummary | null>(null);
  const [sampleDatasets, setSampleDatasets] = useState<SampleDatasetOption[]>([]);
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null);
  const [focusedReportAnomalyId, setFocusedReportAnomalyId] = useState<string | null>(null);
  const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);
  const [useAiEnrichment, setUseAiEnrichment] = useState(true);

  const loadAllData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [
        ovRes,
        anmRes,
        agRes,
        agStatRes,
        invRes,
        riskRes,
        logsRes,
        healthRes,
        notifRes,
      ] = await Promise.all([
        fetch('/api/dashboard/overview'),
        fetch('/api/anomalies'),
        fetch('/api/agents'),
        fetch('/api/agents/status'),
        fetch('/api/investigations'),
        fetch('/api/risk-assessment'),
        fetch('/api/logs'),
        fetch('/api/system/health'),
        fetch('/api/notifications'),
      ]);

      if (!ovRes.ok) throw new Error('Failed to load dashboard overview');

      const [
        ovData,
        anmData,
        agData,
        agStatData,
        invData,
        riskData,
        logsData,
        healthData,
        notifData,
      ] = await Promise.all([
        ovRes.json() as Promise<DashboardOverview>,
        anmRes.json() as Promise<AnomalyRecord[]>,
        agRes.json() as Promise<{
          processType: string;
          configPath: string;
          agents: CrewAgentConfig[];
        }>,
        agStatRes.json() as Promise<{
          crewRun: CrewExecutionRun;
          agents: CrewAgentRuntimeState[];
        }>,
        invRes.json() as Promise<{
          investigations: InvestigationReport[];
          masterMarkdownReport: string;
        }>,
        riskRes.json() as Promise<RiskAssessmentSummary>,
        logsRes.json() as Promise<{
          validationSummary: LogValidationSummary;
          logs: NormalizedLogEntry[];
          sampleDatasets: SampleDatasetOption[];
        }>,
        healthRes.json() as Promise<SystemHealthStatus>,
        notifRes.json() as Promise<NotificationItem[]>,
      ]);

      setOverview(ovData);
      setAnomalies(anmData);
      setAgentConfigs(agData.agents);
      setProcessType(agData.processType);
      setConfigPath(agData.configPath);
      setRuntimeAgents(agStatData.agents);
      setInvestigations(invData.investigations);
      setMasterMarkdownReport(invData.masterMarkdownReport);
      setRiskAssessment(riskData);
      setLogs(logsData.logs);
      setValidationSummary(logsData.validationSummary);
      setSampleDatasets(logsData.sampleDatasets);
      setHealth(healthData);
      setNotifications(notifData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to ANOMALIX AI backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAllData(false);
  }, [loadAllData]);

  // Real-time WebSocket subscription for CrewAI progress
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; payload: any };
          if (msg.type === 'crew_started' && msg.payload) {
            setOverview((prev) =>
              prev ? { ...prev, crewRun: msg.payload.crewRun } : prev
            );
            if (Array.isArray(msg.payload.agents)) {
              setRuntimeAgents(msg.payload.agents);
            }
          } else if (msg.type === 'agent_updated' && msg.payload?.agents) {
            setRuntimeAgents(msg.payload.agents);
          } else if (msg.type === 'crew_completed' || msg.type === 'state_reset') {
            void loadAllData(true);
          } else if (msg.type === 'anomaly_updated' && msg.payload) {
            const updated = msg.payload as AnomalyRecord;
            setAnomalies((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelectedAnomaly((prev) => (prev && prev.id === updated.id ? updated : prev));
          }
        } catch {
          // Ignore malformed WS message
        }
      };
    } catch {
      // Non-fatal if WS unavailable
    }

    return () => {
      if (socket && socket.readyState <= 1) {
        socket.close();
      }
    };
  }, [loadAllData]);

  const handleRunAnalysis = async (payload: {
    datasetKey?: string;
    rawLogs?: string;
    fileName?: string;
    useAiEnrichment: boolean;
  }) => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || 'CrewAI execution failed');
    }
    await loadAllData(true);
  };

  const handleUpdateAnomalyStatus = async (anomalyId: string, status: AnomalyStatus) => {
    const res = await fetch(`/api/anomalies/${encodeURIComponent(anomalyId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = (await res.json()) as AnomalyRecord;
      setAnomalies((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAnomaly((prev) => (prev && prev.id === updated.id ? updated : prev));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    if (res.ok) {
      setNotifications((await res.json()) as NotificationItem[]);
    }
  };

  const handleResetBaseline = async () => {
    const res = await fetch('/api/settings/reset', { method: 'POST' });
    if (res.ok) {
      await loadAllData(true);
    }
  };

  const handleRefreshHealth = async () => {
    const res = await fetch('/api/system/health');
    if (res.ok) {
      setHealth((await res.json()) as SystemHealthStatus);
    }
  };

  const handleInspectFromNotification = (anomalyId: string) => {
    const match = anomalies.find((a) => a.id === anomalyId);
    if (match) {
      setSelectedAnomaly(match);
    }
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen gold-luxury-canvas p-6 flex items-center justify-center">
        <div className="surface-silver-gold border border-amber-300/80 rounded-lg p-8 max-w-md w-full text-center space-y-3 shadow-lg">
          <div className="text-2xl font-bold text-slate-900 tracking-wider">ANOMALIX AI</div>
          <div className="text-sm text-slate-700">
            Initializing Security Operations Center & CrewAI Agent Telemetry...
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-amber-500 to-blue-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="min-h-screen gold-luxury-canvas p-6 flex items-center justify-center">
        <div className="surface-silver-gold border border-red-400 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-lg">
          <AlertTriangle className="w-8 h-8 text-red-700 mx-auto" aria-hidden="true" />
          <div className="text-xl font-bold text-slate-900">Backend Telemetry Unavailable</div>
          <p className="text-sm text-slate-700">{error}</p>
          <button
            type="button"
            onClick={() => loadAllData(false)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const fullStateSnapshot: AnomalixFullState | null =
    overview && validationSummary && riskAssessment
      ? {
          overview,
          validationSummary,
          logs,
          anomalies,
          agents: runtimeAgents,
          investigations,
          riskAssessment,
          masterMarkdownReport,
          notifications,
        }
      : null;

  return (
    <div className="min-h-screen gold-luxury-canvas p-3 sm:p-5 lg:p-6">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Left Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          anomalyCount={anomalies.length}
          criticalCount={overview?.criticalThreats || 0}
          crewStatus={overview?.crewRun.status || 'idle'}
        />

        {/* Right Main Shell */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {overview && (
            <TopBar
              systemStatus={health?.status || 'Operational'}
              crewStatus={overview.crewRun.status}
              lastScanTimestamp={overview.lastScanTimestamp}
              notifications={notifications}
              isRefreshing={refreshing}
              onRefresh={() => loadAllData(true)}
              onOpenAnalyzeModal={() => setAnalyzeModalOpen(true)}
              onMarkAllRead={handleMarkAllRead}
              onSelectAnomalyNotification={handleInspectFromNotification}
            />
          )}

          {error && (
            <div className="bg-red-50/95 border border-red-400 rounded-md px-4 py-3 text-xs font-semibold text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <main className="flex-1 min-w-0">
            {activeSection === 'overview' && overview && (
              <OverviewSection
                overview={overview}
                anomalies={anomalies}
                agents={runtimeAgents}
                onInspectAnomaly={setSelectedAnomaly}
                onUpdateAnomalyStatus={handleUpdateAnomalyStatus}
                onNavigate={setActiveSection}
              />
            )}

            {activeSection === 'monitoring' && overview && (
              <SecurityMonitoringSection overview={overview} />
            )}

            {activeSection === 'logs' && validationSummary && (
              <LogExplorerSection
                logs={logs}
                validationSummary={validationSummary}
                onOpenAnalyzeModal={() => setAnalyzeModalOpen(true)}
              />
            )}

            {activeSection === 'anomalies' && (
              <AnomalyTableSection
                anomalies={anomalies}
                onInspectAnomaly={setSelectedAnomaly}
              />
            )}

            {activeSection === 'agents' && overview && (
              <AgentActivitySection
                agentConfigs={agentConfigs}
                runtimeAgents={runtimeAgents}
                crewRun={overview.crewRun}
                processType={processType}
                configPath={configPath}
                onRunCrew={() => setAnalyzeModalOpen(true)}
              />
            )}

            {activeSection === 'workflows' && overview && (
              <AgentWorkflowsSection
                agentConfigs={agentConfigs}
                runtimeAgents={runtimeAgents}
                crewRun={overview.crewRun}
                processType={processType}
                sampleDatasets={sampleDatasets}
                useAiEnrichment={useAiEnrichment}
                onExecutePipeline={(payload) => handleRunAnalysis(payload)}
                onOpenAnalyzeModal={() => setAnalyzeModalOpen(true)}
                onNavigate={setActiveSection}
              />
            )}

            {activeSection === 'investigations' && (
              <InvestigationReportsSection
                investigations={investigations}
                masterMarkdownReport={masterMarkdownReport}
                initialSelectedAnomalyId={focusedReportAnomalyId}
              />
            )}

            {activeSection === 'risk' && riskAssessment && (
              <RiskAssessmentSection riskAssessment={riskAssessment} />
            )}

            {activeSection === 'health' && (
              <SystemHealthSection
                health={health}
                onRefreshHealth={handleRefreshHealth}
              />
            )}

            {activeSection === 'settings' && fullStateSnapshot && (
              <SettingsSection
                state={fullStateSnapshot}
                useAiEnrichment={useAiEnrichment}
                onToggleAiEnrichment={setUseAiEnrichment}
                onResetBaseline={handleResetBaseline}
              />
            )}
          </main>
        </div>
      </div>

      {/* Investigation Slide-Over Panel */}
      <InvestigationDrawer
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onUpdateStatus={handleUpdateAnomalyStatus}
        onOpenFullReport={(anomalyId) => {
          setSelectedAnomaly(null);
          setFocusedReportAnomalyId(anomalyId);
          setActiveSection('investigations');
        }}
      />

      {/* CrewAI Analysis Execution Modal */}
      <AnalyzeModal
        open={analyzeModalOpen}
        sampleDatasets={sampleDatasets}
        useAiEnrichment={useAiEnrichment}
        onClose={() => setAnalyzeModalOpen(false)}
        onExecute={handleRunAnalysis}
      />
    </div>
  );
}
