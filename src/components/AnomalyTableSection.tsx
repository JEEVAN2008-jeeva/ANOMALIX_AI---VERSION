import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import type { AnomalyRecord, AnomalyStatus, RiskLevel } from '../types/anomalix.ts';
import { formatTimestamp } from '../utils/formatters.ts';
import {
  type AnomalySortField,
  type SortDirection,
  filterAndSortAnomalies,
  paginateItems,
} from '../utils/tableFilters.ts';
import { SeverityBadge, StatusIndicator } from './SeverityBadge.tsx';

interface AnomalyTableSectionProps {
  anomalies: AnomalyRecord[];
  onInspectAnomaly: (anomaly: AnomalyRecord) => void;
}

export function AnomalyTableSection({ anomalies, onInspectAnomaly }: AnomalyTableSectionProps) {
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | 'All'>('All');
  const [status, setStatus] = useState<AnomalyStatus | 'All'>('All');
  const [sortField, setSortField] = useState<AnomalySortField>('riskScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo(
    () =>
      filterAndSortAnomalies(anomalies, {
        search,
        riskLevel,
        status,
        sortField,
        sortDirection,
      }),
    [anomalies, search, riskLevel, status, sortField, sortDirection]
  );

  const { pageItems, totalPages, currentPage } = paginateItems(filtered, page, pageSize);

  const toggleSort = (field: AnomalySortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Anomaly Detection Registry
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Outliers detected by <span className="font-bold text-amber-800">anomaly_detection_analyst</span> · Click any event to review evidence & CrewAI explanation
          </p>
        </div>
        <div className="text-xs text-slate-700 tabular-nums">
          Total Findings: <span className="text-amber-800 font-bold">{anomalies.length}</span>
        </div>
      </div>

      <div className="surface-silver-gold border border-amber-300/80 rounded-lg overflow-hidden shadow-xs">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-amber-200 bg-white/80 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-amber-800 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Event ID, IP, user, event type..."
              aria-label="Search anomalies"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-amber-300/80 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value as RiskLevel | 'All');
                setPage(1);
              }}
              aria-label="Filter by risk level"
              className="px-3 py-2 text-xs font-bold bg-white border border-amber-300/80 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Risk Levels</option>
              <option value="Critical">Critical (75–100)</option>
              <option value="High">High (50–74)</option>
              <option value="Medium">Medium (25–49)</option>
              <option value="Low">Low (0–24)</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AnomalyStatus | 'All');
                setPage(1);
              }}
              aria-label="Filter by investigation status"
              className="px-3 py-2 text-xs font-bold bg-white border border-amber-300/80 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="px-3 py-2 text-xs font-bold bg-white border border-amber-300/80 rounded-md text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value={5}>5 / page</option>
              <option value={8}>8 / page</option>
              <option value={15}>15 / page</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto bg-white/85">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/75 border-b border-amber-300/70 text-xs font-bold text-slate-900">
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('eventId')}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>Event ID</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('timestamp')}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Source IP</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('anomalyScore')}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer ml-auto whitespace-nowrap"
                  >
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('riskScore')}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>Risk Level</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('confidence')}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer ml-auto whitespace-nowrap"
                  >
                    <span>Conf.</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/70 text-sm">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-600">
                    No anomalies match the selected filters. Adjust search criteria or reset filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((anm) => (
                  <tr
                    key={anm.id}
                    onClick={() => onInspectAnomaly(anm)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-bold text-amber-800 tabular-nums whitespace-nowrap">
                      {anm.eventId}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatTimestamp(anm.timestamp)}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-semibold tabular-nums whitespace-nowrap">
                      {anm.sourceIp}
                    </td>
                    <td className="py-3 px-3 text-slate-700 min-w-[170px]">{anm.eventType}</td>
                    <td className="py-3 px-3 text-right font-bold text-blue-800 tabular-nums whitespace-nowrap">
                      {anm.anomalyScore.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <SeverityBadge level={anm.riskLevel} score={anm.riskScore} />
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 tabular-nums whitespace-nowrap">
                      {anm.confidence}%
                    </td>
                    <td className="py-3 px-3">
                      <StatusIndicator status={anm.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectAnomaly(anm);
                        }}
                        aria-label={`View investigation details for ${anm.eventId}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-sm hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-amber-200 flex items-center justify-between text-xs text-slate-700 bg-white/80">
          <span className="tabular-nums">
            Showing {pageItems.length} of {filtered.length} findings (Page {currentPage} of {totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1 border border-blue-400/70 bg-blue-50/90 text-blue-950 font-bold rounded-sm disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1 border border-blue-400/70 bg-blue-50/90 text-blue-950 font-bold rounded-sm disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
