import type { AnomalyRecord, AnomalyStatus, RiskLevel } from '../types/anomalix.ts';

export type AnomalySortField = 'timestamp' | 'anomalyScore' | 'riskScore' | 'confidence' | 'eventId';
export type SortDirection = 'asc' | 'desc';

export interface AnomalyFilterOptions {
  search: string;
  riskLevel: RiskLevel | 'All';
  status: AnomalyStatus | 'All';
  sortField: AnomalySortField;
  sortDirection: SortDirection;
}

export function filterAndSortAnomalies(
  items: AnomalyRecord[],
  options: AnomalyFilterOptions
): AnomalyRecord[] {
  const query = options.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (options.riskLevel !== 'All' && item.riskLevel !== options.riskLevel) {
      return false;
    }
    if (options.status !== 'All' && item.status !== options.status) {
      return false;
    }
    if (query) {
      const hay = `${item.id} ${item.eventId} ${item.sourceIp} ${item.username} ${item.eventType} ${item.affectedAsset}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const dir = options.sortDirection === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    switch (options.sortField) {
      case 'anomalyScore':
        return (a.anomalyScore - b.anomalyScore) * dir;
      case 'riskScore':
        return (a.riskScore - b.riskScore) * dir;
      case 'confidence':
        return (a.confidence - b.confidence) * dir;
      case 'eventId':
        return a.eventId.localeCompare(b.eventId) * dir;
      case 'timestamp':
      default:
        return a.timestamp.localeCompare(b.timestamp) * dir;
    }
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): {
  pageItems: T[];
  totalPages: number;
  currentPage: number;
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

export type OverviewReviewFilter = 'all' | 'critical' | 'high' | 'needs_review';

export function prioritizeAnomaliesForReview(
  items: AnomalyRecord[],
  filter: OverviewReviewFilter
): AnomalyRecord[] {
  const filtered = items.filter((item) => {
    if (filter === 'critical') return item.riskLevel === 'Critical';
    if (filter === 'high') return item.riskLevel === 'High';
    if (filter === 'needs_review') {
      return item.status === 'Open' || item.status === 'Investigating' || item.status === 'Escalated';
    }
    return true;
  });

  const statusRank = (status: AnomalyStatus): number => {
    switch (status) {
      case 'Escalated':
        return 0;
      case 'Open':
        return 1;
      case 'Investigating':
        return 2;
      case 'Resolved':
        return 3;
      case 'False Positive':
      default:
        return 4;
    }
  };

  return [...filtered].sort((a, b) => {
    const rankDiff = statusRank(a.status) - statusRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    return b.anomalyScore - a.anomalyScore;
  });
}
