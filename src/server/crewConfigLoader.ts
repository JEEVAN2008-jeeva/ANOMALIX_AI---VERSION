import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import type { CrewAgentConfig } from '../types/anomalix.ts';

interface RawAgentYaml {
  role?: string;
  goal?: string;
  backstory?: string;
}

interface RawTaskYaml {
  description?: string;
  expected_output?: string;
  agent?: string;
  context?: string[];
}

export interface LoadedCrewDefinition {
  agents: CrewAgentConfig[];
  processType: 'sequential';
  crewModel: string;
  configPath: string;
}

const DEFAULT_CREW_DIR = path.resolve(process.cwd(), 'anomalix_ai_crew', 'anomalix_ai');

export function loadCrewConfig(crewDir: string = DEFAULT_CREW_DIR): LoadedCrewDefinition {
  const agentsYamlPath = path.join(crewDir, 'config', 'agents.yaml');
  const tasksYamlPath = path.join(crewDir, 'config', 'tasks.yaml');
  const crewPyPath = path.join(crewDir, 'crew.py');

  if (!fs.existsSync(agentsYamlPath) || !fs.existsSync(tasksYamlPath)) {
    throw new Error(`CrewAI configuration files not found in ${path.join(crewDir, 'config')}`);
  }

  const agentsRaw = yaml.load(fs.readFileSync(agentsYamlPath, 'utf-8')) as Record<string, RawAgentYaml>;
  const tasksRaw = yaml.load(fs.readFileSync(tasksYamlPath, 'utf-8')) as Record<string, RawTaskYaml>;
  const crewPyText = fs.existsSync(crewPyPath) ? fs.readFileSync(crewPyPath, 'utf-8') : '';

  const modelMatch = crewPyText.match(/model="([^"]+)"/);
  const crewModel = modelMatch ? modelMatch[1] : 'openai/gpt-6-luna';

  const taskByAgent = new Map<string, { taskId: string; task: RawTaskYaml }>();
  for (const [taskId, task] of Object.entries(tasksRaw || {})) {
    if (task.agent) {
      taskByAgent.set(task.agent, { taskId, task });
    }
  }

  const agents: CrewAgentConfig[] = Object.entries(agentsRaw || {}).map(([agentId, cfg]) => {
    const mappedTask = taskByAgent.get(agentId);
    const tools: string[] = [];
    if (agentId === 'log_collection_specialist' || crewPyText.includes(`def ${agentId}`) && agentId === 'log_collection_specialist') {
      tools.push('FileReadTool');
    }

    return {
      id: agentId,
      name: cfg.role?.trim() || agentId,
      role: cfg.role?.trim() || agentId,
      goal: (cfg.goal || '').trim(),
      backstory: (cfg.backstory || '').trim(),
      tools,
      taskId: mappedTask?.taskId || '',
      taskDescription: (mappedTask?.task.description || '').trim(),
      expectedOutput: (mappedTask?.task.expected_output || '').trim(),
      taskContext: mappedTask?.task.context || [],
    };
  });

  return {
    agents,
    processType: 'sequential',
    crewModel,
    configPath: path.join(crewDir, 'config'),
  };
}
