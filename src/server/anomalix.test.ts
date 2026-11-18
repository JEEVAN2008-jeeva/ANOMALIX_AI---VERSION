import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCrewConfig } from './crewConfigLoader.ts';
import { maskSensitiveText, parseAndValidateLogs } from './logParser.ts';
import { classifyRiskLevel, runStatisticalAnomalyDetection } from './anomalyEngine.ts';
import { SAMPLE_LOG_DATASETS } from './seedData.ts';

test('loadCrewConfig reads exact 5 CrewAI agents and sequential tasks from YAML', () => {
  const config = loadCrewConfig();
  assert.equal(config.processType, 'sequential');
  assert.equal(config.agents.length, 5);
  assert.deepEqual(
    config.agents.map((a) => a.id),
    [
      'log_collection_specialist',
      'anomaly_detection_analyst',
      'threat_investigator',
      'risk_assessment_specialist',
      'security_report_writer',
    ]
  );
  assert.equal(config.agents[0].tools.includes('FileReadTool'), true);
  assert.equal(config.agents[4].taskId, 'generate_security_report');
  assert.equal(config.agents[4].taskContext.length, 4);
});

test('maskSensitiveText redacts passwords, tokens, and bearer credentials', () => {
  const { text, masked } = maskSensitiveText('GET /api?token=sk_live_123 password=hunter2 Authorization: Bearer abc.def.ghi');
  assert.equal(masked, true);
  assert.equal(text.includes('sk_live_123'), false);
  assert.equal(text.includes('hunter2'), false);
  assert.equal(text.includes('abc.def.ghi'), false);
});

test('parseAndValidateLogs handles CSV, JSON, TXT, malformed lines, and secret masking', () => {
  const csvRes = parseAndValidateLogs(SAMPLE_LOG_DATASETS.auth_gateway_sample.content, 'auth.csv');
  assert.equal(csvRes.summary.format, 'CSV');
  assert.equal(csvRes.summary.malformedRows, 1);
  assert.equal(csvRes.summary.maskedSecretsCount >= 1, true);
  assert.equal(csvRes.summary.validRows > 30, true);

  const jsonRes = parseAndValidateLogs(SAMPLE_LOG_DATASETS.api_json_audit.content, 'audit.json');
  assert.equal(jsonRes.summary.format, 'JSON');
  assert.equal(jsonRes.summary.validRows, 10);

  const txtRes = parseAndValidateLogs(SAMPLE_LOG_DATASETS.syslog_txt_burst.content, 'syslog.txt');
  assert.equal(txtRes.summary.format, 'TXT');
  assert.equal(txtRes.summary.maskedSecretsCount, 2);
});

test('classifyRiskLevel maps 0-24 Low, 25-49 Medium, 50-74 High, 75-100 Critical', () => {
  assert.equal(classifyRiskLevel(10), 'Low');
  assert.equal(classifyRiskLevel(25), 'Medium');
  assert.equal(classifyRiskLevel(49), 'Medium');
  assert.equal(classifyRiskLevel(50), 'High');
  assert.equal(classifyRiskLevel(74), 'High');
  assert.equal(classifyRiskLevel(75), 'Critical');
  assert.equal(classifyRiskLevel(99), 'Critical');
});

test('runStatisticalAnomalyDetection detects brute-force, data export, and computes security score', () => {
  const { entries } = parseAndValidateLogs(SAMPLE_LOG_DATASETS.auth_gateway_sample.content, 'auth.csv');
  const result = runStatisticalAnomalyDetection(entries);
  assert.equal(result.anomalies.length >= 3, true);
  assert.equal(result.anomalies[0].riskScore >= 75, true);
  assert.equal(result.anomalies[0].riskLevel, 'Critical');
  assert.equal(result.systemSecurityScore < 100 && result.systemSecurityScore > 0, true);
  assert.equal(result.riskAssessment.brackets.length, 4);
});
