import { useState } from 'react';
import { FileUp, Loader2, Play, X } from 'lucide-react';

export interface SampleDatasetOption {
  key: string;
  label: string;
  fileName: string;
  format: 'CSV' | 'JSON' | 'TXT';
  description: string;
}

interface AnalyzeModalProps {
  open: boolean;
  sampleDatasets: SampleDatasetOption[];
  useAiEnrichment: boolean;
  onClose: () => void;
  onExecute: (payload: {
    datasetKey?: string;
    rawLogs?: string;
    fileName?: string;
    useAiEnrichment: boolean;
  }) => Promise<void>;
}

export function AnalyzeModal({
  open,
  sampleDatasets,
  useAiEnrichment,
  onClose,
  onExecute,
}: AnalyzeModalProps) {
  const [mode, setMode] = useState<'sample' | 'custom'>('sample');
  const [selectedDataset, setSelectedDataset] = useState(
    sampleDatasets[0]?.key || 'auth_gateway_sample'
  );
  const [customFileName, setCustomFileName] = useState('custom_server_logs.csv');
  const [customLogs, setCustomLogs] = useState('');
  const [aiEnabled, setAiEnabled] = useState(useAiEnrichment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomFileName(file.name);
    const text = await file.text();
    setCustomLogs(text);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'custom' && !customLogs.trim()) {
      setError('Paste log records or upload a .csv, .json, or .txt log file before executing.');
      return;
    }
    setSubmitting(true);
    try {
      await onExecute({
        datasetKey: mode === 'sample' ? selectedDataset : undefined,
        rawLogs: mode === 'custom' ? customLogs : undefined,
        fileName: mode === 'custom' ? customFileName : undefined,
        useAiEnrichment: aiEnabled,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute CrewAI analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Run CrewAI Log Analysis"
    >
      <div className="w-full max-w-2xl surface-silver-gold border border-amber-300 rounded-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-300/70 bg-gradient-to-r from-[#f8f8fa]/95 via-[#fdf9ec]/95 to-[#eff5fb]/95 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Execute ANOMALIX AI CrewAI Pipeline
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Triggers the 5-agent sequential workflow (`collect_and_validate_logs` → `generate_security_report`)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analysis modal"
            className="p-1.5 text-slate-700 hover:text-slate-900 bg-white border border-amber-300/80 rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Source Mode Switch */}
          <div className="flex items-center gap-1 p-1 bg-white border border-amber-300/80 rounded-md w-fit">
            <button
              type="button"
              onClick={() => setMode('sample')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-sm cursor-pointer ${
                mode === 'sample'
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Synthetic Validation Datasets
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-sm cursor-pointer ${
                mode === 'custom'
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 text-slate-900 border border-amber-400/70'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Upload / Paste Custom Logs
            </button>
          </div>

          {mode === 'sample' ? (
            <div className="space-y-2.5">
              {sampleDatasets.map((ds) => (
                <label
                  key={ds.key}
                  className={`block p-3.5 rounded-md border cursor-pointer transition-colors ${
                    selectedDataset === ds.key
                      ? 'bg-gradient-to-r from-amber-50 to-blue-50 border-amber-400'
                      : 'bg-white/90 border-amber-300/60 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="dataset"
                      value={ds.key}
                      checked={selectedDataset === ds.key}
                      onChange={() => setSelectedDataset(ds.key)}
                      className="accent-amber-600"
                    />
                    <span className="text-sm font-bold text-slate-900">{ds.label}</span>
                    <span className="text-xs font-bold text-blue-800 ml-auto">{ds.format}</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1 pl-6">{ds.description}</div>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  aria-label="Log filename"
                  placeholder="server_logs.csv"
                  className="px-3 py-1.5 text-xs bg-white border border-amber-300/80 rounded-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-sm hover:bg-blue-100 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
                  <span>Load .CSV / .JSON / .TXT File</span>
                  <input
                    type="file"
                    accept=".csv,.json,.txt,.log"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={7}
                value={customLogs}
                onChange={(e) => setCustomLogs(e.target.value)}
                placeholder="Paste CSV, JSON, or TXT log lines here (e.g. timestamp,source_ip,username,event_type,status_code,endpoint,bytes)..."
                aria-label="Custom log content"
                className="w-full p-3 text-xs bg-slate-100/95 border border-slate-300 rounded-md text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="accent-amber-600"
            />
            <span>Run CrewAI Threat Investigator AI explanation enrichment (requires server-side Gemini API key)</span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-400 rounded-md text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-300/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-md hover:bg-blue-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              )}
              <span>{submitting ? 'Executing CrewAI Pipeline...' : 'Execute CrewAI Analysis'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
