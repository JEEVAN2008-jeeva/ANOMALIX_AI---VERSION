import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortAnomalies,
  paginateItems,
  prioritizeAnomaliesForReview,
} from './tableFilters.ts';
import type { AnomalyRecord } from '../types/anomalix.ts';

const MOCK_ANOMALIES: AnomalyRecord[] = [
  {
    id: 'ANM-001',
    eventId: 'EVT-0006',
    timestamp: '2026-11-17T14:18:45Z',
    sourceIp: '185.220.101.47',
    username: 'admin',
    eventType: 'Repeated Authentication Failure Burst',
    anomalyScore: 0.91,
    riskScore: 85,
    riskLevel: 'Critical',
    confidence: 92,
    status: 'Escalated',
    detectionMethod: 'Z-Score',
    evidenceSummary: '7 failed logins',
    statisticalMetrics: { zScore: 2.5, iqrMultiplier: 2, baselineRate: 1, observedRate: 7, correlatedEventCount: 7 },
    affectedAsset: '/api/v1/auth/login',
    aiExplanation: 'Burst failures',
    benignExplanations: ['CI runner'],
    recommendedActions: ['Audit IP'],
    correlatedLogIds: ['LOG-0006'],
  },
  {
    id: 'ANM-002',
    eventId: 'EVT-0015',
    timestamp: '2026-11-17T14:32:12Z',
    sourceIp: '91.132.147.82',
    username: 'svc_backup',
    eventType: 'Anomalous Bulk Data Export',
    anomalyScore: 0.78,
    riskScore: 68,
    riskLevel: 'High',
    confidence: 84,
    status: 'Open',
    detectionMethod: 'IQR',
    evidenceSummary: 'Large export',
    statisticalMetrics: { zScore: 1.9, iqrMultiplier: 1.8, baselineRate: 1, observedRate: 3, correlatedEventCount: 3 },
    affectedAsset: '/api/v1/admin/db_export',
    aiExplanation: 'Large outbound export',
    benignExplanations: ['Scheduled backup'],
    recommendedActions: ['Verify ticket'],
    correlatedLogIds: ['LOG-0015'],
  },
  {
    id: 'ANM-003',
    eventId: 'EVT-0021',
    timestamp: '2026-11-17T14:40:00Z',
    sourceIp: '10.0.0.15',
    username: 'ops_user',
    eventType: 'Resolved Probe',
    anomalyScore: 0.65,
    riskScore: 90,
    riskLevel: 'Critical',
    confidence: 88,
    status: 'Resolved',
    detectionMethod: 'IQR',
    evidenceSummary: 'Resolved probe',
    statisticalMetrics: { zScore: 2.1, iqrMultiplier: 1.5, baselineRate: 1, observedRate: 4, correlatedEventCount: 4 },
    affectedAsset: '/api/v1/health',
    aiExplanation: 'Resolved alert',
    benignExplanations: ['Internal scan'],
    recommendedActions: ['None'],
    correlatedLogIds: ['LOG-0021'],
  },
];

test('filterAndSortAnomalies filters by riskLevel, search, and sorts correctly', () => {
  const crit = filterAndSortAnomalies(MOCK_ANOMALIES, {
    search: '',
    riskLevel: 'Critical',
    status: 'All',
    sortField: 'riskScore',
    sortDirection: 'desc',
  });
  assert.equal(crit.length, 2);
  assert.equal(crit[0].id, 'ANM-003');

  const searchRes = filterAndSortAnomalies(MOCK_ANOMALIES, {
    search: 'svc_backup',
    riskLevel: 'All',
    status: 'All',
    sortField: 'anomalyScore',
    sortDirection: 'asc',
  });
  assert.equal(searchRes.length, 1);
  assert.equal(searchRes[0].id, 'ANM-002');
});

test('paginateItems clamps pages and slices deterministically', () => {
  const res = paginateItems([1, 2, 3, 4, 5], 2, 2);
  assert.deepEqual(res.pageItems, [3, 4]);
  assert.equal(res.totalPages, 3);
  assert.equal(res.currentPage, 2);
});

test('prioritizeAnomaliesForReview prioritizes active findings and respects quick filters', () => {
  const needsReview = prioritizeAnomaliesForReview(MOCK_ANOMALIES, 'needs_review');
  assert.deepEqual(needsReview.map((a) => a.id), ['ANM-001', 'ANM-002']);

  const highOnly = prioritizeAnomaliesForReview(MOCK_ANOMALIES, 'high');
  assert.deepEqual(highOnly.map((a) => a.id), ['ANM-002']);

  const allSorted = prioritizeAnomaliesForReview(MOCK_ANOMALIES, 'all');
  assert.deepEqual(allSorted.map((a) => a.id), ['ANM-001', 'ANM-002', 'ANM-003']);
});
