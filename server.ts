import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { AnomalixOrchestrator } from './src/server/crewOrchestrator.ts';
import { SAMPLE_LOG_DATASETS } from './src/server/seedData.ts';
import type { AnomalyStatus } from './src/types/anomalix.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const startTimeMs = Date.now();
const orchestrator = new AnomalixOrchestrator();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.send(
      JSON.stringify({
        type: 'connected',
        payload: {
          crewRun: orchestrator.getState().overview.crewRun,
          agents: orchestrator.getState().agents,
        },
      })
    );
  });

  orchestrator.subscribe((event) => {
    const serialized = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(serialized);
      }
    }
  });

  // 1. GET /api/dashboard/overview
  app.get('/api/dashboard/overview', (_req, res) => {
    res.json(orchestrator.getState().overview);
  });

  // 2. GET /api/anomalies
  app.get('/api/anomalies', (req, res) => {
    const { riskLevel, status, search } = req.query;
    let items = orchestrator.getState().anomalies;
    if (typeof riskLevel === 'string' && riskLevel !== 'All') {
      items = items.filter((a) => a.riskLevel.toLowerCase() === riskLevel.toLowerCase());
    }
    if (typeof status === 'string' && status !== 'All') {
      items = items.filter((a) => a.status.toLowerCase() === status.toLowerCase());
    }
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.eventId.toLowerCase().includes(q) ||
          a.sourceIp.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.eventType.toLowerCase().includes(q)
      );
    }
    res.json(items);
  });

  // 3. GET /api/anomalies/:id
  app.get('/api/anomalies/:id', (req, res) => {
    const item = orchestrator.getAnomalyById(req.params.id);
    if (!item) {
      res.status(404).json({ error: `Anomaly '${req.params.id}' not found` });
      return;
    }
    res.json(item);
  });

  // PATCH /api/anomalies/:id/status
  app.patch('/api/anomalies/:id/status', (req, res) => {
    const { status } = req.body as { status?: AnomalyStatus };
    const allowed: AnomalyStatus[] = ['Open', 'Investigating', 'Escalated', 'Resolved', 'False Positive'];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid anomaly status value' });
      return;
    }
    const updated = orchestrator.updateAnomalyStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: `Anomaly '${req.params.id}' not found` });
      return;
    }
    res.json(updated);
  });

  // 4. GET /api/agents
  app.get('/api/agents', (_req, res) => {
    const def = orchestrator.getCrewDefinition();
    res.json({
      processType: def.processType,
      crewModel: def.crewModel,
      configPath: def.configPath,
      agents: def.agents,
    });
  });

  // 5. GET /api/agents/status
  app.get('/api/agents/status', (_req, res) => {
    const state = orchestrator.getState();
    res.json({
      crewRun: state.overview.crewRun,
      agents: state.agents,
    });
  });

  // 6. GET /api/investigations
  app.get('/api/investigations', (_req, res) => {
    const state = orchestrator.getState();
    res.json({
      investigations: state.investigations,
      masterMarkdownReport: state.masterMarkdownReport,
    });
  });

  // 7. GET /api/investigations/:id
  app.get('/api/investigations/:id', (req, res) => {
    const inv = orchestrator.getInvestigationById(req.params.id);
    if (!inv) {
      res.status(404).json({ error: `Investigation '${req.params.id}' not found` });
      return;
    }
    res.json(inv);
  });

  // 8. GET /api/risk-assessment
  app.get('/api/risk-assessment', (_req, res) => {
    res.json(orchestrator.getState().riskAssessment);
  });

  // 9. POST /api/analyze
  app.post('/api/analyze', async (req, res) => {
    try {
      const { rawLogs, datasetKey, fileName, useAiEnrichment } = req.body as {
        rawLogs?: string;
        datasetKey?: string;
        fileName?: string;
        useAiEnrichment?: boolean;
      };
      const updatedState = await orchestrator.runAnalysis({
        rawLogs,
        datasetKey,
        fileName,
        useAiEnrichment,
      });
      res.json(updatedState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis execution failed';
      res.status(400).json({ error: message });
    }
  });

  // 10. GET /api/system/health
  app.get('/api/system/health', (_req, res) => {
    const def = orchestrator.getCrewDefinition();
    const state = orchestrator.getState();
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
    const pythonBridgeUrl = process.env.ANOMALIX_PYTHON_API_URL || null;

    res.json({
      status: state.overview.crewRun.status === 'error' ? 'Degraded' : 'Operational',
      uptimeSeconds: Math.round((Date.now() - startTimeMs) / 1000),
      apiLayer: 'Express + CrewAI YAML Orchestrator (FastAPI Bridge Ready)',
      crewConfigLoaded: def.agents.length === 5,
      agentsConfigured: def.agents.length,
      tasksConfigured: def.agents.filter((a) => Boolean(a.taskId)).length,
      processMode: def.processType,
      geminiConfigured,
      pythonBridgeUrl,
      activeWebSocketClients: wss.clients.size,
      lastScanTimestamp: state.overview.lastScanTimestamp,
      lastRunDurationMs: state.overview.crewRun.totalDurationMs,
      storageFile: 'data/anomalix_state.json',
      checks: [
        {
          component: 'CrewAI YAML Definitions (agents.yaml & tasks.yaml)',
          status: def.agents.length === 5 ? 'Healthy' : 'Warning',
          detail: `${def.agents.length} sequential agents and tasks loaded from ${def.configPath}`,
        },
        {
          component: 'Statistical Anomaly Detection Engine',
          status: 'Healthy',
          detail: 'Z-Score, IQR upper-fence, and temporal burst correlation online',
        },
        {
          component: 'AI Threat Investigation Engine (Gemini)',
          status: geminiConfigured ? 'Healthy' : 'Unconfigured',
          detail: geminiConfigured
            ? 'Server-side GEMINI_API_KEY active for agent reasoning enrichment'
            : 'Running deterministic statistical baselines; set GEMINI_API_KEY in Secrets for LLM enrichment',
        },
        {
          component: 'Real-Time WebSocket Telemetry (/ws)',
          status: 'Healthy',
          detail: `${wss.clients.size} connected dashboard client(s)`,
        },
      ],
    });
  });

  // Additional utility endpoints for Log Explorer, Notifications & Reset
  app.get('/api/logs', (_req, res) => {
    res.json({
      ...orchestrator.getLogs(),
      sampleDatasets: Object.entries(SAMPLE_LOG_DATASETS).map(([key, d]) => ({
        key,
        label: d.label,
        fileName: d.fileName,
        format: d.format,
        description: d.description,
      })),
    });
  });

  app.get('/api/notifications', (_req, res) => {
    res.json(orchestrator.getState().notifications);
  });

  app.post('/api/notifications/read-all', (_req, res) => {
    res.json(orchestrator.markAllNotificationsRead());
  });

  app.post('/api/settings/reset', (_req, res) => {
    res.json(orchestrator.resetToBaseline());
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist', 'index.html'));
  if (isProd) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ANOMALIX AI SOC Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ANOMALIX AI server:', err);
  process.exit(1);
});
