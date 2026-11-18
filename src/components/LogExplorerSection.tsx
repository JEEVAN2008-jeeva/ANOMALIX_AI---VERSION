import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Search, Upload } from 'lucide-react';
import type { LogValidationSummary, NormalizedLogEntry } from '../types/anomalix.ts';
import { paginateItems } from '../utils/tableFilters.ts';

interface LogExplorerSectionProps {
  logs: NormalizedLogEntry[];
  validationSummary: LogValidationSummary;
  onOpenAnalyzeModal: () => void;
}

export function LogExplorerSection({
  logs,
  validationSummary,
  onOpenAnalyzeModal,
}: LogExplorerSectionProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'malformed' | 'masked'>('all');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<NormalizedLogEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (filterMode === 'valid' && entry.malformed) return false;
      if (filterMode === 'malformed' && !entry.malformed) return false;
      if (filterMode === 'masked' && !entry.masked) return false;
      if (q) {
        const text = `${entry.id} ${entry.sourceIp} ${entry.username} ${entry.eventType} ${entry.endpoint} ${entry.statusCode}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, filterMode]);

  const { pageItems, totalPages, currentPage } = paginateItems(filtered, page, 10);

  return (
    <div className="space-y-6">
      <div className="surface-silver-gold border border-amber-300/80 rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Log Explorer</h2>
          <p className="text-sm text-slate-700 mt-0.5">
            Normalized telemetry validated by <span className="font-bold text-amber-800">log_collection_specialist</span> · Untrusted input sanitization & secret masking active
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAnalyzeModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md hover:from-amber-400 hover:to-yellow-400 cursor-pointer whitespace-nowrap shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ingest & Analyze New Logs</span>
        </button>
      </div>

      {/* Validation Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Format', val: validationSummary.format, surface: 'surface-blue-spill border-blue-300/80', color: 'text-blue-800' },
          { label: 'Total Rows', val: validationSummary.totalRows, surface: 'surface-silver-gold border-amber-300/80', color: 'text-slate-900' },
          { label: 'Valid Rows', val: validationSummary.validRows, surface: 'surface-green-spill border-emerald-300/80', color: 'text-emerald-800' },
          { label: 'Malformed Flagged', val: validationSummary.malformedRows, surface: 'surface-silver-gold border-amber-300/80', color: 'text-red-700' },
          { label: 'Secrets Masked', val: validationSummary.maskedSecretsCount, surface: 'surface-silver-gold border-amber-300/80', color: 'text-amber-800' },
          { label: 'Unique IPs', val: validationSummary.uniqueIps, surface: 'surface-blue-spill border-blue-300/80', color: 'text-blue-800' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.surface} border rounded-md px-4 py-3 shadow-xs`}
          >
            <div className="text-xs font-semibold text-slate-600">{stat.label}</div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${stat.color}`}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Filter & Table Container */}
      <div className="surface-blue-spill border border-blue-300/80 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 bg-white/80">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-blue-800 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search IP, username, endpoint, event type..."
              aria-label="Search normalized logs"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-blue-300/80 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-white border border-amber-300/80 rounded-md">
            {(
              [
                ['all', 'All'],
                ['valid', 'Valid'],
                ['malformed', 'Malformed'],
                ['masked', 'Secrets Masked'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilterMode(key);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-sm cursor-pointer whitespace-nowrap ${
                  filterMode === key
                    ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto bg-white/85">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/80 border-b border-blue-200 text-xs font-bold text-slate-900">
                <th className="py-3 px-4">Line</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-600">
                    No log entries match your current filter.
                  </td>
                </tr>
              ) : (
                pageItems.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedLog(entry)}
                    className={`hover:bg-amber-50/60 cursor-pointer transition-colors ${
                      entry.malformed ? 'bg-red-50/80' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-xs text-slate-600 tabular-nums">#{entry.lineNumber}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-blue-800 tabular-nums whitespace-nowrap">{entry.sourceIp}</td>
                    <td className="py-2.5 px-4 text-slate-800 whitespace-nowrap">{entry.username}</td>
                    <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">{entry.eventType}</td>
                    <td className="py-2.5 px-4 tabular-nums">
                      <span
                        className={`font-bold ${
                          entry.statusCode >= 500
                            ? 'text-red-700'
                            : entry.statusCode >= 400
                              ? 'text-amber-800'
                              : 'text-emerald-800'
                        }`}
                      >
                        {entry.statusCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700 max-w-[220px] truncate">
                      {entry.endpoint}
                    </td>
                    <td className="py-2.5 px-4 text-xs whitespace-nowrap">
                      {entry.malformed ? (
                        <span className="text-red-700 font-bold">Malformed Row</span>
                      ) : entry.masked ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          <span>Masked</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-800">Valid</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-blue-200 flex items-center justify-between text-xs text-slate-700 bg-white/80">
          <span className="tabular-nums">
            Showing {pageItems.length} of {filtered.length} records (Page {currentPage} of {totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-400/70 bg-blue-50/90 text-blue-950 font-bold rounded-sm disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-400/70 bg-blue-50/90 text-blue-950 font-bold rounded-sm disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="surface-silver-gold border border-amber-300 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-900">
              Sanitized Raw Record — {selectedLog.id} (Line #{selectedLog.lineNumber})
            </span>
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="text-xs font-bold text-blue-800 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
          <pre className="p-3 bg-slate-100/95 border border-slate-300 rounded-md text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap">
            {selectedLog.rawLine}
          </pre>
        </div>
      )}
    </div>
  );
}
