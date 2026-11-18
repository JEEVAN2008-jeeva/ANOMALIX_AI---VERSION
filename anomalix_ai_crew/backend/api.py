"""
FastAPI Integration Layer for ANOMALIX AI CrewAI Backend.
Exposes REST and WebSocket endpoints around the existing AnomalixAiCrew
without modifying the underlying CrewAI agents, tasks, or crew configuration.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT_DIR / "src"
if not SRC_DIR.exists():
    SRC_DIR = ROOT_DIR

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

CONFIG_DIR = ROOT_DIR / "anomalix_ai" / "config"
if not CONFIG_DIR.exists():
    CONFIG_DIR = ROOT_DIR / "src" / "anomalix_ai" / "config"

STATE_FILE = ROOT_DIR / "anomalix_state.json"

app = FastAPI(
    title="ANOMALIX AI CrewAI API",
    version="1.0.0",
    description="FastAPI integration layer for the ANOMALIX AI CrewAI multi-agent log anomaly investigation system.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    log_file_path: Optional[str] = None
    raw_logs: Optional[str] = None
    file_name: Optional[str] = "uploaded_server_logs.csv"


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        dead: List[WebSocket] = []
        for ws in self.active_connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


ws_manager = ConnectionManager()


def load_crew_yaml_configs() -> Dict[str, Any]:
    agents_path = CONFIG_DIR / "agents.yaml"
    tasks_path = CONFIG_DIR / "tasks.yaml"
    agents_cfg = yaml.safe_load(agents_path.read_text(encoding="utf-8")) if agents_path.exists() else {}
    tasks_cfg = yaml.safe_load(tasks_path.read_text(encoding="utf-8")) if tasks_path.exists() else {}
    return {"agents": agents_cfg or {}, "tasks": tasks_cfg or {}}


def load_persisted_state() -> Dict[str, Any]:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {
        "overview": {
            "totalLogsAnalyzed": 0,
            "totalAnomaliesDetected": 0,
            "criticalThreats": 0,
            "highRiskEvents": 0,
            "mediumRiskEvents": 0,
            "lowRiskEvents": 0,
            "systemSecurityScore": 100,
            "lastScanTimestamp": datetime.now(timezone.utc).isoformat(),
            "crewRun": {"status": "idle"},
        },
        "anomalies": [],
        "investigations": [],
        "riskAssessment": {"overallRiskScore": 0, "systemSecurityScore": 100, "brackets": [], "findings": []},
        "agents": [],
    }


def save_persisted_state(state: Dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


@app.get("/api/system/health")
def get_system_health() -> Dict[str, Any]:
    cfg = load_crew_yaml_configs()
    return {
        "status": "Operational",
        "apiLayer": "Python FastAPI + CrewAI",
        "crewConfigLoaded": bool(cfg["agents"] and cfg["tasks"]),
        "agentsConfigured": len(cfg["agents"]),
        "tasksConfigured": len(cfg["tasks"]),
        "processMode": "sequential",
        "lastScanTimestamp": load_persisted_state().get("overview", {}).get("lastScanTimestamp"),
    }


@app.get("/api/dashboard/overview")
def get_dashboard_overview() -> Dict[str, Any]:
    return load_persisted_state().get("overview", {})


@app.get("/api/anomalies")
def get_anomalies() -> List[Dict[str, Any]]:
    return load_persisted_state().get("anomalies", [])


@app.get("/api/anomalies/{anomaly_id}")
def get_anomaly_by_id(anomaly_id: str) -> Dict[str, Any]:
    for item in load_persisted_state().get("anomalies", []):
        if item.get("id") == anomaly_id or item.get("eventId") == anomaly_id:
            return item
    raise HTTPException(status_code=404, detail=f"Anomaly '{anomaly_id}' not found")


@app.get("/api/agents")
def get_agents() -> List[Dict[str, Any]]:
    cfg = load_crew_yaml_configs()
    tasks_by_agent = {
        task_val.get("agent"): {"taskId": task_id, **task_val}
        for task_id, task_val in cfg["tasks"].items()
    }
    agents_list = []
    for agent_id, agent_val in cfg["agents"].items():
        task_info = tasks_by_agent.get(agent_id, {})
        agents_list.append(
            {
                "id": agent_id,
                "name": agent_val.get("role", agent_id),
                "role": agent_val.get("role", agent_id),
                "goal": agent_val.get("goal", ""),
                "backstory": agent_val.get("backstory", ""),
                "tools": ["FileReadTool"] if agent_id == "log_collection_specialist" else [],
                "taskId": task_info.get("taskId", ""),
                "taskDescription": task_info.get("description", ""),
                "expectedOutput": task_info.get("expected_output", ""),
                "taskContext": task_info.get("context", []),
            }
        )
    return agents_list


@app.get("/api/agents/status")
def get_agents_status() -> Dict[str, Any]:
    state = load_persisted_state()
    return {
        "crewRun": state.get("overview", {}).get("crewRun", {}),
        "agents": state.get("agents", []),
    }


@app.get("/api/investigations")
def get_investigations() -> List[Dict[str, Any]]:
    return load_persisted_state().get("investigations", [])


@app.get("/api/investigations/{investigation_id}")
def get_investigation_by_id(investigation_id: str) -> Dict[str, Any]:
    for inv in load_persisted_state().get("investigations", []):
        if inv.get("id") == investigation_id or inv.get("anomalyId") == investigation_id:
            return inv
    raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found")


@app.get("/api/risk-assessment")
def get_risk_assessment() -> Dict[str, Any]:
    return load_persisted_state().get("riskAssessment", {})


@app.post("/api/analyze")
async def trigger_crew_analysis(req: AnalyzeRequest) -> Dict[str, Any]:
    from anomalix_ai.crew import AnomalixAiCrew

    target_path = req.log_file_path
    temp_file_path: Optional[str] = None

    if req.raw_logs:
        suffix = Path(req.file_name or "logs.csv").suffix or ".csv"
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=suffix, encoding="utf-8") as tmp:
            tmp.write(req.raw_logs)
            temp_file_path = tmp.name
        target_path = temp_file_path

    if not target_path:
        raise HTTPException(status_code=400, detail="Provide either log_file_path or raw_logs")

    run_id = f"run-{uuid.uuid4().hex[:8]}"
    started = time.time()
    await ws_manager.broadcast({"type": "crew_started", "runId": run_id, "logFilePath": target_path})

    try:
        def _run_crew() -> Any:
            return AnomalixAiCrew().crew().kickoff(inputs={"log_file_path": target_path})

        result = await asyncio.to_thread(_run_crew)
        duration_ms = int((time.time() - started) * 1000)

        state = load_persisted_state()
        state["overview"]["lastScanTimestamp"] = datetime.now(timezone.utc).isoformat()
        state["overview"]["crewRun"] = {
            "runId": run_id,
            "logFilePath": target_path,
            "status": "completed",
            "totalDurationMs": duration_ms,
            "processType": "sequential",
            "executionMode": "python-fastapi",
        }
        state["masterMarkdownReport"] = str(result)
        save_persisted_state(state)

        await ws_manager.broadcast({"type": "crew_completed", "runId": run_id, "durationMs": duration_ms})
        return {"runId": run_id, "status": "completed", "durationMs": duration_ms, "rawOutput": str(result)}
    except Exception as exc:
        await ws_manager.broadcast({"type": "crew_error", "runId": run_id, "error": str(exc)})
        raise HTTPException(status_code=500, detail=f"CrewAI execution failed: {exc}") from exc
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
