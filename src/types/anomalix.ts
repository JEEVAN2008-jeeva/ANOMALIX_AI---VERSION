export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type AnomalyStatus = 'Open' | 'Investigating' | 'Escalated' | 'Resolved' | 'False Positive';

export type AgentExecutionStatus = 'idle' | 'queued' | 'running' | 'completed' | 'error';

export type NavSection =
  | 'overview'
  | 'monitoring'
  | 'logs'
  | 'anomalies'
  | 'agents'
  | 'workflows'
  | 'investigations'
  | 'risk'
  | 'health'
  | 'settings';

export interface NormalizedLogEntry {
  id: string;
  lineNumber: number;
  timestamp: string;
  sourceIp: string;
  username: string;
  eventType: string;
  statusCode: number;
  endpoint: string;
  bytes: number;
  masked: boolean;
  malformed: boolean;
  rawLine: string;
}

export interface LogValidationSummary {
  fileName: string;
  format: 'CSV' | 'JSON' | 'TXT';
  totalRows: number;
  validRows: number;
  malformedRows: number;
  maskedSecretsCount: number;
  uniqueIps: number;
  uniqueUsers: number;
}

export interface AnomalyRecord {
  id: string;
  eventId: string;
  timestamp: string;
  sourceIp: string;
  username: string;
  eventType: string;
  anomalyScore: number; // 0 to 1
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  confidence: number; // 0 to 100
  status: AnomalyStatus;
  detectionMethod: string;
  evidenceSummary: string;
  statisticalMetrics: {
    zScore: number;
    iqrMultiplier: number;
    baselineRate: number;
    observedRate: number;
    correlatedEventCount: number;
  };
  affectedAsset: string;
  aiExplanation: string;
  benignExplanations: string[];
  recommendedActions: string[];
  correlatedLogIds: string[];
}

export interface CrewAgentConfig {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  taskId: string;
  taskDescription: string;
  expectedOutput: string;
  taskContext: string[];
}

export interface CrewAgentRuntimeState {
  id: string;
  name: string;
  role: string;
  goal: string;
  tools: string[];
  status: AgentExecutionStatus;
  currentTask: string;
  taskId: string;
  taskContext: string[];
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  outputStatus: string;
  outputSummary: string;
  model: string;
}

export interface CrewExecutionRun {
  runId: string;
  logFilePath: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startedAt: string;
  completedAt: string | null;
  totalDurationMs: number;
  processType: 'sequential';
  errorMessage?: string;
  executionMode: 'gemini-crew-pipeline' | 'statistical-baseline' | 'python-fastapi';
}

export interface InvestigationReport {
  id: string;
  anomalyId: string;
  title: string;
  detectedAnomaly: string;
  riskClassification: RiskLevel;
  riskScore: number;
  confidenceScore: number;
  evidenceStrength: 'Strong' | 'Moderate' | 'Preliminary';
  assetImpact: 'High' | 'Medium' | 'Low';
  evidenceSummary: string;
  affectedSource: string;
  affectedAccount: string;
  aiExplanation: string;
  benignAlternatives: string[];
  recommendedActions: string[];
  investigationTimestamp: string;
  markdownReport: string;
}

export interface TimelinePoint {
  timeBucket: string;
  totalLogs: number;
  anomalies: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgRiskScore: number;
}

export interface DashboardOverview {
  totalLogsAnalyzed: number;
  malformedLogs: number;
  totalAnomaliesDetected: number;
  criticalThreats: number;
  highRiskEvents: number;
  mediumRiskEvents: number;
  lowRiskEvents: number;
  systemSecurityScore: number;
  lastScanTimestamp: string;
  activeLogSource: string;
  trends: {
    logsDelta: string;
    anomaliesDelta: string;
    criticalDelta: string;
    highDelta: string;
    mediumDelta: string;
    securityScoreDelta: string;
  };
  timeline: TimelinePoint[];
  severityDistribution: Array<{ level: RiskLevel; count: number; percentage: number }>;
  eventTypeBreakdown: Array<{ eventType: string; count: number; anomalies: number }>;
  crewRun: CrewExecutionRun;
}

export interface RiskAssessmentSummary {
  overallRiskScore: number;
  systemSecurityScore: number;
  brackets: Array<{
    level: RiskLevel;
    range: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
    description: string;
  }>;
  findings: Array<{
    id: string;
    eventId: string;
    title: string;
    sourceIp: string;
    riskScore: number;
    riskLevel: RiskLevel;
    evidenceStrength: string;
    assetImpact: string;
    confidenceScore: number;
    reasoning: string;
  }>;
  riskTrend: Array<{
    label: string;
    riskScore: number;
    securityScore: number;
  }>;
}

export interface SystemHealthStatus {
  status: 'Operational' | 'Degraded' | 'Error';
  uptimeSeconds: number;
  apiLayer: string;
  crewConfigLoaded: boolean;
  agentsConfigured: number;
  tasksConfigured: number;
  processMode: string;
  geminiConfigured: boolean;
  pythonBridgeUrl: string | null;
  activeWebSocketClients: number;
  lastScanTimestamp: string;
  lastRunDurationMs: number;
  storageFile: string;
  checks: Array<{
    component: string;
    status: 'Healthy' | 'Warning' | 'Unconfigured';
    detail: string;
  }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: RiskLevel | 'Info';
  timestamp: string;
  read: boolean;
  anomalyId?: string;
}

export interface AnomalixFullState {
  overview: DashboardOverview;
  validationSummary: LogValidationSummary;
  logs: NormalizedLogEntry[];
  anomalies: AnomalyRecord[];
  agents: CrewAgentRuntimeState[];
  investigations: InvestigationReport[];
  riskAssessment: RiskAssessmentSummary;
  masterMarkdownReport: string;
  notifications: NotificationItem[];
}
