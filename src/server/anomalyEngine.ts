import type {
  AnomalyRecord,
  NormalizedLogEntry,
  RiskAssessmentSummary,
  RiskLevel,
  TimelinePoint,
} from '../types/anomalix.ts';

export function classifyRiskLevel(riskScore: number): RiskLevel {
  if (riskScore >= 75) return 'Critical';
  if (riskScore >= 50) return 'High';
  if (riskScore >= 25) return 'Medium';
  return 'Low';
}

export function computeMeanAndStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

export function computeIqrUpperFence(values: number[]): { q1: number; q3: number; upperFence: number } {
  if (values.length === 0) return { q1: 0, q3: 0, upperFence: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const iqr = q3 - q1;
  return { q1, q3, upperFence: q3 + 1.5 * iqr };
}

function getHourUtc(ts: string): number {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 12;
  return date.getUTCHours();
}

function getTimeBucketLabel(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '00:00';
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(Math.floor(date.getUTCMinutes() / 15) * 15).padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface StatisticalAnalysisResult {
  anomalies: AnomalyRecord[];
  timeline: TimelinePoint[];
  eventTypeBreakdown: Array<{ eventType: string; count: number; anomalies: number }>;
  riskAssessment: RiskAssessmentSummary;
  systemSecurityScore: number;
}

export function runStatisticalAnomalyDetection(entries: NormalizedLogEntry[]): StatisticalAnalysisResult {
  const validLogs = entries.filter((e) => !e.malformed);

  // Group logs by sourceIp
  const byIp = new Map<string, NormalizedLogEntry[]>();
  for (const log of validLogs) {
    const arr = byIp.get(log.sourceIp) || [];
    arr.push(log);
    byIp.set(log.sourceIp, arr);
  }

  const ipCounts = Array.from(byIp.values()).map((arr) => arr.length);
  const ipFailureCounts = Array.from(byIp.values()).map(
    (arr) => arr.filter((l) => l.statusCode >= 400 || /fail|denied|unauthorized|brute/i.test(l.eventType)).length
  );

  const countStats = computeMeanAndStd(ipCounts);
  const failStats = computeMeanAndStd(ipFailureCounts);
  const countIqr = computeIqrUpperFence(ipCounts);

  const anomalies: AnomalyRecord[] = [];
  const anomalousLogIds = new Set<string>();
  let anomalySeq = 1;

  for (const [ip, logs] of byIp.entries()) {
    const totalReq = logs.length;
    const failedAuths = logs.filter(
      (l) =>
        l.statusCode === 401 ||
        l.statusCode === 403 ||
        /fail|invalid|brute|denied|unauthorized/i.test(l.eventType)
    );
    const serverErrors = logs.filter((l) => l.statusCode >= 500);
    const sensitivePaths = logs.filter((l) => /admin|export|dump|root|shadow|sudo|token|key|config/i.test(l.endpoint + ' ' + l.eventType));
    const offHours = logs.filter((l) => {
      const hr = getHourUtc(l.timestamp);
      return hr >= 1 && hr <= 5;
    });
    const highBytes = logs.filter((l) => l.bytes >= 500_000);

    const zScoreCount = countStats.std > 0 ? (totalReq - countStats.mean) / countStats.std : 0;
    const zScoreFail = failStats.std > 0 ? (failedAuths.length - failStats.mean) / failStats.std : 0;
    const maxZ = Math.max(zScoreCount, zScoreFail, 0);
    const iqrMultiplier = countIqr.upperFence > 0 ? totalReq / Math.max(1, countIqr.upperFence) : 1;

    // 1) Credential stuffing / brute-force authentication burst
    if (failedAuths.length >= 3 || zScoreFail >= 1.4) {
      const anomalyScore = Math.min(0.98, Number((0.52 + failedAuths.length * 0.055 + Math.max(0, zScoreFail) * 0.1).toFixed(2)));
      const impactBoost = sensitivePaths.length > 0 || failedAuths.some((l) => /admin|root|secops/i.test(l.username)) ? 14 : 6;
      const riskScore = Math.min(98, Math.round(anomalyScore * 78 + impactBoost));
      const riskLevel = classifyRiskLevel(riskScore);
      const confidence = Math.min(96, Math.round(68 + failedAuths.length * 3.5));
      const latest = failedAuths[failedAuths.length - 1] || logs[0];
      const usernames = Array.from(new Set(failedAuths.map((l) => l.username))).join(', ');

      failedAuths.forEach((l) => anomalousLogIds.add(l.id));
      anomalies.push({
        id: `ANM-${String(anomalySeq++).padStart(3, '0')}`,
        eventId: `EVT-${latest.id.replace('LOG-', '')}`,
        timestamp: latest.timestamp,
        sourceIp: ip,
        username: usernames || latest.username,
        eventType: 'Repeated Authentication Failure Burst',
        anomalyScore,
        riskScore,
        riskLevel,
        confidence,
        status: riskLevel === 'Critical' ? 'Escalated' : 'Investigating',
        detectionMethod: 'Z-Score Failure Rate + Burst Correlation',
        evidenceSummary: `${failedAuths.length} failed authentication attempts (HTTP 401/403) from ${ip} targeting account(s): ${usernames}. Observed failure z-score: ${zScoreFail.toFixed(2)}.`,
        statisticalMetrics: {
          zScore: Number(Math.max(maxZ, 1.5).toFixed(2)),
          iqrMultiplier: Number(iqrMultiplier.toFixed(2)),
          baselineRate: Number(failStats.mean.toFixed(2)),
          observedRate: failedAuths.length,
          correlatedEventCount: failedAuths.length,
        },
        affectedAsset: latest.endpoint || '/auth/login',
        aiExplanation: `Source IP ${ip} generated ${failedAuths.length} consecutive authentication rejections against ${usernames}, exceeding the baseline mean (${failStats.mean.toFixed(1)} failures/IP) by ${zScoreFail.toFixed(2)} standard deviations. Pattern is consistent with automated credential testing.`,
        benignExplanations: [
          'Misconfigured automated service account or CI/CD runner retrying expired credentials.',
          'Shared corporate NAT gateway where multiple users simultaneously mistyped passwords.',
        ],
        recommendedActions: [
          `Audit authentication logs for ${ip} across identity provider and VPN endpoints.`,
          `Verify whether any successful 200 OK session followed the failed attempts for ${usernames}.`,
          'Consider temporary rate-limiting on authentication gateway if source is unverified.',
        ],
        correlatedLogIds: failedAuths.map((l) => l.id),
      });
    }

    // 2) Sensitive endpoint / privilege escalation / data exfiltration spike
    if (sensitivePaths.length >= 2 || highBytes.length >= 1) {
      const matched = Array.from(new Set([...sensitivePaths, ...highBytes]));
      const hasLargeTransfer = highBytes.length > 0;
      const anomalyScore = Math.min(0.95, Number((0.48 + matched.length * 0.08 + (hasLargeTransfer ? 0.18 : 0)).toFixed(2)));
      const riskScore = Math.min(95, Math.round(anomalyScore * 80 + (hasLargeTransfer ? 12 : 4)));
      const riskLevel = classifyRiskLevel(riskScore);
      const confidence = Math.min(94, Math.round(64 + matched.length * 5));
      const latest = matched[matched.length - 1];

      matched.forEach((l) => anomalousLogIds.add(l.id));
      anomalies.push({
        id: `ANM-${String(anomalySeq++).padStart(3, '0')}`,
        eventId: `EVT-${latest.id.replace('LOG-', '')}`,
        timestamp: latest.timestamp,
        sourceIp: ip,
        username: latest.username,
        eventType: hasLargeTransfer ? 'Anomalous Bulk Data Export' : 'Privileged Endpoint Enumeration',
        anomalyScore,
        riskScore,
        riskLevel,
        confidence,
        status: riskLevel === 'Critical' || riskLevel === 'High' ? 'Open' : 'Investigating',
        detectionMethod: 'IQR Outlier + Privileged Resource Heuristic',
        evidenceSummary: `${matched.length} sensitive/high-volume events from ${ip} (${latest.username}) targeting ${Array.from(new Set(matched.map((m) => m.endpoint))).join(', ')}.`,
        statisticalMetrics: {
          zScore: Number(Math.max(zScoreCount, 1.35).toFixed(2)),
          iqrMultiplier: Number(Math.max(iqrMultiplier, 1.4).toFixed(2)),
          baselineRate: Number(countStats.mean.toFixed(2)),
          observedRate: totalReq,
          correlatedEventCount: matched.length,
        },
        affectedAsset: latest.endpoint,
        aiExplanation: `Account ${latest.username} from ${ip} accessed restricted administrative or bulk export endpoints (${latest.endpoint}) with ${hasLargeTransfer ? 'elevated outbound payload volume' : 'unusual sequence frequency'}.`,
        benignExplanations: [
          'Authorized scheduled backup or compliance audit export executed by operations staff.',
          'Internal penetration testing or vulnerability scanner running during maintenance window.',
        ],
        recommendedActions: [
          `Confirm change-ticket authorization for user ${latest.username} accessing ${latest.endpoint}.`,
          'Inspect outbound byte payloads and session token provenance.',
        ],
        correlatedLogIds: matched.map((l) => l.id),
      });
    }

    // 3) Off-hours activity or 5xx error spike
    if ((offHours.length >= 2 || serverErrors.length >= 3) && !anomalies.some((a) => a.sourceIp === ip)) {
      const matched = serverErrors.length >= 3 ? serverErrors : offHours;
      const anomalyScore = Math.min(0.84, Number((0.42 + matched.length * 0.07).toFixed(2)));
      const riskScore = Math.min(72, Math.round(anomalyScore * 66 + (serverErrors.length >= 3 ? 10 : 0)));
      const riskLevel = classifyRiskLevel(riskScore);
      const latest = matched[matched.length - 1];

      matched.forEach((l) => anomalousLogIds.add(l.id));
      anomalies.push({
        id: `ANM-${String(anomalySeq++).padStart(3, '0')}`,
        eventId: `EVT-${latest.id.replace('LOG-', '')}`,
        timestamp: latest.timestamp,
        sourceIp: ip,
        username: latest.username,
        eventType: serverErrors.length >= 3 ? 'Application Fault / Probe Spike' : 'Off-Hours Access Deviation',
        anomalyScore,
        riskScore,
        riskLevel,
        confidence: Math.min(88, 58 + matched.length * 4),
        status: 'Open',
        detectionMethod: 'Temporal Window Baseline + Status Code Outlier',
        evidenceSummary: `${matched.length} anomalous ${serverErrors.length >= 3 ? '5xx fault' : 'off-hours (01:00–05:00 UTC)'} events observed from ${ip}.`,
        statisticalMetrics: {
          zScore: Number(Math.max(zScoreCount, 1.15).toFixed(2)),
          iqrMultiplier: Number(iqrMultiplier.toFixed(2)),
          baselineRate: Number(countStats.mean.toFixed(2)),
          observedRate: totalReq,
          correlatedEventCount: matched.length,
        },
        affectedAsset: latest.endpoint,
        aiExplanation: `Activity from ${ip} deviates from normal diurnal operating hours or triggered repeated 5xx server exceptions, warranting analyst verification.`,
        benignExplanations: [
          'Engineer operating from a different time zone or handling on-call deployment.',
          'Transient upstream microservice timeout causing cascading 500/502 status codes.',
        ],
        recommendedActions: [
          `Verify shift schedule and VPN session geolocation for ${latest.username}.`,
          'Correlate 5xx stack traces against recent application deployments.',
        ],
        correlatedLogIds: matched.map((l) => l.id),
      });
    }
  }

  // Sort anomalies highest risk first
  anomalies.sort((a, b) => b.riskScore - a.riskScore);

  // Build timeline buckets
  const bucketMap = new Map<string, TimelinePoint>();
  for (const log of validLogs) {
    const bucket = getTimeBucketLabel(log.timestamp);
    if (!bucketMap.has(bucket)) {
      bucketMap.set(bucket, {
        timeBucket: bucket,
        totalLogs: 0,
        anomalies: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgRiskScore: 0,
      });
    }
    const point = bucketMap.get(bucket)!;
    point.totalLogs += 1;
  }

  for (const anm of anomalies) {
    const bucket = getTimeBucketLabel(anm.timestamp);
    if (!bucketMap.has(bucket)) {
      bucketMap.set(bucket, {
        timeBucket: bucket,
        totalLogs: 1,
        anomalies: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgRiskScore: 0,
      });
    }
    const point = bucketMap.get(bucket)!;
    point.anomalies += 1;
    if (anm.riskLevel === 'Critical') point.critical += 1;
    else if (anm.riskLevel === 'High') point.high += 1;
    else if (anm.riskLevel === 'Medium') point.medium += 1;
    else point.low += 1;
    point.avgRiskScore = point.avgRiskScore === 0 ? anm.riskScore : Math.round((point.avgRiskScore + anm.riskScore) / 2);
  }

  const timeline = Array.from(bucketMap.values()).sort((a, b) => a.timeBucket.localeCompare(b.timeBucket));

  // Event type breakdown
  const eventMap = new Map<string, { eventType: string; count: number; anomalies: number }>();
  for (const log of validLogs) {
    const item = eventMap.get(log.eventType) || { eventType: log.eventType, count: 0, anomalies: 0 };
    item.count += 1;
    if (anomalousLogIds.has(log.id)) item.anomalies += 1;
    eventMap.set(log.eventType, item);
  }
  const eventTypeBreakdown = Array.from(eventMap.values()).sort((a, b) => b.count - a.count);

  const criticalCount = anomalies.filter((a) => a.riskLevel === 'Critical').length;
  const highCount = anomalies.filter((a) => a.riskLevel === 'High').length;
  const mediumCount = anomalies.filter((a) => a.riskLevel === 'Medium').length;
  const lowCount = anomalies.filter((a) => a.riskLevel === 'Low').length;
  const totalAnomalies = anomalies.length;

  const avgRiskScore = totalAnomalies > 0
    ? Math.round(anomalies.reduce((acc, a) => acc + a.riskScore, 0) / totalAnomalies)
    : 8;

  const penalty = criticalCount * 14 + highCount * 8 + mediumCount * 4 + lowCount * 1;
  const systemSecurityScore = Math.max(18, Math.min(100, 100 - penalty));

  const riskAssessment: RiskAssessmentSummary = {
    overallRiskScore: avgRiskScore,
    systemSecurityScore,
    brackets: [
      {
        level: 'Critical',
        range: '75–100',
        min: 75,
        max: 100,
        count: criticalCount,
        percentage: totalAnomalies > 0 ? Math.round((criticalCount / totalAnomalies) * 100) : 0,
        description: 'Immediate SOC analyst triage required; strong multi-signal outlier evidence on sensitive assets.',
      },
      {
        level: 'High',
        range: '50–74',
        min: 50,
        max: 74,
        count: highCount,
        percentage: totalAnomalies > 0 ? Math.round((highCount / totalAnomalies) * 100) : 0,
        description: 'Elevated statistical deviation requiring prompt correlation and credential verification.',
      },
      {
        level: 'Medium',
        range: '25–49',
        min: 25,
        max: 49,
        count: mediumCount,
        percentage: totalAnomalies > 0 ? Math.round((mediumCount / totalAnomalies) * 100) : 0,
        description: 'Moderate baseline divergence; validate against maintenance windows or service accounts.',
      },
      {
        level: 'Low',
        range: '0–24',
        min: 0,
        max: 24,
        count: lowCount,
        percentage: totalAnomalies > 0 ? Math.round((lowCount / totalAnomalies) * 100) : 0,
        description: 'Minor variance within acceptable operational tolerance; log for baseline tracking.',
      },
    ],
    findings: anomalies.map((a) => ({
      id: a.id,
      eventId: a.eventId,
      title: a.eventType,
      sourceIp: a.sourceIp,
      riskScore: a.riskScore,
      riskLevel: a.riskLevel,
      evidenceStrength: a.confidence >= 85 ? 'Strong' : a.confidence >= 70 ? 'Moderate' : 'Preliminary',
      assetImpact: /admin|root|export|db|auth/i.test(a.affectedAsset) ? 'High' : 'Medium',
      confidenceScore: a.confidence,
      reasoning: a.aiExplanation,
    })),
    riskTrend: timeline.map((t) => ({
      label: t.timeBucket,
      riskScore: t.avgRiskScore,
      securityScore: Math.max(20, 100 - t.avgRiskScore),
    })),
  };

  return {
    anomalies,
    timeline,
    eventTypeBreakdown,
    riskAssessment,
    systemSecurityScore,
  };
}
